/**
 * Measurement Utilities
 *
 * Extracts and formats measurements from Giraffe analytics results.
 * Analytics structure based on rpc.invoke('getAnalyticsResult', [])
 */

import { GIRAFFE_MEASURES } from '../constants/validationRules';

// Enable/disable debug logging
const DEBUG_MODE = true; // Set to false to disable debug logs

/**
 * Extract measure value from Giraffe analytics by measure name
 * NOW MORE ROBUST: Searches through all categories and usages, not just hardcoded ones
 * @param {Object} analytics - Analytics object from Giraffe SDK (getAnalyticsResult)
 * @param {string} measureName - Name of the measure to extract
 * @returns {number|null} Measure value or null if not found
 */
export const extractMeasure = (analytics, measureName) => {
  if (!analytics || !analytics.grouped) {
    if (DEBUG_MODE) {
      console.warn(`⚠️  Analytics is ${!analytics ? 'null/undefined' : 'missing grouped property'}`);
    }
    return null;
  }

  const grouped = analytics.grouped;
  const categoryIds = Object.keys(grouped);

  if (categoryIds.length === 0) {
    if (DEBUG_MODE) {
      console.warn('⚠️  No category IDs found in analytics.grouped');
    }
    return null;
  }

  // Search through ALL categories and usages (not just first category and __COMBINED)
  for (const categoryId of categoryIds) {
    const category = grouped[categoryId];
    
    if (!category.usages) {
      if (DEBUG_MODE) {
        console.warn(`⚠️  Category "${categoryId}" has no usages`);
      }
      continue;
    }

    const usageNames = Object.keys(category.usages);

    for (const usageName of usageNames) {
      const usage = category.usages[usageName];

      if (!usage.rows) {
        continue;
      }

      // Find the row where measure.name matches our target
      const row = usage.rows.find(r => r.measure?.name === measureName);

      if (row) {
        if (!row.columns || row.columns.length === 0) {
          if (DEBUG_MODE) {
            console.warn(`⚠️  Found measure "${measureName}" but no columns data`);
          }
          return null;
        }

        // Extract value from first column
        const value = row.columns[0]?.value ?? null;
        
        if (DEBUG_MODE && value !== null) {
          console.log(`✅ Found "${measureName}" = ${value} (category: "${categoryId}", usage: "${usageName}")`);
        }
        
        return value;
      }
    }
  }

  // Measure not found anywhere
  if (DEBUG_MODE) {
    console.warn(`❌ Measure "${measureName}" not found in analytics`);
    console.log('Available categories:', categoryIds);
    
    // List all available measures
    const allMeasures = [];
    categoryIds.forEach(catId => {
      const cat = grouped[catId];
      if (cat.usages) {
        Object.values(cat.usages).forEach(usage => {
          if (usage.rows) {
            usage.rows.forEach(row => {
              if (row.measure?.name) {
                allMeasures.push(row.measure.name);
              }
            });
          }
        });
      }
    });
    console.log('Available measures:', allMeasures);
  }

  return null;
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
    density: extractMeasure(analytics, GIRAFFE_MEASURES.PROVIDED_DENSITY),
    imperviousCover: extractMeasure(analytics, GIRAFFE_MEASURES.PROVIDED_IMPERVIOUS_COVER)
  };

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
