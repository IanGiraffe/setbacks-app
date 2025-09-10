import React from 'react';
import UnitsToggle from './UnitsToggle';
import { getUnitSymbol, formatValueForUnit } from '../utils/unitConversions';

const SetbackForm = ({ setbacks, onChange, disabled, currentUnit, onUnitChange }) => {
  const handleInputChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    onChange({
      ...setbacks,
      [field]: numValue
    });
  };

  const unitSymbol = getUnitSymbol(currentUnit);

  return (
    <div className="setback-form">
      <div className="form-header">
        <h3>Setback Parameters</h3>
        <UnitsToggle 
          currentUnit={currentUnit}
          onUnitChange={onUnitChange}
          disabled={disabled}
        />
      </div>
      
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="maxHeight">
            Max Height ({unitSymbol})
          </label>
          <input
            type="number"
            id="maxHeight"
            value={formatValueForUnit(setbacks.maxHeight, currentUnit)}
            onChange={(e) => handleInputChange('maxHeight', e.target.value)}
            disabled={disabled}
            min="0"
            step="0.1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="frontSetback">
            Front Setback ({unitSymbol})
          </label>
          <input
            type="number"
            id="frontSetback"
            value={formatValueForUnit(setbacks.frontSetback, currentUnit)}
            onChange={(e) => handleInputChange('frontSetback', e.target.value)}
            disabled={disabled}
            min="0"
            step="0.1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="sideSetback">
            Side Setback ({unitSymbol})
          </label>
          <input
            type="number"
            id="sideSetback"
            value={formatValueForUnit(setbacks.sideSetback, currentUnit)}
            onChange={(e) => handleInputChange('sideSetback', e.target.value)}
            disabled={disabled}
            min="0"
            step="0.1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="rearSetback">
            Rear Setback ({unitSymbol})
          </label>
          <input
            type="number"
            id="rearSetback"
            value={formatValueForUnit(setbacks.rearSetback, currentUnit)}
            onChange={(e) => handleInputChange('rearSetback', e.target.value)}
            disabled={disabled}
            min="0"
            step="0.1"
          />
        </div>
      </div>

      <div className="setback-info">
        <h4>Current Settings:</h4>
        <ul>
          <li>Maximum Height: {formatValueForUnit(setbacks.maxHeight, currentUnit)} {unitSymbol}</li>
          <li>Front Setback: {formatValueForUnit(setbacks.frontSetback, currentUnit)} {unitSymbol}</li>
          <li>Side Setback: {formatValueForUnit(setbacks.sideSetback, currentUnit)} {unitSymbol}</li>
          <li>Rear Setback: {formatValueForUnit(setbacks.rearSetback, currentUnit)} {unitSymbol}</li>
        </ul>
      </div>
    </div>
  );
};

export default SetbackForm;