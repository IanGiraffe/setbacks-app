/**
 * Zoning Parameter Configuration
 *
 * This file defines all zoning parameters for the application.
 * Parameters are organized into categories for easy management and extension.
 *
 * Future: This configuration can be easily replaced or augmented with data from external APIs
 * by wrapping these exports in a service layer that fetches from an API endpoint.
 */

/**
 * Zoning parameters (non-spatial constraints)
 * These parameters define regulatory limits that aren't related to setbacks
 */
export const ZONING_PARAMETERS = [
  {
    key: 'maxHeight',
    label: 'Max Height',
    labelWithUnit: true, // Will show as "Max Height (ft)" or "Max Height (m)"
    defaultValue: 40,
    step: 0.1,
    min: 0,
    unit: 'distance', // Will be converted based on feet/meters toggle
    description: 'Maximum allowed building height'
  },
  {
    key: 'maxHeightStories',
    label: 'Max Height (Stories)',
    defaultValue: 3,
    step: 1,
    min: 0,
    unit: 'none', // Dimensionless - number of stories
    description: 'Maximum allowed building height in stories'
  },
  {
    key: 'maxFAR',
    label: 'Max FAR',
    defaultValue: 2.0,
    step: 0.01,
    min: 0,
    unit: 'none', // Dimensionless ratio
    description: 'Floor Area Ratio - ratio of building floor area to lot area'
  },
  {
    key: 'maxDensity',
    label: 'Max Density',
    defaultValue: 50,
    step: 1,
    min: 0,
    unit: 'none', // Dimensionless - units per acre or similar
    description: 'Maximum density (e.g., dwelling units per acre)'
  }
];

/**
 * Setback parameters (spatial constraints)
 * These parameters define required distances from property boundaries
 */
export const SETBACK_PARAMETERS = [
  {
    key: 'frontSetback',
    label: 'Front Setback',
    defaultValue: 25,
    step: 0.1,
    min: 0,
    unit: 'distance',
    description: 'Required setback from front property line'
  },
  {
    key: 'sideSetback',
    label: 'Side Setback',
    defaultValue: 5,
    step: 0.1,
    min: 0,
    unit: 'distance',
    description: 'Required setback from side property lines'
  },
  {
    key: 'rearSetback',
    label: 'Rear Setback',
    defaultValue: 10,
    step: 0.1,
    min: 0,
    unit: 'distance',
    description: 'Required setback from rear property line'
  }
];

/**
 * Get default values for all parameters
 * @returns {Object} Object with all parameter keys and default values
 */
export const getDefaultParameters = () => {
  const defaults = {};

  [...ZONING_PARAMETERS, ...SETBACK_PARAMETERS].forEach(param => {
    defaults[param.key] = param.defaultValue;
  });

  return defaults;
};

/**
 * Check if a parameter requires unit conversion
 * @param {string} key - Parameter key
 * @returns {boolean} True if parameter uses distance units
 */
export const requiresUnitConversion = (key) => {
  const allParams = [...ZONING_PARAMETERS, ...SETBACK_PARAMETERS];
  const param = allParams.find(p => p.key === key);
  return param?.unit === 'distance';
};

/**
 * Get parameter configuration by key
 * @param {string} key - Parameter key
 * @returns {Object|null} Parameter configuration or null if not found
 */
export const getParameterConfig = (key) => {
  const allParams = [...ZONING_PARAMETERS, ...SETBACK_PARAMETERS];
  return allParams.find(p => p.key === key) || null;
};

/**
 * Future API Integration Example:
 *
 * export const fetchZoningParameters = async (parcelId, jurisdiction) => {
 *   const response = await fetch(`/api/zoning/${jurisdiction}/${parcelId}`);
 *   const apiData = await response.json();
 *
 *   // Map API data to our parameter structure
 *   return {
 *     maxHeight: apiData.height_limit,
 *     maxFAR: apiData.far,
 *     maxDensity: apiData.density_limit,
 *     frontSetback: apiData.setbacks.front,
 *     sideSetback: apiData.setbacks.side,
 *     rearSetback: apiData.setbacks.rear
 *   };
 * };
 */
