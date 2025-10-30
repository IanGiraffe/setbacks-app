/**
 * useZoningData Hook
 *
 * Custom hook for managing zoning parameter state with unit conversion support.
 * Encapsulates all zoning data logic following Single Responsibility Principle.
 */

import { useState, useCallback } from 'react';
import { ZoningService } from '../domain/ZoningService';
import { UNITS, convertSetbacksUnits } from '../utils/unitConversions';

export const useZoningData = (initialUnit = UNITS.FEET) => {
  const [parameters, setParameters] = useState(() => ZoningService.getDefaults(initialUnit));
  const [currentUnit, setCurrentUnit] = useState(initialUnit);
  const [customSetbacks, setCustomSetbacks] = useState({});

  /**
   * Update a single parameter
   */
  const updateParameter = useCallback((key, value) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  /**
   * Update multiple parameters at once
   */
  const updateParameters = useCallback((newParams) => {
    setParameters(prev => ({
      ...prev,
      ...newParams
    }));
  }, []);

  /**
   * Change unit system and convert all values
   */
  const changeUnit = useCallback((newUnit) => {
    if (newUnit !== currentUnit) {
      const convertedParams = convertSetbacksUnits(parameters, currentUnit, newUnit);
      setParameters(convertedParams);
      setCurrentUnit(newUnit);
    }
  }, [currentUnit, parameters]);

  /**
   * Add a custom setback type
   */
  const addCustomSetback = useCallback((name, value = 0) => {
    setCustomSetbacks(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  /**
   * Remove a custom setback type
   */
  const removeCustomSetback = useCallback((name) => {
    setCustomSetbacks(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  }, []);

  /**
   * Update a custom setback value
   */
  const updateCustomSetback = useCallback((name, value) => {
    setCustomSetbacks(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  /**
   * Rename a custom setback
   */
  const renameCustomSetback = useCallback((oldName, newName) => {
    if (oldName === newName || !customSetbacks[oldName]) {
      return;
    }

    setCustomSetbacks(prev => {
      const updated = {};
      Object.keys(prev).forEach(key => {
        if (key === oldName) {
          updated[newName] = prev[oldName];
        } else {
          updated[key] = prev[key];
        }
      });
      return updated;
    });
  }, [customSetbacks]);

  /**
   * Get all parameters in meters (for Giraffe)
   */
  const getParametersInMeters = useCallback(() => {
    return ZoningService.convertToMeters(parameters, currentUnit);
  }, [parameters, currentUnit]);

  /**
   * Get custom setbacks in meters (for Giraffe)
   */
  const getCustomSetbacksInMeters = useCallback(() => {
    if (currentUnit === UNITS.METERS) {
      return customSetbacks;
    }

    return Object.fromEntries(
      Object.entries(customSetbacks).map(([key, value]) => [
        key,
        value * 0.3048 // Convert feet to meters
      ])
    );
  }, [customSetbacks, currentUnit]);

  /**
   * Validate all parameters
   */
  const validate = useCallback(() => {
    return ZoningService.validateParameters(parameters);
  }, [parameters]);

  /**
   * Reset to defaults
   */
  const resetToDefaults = useCallback(() => {
    setParameters(ZoningService.getDefaults(currentUnit));
    setCustomSetbacks({});
  }, [currentUnit]);

  /**
   * Load parameters from an envelope
   */
  const loadFromEnvelope = useCallback((envelopeParams) => {
    if (!envelopeParams) return;

    // Convert from meters (Giraffe format) to current unit
    const convertedParams = ZoningService.convertFromMeters(envelopeParams, currentUnit);
    setParameters(convertedParams);

    // Load custom setbacks if present
    if (envelopeParams.customSetbacks) {
      const convertedCustom = currentUnit === UNITS.FEET
        ? Object.fromEntries(
          Object.entries(envelopeParams.customSetbacks).map(([key, value]) => [
            key,
            value * 3.28084 // Convert meters to feet
          ])
        )
        : envelopeParams.customSetbacks;

      setCustomSetbacks(convertedCustom);
    }
  }, [currentUnit]);

  return {
    parameters,
    currentUnit,
    customSetbacks,
    updateParameter,
    updateParameters,
    changeUnit,
    addCustomSetback,
    removeCustomSetback,
    updateCustomSetback,
    renameCustomSetback,
    getParametersInMeters,
    getCustomSetbacksInMeters,
    validate,
    resetToDefaults,
    loadFromEnvelope
  };
};
