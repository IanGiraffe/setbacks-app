/**
 * useValidation Hook
 *
 * Custom hook for managing design validation state.
 * Validates designs on-demand rather than automatically to avoid rate limiting.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ValidationService } from '../domain/ValidationService';

export const useValidation = (selectedEnvelope, zoningParams, enabledParams = {}) => {
  const [validationResults, setValidationResults] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const envelopeIdRef = useRef(null);

  /**
   * Perform validation
   */
  const validate = useCallback(async () => {
    if (!selectedEnvelope || !selectedEnvelope.properties?.id) {
      setValidationResults(null);
      return;
    }

    // Prevent duplicate validations
    if (isValidating) {
      return;
    }

    setIsValidating(true);

    try {
      const results = await ValidationService.validateEnvelope(
        selectedEnvelope.properties.id,
        zoningParams,
        enabledParams
      );

      setValidationResults(results);
      return results;
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResults(null);
    } finally {
      setIsValidating(false);
    }
  }, [selectedEnvelope, zoningParams, enabledParams, isValidating]);

  /**
   * Auto-validate only when envelope ID changes (not on every param change)
   */
  useEffect(() => {
    const currentEnvelopeId = selectedEnvelope?.properties?.id;

    // Only validate if envelope changed, not if params changed
    if (currentEnvelopeId && currentEnvelopeId !== envelopeIdRef.current) {
      envelopeIdRef.current = currentEnvelopeId;
      validate();
    } else if (!currentEnvelopeId) {
      envelopeIdRef.current = null;
      setValidationResults(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnvelope?.properties?.id]);

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
