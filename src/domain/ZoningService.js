/**
 * Zoning Service
 *
 * Business logic for managing zoning parameters.
 * Handles validation, defaults, and unit conversions.
 */

import { getDefaultParameters, requiresUnitConversion } from '../config/zoningParameters';
import { convertSetbacksUnits, UNITS } from '../utils/unitConversions';

export class ZoningService {
  /**
   * Get default zoning parameters in specified unit
   * @param {string} unit - Unit system (UNITS.FEET or UNITS.METERS)
   * @returns {Object} Default parameters in specified unit
   */
  static getDefaults(unit = UNITS.FEET) {
    const defaults = getDefaultParameters();

    if (unit === UNITS.METERS) {
      return convertSetbacksUnits(defaults, UNITS.FEET, UNITS.METERS);
    }

    return defaults;
  }

  /**
   * Validate a single zoning parameter
   * @param {string} key - Parameter key
   * @param {number} value - Parameter value
   * @returns {Object} Validation result with valid flag and error message
   */
  static validateParameter(key, value) {
    if (typeof value !== 'number' || isNaN(value)) {
      return { valid: false, error: 'Value must be a number' };
    }

    if (value < 0) {
      return { valid: false, error: 'Value cannot be negative' };
    }

    // Add specific validation rules per parameter type
    switch (key) {
      case 'maxHeightStories':
        if (value % 1 !== 0) {
          return { valid: false, error: 'Stories must be a whole number' };
        }
        break;

      case 'maxFAR':
        if (value > 20) {
          return { valid: false, error: 'FAR seems unusually high (>20)' };
        }
        break;

      case 'maxDensity':
        if (value > 500) {
          return { valid: false, error: 'Density seems unusually high (>500)' };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Validate all zoning parameters
   * @param {Object} parameters - All zoning parameters
   * @returns {Object} Validation results with overall valid flag and errors
   */
  static validateParameters(parameters) {
    const errors = {};
    let valid = true;

    Object.keys(parameters).forEach(key => {
      const result = this.validateParameter(key, parameters[key]);
      if (!result.valid) {
        errors[key] = result.error;
        valid = false;
      }
    });

    return { valid, errors };
  }

  /**
   * Convert parameters to meters for Giraffe SDK
   * @param {Object} parameters - Parameters in any unit
   * @param {string} currentUnit - Current unit system
   * @returns {Object} Parameters in meters
   */
  static convertToMeters(parameters, currentUnit) {
    if (currentUnit === UNITS.METERS) {
      return parameters;
    }

    return convertSetbacksUnits(parameters, UNITS.FEET, UNITS.METERS);
  }

  /**
   * Convert parameters from meters to display unit
   * @param {Object} parameters - Parameters in meters
   * @param {string} targetUnit - Target unit system
   * @returns {Object} Parameters in target unit
   */
  static convertFromMeters(parameters, targetUnit) {
    if (targetUnit === UNITS.METERS) {
      return parameters;
    }

    return convertSetbacksUnits(parameters, UNITS.METERS, targetUnit);
  }

  /**
   * Merge custom setbacks with standard parameters
   * @param {Object} standardParams - Standard zoning parameters
   * @param {Object} customSetbacks - Custom setback definitions
   * @returns {Object} Merged parameters
   */
  static mergeCustomSetbacks(standardParams, customSetbacks) {
    return {
      ...standardParams,
      customSetbacks: { ...customSetbacks }
    };
  }

  /**
   * Check if parameter requires unit conversion
   * @param {string} key - Parameter key
   * @returns {boolean} True if parameter needs unit conversion
   */
  static needsUnitConversion(key) {
    return requiresUnitConversion(key);
  }
}
