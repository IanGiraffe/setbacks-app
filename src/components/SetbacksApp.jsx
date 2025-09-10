import React, { useState, useEffect } from 'react';
import { rpc } from '@gi-nx/iframe-sdk';
import { useGiraffeState } from '@gi-nx/iframe-sdk-react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import SetbackForm from './SetbackForm';
import ProjectBoundaryStatus from './ProjectBoundaryStatus';
import { UNITS, convertSetbacksUnits } from '../utils/unitConversions';
import { cn } from '../utils/cn';

const SetbacksApp = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [currentUnit, setCurrentUnit] = useState(UNITS.FEET);
  const [selectedEnvelope, setSelectedEnvelope] = useState(null);
  
  const project = useGiraffeState('project');
  const selectedFeatures = useGiraffeState('selected');
  
  // Default values in feet
  const [setbacks, setSetbacks] = useState({
    maxHeight: 40,
    frontSetback: 25,
    sideSetback: 5,
    rearSetback: 10
  });

  const hasProjectBoundary = project && project.geometry;

  // Listen for envelope selection
  useEffect(() => {
    if (selectedFeatures && selectedFeatures.features) {
      const envelope = selectedFeatures.features.find(feature => 
        feature.properties && feature.properties.usage === 'Envelope'
      );
      
      if (envelope) {
        setSelectedEnvelope(envelope);
        // Extract setback parameters from the selected envelope and populate the form
        const envelopeParams = envelope.properties?.flow?.inputs?.['62f9968fb7ab458698ecc6b32cc20fef']?.parameters;
        if (envelopeParams) {
          const extractedSetbacks = {
            maxHeight: envelopeParams.maxHeight || 40,
            frontSetback: envelopeParams.setbackSteps?.front?.[0]?.inset || 25,
            sideSetback: envelopeParams.setbackSteps?.side?.[0]?.inset || 5,
            rearSetback: envelopeParams.setbackSteps?.rear?.[0]?.inset || 10
          };
          
          // Convert from meters to current unit if needed
          const convertedSetbacks = currentUnit === UNITS.FEET 
            ? convertSetbacksUnits(extractedSetbacks, UNITS.METERS, UNITS.FEET)
            : extractedSetbacks;
          
          setSetbacks(convertedSetbacks);
        }
      } else {
        setSelectedEnvelope(null);
      }
    } else {
      setSelectedEnvelope(null);
    }
  }, [selectedFeatures, currentUnit]);

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
      
      if (selectedEnvelope) {
        // Get the current state of the selected envelope (in case user modified sideIndices after selection)
        const currentSelectedFeatures = await rpc.invoke('getSelectedFeatures', []);
        const currentEnvelope = currentSelectedFeatures.features.find(feature => 
          feature.properties && 
          feature.properties.usage === 'Envelope' && 
          feature.properties.id === selectedEnvelope.properties.id
        );
        
        if (!currentEnvelope) {
          throw new Error('Selected envelope is no longer available');
        }
        
        // Update current envelope - create a deep copy and only modify the setback parameters
        const updatedEnvelope = JSON.parse(JSON.stringify(currentEnvelope));
        
        // Update only the parameters we care about, preserving everything else including current sideIndices
        const params = updatedEnvelope.properties.flow.inputs['62f9968fb7ab458698ecc6b32cc20fef'].parameters;
        params.maxHeight = setbacksInMeters.maxHeight;
        
        // Update setback steps while preserving structure and current sideIndices mapping
        // Note: We preserve params.sideIndices to maintain user-configured edge mappings
        params.setbackSteps.rear[0].inset = setbacksInMeters.rearSetback;
        params.setbackSteps.rear[1].inset = setbacksInMeters.rearSetback;
        params.setbackSteps.side[0].inset = setbacksInMeters.sideSetback;
        params.setbackSteps.side[1].inset = setbacksInMeters.sideSetback;
        params.setbackSteps.front[0].inset = setbacksInMeters.frontSetback;
        params.setbackSteps.front[1].inset = setbacksInMeters.frontSetback;
        
        await rpc.invoke('updateRawSection', [updatedEnvelope]);
        console.log('Building envelope updated successfully');
      } else {
        // Create new envelope
        const envelopeFeature = createEnvelopeFeature(project, setbacksInMeters);
        await rpc.invoke('createRawSection', [envelopeFeature]);
        console.log('Building envelope created successfully');
      }
    } catch (err) {
      setError(`Failed to ${selectedEnvelope ? 'update' : 'create'} building envelope: ` + err.message);
      console.error(`Error ${selectedEnvelope ? 'updating' : 'creating'} building envelope:`, err);
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
        layerId: "setbacks"
      },
      geometry: projectGeometry.geometry
    };

    return envelopeFeature;
  };


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full bg-gradient-to-br from-slate-50 to-slate-100 p-4"
    >
      <div className="w-full h-full">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 text-center"
        >
          <h1 className="text-2xl font-black text-giraffe-dark mb-2 tracking-tight">
            Envelope Generator
          </h1>
          <p className="text-sm text-slate-600 font-medium">
            Create building envelopes that show setbacks and height limits
          </p>
        </motion.div>

        <ProjectBoundaryStatus 
          hasProject={hasProjectBoundary}
          projectName={project?.properties?.name}
        />

        {hasProjectBoundary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <SetbackForm 
              setbacks={setbacks}
              onChange={setSetbacks}
              disabled={isGenerating}
              currentUnit={currentUnit}
              onUnitChange={handleUnitChange}
            />

            <motion.div 
              className="mt-6 flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <motion.button 
                className={cn(
                  "bg-giraffe-yellow hover:bg-yellow-300 text-giraffe-dark",
                  "px-6 py-3 text-base font-black uppercase tracking-wide",
                  "border-3 border-black shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1",
                  "transition-all duration-150 active:shadow-none active:translate-x-1 active:translate-y-1",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-brutal disabled:hover:translate-x-0 disabled:hover:translate-y-0",
                  "rounded-lg w-full max-w-xs"
                )}
                onClick={generateBuildingEnvelope}
                disabled={isGenerating || !hasProjectBoundary}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isGenerating ? (
                  <motion.span 
                    className="flex items-center justify-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="w-5 h-5 border-2 border-giraffe-dark border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    {selectedEnvelope ? 'Updating...' : 'Generating...'}
                  </motion.span>
                ) : (
                  selectedEnvelope ? 'Modify Selected Envelope' : 'Generate Envelope'
                )}
              </motion.button>
            </motion.div>

            <motion.div 
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h3 className="text-lg font-bold text-giraffe-dark mb-4">
                How to Modify Edge Designations
              </h3>
              
              <div className="mb-4 flex justify-center">
                <img 
                  src="/Envelope Example.gif" 
                  alt="How to modify edge designations"
                  className="max-w-full h-auto rounded-lg border-2 border-slate-300 shadow-md"
                />
              </div>
              
              <div className="bg-white p-4 rounded-lg border-2 border-slate-200 shadow-sm text-left max-w-md mx-auto">
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong className="text-giraffe-dark">To customize edge designations:</strong>
                </p>
                <ol className="mt-2 text-sm text-slate-700 space-y-1 list-decimal list-inside">
                  <li>Select your generated envelope in Giraffe</li>
                  <li>Press <strong>SHIFT+A</strong> to view the property line designations</li>
                  <li>Click the arrow icons on each property edge</li>
                  <li>Choose the appropriate designation</li>
                </ol>
              </div>
            </motion.div>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-6 p-4 bg-red-50 border-3 border-red-500 rounded-lg"
          >
            <div className="text-red-800 font-bold">
              <strong className="text-red-900">Error:</strong> {error}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default SetbacksApp;