import React from 'react';
import { UNITS, getUnitSymbol } from '../utils/unitConversions';

const UnitsToggle = ({ currentUnit, onUnitChange, disabled = false }) => {
  const handleToggle = (unit) => {
    if (!disabled && unit !== currentUnit) {
      onUnitChange(unit);
    }
  };

  return (
    <div className="units-toggle">
      <span className="units-label">Units:</span>
      <div className="toggle-buttons">
        <button
          type="button"
          className={`toggle-button ${currentUnit === UNITS.FEET ? 'active' : ''}`}
          onClick={() => handleToggle(UNITS.FEET)}
          disabled={disabled}
        >
          {getUnitSymbol(UNITS.FEET)}
        </button>
        <button
          type="button"
          className={`toggle-button ${currentUnit === UNITS.METERS ? 'active' : ''}`}
          onClick={() => handleToggle(UNITS.METERS)}
          disabled={disabled}
        >
          {getUnitSymbol(UNITS.METERS)}
        </button>
      </div>
    </div>
  );
};

export default UnitsToggle;