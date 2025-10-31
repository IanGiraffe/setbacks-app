/**
 * ProfileManager Component
 *
 * UI component for managing zoning parameter profiles.
 * Allows users to save, load, delete, and compare parameter presets.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfiles } from '../hooks/useProfiles';
import { cn } from '../utils/cn';

const ProfileManager = ({ currentParameters, currentUnit, onLoadProfile }) => {
  const {
    profiles,
    isLoading,
    error,
    saveProfile,
    deleteProfile,
    loadProfile,
    compare
  } = useProfiles();

  const [isOpen, setIsOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [saveError, setSaveError] = useState(null);
  const [selectedProfileForCompare, setSelectedProfileForCompare] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);

  const handleSaveProfile = async () => {
    setSaveError(null);

    if (!newProfileName.trim()) {
      setSaveError('Please enter a profile name');
      return;
    }

    const result = await saveProfile(newProfileName, currentParameters, currentUnit);

    if (result.success) {
      setNewProfileName('');
      setSaveError(null);
    } else {
      setSaveError(result.error);
    }
  };

  const handleLoadProfile = (profileId) => {
    const result = loadProfile(profileId);
    if (result.success) {
      onLoadProfile(result.parameters, result.unit);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      await deleteProfile(profileId);
    }
  };

  const handleCompareProfiles = (profileId) => {
    if (!selectedProfileForCompare) {
      setSelectedProfileForCompare(profileId);
      return;
    }

    if (selectedProfileForCompare === profileId) {
      // Deselect if clicking the same profile
      setSelectedProfileForCompare(null);
      setComparisonResult(null);
      return;
    }

    // Compare the two profiles
    const result = compare(selectedProfileForCompare, profileId);
    if (result.success) {
      setComparisonResult(result.comparison);
    }

    setSelectedProfileForCompare(null);
  };

  return (
    <div className="mt-4">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-md shadow-md hover:from-blue-600 hover:to-blue-700 transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isOpen ? 'Close' : 'Manage Profiles'} ({profiles.length})
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden"
          >
            <div className="p-4">
              {/* Save New Profile Section */}
              <div className="mb-4 pb-4 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-2">
                  Save Current Settings
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="Profile name..."
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveProfile()}
                  />
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-md hover:bg-green-600 transition-colors"
                  >
                    Save
                  </button>
                </div>
                {saveError && (
                  <p className="mt-2 text-xs text-red-600">{saveError}</p>
                )}
              </div>

              {/* Profiles List */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-2">
                  Saved Profiles
                </h3>

                {isLoading && (
                  <p className="text-sm text-slate-500">Loading profiles...</p>
                )}

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                {!isLoading && profiles.length === 0 && (
                  <p className="text-sm text-slate-500 italic">
                    No saved profiles yet. Save your current settings above.
                  </p>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {profiles.map((profile) => (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'p-3 rounded-md border transition-all',
                        selectedProfileForCompare === profile.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-slate-800">
                            {profile.name}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Unit: {profile.unit} • Created:{' '}
                            {new Date(profile.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleLoadProfile(profile.id)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            title="Load this profile"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleCompareProfiles(profile.id)}
                            className={cn(
                              'px-2 py-1 text-xs rounded transition-colors',
                              selectedProfileForCompare === profile.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-purple-500 text-white hover:bg-purple-600'
                            )}
                            title={
                              selectedProfileForCompare
                                ? 'Compare with this profile'
                                : 'Select for comparison'
                            }
                          >
                            {selectedProfileForCompare === profile.id
                              ? 'Cancel'
                              : selectedProfileForCompare
                              ? 'Compare'
                              : 'Compare'}
                          </button>
                          <button
                            onClick={() => handleDeleteProfile(profile.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            title="Delete this profile"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Comparison Result */}
              {comparisonResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-md"
                >
                  <h4 className="font-bold text-sm text-purple-900 mb-2">
                    Comparison: {comparisonResult.profile1.name} vs{' '}
                    {comparisonResult.profile2.name}
                  </h4>

                  {!comparisonResult.hasDifferences && (
                    <p className="text-sm text-purple-700">
                      ✓ Both profiles have identical parameters
                    </p>
                  )}

                  {comparisonResult.hasDifferences && (
                    <div className="space-y-1">
                      {comparisonResult.differences.map((diff, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-white p-2 rounded border border-purple-100"
                        >
                          <span className="font-semibold text-slate-700">
                            {diff.parameter}:
                          </span>{' '}
                          <span className="text-purple-600">
                            {diff.profile1Value}
                          </span>
                          {' → '}
                          <span className="text-purple-600">
                            {diff.profile2Value}
                          </span>
                          <span className="text-slate-500">
                            {' '}
                            ({diff.difference > 0 ? '+' : ''}
                            {diff.difference.toFixed(2)})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setComparisonResult(null)}
                    className="mt-2 text-xs text-purple-600 hover:text-purple-800 underline"
                  >
                    Close comparison
                  </button>
                </motion.div>
              )}

              {selectedProfileForCompare && !comparisonResult && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-700">
                    Select another profile to compare, or click "Cancel" to deselect.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileManager;
