/**
 * useValidation Hook
 *
 * Custom hook for managing design validation state.
 * Automatically validates designs when envelope changes.
 */

import { useState, useCallback, useEffect } from 'react';
import { ValidationService } from '../domain/ValidationService';

export const useValidation = (selectedEnvelope, zoningParams) => {
  const [validationResults, setValidationResults] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Perform validation
   */
  const validate = useCallback(async () => {
    if (!selectedEnvelope || !selectedEnvelope.properties?.id) {
      setValidationResults(null);
      return;
    }

    setIsValidating(true);

    try {
      const results = await ValidationService.validateEnvelope(
        selectedEnvelope.properties.id,
        zoningParams
      );

      setValidationResults(results);
      return results;
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResults(null);
    } finally {
      setIsValidating(false);
    }
  }, [selectedEnvelope, zoningParams]);

  /**
   * Auto-validate when envelope or params change
   */
  useEffect(() => {
    if (selectedEnvelope && ValidationService.canValidate(selectedEnvelope)) {
      validate();
    } else {
      setValidationResults(null);
    }
  }, [selectedEnvelope, zoningParams, validate]);

  /**
   * Clear validation results
   */
  const clearValidation = useCallback(() => {
    setValidationResults(null);
  }, []);

  /**
   * Get validation summary
   */
  const getValidationSummary = useCallback(() => {
    return ValidationService.getValidationSummary(validationResults);
  }, [validationResults]);

  /**
   * Get breaches only
   */
  const getBreaches = useCallback(() => {
    return ValidationService.getBreaches(validationResults);
  }, [validationResults]);

  return {
    validationResults,
    isValidating,
    validate,
    clearValidation,
    getValidationSummary,
    getBreaches,
    hasBreaches: validationResults?.hasBreaches || false,
    isCompliant: validationResults?.isCompliant || false
  };
};
