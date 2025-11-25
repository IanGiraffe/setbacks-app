/**
 * Giraffe Adapter
 *
 * Isolates all Giraffe SDK interactions from the rest of the application.
 * This adapter provides a clean interface for Giraffe operations following
 * the Dependency Inversion Principle.
 */

import { rpc, giraffeState } from '@gi-nx/iframe-sdk';
import {
  GIRAFFE_FLOWS,
  GIRAFFE_PROPERTIES,
  DEFAULT_SIDE_INDICES,
  createSetbackSteps
} from '../constants/giraffeFlows';

export class GiraffeAdapter {
  /**
   * Create a raw section (envelope) in Giraffe
   * @param {Object} feature - GeoJSON feature to create
   * @returns {Promise<Object>} Result with success status and data
   */
  static async createRawSection(feature) {
    try {
      const result = await rpc.invoke('createRawSection', [feature]);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update an existing raw section in Giraffe
   * @param {Object} feature - Updated GeoJSON feature
   * @returns {Promise<Object>} Result with success status and data
   */
  static async updateRawSection(feature) {
    try {
      const result = await rpc.invoke('updateRawSection', [feature]);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get selected features from Giraffe
   * @returns {Promise<Object>} Selected features collection
   */
  static async getSelectedFeatures() {
    try {
      const result = await rpc.invoke('getSelectedFeatures', []);
      return result;
    } catch (error) {
      return { features: [] };
    }
  }

  /**
   * Get all raw sections from Giraffe state
   * @returns {Object} Raw sections feature collection
   */
  static getRawSections() {
    return giraffeState.get('rawSections') || { features: [] };
  }

  /**
   * Find envelope features by usage type
   * @returns {Array} Array of envelope features
   */
  static getEnvelopeFeatures() {
    const rawSections = this.getRawSections();
    return rawSections.features?.filter(
      f => f.properties?.usage === GIRAFFE_PROPERTIES.USAGE_ENVELOPE
    ) || [];
  }

  /**
   * Find a specific envelope by ID
   * @param {string} envelopeId - Envelope ID to find
   * @returns {Object|null} Envelope feature or null if not found
   */
  static findEnvelopeById(envelopeId) {
    const envelopes = this.getEnvelopeFeatures();
    return envelopes.find(e => e.properties?.id === envelopeId) || null;
  }

  /**
   * Get analytics/measures from Giraffe
   * @returns {Promise<Object>} Analytics data with rows of measures
   */
  static async getAnalytics() {
    try {
      const result = await rpc.invoke('getAnalyticsResult', []);
      return result;
    } catch (error) {
      console.error('Error getting analytics:', error);
      return null;
    }
  }

  /**
   * Debug analytics structure - logs the full analytics to console
   * Use this to see what the actual structure looks like when measures return null
   * @returns {Promise<void>}
   */
  static async debugAnalytics() {
    try {
      const analytics = await rpc.invoke('getAnalyticsResult', []);
      
      console.group('🔍 GIRAFFE ANALYTICS DEBUG');
      console.log('📦 Full Analytics Object:', analytics);
      
      if (!analytics) {
        console.error('❌ Analytics is null');
        console.groupEnd();
        return;
      }

      if (!analytics.grouped) {
        console.error('❌ analytics.grouped is missing');
        console.log('Available keys:', Object.keys(analytics));
        console.groupEnd();
        return;
      }

      const categoryIds = Object.keys(analytics.grouped);
      console.log('📁 Categories:', categoryIds);

      categoryIds.forEach((categoryId, index) => {
        console.group(`📂 Category ${index + 1}: "${categoryId}"`);
        
        const category = analytics.grouped[categoryId];
        
        if (!category.usages) {
          console.error('❌ No usages in this category');
          console.groupEnd();
          return;
        }

        const usageNames = Object.keys(category.usages);
        console.log('🏷️  Usages:', usageNames);

        usageNames.forEach(usageName => {
          console.group(`🏷️  Usage: "${usageName}"`);
          
          const usage = category.usages[usageName];
          
          if (!usage.rows) {
            console.error('❌ No rows');
            console.groupEnd();
            return;
          }

          console.log(`📊 ${usage.rows.length} rows`);
          
          const measures = usage.rows
            .map(row => ({
              name: row.measure?.name,
              value: row.columns?.[0]?.value
            }))
            .filter(m => m.name);
          
          console.table(measures);
          console.groupEnd();
        });

        console.groupEnd();
      });

      console.groupEnd();
    } catch (error) {
      console.error('Error debugging analytics:', error);
    }
  }

  /**
   * Build envelope feature GeoJSON structure
   * @param {Object} params - Envelope parameters
   * @param {Object} params.projectGeometry - Project boundary geometry
   * @param {Object} params.zoningParams - Zoning parameters (in meters)
   * @param {Object} params.customSetbacks - Custom setback types (in meters)
   * @param {string} params.envelopeId - Optional envelope ID for updates
   * @returns {Object} Complete envelope feature GeoJSON
   */
  static buildEnvelopeFeature({ projectGeometry, zoningParams, customSetbacks = {}, envelopeId = null }) {
    const {
      maxHeight,
      maxHeightStories,
      maxFAR,
      maxDensity,
      frontSetback,
      sideSetback,
      rearSetback
    } = zoningParams;

    const featureId = envelopeId || `envelope_${Date.now()}`;

    // Build setback steps for all setback types
    const setbackSteps = {
      front: createSetbackSteps(frontSetback),
      side: createSetbackSteps(sideSetback),
      rear: createSetbackSteps(rearSetback)
    };

    // Add custom setbacks
    Object.entries(customSetbacks).forEach(([name, value]) => {
      setbackSteps[name] = createSetbackSteps(value);
    });

    // Build side indices
    const sideIndices = {
      ...DEFAULT_SIDE_INDICES,
      ...Object.fromEntries(
        Object.keys(customSetbacks).map(name => [name, []])
      )
    };

    return {
      type: "Feature",
      properties: {
        usage: GIRAFFE_PROPERTIES.USAGE_ENVELOPE,
        id: featureId,
        flow: {
          id: GIRAFFE_FLOWS.ENVELOPE.FLOW_ID,
          inputs: {
            [GIRAFFE_FLOWS.ENVELOPE.INPUT_ID]: {
              type: "envelope",
              parameters: {
                version: GIRAFFE_FLOWS.ENVELOPE.VERSION,
                maxHeight,
                maxHeightStories,
                maxFAR,
                maxDensity,
                sideIndices,
                setbackSteps,
                hasSetbackOutput: false
              }
            }
          }
        },
        appId: GIRAFFE_PROPERTIES.APP_ID,
        color: GIRAFFE_PROPERTIES.DEFAULT_COLOR,
        public: true,
        stroke: GIRAFFE_PROPERTIES.DEFAULT_STROKE,
        projectId: projectGeometry.properties?.id || "unknown",
        stackOrder: GIRAFFE_PROPERTIES.DEFAULT_STACK_ORDER,
        fillOpacity: GIRAFFE_PROPERTIES.DEFAULT_FILL_OPACITY,
        strokeOpacity: GIRAFFE_PROPERTIES.DEFAULT_STROKE_OPACITY,
        layerId: GIRAFFE_PROPERTIES.LAYER_ID
      },
      geometry: projectGeometry.geometry
    };
  }

  /**
   * Extract envelope parameters from a feature
   * @param {Object} feature - Envelope feature
   * @returns {Object|null} Extracted parameters or null if invalid
   */
  static extractEnvelopeParameters(feature) {
    try {
      const params = feature.properties?.flow?.inputs?.[GIRAFFE_FLOWS.ENVELOPE.INPUT_ID]?.parameters;
      if (!params) return null;

      return {
        maxHeight: params.maxHeight,
        maxHeightStories: params.maxHeightStories,
        maxFAR: params.maxFAR,
        maxDensity: params.maxDensity,
        frontSetback: params.setbackSteps?.front?.[0]?.inset,
        sideSetback: params.setbackSteps?.side?.[0]?.inset,
        rearSetback: params.setbackSteps?.rear?.[0]?.inset,
        customSetbacks: this.extractCustomSetbacks(params.setbackSteps),
        sideIndices: params.sideIndices
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract custom setback types from setback steps
   * @param {Object} setbackSteps - Setback steps object
   * @returns {Object} Custom setbacks (excluding front, side, rear)
   */
  static extractCustomSetbacks(setbackSteps) {
    const standardTypes = ['front', 'side', 'rear'];
    const customSetbacks = {};

    Object.keys(setbackSteps || {}).forEach(key => {
      if (!standardTypes.includes(key)) {
        customSetbacks[key] = setbackSteps[key]?.[0]?.inset;
      }
    });

    return customSetbacks;
  }
}
