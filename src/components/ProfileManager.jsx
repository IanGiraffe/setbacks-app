/**
 * ProfileManager Component
 *
 * UI component for managing zoning parameter profiles.
 * Integrated into the form with a dropdown selector and smart save functionality.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfiles } from '../hooks/useProfiles';
import { cn } from '../utils/cn';
import { ZONING_PARAMETERS, SETBACK_PARAMETERS, isStandardParameter } from '../config/zoningParameters';

const ProfileManager = ({
  currentParameters,
  currentUnit,
  onLoadProfile,
  enabledParams,
  customSetbacks
}) => {
  const {
    profiles,
    saveProfile,
    deleteProfile,
    loadProfile,
    updateProfile,
    compare
  } = useProfiles();

  const [selectedProfileId, setSelectedProfileId] = useState('new');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [compareProfileId, setCompareProfileId] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [saveError, setSaveError] = useState(null);

  // Helper function to get formatted parameter label
  const getParameterLabel = (paramKey) => {
    const allParams = [...ZONING_PARAMETERS, ...SETBACK_PARAMETERS];
    const paramConfig = allParams.find(p => p.key === paramKey);

    if (paramConfig) {
      return paramConfig.label.toUpperCase();
    }

    // For custom setbacks, format the key (e.g., "customSetback" -> "CUSTOM SETBACK")
    return paramKey
      .replace(/([A-Z])/g, ' $1') // Add space before capitals
      .trim()
      .toUpperCase();
  };

  // Detect parameter changes
  useEffect(() => {
    if (selectedProfileId === 'new') {
      setHasUnsavedChanges(false);
      return;
    }

    const selectedProfile = profiles.find(p => p.id === selectedProfileId);
    if (!selectedProfile) {
      setHasUnsavedChanges(false);
      return;
    }

    // Merge standard parameters with custom setbacks to get all current values
    const allCurrentParams = { ...currentParameters, ...customSetbacks };
    const profileParams = selectedProfile.parameters || {};

    // Compare all keys from both objects
    const allKeys = new Set([
      ...Object.keys(allCurrentParams),
      ...Object.keys(profileParams)
    ]);

    const paramsDifferent = Array.from(allKeys).some(key => {
      const currentVal = allCurrentParams[key] ?? 0;
      const profileVal = profileParams[key] ?? 0;
      return Math.abs(currentVal - profileVal) > 0.001;
    });

    // Compare enabled state
    const profileEnabled = selectedProfile.enabledParams || {};
    const expectedEnabled = Object.keys(profileEnabled).length === 0
      ? Object.keys(profileParams).reduce((acc, key) => ({ ...acc, [key]: true }), {})
      : profileEnabled;

    const enabledDifferent = Array.from(allKeys).some(key =>
      (enabledParams[key] ?? false) !== (expectedEnabled[key] ?? false)
    );

    setHasUnsavedChanges(paramsDifferent || enabledDifferent);
  }, [currentParameters, customSetbacks, enabledParams, selectedProfileId, profiles]);

  const handleProfileSelect = (profileId) => {
    if (profileId === 'new') {
      setSelectedProfileId('new');
      setHasUnsavedChanges(false);
      return;
    }

    const result = loadProfile(profileId);
    if (result.success) {
      // Separate standard parameters from custom setbacks
      const standardParams = {};
      const customSetbacksToLoad = {};

      Object.entries(result.parameters).forEach(([key, value]) => {
        if (isStandardParameter(key)) {
          standardParams[key] = value;
        } else {
          customSetbacksToLoad[key] = value;
        }
      });

      // Build enabled params - if empty, enable all parameters in profile
      const enabledParamsToPass = Object.keys(result.profile.enabledParams || {}).length === 0
        ? Object.keys(result.parameters).reduce((acc, key) => ({ ...acc, [key]: true }), {})
        : result.profile.enabledParams;

      setSelectedProfileId(profileId);
      setHasUnsavedChanges(false);
      onLoadProfile(standardParams, result.unit, enabledParamsToPass, customSetbacksToLoad);
    }
  };

  const handleSaveEdits = async () => {
    if (selectedProfileId === 'new') return;

    // Merge standard parameters with custom setbacks
    const allParams = { ...currentParameters, ...customSetbacks };

    const result = await updateProfile(selectedProfileId, {
      parameters: allParams,
      unit: currentUnit,
      enabledParams: enabledParams
    });

    if (result.success) {
      setHasUnsavedChanges(false);
    }
  };

  const handleSaveAsNew = async () => {
    setShowSaveDialog(true);
  };

  const handleConfirmSaveNew = async () => {
    setSaveError(null);

    if (!newProfileName.trim()) {
      setSaveError('Please enter a profile name');
      return;
    }

    // Merge standard parameters with custom setbacks
    const allParams = { ...currentParameters, ...customSetbacks };

    const result = await saveProfile(newProfileName, allParams, currentUnit, enabledParams);

    if (result.success) {
      setNewProfileName('');
      setSaveError(null);
      setShowSaveDialog(false);
      setSelectedProfileId(result.profile.id);
      setHasUnsavedChanges(false);
    } else {
      setSaveError(result.error);
    }
  };

  const handleDelete = async () => {
    if (selectedProfileId === 'new') return;

    if (window.confirm('Are you sure you want to delete this profile?')) {
      await deleteProfile(selectedProfileId);
      setSelectedProfileId('new');
      setHasUnsavedChanges(false);
    }
  };

  const handleCompare = () => {
    setShowCompareDialog(true);
  };

  const handleConfirmCompare = () => {
    if (!compareProfileId || selectedProfileId === 'new') return;

    const result = compare(selectedProfileId, compareProfileId);
    if (result.success) {
      setComparisonResult(result.comparison);
    }
    setShowCompareDialog(false);
  };

  return (
    <>
      {/* Profile Dropdown - appears above "Parameters" title */}
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <select
            value={selectedProfileId}
            onChange={(e) => handleProfileSelect(e.target.value)}
            className={cn(
              "flex-1 px-2 py-1.5 text-xs font-bold text-giraffe-dark",
              "border-2 border-black bg-white rounded",
              "focus:outline-none focus:ring-0 focus:border-giraffe-orange",
              "transition-colors duration-150"
            )}
          >
            <option value="new">New Configuration</option>
            {profiles.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.name} ({profile.unit})
              </option>
            ))}
          </select>

          {selectedProfileId !== 'new' && (
            <div className="flex gap-1">
              <button
                onClick={handleCompare}
                className="px-2 py-1 text-xs font-bold bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors border-2 border-black"
                title="Compare with another profile"
              >
                Compare
              </button>
              <button
                onClick={handleDelete}
                className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded hover:bg-red-600 transition-colors border-2 border-black"
                title="Delete this profile"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Save Edits / Save as New buttons */}
        {hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex gap-2"
          >
            <button
              onClick={handleSaveEdits}
              className="flex-1 px-3 py-1.5 text-xs font-bold bg-green-500 text-white rounded hover:bg-green-600 transition-colors border-2 border-black"
            >
              Save Edits to "{profiles.find(p => p.id === selectedProfileId)?.name}"
            </button>
            <button
              onClick={handleSaveAsNew}
              className="flex-1 px-3 py-1.5 text-xs font-bold bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors border-2 border-black"
            >
              Save as New Profile
            </button>
          </motion.div>
        )}

        {/* Save button for new configurations */}
        {selectedProfileId === 'new' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2"
          >
            <button
              onClick={handleSaveAsNew}
              className="w-full px-3 py-1.5 text-xs font-bold bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors border-2 border-black"
            >
              Save Current Configuration
            </button>
          </motion.div>
        )}
      </div>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-2 border-black rounded-md p-4 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-black text-giraffe-dark mb-3">
                Save Profile
              </h3>
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Enter profile name..."
                className="w-full px-3 py-2 text-sm border-2 border-black rounded focus:outline-none focus:border-giraffe-orange mb-3"
                onKeyPress={(e) => e.key === 'Enter' && handleConfirmSaveNew()}
                autoFocus
              />
              {saveError && (
                <p className="text-xs text-red-600 mb-3">{saveError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmSaveNew}
                  className="flex-1 px-4 py-2 bg-green-500 text-white font-bold rounded hover:bg-green-600 transition-colors border-2 border-black"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setNewProfileName('');
                    setSaveError(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300 transition-colors border-2 border-black"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare Dialog */}
      <AnimatePresence>
        {showCompareDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCompareDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-2 border-black rounded-md p-4 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-black text-giraffe-dark mb-3">
                Compare Profiles
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                Compare "{profiles.find(p => p.id === selectedProfileId)?.name}" with:
              </p>
              <select
                value={compareProfileId || ''}
                onChange={(e) => setCompareProfileId(e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-black rounded focus:outline-none focus:border-giraffe-orange mb-3"
              >
                <option value="">Select a profile...</option>
                {profiles
                  .filter(p => p.id !== selectedProfileId)
                  .map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} ({profile.unit})
                    </option>
                  ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmCompare}
                  disabled={!compareProfileId}
                  className="flex-1 px-4 py-2 bg-purple-500 text-white font-bold rounded hover:bg-purple-600 transition-colors border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Compare
                </button>
                <button
                  onClick={() => {
                    setShowCompareDialog(false);
                    setCompareProfileId(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300 transition-colors border-2 border-black"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Result - Table Format */}
      <AnimatePresence>
        {comparisonResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setComparisonResult(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-2 border-black rounded-md p-4 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-black text-giraffe-dark mb-3">
                Profile Comparison
              </h3>

              {!comparisonResult.hasDifferences && (
                <p className="text-sm text-green-600 font-semibold mb-4">
                  ✓ Both profiles have identical parameters
                </p>
              )}

              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-2 border-black">
                  <thead>
                    <tr className="bg-purple-100 border-2 border-black">
                      <th className="px-3 py-2 text-left font-black text-xs text-giraffe-dark uppercase border-r-2 border-black">
                        Parameter
                      </th>
                      <th className="px-3 py-2 text-center font-black text-xs text-purple-700 border-r-2 border-black">
                        {comparisonResult.profile1.name}
                        <div className="text-[10px] font-normal text-slate-600">
                          ({comparisonResult.profile1.unit})
                        </div>
                      </th>
                      <th className="px-3 py-2 text-center font-black text-xs text-purple-700 border-r-2 border-black">
                        {comparisonResult.profile2.name}
                        <div className="text-[10px] font-normal text-slate-600">
                          ({comparisonResult.profile2.unit})
                        </div>
                      </th>
                      <th className="px-3 py-2 text-center font-black text-xs text-giraffe-dark uppercase">
                        Difference
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Get all parameters from both profiles */}
                    {(() => {
                      const profile1 = profiles.find(p => p.id === comparisonResult.profile1.id);
                      const profile2 = profiles.find(p => p.id === comparisonResult.profile2.id);
                      const allParams = new Set([
                        ...Object.keys(profile1?.parameters || {}),
                        ...Object.keys(profile2?.parameters || {})
                      ]);

                      return Array.from(allParams).map((paramKey) => {
                        const val1 = profile1?.parameters[paramKey];
                        const val2 = profile2?.parameters[paramKey];
                        const diff = val2 - val1;
                        const isDifferent = val1 !== val2;

                        return (
                          <tr
                            key={paramKey}
                            className={cn(
                              'border-t-2 border-black',
                              isDifferent ? 'bg-purple-50' : 'bg-white'
                            )}
                          >
                            <td className="px-3 py-2 font-bold text-xs text-slate-700 border-r-2 border-black">
                              {getParameterLabel(paramKey)}
                            </td>
                            <td className="px-3 py-2 text-center text-xs font-semibold text-slate-800 border-r-2 border-black">
                              {val1 !== undefined ? val1 : '-'}
                            </td>
                            <td className="px-3 py-2 text-center text-xs font-semibold text-slate-800 border-r-2 border-black">
                              {val2 !== undefined ? val2 : '-'}
                            </td>
                            <td className="px-3 py-2 text-center text-xs font-semibold">
                              {isDifferent && val1 !== undefined && val2 !== undefined ? (
                                <span className={cn(
                                  diff > 0 ? 'text-green-600' : 'text-red-600'
                                )}>
                                  {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => setComparisonResult(null)}
                className="mt-4 w-full px-4 py-2 bg-purple-500 text-white font-bold rounded hover:bg-purple-600 transition-colors border-2 border-black"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProfileManager;
