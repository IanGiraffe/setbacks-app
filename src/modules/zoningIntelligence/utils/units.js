/**
 * Unit Utilities
 *
 * Formatting and parsing utilities for imperial units (US standard).
 * All values stored and returned in imperial units (feet, square feet, acres).
 */

// Conversion constant
const SQ_FEET_PER_ACRE = 43560;

/**
 * Convert square feet to acres
 * @param {number} sqFeet - Area in square feet
 * @returns {number} Area in acres
 */
export function sqFeetToAcres(sqFeet) {
  return sqFeet / SQ_FEET_PER_ACRE;
}

/**
 * Convert acres to square feet
 * @param {number} acres - Area in acres
 * @returns {number} Area in square feet
 */
export function acresToSqFeet(acres) {
  return acres * SQ_FEET_PER_ACRE;
}

/**
 * Format a distance for display
 * @param {number} feet - Distance in feet
 * @param {number} [precision=1] - Decimal places
 * @returns {string} Formatted distance with unit
 */
export function formatDistance(feet, precision = 1) {
  return `${feet.toFixed(precision)} ft`;
}

/**
 * Format an area for display
 * @param {number} sqFeet - Area in square feet
 * @param {string} [unit='sqFeet'] - Target unit ('sqFeet' or 'acres')
 * @param {number} [precision=0] - Decimal places
 * @returns {string} Formatted area with unit
 */
export function formatArea(sqFeet, unit = 'sqFeet', precision = 0) {
  if (unit === 'acres') {
    return `${sqFeetToAcres(sqFeet).toFixed(2)} acres`;
  }
  return `${sqFeet.toFixed(precision)} sq ft`;
}

/**
 * Parse a distance string to feet
 * Handles formats like "15 ft", "15'", "15"
 * @param {string|number} input - Distance string or number
 * @returns {number|null} Distance in feet, or null if invalid
 */
export function parseDistance(input) {
  if (typeof input === 'number') return input;

  const trimmed = input.trim().toLowerCase();

  // Match patterns like "15 ft", "15'", "15"
  const match = trimmed.match(/^([\d.]+)\s*(ft|feet|')?$/);

  if (!match) return null;

  const value = parseFloat(match[1]);

  if (isNaN(value)) return null;

  return value;
}

/**
 * Parse an area string to square feet
 * Handles formats like "5000 sq ft", "0.5 acres", "5000"
 * @param {string|number} input - Area string or number
 * @returns {number|null} Area in square feet, or null if invalid
 */
export function parseArea(input) {
  if (typeof input === 'number') return input;

  const trimmed = input.trim().toLowerCase();

  // Match patterns like "5000 sq ft", "0.5 acres", "5000"
  const match = trimmed.match(/^([\d.]+)\s*(sq\s*ft|sqft|acres?)?$/);

  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2];

  if (isNaN(value)) return null;

  // Convert acres to sq ft if needed
  if (unit?.includes('acre')) {
    return acresToSqFeet(value);
  }

  return value;
}

/**
 * Round to a reasonable precision for display
 * @param {number} value - Value to round
 * @param {number} [precision=2] - Decimal places
 * @returns {number} Rounded value
 */
export function roundToPrecision(value, precision = 2) {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}
