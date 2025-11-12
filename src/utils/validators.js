/**
 * Validation Utilities
 *
 * Pure validation functions for design compliance checking.
 * All measurements are expected in FEET (Giraffe analytics returns feet).
 */

import {
  VALIDATION_STATUS,
  VALIDATION_TYPES,
  VALIDATION_MESSAGES,
  VALIDATION_TOLERANCE
} from '../constants/validationRules';

/**
 * Validate height in feet
 * @param {number} providedHeight - Actual height from design
 * @param {number} maxHeight - Maximum allowed height
 * @returns {Object} Validation result
 */
export const validateHeightFeet = (providedHeight, maxHeight) => {
  if (typeof providedHeight !== 'number' || typeof maxHeight !== 'number') {
    return {
      type: VALIDATION_TYPES.HEIGHT_FT,
      status: VALIDATION_STATUS.UNKNOWN,
      message: 'Height data unavailable'
    };
  }

  const isCompliant = providedHeight <= (maxHeight + VALIDATION_TOLERANCE.HEIGHT);

  return {
    type: VALIDATION_TYPES.HEIGHT_FT,
    status: isCompliant ? VALIDATION_STATUS.COMPLIANT : VALIDATION_STATUS.BREACH,
    message: isCompliant
      ? `Height compliant: ${providedHeight.toFixed(1)} ft ≤ ${maxHeight.toFixed(1)} ft`
      : VALIDATION_MESSAGES[VALIDATION_TYPES.HEIGHT_FT](providedHeight, maxHeight),
    providedValue: providedHeight,
    maxValue: maxHeight,
    isCompliant
  };
};

/**
 * Validate height in stories
 * @param {number} providedStories - Actual stories from design
 * @param {number} maxStories - Maximum allowed stories
 * @returns {Object} Validation result
 */
export const validateHeightStories = (providedStories, maxStories) => {
  if (typeof providedStories !== 'number' || typeof maxStories !== 'number') {
    return {
      type: VALIDATION_TYPES.HEIGHT_STORIES,
      status: VALIDATION_STATUS.UNKNOWN,
      message: 'Story height data unavailable'
    };
  }

  const isCompliant = providedStories <= maxStories;

  return {
    type: VALIDATION_TYPES.HEIGHT_STORIES,
    status: isCompliant ? VALIDATION_STATUS.COMPLIANT : VALIDATION_STATUS.BREACH,
    message: isCompliant
      ? `Stories compliant: ${providedStories} ≤ ${maxStories}`
      : VALIDATION_MESSAGES[VALIDATION_TYPES.HEIGHT_STORIES](providedStories, maxStories),
    providedValue: providedStories,
    maxValue: maxStories,
    isCompliant
  };
};

/**
 * Validate Floor Area Ratio (FAR)
 * @param {number} providedFAR - Actual FAR from design
 * @param {number} maxFAR - Maximum allowed FAR
 * @returns {Object} Validation result
 */
export const validateFAR = (providedFAR, maxFAR) => {
  if (typeof providedFAR !== 'number' || typeof maxFAR !== 'number') {
    return {
      type: VALIDATION_TYPES.FAR,
      status: VALIDATION_STATUS.UNKNOWN,
      message: 'FAR data unavailable'
    };
  }

  const isCompliant = providedFAR <= (maxFAR + VALIDATION_TOLERANCE.FAR);

  return {
    type: VALIDATION_TYPES.FAR,
    status: isCompliant ? VALIDATION_STATUS.COMPLIANT : VALIDATION_STATUS.BREACH,
    message: isCompliant
      ? `FAR compliant: ${providedFAR.toFixed(2)} ≤ ${maxFAR.toFixed(2)}`
      : VALIDATION_MESSAGES[VALIDATION_TYPES.FAR](providedFAR, maxFAR),
    providedValue: providedFAR,
    maxValue: maxFAR,
    isCompliant
  };
};

/**
 * Validate density
 * @param {number} providedDensity - Actual density from design
 * @param {number} maxDensity - Maximum allowed density
 * @returns {Object} Validation result
 */
