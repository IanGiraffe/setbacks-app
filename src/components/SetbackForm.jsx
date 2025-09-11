import React from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import UnitsToggle from './UnitsToggle';
import { formatValueForUnit } from '../utils/unitConversions';
import { cn } from '../utils/cn';

const SetbackForm = ({ setbacks, onChange, disabled, currentUnit, onUnitChange, onGenerate, isGenerating, selectedEnvelope }) => {
  const [customSetbacks, setCustomSetbacks] = React.useState({});
  const [newSetbackName, setNewSetbackName] = React.useState('');

  const handleInputChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    onChange({
      ...setbacks,
      [field]: numValue
    });
  };

  const handleCustomSetbackChange = (name, value) => {
    const numValue = parseFloat(value) || 0;
    setCustomSetbacks({
      ...customSetbacks,
      [name]: numValue
    });
  };

  const addCustomSetback = () => {
    if (newSetbackName.trim() && !customSetbacks[newSetbackName] && !['maxHeight', 'frontSetback', 'sideSetback', 'rearSetback'].includes(newSetbackName + 'Setback')) {
      setCustomSetbacks({
        ...customSetbacks,
        [newSetbackName]: 0
      });
      setNewSetbackName('');
    }
  };

  const removeCustomSetback = (name) => {
    const updatedCustom = { ...customSetbacks };
    delete updatedCustom[name];
    setCustomSetbacks(updatedCustom);
  };

  const formInputs = [
    { key: 'maxHeight', label: 'Max Height' },
    { key: 'frontSetback', label: 'Front Setback' },
    { key: 'sideSetback', label: 'Side Setback' },
    { key: 'rearSetback', label: 'Rear Setback' }
  ];

  return (
    <motion.div 
      className="bg-white border-2 border-black rounded-md p-3 mb-3 w-full transform scale-80 origin-top"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
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
        {formInputs.map((field, index) => (
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
              value={formatValueForUnit(setbacks[field.key], currentUnit)}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
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
              whileFocus={{ scale: 1.02 }}
            />
          </motion.div>
        ))}
        
        {/* Custom setback inputs - positioned right after rear setback */}
        {Object.keys(customSetbacks).map((name, index) => (
          <motion.div 
            key={name}
            className="flex items-center gap-2 min-w-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
          >
            <label 
              className="text-xs font-black text-giraffe-dark uppercase tracking-wide flex-shrink-0 text-right"
              style={{ minWidth: '120px' }}
            >
              {name}
            </label>
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
            <motion.button
              onClick={() => removeCustomSetback(name)}
              disabled={disabled}
              className={cn(
                "px-2 py-1 text-xs font-bold text-white bg-red-500",
                "border border-red-600 rounded hover:bg-red-600",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-150"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ×
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* Add Custom Setback Section */}
      <div className="mt-4 pt-3 border-t border-slate-200">
        <motion.h4 
          className="text-sm font-black text-giraffe-dark mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Add Custom Setback Type
        </motion.h4>
        
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <input
            type="text"
            placeholder="Type name (e.g., 'compatibility')"
            value={newSetbackName}
            onChange={(e) => setNewSetbackName(e.target.value)}
            disabled={disabled}
            className={cn(
              "flex-1 px-2 py-1 text-xs font-medium text-giraffe-dark",
              "border border-slate-300 bg-white rounded",
              "focus:outline-none focus:ring-0 focus:border-giraffe-orange",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors duration-150"
            )}
          />
          <motion.button
            onClick={addCustomSetback}
            disabled={disabled || !newSetbackName.trim()}
            className={cn(
              "px-3 py-1 text-xs font-bold text-white bg-giraffe-dark",
              "border border-black rounded hover:bg-opacity-80",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-150"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Add
          </motion.button>
        </motion.div>
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