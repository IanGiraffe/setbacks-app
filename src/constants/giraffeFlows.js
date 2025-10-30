/**
 * Giraffe Flow Configuration Constants
 *
 * Centralized configuration for Giraffe SDK flow IDs and parameters.
 * This isolates Giraffe-specific magic strings and makes them easy to update.
 */

export const GIRAFFE_FLOWS = {
  ENVELOPE: {
    FLOW_ID: "9ed6808627da407ca40b2f5fab01e326",
    INPUT_ID: "62f9968fb7ab458698ecc6b32cc20fef",
    VERSION: "beta"
  }
};

export const GIRAFFE_PROPERTIES = {
  USAGE_ENVELOPE: "Envelope",
  LAYER_ID: "setbacks",
  APP_ID: "1",
  DEFAULT_COLOR: "#7af3ff",
  DEFAULT_STROKE: "#257676",
  DEFAULT_FILL_OPACITY: 0.4282,
  DEFAULT_STROKE_OPACITY: 1,
  DEFAULT_STACK_ORDER: 0
};

/**
 * Default side indices for envelope creation
 * Maps property edges to setback types
 */
export const DEFAULT_SIDE_INDICES = {
  rear: [],
  side: [0, 2],
  front: [1]
};

/**
 * Creates a setback step configuration
 * @param {number} inset - Setback distance in meters
 * @returns {Array} Array of setback steps
 */
export const createSetbackSteps = (inset) => [
  { inset, height: 0 },
  { inset }
];
