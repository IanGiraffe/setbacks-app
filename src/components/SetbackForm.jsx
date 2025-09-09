import React from 'react';

const SetbackForm = ({ setbacks, onChange, disabled }) => {
  const handleInputChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    onChange({
      ...setbacks,
      [field]: numValue
    });
  };

  return (
    <div className="setback-form">
      <h3>Setback Parameters</h3>
      
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="maxHeight">
            Max Height (m)
          </label>
          <input
            type="number"
            id="maxHeight"
            value={setbacks.maxHeight}
            onChange={(e) => handleInputChange('maxHeight', e.target.value)}
            disabled={disabled}
            min="0"
            step="0.1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="frontSetback">
            Front Setback (m)
          </label>
          <input
            type="number"
            id="frontSetback"
            value={setbacks.frontSetback}
            onChange={(e) => handleInputChange('frontSetback', e.target.value)}
            disabled={disabled}
            min="0"
            step="0.1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="sideSetback">
            Side Setback (m)
          </label>
          <input
            type="number"
            id="sideSetback"
            value={setbacks.sideSetback}
            onChange={(e) => handleInputChange('sideSetback', e.target.value)}
            disabled={disabled}
            min="0"
            step="0.1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="rearSetback">
            Rear Setback (m)
          </label>
          <input
            type="number"
            id="rearSetback"
            value={setbacks.rearSetback}
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
          <li>Maximum Height: {setbacks.maxHeight}m</li>
          <li>Front Setback: {setbacks.frontSetback}m</li>
          <li>Side Setback: {setbacks.sideSetback}m</li>
          <li>Rear Setback: {setbacks.rearSetback}m</li>
        </ul>
      </div>
    </div>
  );
};

export default SetbackForm;