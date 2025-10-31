/**
 * Validation Rules and Constants
 *
 * Defines validation thresholds, rules, and severity levels
 * for design validation against zoning parameters.
 */

export const VALIDATION_STATUS = {
  COMPLIANT: 'compliant',
  BREACH: 'breach',
  WARNING: 'warning',
  UNKNOWN: 'unknown'
};

export const VALIDATION_TYPES = {
  HEIGHT_FT: 'height_ft',
  HEIGHT_STORIES: 'height_stories',
  FAR: 'far',
  DENSITY: 'density',
  SETBACK_ENCROACHMENT: 'setback_encroachment'
};

/**
 * Giraffe measure keys for analytics
 * These match the measure names from rpc.invoke('getAnalyticsResult', [])
 */
export const GIRAFFE_MEASURES = {
  MAX_HEIGHT_FT: 'Provided Max Height (ft)',
  MIN_HEIGHT_FT: 'Provided Min Height (ft)',
  MAX_HEIGHT_STORIES: 'Provided Max Height (stories)',
  MIN_HEIGHT_STORIES: 'Provided Min Height (stories)',
  PROVIDED_FAR: 'Provided FAR',
  PROVIDED_DENSITY: 'Provided Density'
};

/**
 * Validation message templates
 */
export const VALIDATION_MESSAGES = {
  [VALIDATION_TYPES.HEIGHT_FT]: (provided, max) =>
    `Height breach: ${provided.toFixed(1)} ft exceeds maximum ${max.toFixed(1)} ft`,

  [VALIDATION_TYPES.HEIGHT_STORIES]: (provided, max) =>
    `Story breach: ${provided} stories exceeds maximum ${max} stories`,

  [VALIDATION_TYPES.FAR]: (provided, max) =>
    `FAR breach: ${provided.toFixed(2)} exceeds maximum ${max.toFixed(2)}`,

  [VALIDATION_TYPES.DENSITY]: (provided, max) =>
    `Density breach: ${provided.toFixed(1)} units/acre exceeds maximum ${max.toFixed(1)} units/acre`,

  [VALIDATION_TYPES.SETBACK_ENCROACHMENT]: () =>
    `Setback breach: Building encroaches on required setbacks`
};

/**
 * Tolerance thresholds for validation
 * Small tolerances account for floating-point precision issues
 */
export const VALIDATION_TOLERANCE = {
  HEIGHT: 0.01, // 0.01 ft tolerance
  FAR: 0.001,   // 0.001 FAR tolerance
  DENSITY: 0.01 // 0.01 units/acre tolerance
};
