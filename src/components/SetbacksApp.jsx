/**
 * SetbacksApp Component (Refactored)
 *
 * Main application container following SOLID principles.
 * This component orchestrates between hooks and child components,
 * delegating all business logic to domain services and custom hooks.
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import SetbackForm from './SetbackForm';
import ProjectBoundaryStatus from './ProjectBoundaryStatus';
import ValidationPanel from './ValidationPanel';
import { useZoningData } from '../hooks/useZoningData';
import { useEnvelope } from '../hooks/useEnvelope';
import { useValidation } from '../hooks/useValidation';
import { UNITS } from '../utils/unitConversions';

const SetbacksApp = () => {
  // Custom hooks encapsulate all business logic
  const zoningData = useZoningData(UNITS.FEET);
  const envelope = useEnvelope();
  const validation = useValidation(envelope.selectedEnvelope, zoningData.parameters);

  /**
   * Load parameters from selected envelope
   */
  useEffect(() => {
    if (envelope.selectedEnvelope) {
      const params = envelope.getSelectedEnvelopeParameters();
      if (params) {
        zoningData.loadFromEnvelope(params);
      }
    }
  }, [envelope.selectedEnvelope?.properties?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handle envelope generation/update
   */
  const handleGenerateEnvelope = async () => {
    const paramsInMeters = zoningData.getParametersInMeters();
    const customSetbacksInMeters = zoningData.getCustomSetbacksInMeters();

    const result = await envelope.saveEnvelope(paramsInMeters, customSetbacksInMeters);

    if (result.success) {
      // Validation will automatically trigger via useEffect in useValidation
      console.log('Envelope saved successfully');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full bg-gradient-to-br from-slate-50 to-slate-100 p-3"
    >
      <div className="w-full h-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-4 text-center"
        >
          <h1 className="text-xl font-black text-giraffe-dark mb-1 tracking-tight">
            Zoning Validator
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Create envelopes that show setbacks and height limits
          </p>
        </motion.div>

        {/* Project Boundary Status */}
        <ProjectBoundaryStatus
          hasProject={envelope.hasProjectBoundary}
          projectName={envelope.project?.properties?.name}
        />

        {/* Main Form and Validation */}
        {envelope.hasProjectBoundary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Setback Form */}
            <SetbackForm
              setbacks={zoningData.parameters}
              onChange={zoningData.updateParameters}
              disabled={envelope.isGenerating}
              currentUnit={zoningData.currentUnit}
              onUnitChange={zoningData.changeUnit}
              onGenerate={handleGenerateEnvelope}
              isGenerating={envelope.isGenerating}
              selectedEnvelope={envelope.selectedEnvelope}
            />

            {/* Validation Panel */}
            {envelope.selectedEnvelope && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mt-4"
              >
                <ValidationPanel
                  validationResults={validation.validationResults}
                  isLoading={validation.isValidating}
                />
              </motion.div>
            )}

            {/* Instructions */}
            <motion.div
              className="mt-5 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h3 className="text-base font-bold text-giraffe-dark mb-3">
                How to Modify Edge Designations
              </h3>

              <div className="mb-3 flex justify-center">
                <img
                  src="/Envelope Example.gif"
                  alt="How to modify edge designations"
                  className="max-w-full h-auto rounded-md border border-slate-300 shadow-sm"
                  style={{ maxHeight: '300px' }}
                />
              </div>

              <div className="bg-white p-3 rounded-md border border-slate-200 shadow-sm text-left max-w-sm mx-auto">
                <p className="text-xs text-slate-700 leading-snug">
                  <strong className="text-giraffe-dark">To customize edge designations:</strong>
                </p>
                <ol className="mt-1 text-xs text-slate-700 space-y-0.5 list-decimal list-inside leading-tight">
                  <li>Select your generated envelope in Giraffe</li>
                  <li>Press <strong>SHIFT+A</strong> to view the property line designations</li>
                  <li>Click the arrow icons on each property edge</li>
                  <li>Choose the appropriate designation</li>
                </ol>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Error Display */}
        {envelope.error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-4 p-3 bg-red-50 border-2 border-red-500 rounded-md"
          >
            <div className="text-red-800 font-semibold text-sm">
              <strong className="text-red-900">Error:</strong> {envelope.error}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default SetbacksApp;
