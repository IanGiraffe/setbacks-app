/**
 * useProfiles Hook
 *
 * Custom React hook for managing zoning parameter profiles.
 * Handles state management, persistence, and CRUD operations for profiles.
 *
 * Features:
 * - Save/load/delete profiles
 * - Persist to Giraffe projectApp public storage
 * - Compare multiple profiles
 * - Search and sort profiles
 */

import { useState, useEffect, useCallback } from 'react';
import { useGiraffeState } from '@gi-nx/iframe-sdk-react';
import { rpc } from '@gi-nx/iframe-sdk';
import {
  createProfile,
  updateProfile,
  validateProfile,
  compareProfiles,
  sortProfiles,
  searchProfiles,
  isProfileNameDuplicate
} from '../domain/ProfileService';

/**
 * Hook for managing zoning parameter profiles
 * @returns {Object} Profile management interface
 */
export const useProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const giraffeState = useGiraffeState('selectedProjectApp');

  // Load profiles from Giraffe storage on mount
  useEffect(() => {
    loadProfiles();
  }, [giraffeState]);

  /**
   * Load profiles from Giraffe storage
   */
  const loadProfiles = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);

      const storedProfiles = giraffeState?.public?.zoningProfiles || [];
      setProfiles(storedProfiles);
    } catch (err) {
      setError(`Failed to load profiles: ${err.message}`);
      console.error('Error loading profiles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [giraffeState]);

  /**
   * Save profiles to Giraffe storage
   * @param {Array} updatedProfiles - Updated profiles array
   */
  const saveToStorage = async (updatedProfiles) => {
    if (!giraffeState) {
      throw new Error('No active project app');
    }

    await rpc.invoke('updateProjectApp', [
      giraffeState.app,
      {
        ...giraffeState,
        public: {
          ...(giraffeState.public || {}),
          zoningProfiles: updatedProfiles
        }
      }
    ]);
  };

  /**
   * Save a new profile
   * @param {string} name - Profile name
   * @param {Object} parameters - Zoning parameters
   * @param {string} unit - Unit system
   * @returns {Object} Result { success: boolean, profile?: Object, error?: string }
   */
  const saveProfile = async (name, parameters, unit) => {
    try {
      setError(null);

      // Check for duplicate name
      if (isProfileNameDuplicate(profiles, name)) {
        return {
          success: false,
          error: 'A profile with this name already exists'
        };
      }

      const newProfile = createProfile(name, parameters, unit);
      const validation = validateProfile(newProfile);

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      const updatedProfiles = [...profiles, newProfile];
      await saveToStorage(updatedProfiles);
      setProfiles(updatedProfiles);

      return {
        success: true,
        profile: newProfile
      };
    } catch (err) {
      const errorMsg = `Failed to save profile: ${err.message}`;
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }
  };

  /**
   * Update an existing profile
   * @param {string} profileId - Profile ID to update
   * @param {Object} updates - Updates to apply
   * @returns {Object} Result { success: boolean, profile?: Object, error?: string }
   */
  const updateProfileById = async (profileId, updates) => {
    try {
      setError(null);

      const profileIndex = profiles.findIndex(p => p.id === profileId);
      if (profileIndex === -1) {
        return {
          success: false,
          error: 'Profile not found'
        };
      }

      // Check for duplicate name if name is being updated
      if (updates.name && isProfileNameDuplicate(profiles, updates.name, profileId)) {
        return {
          success: false,
          error: 'A profile with this name already exists'
        };
      }

      const updatedProfile = updateProfile(profiles[profileIndex], updates);
      const validation = validateProfile(updatedProfile);

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      const updatedProfiles = [...profiles];
      updatedProfiles[profileIndex] = updatedProfile;

      await saveToStorage(updatedProfiles);
      setProfiles(updatedProfiles);

      return {
        success: true,
        profile: updatedProfile
      };
    } catch (err) {
      const errorMsg = `Failed to update profile: ${err.message}`;
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }
  };

  /**
   * Delete a profile
   * @param {string} profileId - Profile ID to delete
   * @returns {Object} Result { success: boolean, error?: string }
   */
  const deleteProfile = async (profileId) => {
    try {
      setError(null);

      const updatedProfiles = profiles.filter(p => p.id !== profileId);
      await saveToStorage(updatedProfiles);
      setProfiles(updatedProfiles);

      return { success: true };
    } catch (err) {
      const errorMsg = `Failed to delete profile: ${err.message}`;
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }
  };

  /**
   * Get a profile by ID
   * @param {string} profileId - Profile ID
   * @returns {Object|null} Profile or null if not found
   */
  const getProfile = (profileId) => {
    return profiles.find(p => p.id === profileId) || null;
  };

  /**
   * Load a profile's parameters
   * @param {string} profileId - Profile ID
   * @returns {Object} Result { success: boolean, parameters?: Object, unit?: string, error?: string }
   */
  const loadProfile = (profileId) => {
    const profile = getProfile(profileId);
    if (!profile) {
      return {
        success: false,
        error: 'Profile not found'
      };
    }

    return {
      success: true,
      parameters: profile.parameters,
      unit: profile.unit,
      profile
    };
  };

  /**
   * Compare two profiles
   * @param {string} profileId1 - First profile ID
   * @param {string} profileId2 - Second profile ID
   * @returns {Object} Comparison result or error
   */
  const compare = (profileId1, profileId2) => {
    const profile1 = getProfile(profileId1);
    const profile2 = getProfile(profileId2);

    if (!profile1 || !profile2) {
      return {
        success: false,
        error: 'One or both profiles not found'
      };
    }

    return {
      success: true,
      comparison: compareProfiles(profile1, profile2)
    };
  };

  /**
   * Sort profiles
   * @param {string} sortBy - Sort criteria
   * @param {string} order - Sort order
   * @returns {Array} Sorted profiles
   */
  const getSortedProfiles = (sortBy = 'name', order = 'asc') => {
    return sortProfiles(profiles, sortBy, order);
  };

  /**
   * Search profiles
   * @param {string} query - Search query
   * @returns {Array} Filtered profiles
   */
  const search = (query) => {
    return searchProfiles(profiles, query);
  };

  return {
    // State
    profiles,
    isLoading,
    error,

    // CRUD operations
    saveProfile,
    updateProfile: updateProfileById,
    deleteProfile,
    getProfile,
    loadProfile,

    // Utility functions
    compare,
    getSortedProfiles,
    search,

    // Reload function
    reload: loadProfiles
  };
};
