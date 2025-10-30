/**
 * Measurement Utilities
 *
 * Utilities for extracting and processing measurements from Giraffe analytics.
 */

import { GIRAFFE_MEASURES } from '../constants/validationRules';

/**
 * Extract measure value from Giraffe analytics by measure name
 * @param {Object} analytics - Analytics object from Giraffe
 * @param {string} measureName - Name of the measure to extract
 * @returns {number|null} Measure value or null if not found
 */
export const extractMeasure = (analytics, measureName) => {
  if (!analytics || !analytics.measures) {
    return null;
  }

  const measure = analytics.measures.find(m => m.name === measureName);
  return measure?.value ?? null;
};

/**
 * Extract all design measurements from Giraffe analytics
 * @param {Object} analytics - Analytics object from Giraffe
 * @returns {Object} Extracted measurements
 */
export const extractDesignMeasurements = (analytics) => {
  return {
    maxHeightFt: extractMeasure(analytics, GIRAFFE_MEASURES.MAX_HEIGHT_FT),
    maxHeightStories: extractMeasure(analytics, GIRAFFE_MEASURES.MAX_HEIGHT_STORIES),
    far: extractMeasure(analytics, GIRAFFE_MEASURES.PROVIDED_FAR),
    density: extractMeasure(analytics, GIRAFFE_MEASURES.PROVIDED_DENSITY)
  };
};

/**
 * Check if analytics data is available
 * @param {Object} analytics - Analytics object from Giraffe
 * @returns {boolean} True if analytics has valid measures
 */
export const hasValidAnalytics = (analytics) => {
  return !!(analytics && analytics.measures && analytics.measures.length > 0);
};

/**
 * Format measurement for display
 * @param {number} value - Measurement value
 * @param {string} unit - Unit of measurement
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted measurement string
 */
export const formatMeasurement = (value, unit, decimals = 1) => {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  return `${value.toFixed(decimals)} ${unit}`;
};
