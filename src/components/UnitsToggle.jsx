import React from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { UNITS, getUnitDisplayName } from '../utils/unitConversions';
import { cn } from '../utils/cn';

const UnitsToggle = ({ currentUnit, onUnitChange, disabled = false }) => {
  const handleToggle = (unit) => {
    if (!disabled && unit !== currentUnit) {
      onUnitChange(unit);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-black text-giraffe-dark uppercase tracking-wide">
        Units:
      </span>
      <div className="flex border-3 border-black overflow-hidden rounded-lg">
        <motion.button
          type="button"
          className={cn(
            "px-4 py-2 font-black text-sm uppercase tracking-wide transition-all duration-150",
            "border-r-3 border-black",
            currentUnit === UNITS.FEET
              ? "bg-giraffe-yellow text-giraffe-dark"
              : "bg-white text-slate-600 hover:bg-slate-100",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => handleToggle(UNITS.FEET)}
          disabled={disabled}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
        >
          {getUnitDisplayName(UNITS.FEET)}
        </motion.button>
        <motion.button
          type="button"
          className={cn(
            "px-4 py-2 font-black text-sm uppercase tracking-wide transition-all duration-150",
            currentUnit === UNITS.METERS
              ? "bg-giraffe-yellow text-giraffe-dark"
              : "bg-white text-slate-600 hover:bg-slate-100",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => handleToggle(UNITS.METERS)}
          disabled={disabled}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
        >
          {getUnitDisplayName(UNITS.METERS)}
        </motion.button>
      </div>
    </div>
  );
};

export default UnitsToggle;