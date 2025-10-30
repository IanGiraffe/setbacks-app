/**
 * useEnvelope Hook
 *
 * Custom hook for managing envelope operations (create, update, select).
 * Provides a clean interface for envelope-related state and operations.
 */

import { useState, useCallback, useEffect } from 'react';
import { useGiraffeState } from '@gi-nx/iframe-sdk-react';
import { GiraffeAdapter } from '../domain/GiraffeAdapter';

export const useEnvelope = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEnvelope, setSelectedEnvelope] = useState(null);

  const project = useGiraffeState('project');
  const selectedFeatures = useGiraffeState('selected');

  const hasProjectBoundary = project && project.geometry;

  /**
   * Listen for envelope selection changes
   */
  useEffect(() => {
    if (selectedFeatures && selectedFeatures.features) {
      const envelope = selectedFeatures.features.find(feature =>
        feature.properties && feature.properties.usage === 'Envelope'
      );

      if (envelope) {
        setSelectedEnvelope(envelope);
      } else {
        setSelectedEnvelope(null);
      }
    } else {
      setSelectedEnvelope(null);
    }
  }, [selectedFeatures]);

  /**
   * Create a new envelope
   */
  const createEnvelope = useCallback(async (zoningParams, customSetbacks = {}) => {
    if (!hasProjectBoundary) {
      setError('No project boundary found');
      return { success: false, error: 'No project boundary found' };
    }

    setIsGenerating(true);
    setError(null);

    try {
      const envelopeFeature = GiraffeAdapter.buildEnvelopeFeature({
        projectGeometry: project,
        zoningParams,
        customSetbacks
      });

      const result = await GiraffeAdapter.createRawSection(envelopeFeature);

      if (result.success) {
        console.log('Envelope created successfully');
        return { success: true, data: result.data };
      } else {
        throw new Error(result.error || 'Failed to create envelope');
      }
    } catch (err) {
      const errorMessage = `Failed to create envelope: ${err.message}`;
      setError(errorMessage);
      console.error('Error creating envelope:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  }, [hasProjectBoundary, project]);

  /**
   * Update existing envelope
   */
  const updateEnvelope = useCallback(async (zoningParams, customSetbacks = {}) => {
    if (!selectedEnvelope) {
      return createEnvelope(zoningParams, customSetbacks);
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Get current state of the selected envelope
      const currentSelectedFeatures = await GiraffeAdapter.getSelectedFeatures();
      const currentEnvelope = currentSelectedFeatures.features.find(feature =>
        feature.properties &&
        feature.properties.usage === 'Envelope' &&
        feature.properties.id === selectedEnvelope.properties.id
      );

      if (!currentEnvelope) {
        throw new Error('Selected envelope is no longer available');
      }

      // Create deep copy and update parameters
      const updatedEnvelope = JSON.parse(JSON.stringify(currentEnvelope));
      const params = updatedEnvelope.properties.flow.inputs['62f9968fb7ab458698ecc6b32cc20fef'].parameters;

      // Update zoning parameters
      params.maxHeight = zoningParams.maxHeight;
      params.maxHeightStories = zoningParams.maxHeightStories;
      params.maxFAR = zoningParams.maxFAR;
      params.maxDensity = zoningParams.maxDensity;

      // Update setback steps
      params.setbackSteps.rear[0].inset = zoningParams.rearSetback;
      params.setbackSteps.rear[1].inset = zoningParams.rearSetback;
      params.setbackSteps.side[0].inset = zoningParams.sideSetback;
      params.setbackSteps.side[1].inset = zoningParams.sideSetback;
      params.setbackSteps.front[0].inset = zoningParams.frontSetback;
      params.setbackSteps.front[1].inset = zoningParams.frontSetback;

      // Update or add custom setback types
      Object.entries(customSetbacks).forEach(([name, value]) => {
        if (!params.setbackSteps[name]) {
          params.setbackSteps[name] = [
            { inset: value, height: 0 },
            { inset: value }
          ];
          if (!params.sideIndices[name]) {
            params.sideIndices[name] = [];
          }
        } else {
          params.setbackSteps[name][0].inset = value;
          params.setbackSteps[name][1].inset = value;
        }
      });

      // Remove custom setback types that are no longer defined
      Object.keys(params.setbackSteps).forEach(key => {
        if (!['rear', 'side', 'front'].includes(key) && !Object.prototype.hasOwnProperty.call(customSetbacks, key)) {
          delete params.setbackSteps[key];
          delete params.sideIndices[key];
        }
      });

      const result = await GiraffeAdapter.updateRawSection(updatedEnvelope);

      if (result.success) {
        console.log('Envelope updated successfully');
        return { success: true, data: result.data };
      } else {
        throw new Error(result.error || 'Failed to update envelope');
      }
    } catch (err) {
      const errorMessage = `Failed to update envelope: ${err.message}`;
      setError(errorMessage);
      console.error('Error updating envelope:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  }, [selectedEnvelope, createEnvelope]);

  /**
   * Create or update envelope (smart routing)
   */
  const saveEnvelope = useCallback(async (zoningParams, customSetbacks = {}) => {
    if (selectedEnvelope) {
      return updateEnvelope(zoningParams, customSetbacks);
    } else {
      return createEnvelope(zoningParams, customSetbacks);
    }
  }, [selectedEnvelope, createEnvelope, updateEnvelope]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get envelope parameters from selected envelope
   */
  const getSelectedEnvelopeParameters = useCallback(() => {
    if (!selectedEnvelope) return null;
    return GiraffeAdapter.extractEnvelopeParameters(selectedEnvelope);
  }, [selectedEnvelope]);

  return {
    selectedEnvelope,
    isGenerating,
    error,
    hasProjectBoundary,
    project,
    createEnvelope,
    updateEnvelope,
    saveEnvelope,
    clearError,
    getSelectedEnvelopeParameters
  };
};
