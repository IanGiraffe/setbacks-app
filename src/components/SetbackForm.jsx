import React from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import UnitsToggle from './UnitsToggle';
import { formatValueForUnit } from '../utils/unitConversions';
import { cn } from '../utils/cn';

const SetbackForm = ({ setbacks, onChange, disabled, currentUnit, onUnitChange }) => {
  const handleInputChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    onChange({
      ...setbacks,
      [field]: numValue
    });
  };


  const formInputs = [
    { key: 'maxHeight', label: 'Max Height' },
    { key: 'frontSetback', label: 'Front Setback' },
    { key: 'sideSetback', label: 'Side Setback' },
    { key: 'rearSetback', label: 'Rear Setback' }
  ];

  return (
    <motion.div 
      className="bg-white border-3 border-black rounded-lg p-4 mb-4 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <motion.h3 
          className="text-2xl font-black text-giraffe-dark mb-4 md:mb-0"
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
      
      <div className="grid grid-cols-1 gap-4">
        {formInputs.map((field, index) => (
          <motion.div 
            key={field.key}
            className="flex items-center gap-3 min-w-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * (index + 3) }}
          >
            <label 
              htmlFor={field.key}
              className="text-xs font-black text-giraffe-dark uppercase tracking-wide flex-shrink-0 text-right"
              style={{ minWidth: '110px' }}
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
                "min-w-0 flex-1 px-3 py-2 text-base font-bold text-giraffe-dark",
                "border-3 border-black bg-white rounded",
                "focus:outline-none focus:ring-0 focus:border-giraffe-orange",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors duration-150"
              )}
              whileFocus={{ scale: 1.02 }}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SetbackForm;