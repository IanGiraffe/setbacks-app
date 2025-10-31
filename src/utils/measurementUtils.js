/**
 * Measurement Utilities
 *
 * Extracts and formats measurements from Giraffe analytics results.
 * Analytics structure based on rpc.invoke('getAnalyticsResult', [])
 */

import { GIRAFFE_MEASURES } from '../constants/validationRules';

/**
 * Extract measure value from Giraffe analytics by measure name
 * @param {Object} analytics - Analytics object from Giraffe SDK (getAnalyticsResult)
 * @param {string} measureName - Name of the measure to extract
 * @returns {number|null} Measure value or null if not found
 */
export const extractMeasure = (analytics, measureName) => {
  if (!analytics || !analytics.grouped) {
    console.log(`No analytics or grouped data for measure: ${measureName}`);
    return null;
  }

  // Navigate to the actual rows with column data
  // Structure: analytics.grouped[categoryId].usages.__COMBINED.rows
  const grouped = analytics.grouped;

  // Get the first category (should only be one)
  const categoryId = Object.keys(grouped)[0];
  if (!categoryId) {
    console.log(`No category found in grouped data`);
    return null;
  }

  const usageRows = grouped[categoryId]?.usages?.__COMBINED?.rows;
  if (!usageRows) {
    console.log(`No rows found in grouped.${categoryId}.usages.__COMBINED`);
    return null;
  }

  // Find the row where measure.name matches our target
  const row = usageRows.find(r => r.measure?.name === measureName);

  if (!row) {
    console.log(`No row found for measure: ${measureName}`);
    return null;
  }

  if (!row.columns || row.columns.length === 0) {
    console.log(`No columns for measure: ${measureName}`);
    return null;
  }

  // Extract value from first column (typically __COMBINED group)
  const value = row.columns[0]?.value ?? null;
  console.log(`✓ Extracted ${measureName}:`, value);
  return value;
};

/**
 * Extract all design measurements from Giraffe analytics
 * @param {Object} analytics - Analytics object from Giraffe SDK (getAnalyticsResult)
 * @returns {Object} Extracted measurements
 */
export const extractDesignMeasurements = (analytics) => {
  const measurements = {
    maxHeightFt: extractMeasure(analytics, GIRAFFE_MEASURES.MAX_HEIGHT_FT),
    minHeightFt: extractMeasure(analytics, GIRAFFE_MEASURES.MIN_HEIGHT_FT),
    maxHeightStories: extractMeasure(analytics, GIRAFFE_MEASURES.MAX_HEIGHT_STORIES),
    minHeightStories: extractMeasure(analytics, GIRAFFE_MEASURES.MIN_HEIGHT_STORIES),
    far: extractMeasure(analytics, GIRAFFE_MEASURES.PROVIDED_FAR),
    density: extractMeasure(analytics, GIRAFFE_MEASURES.PROVIDED_DENSITY)
  };

  console.log('📊 Extracted measurements:', measurements);
  return measurements;
};

/**
 * Check if analytics data is available
 * @param {Object} analytics - Analytics object from Giraffe SDK
 * @returns {boolean} True if analytics has valid rows
 */
export const hasValidAnalytics = (analytics) => {
  return !!(analytics && analytics.rows && analytics.rows.length > 0);
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
