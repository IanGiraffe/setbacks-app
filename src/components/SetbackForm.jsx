import React from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import UnitsToggle from './UnitsToggle';
import ProfileManager from './ProfileManager';
import { formatValueForUnit, UNITS } from '../utils/unitConversions';
import { cn } from '../utils/cn';
import { ZONING_PARAMETERS, SETBACK_PARAMETERS } from '../config/zoningParameters';

const SetbackForm = ({ setbacks, onChange, disabled, currentUnit, onUnitChange, onGenerate, isGenerating, selectedEnvelope, onLoadProfile, enabledParams, onEnabledChange }) => {
  const [customSetbacks, setCustomSetbacks] = React.useState({});
  const [editingLabel, setEditingLabel] = React.useState(null);
  const [unnamedSetbacks, setUnnamedSetbacks] = React.useState(new Set());
  const [hoveredSetback, setHoveredSetback] = React.useState(null);

  // Wrap onLoadProfile to handle custom setbacks restoration
  const handleLoadProfileWrapper = React.useCallback((parameters, unit, enabled, customSetbacksToLoad) => {
    const result = onLoadProfile(parameters, unit, enabled, customSetbacksToLoad);
    if (customSetbacksToLoad) {
      setCustomSetbacks(customSetbacksToLoad);
    }
    return result;
  }, [onLoadProfile]);

  const handleInputChange = (field, value) => {
    let numValue = parseFloat(value) || 0;

    // Round to appropriate precision based on parameter config
    const allParams = [...ZONING_PARAMETERS, ...SETBACK_PARAMETERS];
    const paramConfig = allParams.find(p => p.key === field);

    if (paramConfig) {
      if (paramConfig.step >= 1) {
        // Whole numbers
        numValue = Math.round(numValue);
      } else if (paramConfig.step === 0.01) {
        // 2 decimal places
        numValue = Math.round(numValue * 100) / 100;
      } else {
        // 1 decimal place (step 0.1)
        numValue = Math.round(numValue * 10) / 10;
      }
    }

    onChange({
      ...setbacks,
      [field]: numValue
    });
  };

  const handleToggleEnabled = (field) => {
    onEnabledChange({
      ...enabledParams,
      [field]: !enabledParams[field]
    });
  };

  const handleCustomSetbackChange = (name, value) => {
    let numValue = parseFloat(value) || 0;
    // Round custom setbacks to 1 decimal place
    numValue = Math.round(numValue * 10) / 10;
    setCustomSetbacks({
      ...customSetbacks,
      [name]: numValue
    });
  };

  const addCustomSetback = () => {
    const newName = 'Setback Name';
    let uniqueName = newName;
    let counter = 1;

    // Ensure unique name
    while (customSetbacks[uniqueName]) {
      counter++;
      uniqueName = `${newName} ${counter}`;
    }

    setCustomSetbacks({
      ...customSetbacks,
      [uniqueName]: 0
    });
    setEditingLabel(uniqueName);
    setUnnamedSetbacks(prev => new Set([...prev, uniqueName]));
  };

  const removeCustomSetback = (name) => {
    const updatedCustom = { ...customSetbacks };
    delete updatedCustom[name];
    setCustomSetbacks(updatedCustom);

    // Remove from unnamed set
    setUnnamedSetbacks(prev => {
      const newSet = new Set(prev);
      newSet.delete(name);
      return newSet;
    });
  };

  const renameCustomSetback = (oldName, newName) => {
    if (newName.trim() === '' || newName === oldName) {
      setEditingLabel(null);
      return;
    }

    // Prevent duplicate names
    if (customSetbacks[newName]) {
      setEditingLabel(null);
      return;
    }

    const updatedCustom = {};
    Object.keys(customSetbacks).forEach(key => {
      if (key === oldName) {
        updatedCustom[newName] = customSetbacks[oldName];
      } else {
        updatedCustom[key] = customSetbacks[key];
      }
    });

    setCustomSetbacks(updatedCustom);
    setEditingLabel(null);

    // Remove from unnamed set if it was renamed
    setUnnamedSetbacks(prev => {
      const newSet = new Set(prev);
      newSet.delete(oldName);
      return newSet;
    });
  };

  const handleLabelInputFocus = (e) => {
    // Select all text when focusing for easy overwriting
    e.target.select();
  };

  const handleLabelKeyDown = (name, e) => {
    if (e.key === 'Enter') {
      renameCustomSetback(name, e.target.value);
    } else if (e.key === 'Escape') {
      setEditingLabel(null);
    } else if (e.key === 'Tab') {
      // Allow Tab to move to value input
      renameCustomSetback(name, e.target.value);
      // Focus will naturally move to next input due to Tab
    }
  };

  // Helper function to get label with unit suffix if needed
  const getLabelWithUnit = (param) => {
    if (param.labelWithUnit && param.unit === 'distance') {
      const unitSymbol = currentUnit === UNITS.FEET ? 'ft' : 'm';
      return `${param.label} (${unitSymbol})`;
    }
    return param.label;
  };

  // Use configuration from zoningParameters.js
  const zoningInputs = ZONING_PARAMETERS.map(param => ({
    key: param.key,
    label: getLabelWithUnit(param),
    step: param.step.toString(),
    noUnit: param.unit !== 'distance'
  }));

  const setbackInputs = SETBACK_PARAMETERS.map(param => ({
    key: param.key,
    label: getLabelWithUnit(param),
    step: param.step.toString(),
    noUnit: param.unit !== 'distance'
  }));

  return (
    <motion.div
      className="bg-white border-2 border-black rounded-md p-3 mb-3 w-full transform scale-80 origin-top"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Profile Manager above Parameters */}
      <ProfileManager
        currentParameters={setbacks}
        currentUnit={currentUnit}
        onLoadProfile={handleLoadProfileWrapper}
        enabledParams={enabledParams}
        customSetbacks={customSetbacks}
      />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <motion.h3
          className="text-lg font-black text-giraffe-dark mb-3 md:mb-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Parameters
        </motion.h3>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <UnitsToggle
            currentUnit={currentUnit}
            onUnitChange={onUnitChange}
            disabled={disabled}
          />
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {/* Zoning parameters */}
        {zoningInputs.map((field, index) => (
          <motion.div
            key={field.key}
            className="flex items-center gap-2 min-w-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * (index + 3) }}
          >
            <label
              htmlFor={field.key}
              className="text-xs font-black text-giraffe-dark uppercase tracking-wide flex-shrink-0 text-right"
              style={{ minWidth: '120px' }}
            >
              {field.label}
            </label>
            <motion.input
              type="number"
              id={field.key}
              value={field.noUnit ? setbacks[field.key] : formatValueForUnit(setbacks[field.key], currentUnit)}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              disabled={disabled || !enabledParams[field.key]}
              min="0"
              step={field.step || "0.1"}
              className={cn(
                "min-w-0 flex-1 px-2 py-1.5 text-sm font-bold text-giraffe-dark",
                "border-2 border-black bg-white rounded",
                "focus:outline-none focus:ring-0 focus:border-giraffe-orange",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors duration-150"
              )}
              whileFocus={{ scale: 1.02 }}
            />
            <motion.button
              onClick={() => handleToggleEnabled(field.key)}
              disabled={disabled}
              className={cn(
                "px-2 py-1.5 text-xs font-bold rounded border-2 transition-all duration-150",
                "disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0",
                enabledParams[field.key]
                  ? "bg-green-100 border-green-600 text-green-700 hover:bg-green-200"
                  : "bg-slate-100 border-slate-400 text-slate-600 hover:bg-slate-200"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={enabledParams[field.key] ? "Enabled - click to disable" : "Disabled - click to enable"}
            >
              {enabledParams[field.key] ? "ON" : "OFF"}
            </motion.button>
          </motion.div>
        ))}

        {/* Setback parameters */}
        <div className="mt-2 pt-2 border-t border-slate-200">
          {setbackInputs.map((field, index) => (
            <motion.div
              key={field.key}
              className="flex items-center gap-2 min-w-0 mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + zoningInputs.length + 3) }}
            >
              <label
                htmlFor={field.key}
                className="text-xs font-black text-giraffe-dark uppercase tracking-wide flex-shrink-0 text-right"
                style={{ minWidth: '120px' }}
              >
                {field.label}
              </label>
              <motion.input
                type="number"
                id={field.key}
                value={field.noUnit ? setbacks[field.key] : formatValueForUnit(setbacks[field.key], currentUnit)}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                disabled={disabled || !enabledParams[field.key]}
                min="0"
                step={field.step || "0.1"}
                className={cn(
                  "min-w-0 flex-1 px-2 py-1.5 text-sm font-bold text-giraffe-dark",
                  "border-2 border-black bg-white rounded",
                  "focus:outline-none focus:ring-0 focus:border-giraffe-orange",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-colors duration-150"
                )}
                whileFocus={{ scale: 1.02 }}
              />
              <motion.button
                onClick={() => handleToggleEnabled(field.key)}
                disabled={disabled}
                className={cn(
                  "px-2 py-1.5 text-xs font-bold rounded border-2 transition-all duration-150",
                  "disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0",
                  enabledParams[field.key]
                    ? "bg-green-100 border-green-600 text-green-700 hover:bg-green-200"
                    : "bg-slate-100 border-slate-400 text-slate-600 hover:bg-slate-200"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={enabledParams[field.key] ? "Enabled - click to disable" : "Disabled - click to enable"}
              >
                {enabledParams[field.key] ? "ON" : "OFF"}
              </motion.button>
            </motion.div>
          ))}

          {/* Custom setback inputs - positioned right after rear setback */}
          {Object.keys(customSetbacks).map((name, index) => (
            <motion.div
              key={name}
              className="flex items-center gap-2 min-w-0 mb-3 relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              onMouseEnter={() => setHoveredSetback(name)}
              onMouseLeave={() => setHoveredSetback(null)}
            >
              {editingLabel === name ? (
                <input
                  type="text"
                  defaultValue={name}
                  autoFocus
                  onFocus={handleLabelInputFocus}
                  onBlur={(e) => renameCustomSetback(name, e.target.value)}
                  onKeyDown={(e) => handleLabelKeyDown(name, e)}
                  className={cn(
                    "text-xs font-black uppercase tracking-wide flex-shrink-0 text-right",
                    "px-1 py-0.5 border border-slate-300 rounded bg-white",
                    "focus:outline-none focus:border-giraffe-orange",
                    unnamedSetbacks.has(name) ? "text-slate-400" : "text-giraffe-dark"
                  )}
                  style={{ minWidth: '120px' }}
                />
              ) : (
                <button
                  onClick={() => setEditingLabel(name)}
                  disabled={disabled}
                  className={cn(
                    "text-xs font-black uppercase tracking-wide flex-shrink-0 text-right",
                    "hover:text-giraffe-dark transition-colors cursor-pointer",
                    "disabled:cursor-not-allowed",
                    unnamedSetbacks.has(name) ? "text-slate-400" : "text-giraffe-dark"
                  )}
                  style={{ minWidth: '120px' }}
                  title="Click to edit label"
                >
                  {name}
                </button>
              )}
              <motion.input
                type="number"
                value={formatValueForUnit(customSetbacks[name], currentUnit)}
                onChange={(e) => handleCustomSetbackChange(name, e.target.value)}
                disabled={disabled}
                min="0"
                step="0.1"
                className={cn(
                  "min-w-0 flex-1 px-2 py-1.5 text-sm font-bold text-giraffe-dark",
                  "border-2 border-black bg-white rounded",
                  "focus:outline-none focus:ring-0 focus:border-giraffe-orange",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-colors duration-150"
                )}
              />

              {/* Sliding trash icon on hover */}
              <motion.button
                onClick={() => removeCustomSetback(name)}
                disabled={disabled}
                initial={{ x: 20, opacity: 0 }}
                animate={{
                  x: hoveredSetback === name ? 0 : 20,
                  opacity: hoveredSetback === name ? 1 : 0
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={cn(
                  "px-2 py-1.5 text-sm text-red-600 hover:text-red-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-colors duration-150"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Delete custom setback"
              >
                🗑️
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add Custom Setback Button */}
      <div className="mt-3">
        <motion.button
          onClick={addCustomSetback}
          disabled={disabled}
          className={cn(
            "w-full px-3 py-2 text-xs font-bold text-giraffe-dark bg-slate-100",
            "border-2 border-slate-300 rounded hover:bg-slate-200 hover:border-slate-400",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-150"
          )}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          + Add Custom Setback
        </motion.button>
      </div>

      <motion.div 
        className="mt-4 flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <motion.button 
          className={cn(
            "bg-giraffe-yellow hover:bg-yellow-300 text-giraffe-dark",
            "px-4 py-2 text-sm font-black uppercase tracking-wide",
            "border-2 border-black shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1",
            "transition-all duration-150 active:shadow-none active:translate-x-1 active:translate-y-1",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-brutal disabled:hover:translate-x-0 disabled:hover:translate-y-0",
            "rounded-md w-full max-w-xs"
          )}
          onClick={() => onGenerate(customSetbacks)}
          disabled={isGenerating || disabled}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isGenerating ? (
            <motion.span 
              className="flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-4 h-4 border-2 border-giraffe-dark border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              {selectedEnvelope ? 'Updating...' : 'Generating...'}
            </motion.span>
          ) : (
            selectedEnvelope ? 'Modify Selected Envelope' : 'Generate Envelope'
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default SetbackForm;