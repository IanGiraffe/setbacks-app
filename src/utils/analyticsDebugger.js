/**
 * Analytics Debugger
 * 
 * Utility to inspect and debug the Giraffe analytics structure
 * when measures are returning null unexpectedly.
 */

/**
 * Log the full analytics structure to console
 * @param {Object} analytics - Raw analytics from Giraffe
 */
export const debugAnalyticsStructure = (analytics) => {
  console.group('🔍 Analytics Structure Debug');
  
  if (!analytics) {
    console.error('❌ Analytics is null or undefined');
    console.groupEnd();
    return;
  }

  console.log('📦 Full Analytics Object:', analytics);

  // Check for grouped structure
  if (!analytics.grouped) {
    console.error('❌ analytics.grouped is missing');
    console.log('Available keys:', Object.keys(analytics));
    console.groupEnd();
    return;
  }

  console.log('✅ analytics.grouped exists');
  
  // List all category IDs
  const categoryIds = Object.keys(analytics.grouped);
  console.log('📁 Category IDs:', categoryIds);

  // Inspect each category
  categoryIds.forEach((categoryId, index) => {
    console.group(`📂 Category ${index + 1}: "${categoryId}"`);
    
    const category = analytics.grouped[categoryId];
    console.log('Category object:', category);

    if (!category.usages) {
      console.error('❌ No usages in this category');
      console.groupEnd();
      return;
    }

    // List all usage names
    const usageNames = Object.keys(category.usages);
    console.log('🏷️  Usage names:', usageNames);

    // Inspect each usage
    usageNames.forEach(usageName => {
      console.group(`🏷️  Usage: "${usageName}"`);
      
      const usage = category.usages[usageName];
      console.log('Usage object:', usage);

      if (!usage.rows) {
        console.error('❌ No rows in this usage');
        console.groupEnd();
        return;
      }

      console.log(`📊 Number of rows: ${usage.rows.length}`);

      // List all measure names
      const measureNames = usage.rows.map(row => row.measure?.name).filter(Boolean);
      console.log('📏 Available measures:', measureNames);

      // Show first row structure as example
      if (usage.rows.length > 0) {
        console.group('📋 Example Row Structure (first row)');
        console.log('Full row:', usage.rows[0]);
        console.log('Measure name:', usage.rows[0].measure?.name);
        console.log('Columns:', usage.rows[0].columns);
        if (usage.rows[0].columns && usage.rows[0].columns.length > 0) {
          console.log('First column value:', usage.rows[0].columns[0]?.value);
        }
        console.groupEnd();
      }

      console.groupEnd(); // Usage
    });

    console.groupEnd(); // Category
  });

  console.groupEnd(); // Main group
};

/**
 * Find where a specific measure is located in the analytics
 * @param {Object} analytics - Raw analytics from Giraffe
 * @param {string} measureName - Name of the measure to find
 */
export const findMeasure = (analytics, measureName) => {
  console.group(`🔎 Searching for measure: "${measureName}"`);

  if (!analytics?.grouped) {
    console.error('❌ Analytics.grouped is missing');
    console.groupEnd();
    return null;
  }

  const categoryIds = Object.keys(analytics.grouped);

  for (const categoryId of categoryIds) {
    const category = analytics.grouped[categoryId];
    
    if (!category.usages) continue;

    const usageNames = Object.keys(category.usages);

    for (const usageName of usageNames) {
      const usage = category.usages[usageName];

      if (!usage.rows) continue;

      const row = usage.rows.find(r => r.measure?.name === measureName);

      if (row) {
        console.log('✅ Found measure!');
        console.log(`📁 Category: "${categoryId}"`);
        console.log(`🏷️  Usage: "${usageName}"`);
        console.log('📋 Row:', row);
        console.log('📏 Value:', row.columns?.[0]?.value);
        console.groupEnd();
        return {
          categoryId,
          usageName,
          row,
          value: row.columns?.[0]?.value
        };
      }
    }
  }

  console.error('❌ Measure not found anywhere in analytics');
  console.groupEnd();
  return null;
};

/**
 * List all available measures in the analytics
 * @param {Object} analytics - Raw analytics from Giraffe
 * @returns {Array} Array of measure names
 */
export const listAllMeasures = (analytics) => {
  const measures = [];

  if (!analytics?.grouped) {
    return measures;
  }

  const categoryIds = Object.keys(analytics.grouped);

  categoryIds.forEach(categoryId => {
    const category = analytics.grouped[categoryId];
    
    if (!category.usages) return;

    const usageNames = Object.keys(category.usages);

    usageNames.forEach(usageName => {
      const usage = category.usages[usageName];

      if (!usage.rows) return;

      usage.rows.forEach(row => {
        if (row.measure?.name) {
          measures.push({
            measureName: row.measure.name,
            categoryId,
            usageName,
            value: row.columns?.[0]?.value
          });
        }
      });
    });
  });

  return measures;
};

