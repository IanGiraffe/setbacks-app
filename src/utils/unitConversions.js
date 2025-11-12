// Unit conversion utilities
export const UNITS = {
  FEET: 'feet',
  METERS: 'meters'
};

// Conversion factors
const FEET_TO_METERS = 0.3048;
const METERS_TO_FEET = 3.28084;

/**
 * Convert feet to meters
 * @param {number} feet - Value in feet
 * @returns {number} Value in meters
 */
export const feetToMeters = (feet) => {
  return feet * FEET_TO_METERS;
};

/**
 * Convert meters to feet
 * @param {number} meters - Value in meters
 * @returns {number} Value in feet
 */
export const metersToFeet = (meters) => {
  return meters * METERS_TO_FEET;
};

/**
 * Convert value from one unit to another
 * @param {number} value - The value to convert
 * @param {string} fromUnit - Source unit (UNITS.FEET or UNITS.METERS)
 * @param {string} toUnit - Target unit (UNITS.FEET or UNITS.METERS)
 * @returns {number} Converted value
 */
export const convertUnits = (value, fromUnit, toUnit) => {
  if (fromUnit === toUnit) {
    return value;
  }
  
  if (fromUnit === UNITS.FEET && toUnit === UNITS.METERS) {
    return feetToMeters(value);
  }
  
  if (fromUnit === UNITS.METERS && toUnit === UNITS.FEET) {
    return metersToFeet(value);
  }
  
  throw new Error(`Unsupported unit conversion: ${fromUnit} to ${toUnit}`);
};

/**
 * Convert setbacks object from one unit to another
 * @param {Object} setbacks - Setbacks object with numeric values
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @returns {Object} Converted setbacks object
 */
export const convertSetbacksUnits = (setbacks, fromUnit, toUnit) => {
  if (fromUnit === toUnit) {
    return setbacks;
  }

  const convertedSetbacks = {};
  const dimensionlessFields = ['maxFAR', 'maxDensity', 'maxHeightStories', 'maxImperviousCover']; // These don't need unit conversion

  Object.keys(setbacks).forEach(key => {
    const value = setbacks[key];
    if (typeof value === 'number') {
      // Don't convert dimensionless parameters
      if (dimensionlessFields.includes(key)) {
        convertedSetbacks[key] = value;
      } else {
        const converted = convertUnits(value, fromUnit, toUnit);
        // Round to appropriate decimal places to avoid floating-point errors
        const decimals = toUnit === UNITS.FEET ? 1 : 2;
        convertedSetbacks[key] = Math.round(converted * Math.pow(10, decimals)) / Math.pow(10, decimals);
      }
    } else {
      convertedSetbacks[key] = value;
    }
  });

  return convertedSetbacks;
};

/**
 * Get the unit symbol for display
 * @param {string} unit - Unit type
 * @returns {string} Unit symbol
 */
export const getUnitSymbol = (unit) => {
  switch (unit) {
    case UNITS.FEET:
      return 'ft';
    case UNITS.METERS:
      return 'm';
    default:
      return unit;
  }
};

/**
 * Get the full unit name for display in toggles
 * @param {string} unit - Unit type
 * @returns {string} Full unit name
 */
export const getUnitDisplayName = (unit) => {
  switch (unit) {
    case UNITS.FEET:
      return 'feet';
    case UNITS.METERS:
      return 'meters';
    default:
      return unit;
  }
};

/**
 * Format a value with appropriate decimal places for the unit
 * @param {number} value - The value to format
 * @param {string} unit - The unit type
 * @returns {number} Formatted value
 */
export const formatValueForUnit = (value, unit) => {
  // Round to appropriate decimal places
  const decimals = unit === UNITS.FEET ? 1 : 2;
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};