export const validateDensity = (providedDensity, maxDensity) => {
  if (typeof providedDensity !== 'number' || typeof maxDensity !== 'number') {
    return {
      type: VALIDATION_TYPES.DENSITY,
      status: VALIDATION_STATUS.UNKNOWN,
      message: 'Density data unavailable'
    };
  }

  const isCompliant = providedDensity <= (maxDensity + VALIDATION_TOLERANCE.DENSITY);

  return {
    type: VALIDATION_TYPES.DENSITY,
    status: isCompliant ? VALIDATION_STATUS.COMPLIANT : VALIDATION_STATUS.BREACH,
    message: isCompliant
      ? `Density compliant: ${providedDensity.toFixed(1)} ≤ ${maxDensity.toFixed(1)} units/acre`
      : VALIDATION_MESSAGES[VALIDATION_TYPES.DENSITY](providedDensity, maxDensity),
    providedValue: providedDensity,
    maxValue: maxDensity,
    isCompliant
  };
};

/**
 * Validate impervious cover percentage
 * @param {number} providedCover - Actual impervious cover percentage from design
 * @param {number} maxCover - Maximum allowed impervious cover percentage
 * @returns {Object} Validation result
 */
export const validateImperviousCover = (providedCover, maxCover) => {
  if (typeof providedCover !== 'number' || typeof maxCover !== 'number') {
    return {
      type: VALIDATION_TYPES.IMPERVIOUS_COVER,
      status: VALIDATION_STATUS.UNKNOWN,
      message: 'Impervious cover data unavailable'
    };
  }

  const isCompliant = providedCover <= (maxCover + VALIDATION_TOLERANCE.IMPERVIOUS_COVER);

  return {
    type: VALIDATION_TYPES.IMPERVIOUS_COVER,
    status: isCompliant ? VALIDATION_STATUS.COMPLIANT : VALIDATION_STATUS.BREACH,
    message: isCompliant
      ? `Impervious cover compliant: ${providedCover.toFixed(1)}% ≤ ${maxCover.toFixed(1)}%`
      : VALIDATION_MESSAGES[VALIDATION_TYPES.IMPERVIOUS_COVER](providedCover, maxCover),
    providedValue: providedCover,
    maxValue: maxCover,
    isCompliant
  };
};

/**
 * Validate all design parameters
 * @param {Object} providedValues - Actual values from design
 * @param {Object} maxValues - Maximum allowed values
 * @returns {Object} Comprehensive validation results
 */
export const validateDesign = (providedValues, maxValues) => {
  const results = {
    heightFt: validateHeightFeet(
      providedValues.maxHeightFt,
      maxValues.maxHeight
    ),
    heightStories: validateHeightStories(
      providedValues.maxHeightStories,
      maxValues.maxHeightStories
    ),
    far: validateFAR(
      providedValues.far,
      maxValues.maxFAR
    ),
    density: validateDensity(
      providedValues.density,
      maxValues.maxDensity
    ),
    imperviousCover: validateImperviousCover(
      providedValues.imperviousCover,
      maxValues.maxImperviousCover
    )
  };

  // Determine overall compliance
  const allResults = Object.values(results);
  const hasBreaches = allResults.some(r => r.status === VALIDATION_STATUS.BREACH);
  const allCompliant = allResults.every(r => r.status === VALIDATION_STATUS.COMPLIANT);
  const hasUnknown = allResults.some(r => r.status === VALIDATION_STATUS.UNKNOWN);

  return {
    results,
    overallStatus: hasBreaches
      ? VALIDATION_STATUS.BREACH
      : allCompliant
        ? VALIDATION_STATUS.COMPLIANT
        : hasUnknown
          ? VALIDATION_STATUS.UNKNOWN
          : VALIDATION_STATUS.WARNING,
    isCompliant: allCompliant,
    hasBreaches,
    breachCount: allResults.filter(r => r.status === VALIDATION_STATUS.BREACH).length
  };
};
