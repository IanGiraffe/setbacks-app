import React, { useState, useEffect } from 'react';
import { giraffeState, rpc } from '@gi-nx/iframe-sdk';
import { useGiraffeState } from '@gi-nx/iframe-sdk-react';
import SetbackForm from './SetbackForm';
import ProjectBoundaryStatus from './ProjectBoundaryStatus';
import { UNITS, convertSetbacksUnits, feetToMeters } from '../utils/unitConversions';
import './SetbacksApp.css';

const SetbacksApp = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [currentUnit, setCurrentUnit] = useState(UNITS.FEET);
  
  const project = useGiraffeState('project');
  const projectOrigin = useGiraffeState('projectOrigin');
  
  // Default values in feet
  const [setbacks, setSetbacks] = useState({
    maxHeight: 65.6, // ~20m in feet
    frontSetback: 6.6, // ~2m in feet
    sideSetback: 9.8, // ~3m in feet
    rearSetback: 19.7 // ~6m in feet
  });

  const hasProjectBoundary = project && project.geometry;

  const handleUnitChange = (newUnit) => {
    if (newUnit !== currentUnit) {
      // Convert current setback values to new unit
      const convertedSetbacks = convertSetbacksUnits(setbacks, currentUnit, newUnit);
      setSetbacks(convertedSetbacks);
      setCurrentUnit(newUnit);
    }
  };

  const generateBuildingEnvelope = async () => {
    if (!hasProjectBoundary) {
      setError('No project boundary found');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Convert setbacks to meters for Giraffe (if needed)
      const setbacksInMeters = currentUnit === UNITS.FEET 
        ? convertSetbacksUnits(setbacks, UNITS.FEET, UNITS.METERS)
        : setbacks;
      
      const envelopeFeature = createEnvelopeFeature(project, setbacksInMeters);
      
      await rpc.invoke('createRawSection', [envelopeFeature]);
      
      console.log('Building envelope created successfully');
    } catch (err) {
      setError('Failed to create building envelope: ' + err.message);
      console.error('Error creating building envelope:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const createEnvelopeFeature = (projectGeometry, setbackValues) => {
    const { maxHeight, frontSetback, sideSetback, rearSetback } = setbackValues;
    
    const envelopeFeature = {
      type: "Feature",
      properties: {
        usage: "Envelope",
        id: `envelope_${Date.now()}`,
        flow: {
          id: "9ed6808627da407ca40b2f5fab01e326",
          inputs: {
            "62f9968fb7ab458698ecc6b32cc20fef": {
              type: "envelope",
              parameters: {
                version: "beta",
                maxHeight: maxHeight,
                sideIndices: {
                  rear: [],
                  side: [0, 2],
                  front: [1]
                },
                setbackSteps: {
                  rear: [
                    {
                      inset: rearSetback,
                      height: 0
                    },
                    {
                      inset: rearSetback
                    }
                  ],
                  side: [
                    {
                      inset: sideSetback,
                      height: 0
                    },
                    {
                      inset: sideSetback
                    }
                  ],
                  front: [
                    {
                      inset: frontSetback,
                      height: 0
                    },
                    {
                      inset: frontSetback
                    }
                  ]
                },
                hasSetbackOutput: false
              }
            }
          }
        },
        appId: "1",
        color: "#7af3ff",
        public: true,
        stroke: "#257676",
        projectId: project.properties?.id || "unknown",
        stackOrder: 0,
        fillOpacity: 0.4282,
        strokeOpacity: 1,
        layerId: "setbacks-app"
      },
      geometry: projectGeometry.geometry
    };

    return envelopeFeature;
  };


  return (
    <div className="setbacks-app">
      <div className="app-header">
        <h1>Building Envelope Generator</h1>
        <p>Create building envelopes with custom setbacks from project boundaries</p>
      </div>

      <ProjectBoundaryStatus 
        hasProject={hasProjectBoundary}
        projectName={project?.properties?.name}
      />

      {hasProjectBoundary && (
        <>
          <SetbackForm 
            setbacks={setbacks}
            onChange={setSetbacks}
            disabled={isGenerating}
            currentUnit={currentUnit}
            onUnitChange={handleUnitChange}
          />

          <div className="generate-section">
            <button 
              className="generate-button"
              onClick={generateBuildingEnvelope}
              disabled={isGenerating || !hasProjectBoundary}
            >
              {isGenerating ? 'Generating...' : 'Generate Building Envelope'}
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default SetbacksApp;