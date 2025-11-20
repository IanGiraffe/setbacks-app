/**
 * Validation Service
 *
 * Orchestrates design validation by coordinating between Giraffe analytics
 * and validation rules. This service encapsulates the business logic for
 * validating designs against zoning parameters.
 */

import { GiraffeAdapter } from './GiraffeAdapter';
import { extractDesignMeasurements, hasValidAnalytics } from '../utils/measurementUtils';
import { validateDesign } from '../utils/validators';
import { VALIDATION_STATUS, PARAMETER_NAMES } from '../constants/validationRules';

export class ValidationService {
  /**
   * Validate a design against zoning parameters
   * @param {string} envelopeId - Envelope feature ID (unused - analytics are project-wide)
   * @param {Object} zoningParams - Zoning parameters to validate against
   * @param {Object} enabledParams - Which parameters are enabled for validation
   * @returns {Promise<Object>} Validation results
   */
  static async validateEnvelope(envelopeId, zoningParams, enabledParams = {}) {
    try {
      // Get analytics from Giraffe (project-wide analytics)
      const analytics = await GiraffeAdapter.getAnalytics();

      if (!hasValidAnalytics(analytics)) {
        return {
          status: VALIDATION_STATUS.UNKNOWN,
          message: 'Analytics data not available',
          results: null
        };
      }

      // Extract measurements
      const providedValues = extractDesignMeasurements(analytics);

      // Filter zoningParams to only include enabled parameters
      const enabledZoningParams = {};
      Object.keys(zoningParams).forEach(key => {
        if (enabledParams[key]) {
          enabledZoningParams[key] = zoningParams[key];
        }
      });

      // Perform validation only on enabled parameters
      const validationResults = validateDesign(providedValues, enabledZoningParams);

      // Add NOT_APPLICABLE status for disabled parameters
      const allParameters = ['maxHeight', 'maxHeightStories', 'maxFAR', 'maxDensity', 'maxImperviousCover'];
      const disabledResults = {};

      allParameters.forEach(paramKey => {
        if (!enabledParams[paramKey]) {
          // Map parameter keys to result keys
          const resultKeyMap = {
            maxHeight: 'heightFt',
            maxHeightStories: 'heightStories',
            maxFAR: 'far',
            maxDensity: 'density',
            maxImperviousCover: 'imperviousCover'
          };

          const resultKey = resultKeyMap[paramKey];
          const paramName = PARAMETER_NAMES[paramKey] || paramKey;

          disabledResults[resultKey] = {
            status: VALIDATION_STATUS.NOT_APPLICABLE,
            message: `${paramName} does not apply in this zoning profile`
          };
        }
      });

      // Merge validation results - disabled results take precedence over validation results
      const allResults = {
        ...validationResults.results,
        ...disabledResults
      };

      return {
        status: validationResults.overallStatus,
        isCompliant: validationResults.isCompliant,
        hasBreaches: validationResults.hasBreaches,
        breachCount: validationResults.breachCount,
        results: allResults,
        providedValues,
        zoningParams: enabledZoningParams
      };
    } catch (error) {
      console.error('Error validating envelope:', error);
      return {
        status: VALIDATION_STATUS.UNKNOWN,
        message: `Validation error: ${error.message}`,
        results: null
      };
    }
  }

  /**
   * Get validation summary for display
   * @param {Object} validationResults - Results from validateEnvelope
   * @returns {Object} Summary for UI display
   */
  static getValidationSummary(validationResults) {
    if (!validationResults || !validationResults.results) {
      return {
        title: 'Validation Unavailable',
        message: 'No validation data available',
        color: 'gray'
      };
    }

    const { isCompliant, hasBreaches, breachCount } = validationResults;

    if (isCompliant) {
      return {
        title: 'Design Compliant',
        message: 'All parameters meet zoning requirements',
        color: 'green'
      };
    }

    if (hasBreaches) {
      return {
        title: 'Design Non-Compliant',
        message: `${breachCount} parameter${breachCount > 1 ? 's' : ''} exceed zoning limits`,
        color: 'red'
      };
    }

    return {
      title: 'Validation Incomplete',
      message: 'Some validation data unavailable',
      color: 'yellow'
    };
  }

  /**
   * Get breaches only from validation results
   * @param {Object} validationResults - Results from validateEnvelope
   * @returns {Array} Array of breach objects
   */
  static getBreaches(validationResults) {
    if (!validationResults || !validationResults.results) {
      return [];
    }

    return Object.values(validationResults.results)
      .filter(result => result.status === VALIDATION_STATUS.BREACH);
  }

  /**
   * Check if validation is needed (envelope exists and has analytics)
   * @param {Object} envelope - Envelope feature
   * @returns {boolean} True if validation can be performed
   */
  static canValidate(envelope) {
    return !!(envelope && envelope.properties?.id);
  }
}
