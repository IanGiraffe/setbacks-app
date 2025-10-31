/**
 * ProfileService
 *
 * Domain service for managing zoning parameter profiles.
 * Handles saving, loading, comparing, and managing named parameter presets.
 *
 * Following clean architecture principles:
 * - Pure business logic for profile management
 * - Independent of storage mechanism (uses GiraffeAdapter)
 * - Easy to test and extend
 */

import { getDefaultParameters } from '../config/zoningParameters';

/**
 * Create a new profile from zoning parameters
 * @param {string} name - Profile name
 * @param {Object} parameters - Zoning parameters
 * @param {string} unit - Unit system (FEET or METERS)
 * @returns {Object} Profile object
 */
export const createProfile = (name, parameters, unit = 'FEET') => {
  return {
    id: generateProfileId(),
    name: name.trim(),
    parameters: { ...parameters },
    unit,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

/**
 * Update an existing profile
 * @param {Object} profile - Existing profile
 * @param {Object} updates - Updates to apply (can include name, parameters, unit)
 * @returns {Object} Updated profile
 */
export const updateProfile = (profile, updates) => {
  return {
    ...profile,
    ...updates,
    updatedAt: new Date().toISOString()
  };
};

/**
 * Validate profile data
 * @param {Object} profile - Profile to validate
 * @returns {Object} Validation result { isValid: boolean, errors: string[] }
 */
export const validateProfile = (profile) => {
  const errors = [];

  if (!profile.name || profile.name.trim().length === 0) {
    errors.push('Profile name is required');
  }

  if (!profile.parameters || typeof profile.parameters !== 'object') {
    errors.push('Profile parameters are required');
  }

  if (!profile.unit || !['feet', 'meters', 'FEET', 'METERS'].includes(profile.unit)) {
    errors.push('Invalid unit system');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Compare two profiles and return differences
 * @param {Object} profile1 - First profile
 * @param {Object} profile2 - Second profile
 * @returns {Object} Comparison result with differences
 */
export const compareProfiles = (profile1, profile2) => {
  const differences = [];
  const allKeys = new Set([
    ...Object.keys(profile1.parameters),
    ...Object.keys(profile2.parameters)
  ]);

  allKeys.forEach(key => {
    const val1 = profile1.parameters[key];
    const val2 = profile2.parameters[key];

    if (val1 !== val2) {
      differences.push({
        parameter: key,
        profile1Name: profile1.name,
        profile1Value: val1,
        profile2Name: profile2.name,
        profile2Value: val2,
        difference: val2 - val1
      });
    }
  });

  return {
    profile1: {
      id: profile1.id,
      name: profile1.name,
      unit: profile1.unit
    },
    profile2: {
      id: profile2.id,
      name: profile2.name,
      unit: profile2.unit
    },
    differences,
    hasDifferences: differences.length > 0
  };
};

/**
 * Sort profiles by name or date
 * @param {Array} profiles - Array of profiles
 * @param {string} sortBy - Sort criteria ('name', 'createdAt', 'updatedAt')
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted profiles
 */
export const sortProfiles = (profiles, sortBy = 'name', order = 'asc') => {
  const sorted = [...profiles].sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      comparison = new Date(a[sortBy]) - new Date(b[sortBy]);
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
};

/**
 * Filter profiles by search query
 * @param {Array} profiles - Array of profiles
 * @param {string} query - Search query
 * @returns {Array} Filtered profiles
 */
export const searchProfiles = (profiles, query) => {
  if (!query || query.trim().length === 0) {
    return profiles;
  }

  const lowerQuery = query.toLowerCase();
  return profiles.filter(profile =>
    profile.name.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Check if a profile name already exists
 * @param {Array} profiles - Array of existing profiles
 * @param {string} name - Name to check
 * @param {string} excludeId - Optional profile ID to exclude from check (for updates)
 * @returns {boolean} True if name exists
 */
export const isProfileNameDuplicate = (profiles, name, excludeId = null) => {
  const trimmedName = name.trim().toLowerCase();
  return profiles.some(
    profile =>
      profile.id !== excludeId &&
      profile.name.toLowerCase() === trimmedName
  );
};

/**
 * Create a default "Current Settings" profile
 * @param {Object} parameters - Current zoning parameters
 * @param {string} unit - Current unit system
 * @returns {Object} Profile object
 */
export const createCurrentSettingsProfile = (parameters, unit) => {
  return createProfile('Current Settings', parameters, unit);
};

/**
 * Generate a unique profile ID
 * @returns {string} Unique ID
 */
const generateProfileId = () => {
  return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Export profile to JSON
 * @param {Object} profile - Profile to export
 * @returns {string} JSON string
 */
export const exportProfileToJSON = (profile) => {
  return JSON.stringify(profile, null, 2);
};

/**
 * Import profile from JSON
 * @param {string} jsonString - JSON string
 * @returns {Object} Result { success: boolean, profile?: Object, error?: string }
 */
export const importProfileFromJSON = (jsonString) => {
  try {
    const profile = JSON.parse(jsonString);
    const validation = validateProfile(profile);

    if (!validation.isValid) {
      return {
        success: false,
        error: `Invalid profile: ${validation.errors.join(', ')}`
      };
    }

    // Regenerate ID to avoid conflicts
    const importedProfile = {
      ...profile,
      id: generateProfileId(),
      name: `${profile.name} (Imported)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      success: true,
      profile: importedProfile
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse JSON: ${error.message}`
    };
  }
};
