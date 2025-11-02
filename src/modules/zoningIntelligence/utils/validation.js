/**
 * Validation Utilities
 *
 * Functions for validating inputs and data structures.
 */

import { isValidBoundary, isValidParcelData, ERROR_TYPES, createError } from '../schemas/index.js';

/**
 * Validate zoning regulation data
 * @param {Object} regulation - Zoning regulation object to validate
 * @returns {Object} Validation result {valid: boolean, errors: string[]}
 */
export function validateZoningRegulation(regulation) {
  const errors = [];

  if (!regulation) {
    errors.push('Regulation data is required');
    return { valid: false, errors };
  }

  if (!regulation.jurisdiction || typeof regulation.jurisdiction !== 'string') {
    errors.push('jurisdiction is required and must be a string');
  }

  if (!regulation.zoningCode || typeof regulation.zoningCode !== 'string') {
    errors.push('zoningCode is required and must be a string');
  }

  if (!regulation.regulations || typeof regulation.regulations !== 'object') {
    errors.push('regulations object is required');
  }

  // Validate numeric values if present
  const numericFields = [
    'regulations.maxHeight',
    'regulations.maxHeightStories',
    'regulations.maxFAR',
    'regulations.maxDensity'
  ];

  numericFields.forEach(field => {
    const value = getNestedValue(regulation, field);
    if (value !== undefined && value !== null && typeof value !== 'number') {
      errors.push(`${field} must be a number`);
    }
  });

  // Validate setbacks if present
  if (regulation.regulations?.setbacks) {
    const setbacks = regulation.regulations.setbacks;
    const setbackFields = ['front', 'side', 'rear'];

    setbackFields.forEach(field => {
      const value = setbacks[field];
      if (value !== undefined && value !== null && typeof value !== 'number') {
        errors.push(`setbacks.${field} must be a number`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate boundary input for parcel queries
 * @param {Object} boundary - Boundary to validate
 * @returns {Object} Validation result with error details
 */
export function validateBoundaryInput(boundary) {
  if (!boundary) {
    return {
      valid: false,
      error: createError(
        ERROR_TYPES.INVALID_INPUT,
        'Boundary is required'
      )
    };
  }

  if (!isValidBoundary(boundary)) {
    return {
      valid: false,
      error: createError(
        ERROR_TYPES.INVALID_INPUT,
        'Invalid boundary: must be a GeoJSON Feature with Polygon or MultiPolygon geometry',
        null,
        { boundary }
      )
    };
  }

  return { valid: true };
}

/**
 * Validate parcel data from API response
 * @param {Object} parcel - Parcel data to validate
 * @returns {Object} Validation result
 */
export function validateParcelResponse(parcel) {
  if (!parcel) {
    return {
      valid: false,
      error: createError(
        ERROR_TYPES.INVALID_INPUT,
        'Parcel data is required'
      )
    };
  }

  if (!isValidParcelData(parcel)) {
    return {
      valid: false,
      error: createError(
        ERROR_TYPES.INVALID_INPUT,
        'Invalid parcel data structure',
        null,
        { parcel }
      )
    };
  }

  return { valid: true };
}

/**
 * Validate API configuration
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result
 */
export function validateApiConfig(config) {
  const errors = [];

  if (!config) {
    errors.push('Configuration is required');
    return { valid: false, errors };
  }

  if (!config.regrid?.token) {
    errors.push('Regrid token is required');
  }

  if (!config.claude?.apiKey) {
    errors.push('Claude API key is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize user input strings
 * @param {string} input - Input to sanitize
 * @param {number} [maxLength=1000] - Maximum length
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input, maxLength = 1000) {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential HTML tags
}

/**
 * Validate numeric range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - Field name for error message
 * @returns {Object} Validation result
 */
export function validateRange(value, min, max, fieldName) {
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      valid: false,
      error: `${fieldName} must be a valid number`
    };
  }

  if (value < min || value > max) {
    return {
      valid: false,
      error: `${fieldName} must be between ${min} and ${max}`
    };
  }

  return { valid: true };
}

/**
 * Helper to get nested object value by path
 * @param {Object} obj - Object to traverse
 * @param {string} path - Dot-notation path (e.g., 'regulations.maxHeight')
 * @returns {*} Value at path or undefined
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
}
