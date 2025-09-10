export const createEnvelopeFeature = (projectGeometry, setbackValues, envelopeId = null) => {
  const { maxHeight, frontSetback, sideSetback, rearSetback } = setbackValues;
  
  // Use existing ID if updating, or create new ID if creating
  // Use a more unique ID format to avoid collisions
  const featureId = envelopeId || `SETBACKS_APP_ENVELOPE_${projectGeometry.properties?.id || 'unknown'}_${Date.now()}`;
  
  console.log('Creating envelope with ID:', featureId);
  
  const envelopeFeature = {
    type: "Feature",
    properties: {
      usage: "Envelope",
      id: featureId,
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
      projectId: projectGeometry.properties?.id || "unknown",
      stackOrder: 0,
      fillOpacity: 0.4282,
      strokeOpacity: 1,
      layerId: "setbacks"
    },
    geometry: projectGeometry.geometry
  };

  return envelopeFeature;
};