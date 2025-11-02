/**
 * Regrid Service
 *
 * Business logic layer for parcel lookups using Regrid API.
 * Handles response parsing, normalization, and error handling.
 */

import regridClient from '../api/RegridAPIClient.js';
import { APIError, ValidationError } from '../utils/errors.js';
import { validateGeoJSON } from '../utils/geometry.js';

/**
 * Normalized parcel data structure
 * @typedef {Object} ParcelData
 * @property {string} id - Regrid parcel ID
 * @property {string} parcelnumb - County parcel number
 * @property {string} address - Full street address
 * @property {string} city - City name
 * @property {string} county - County name
 * @property {string} state - State code (2-letter)
 * @property {string} zip - ZIP code
 * @property {Object} zoning - Zoning information
 * @property {string} zoning.code - Municipal zoning code
 * @property {string} zoning.description - Human-readable zoning description
 * @property {string|null} zoning.type - Standardized zoning type (premium field)
 * @property {string|null} zoning.subtype - Standardized zoning subtype (premium field)
 * @property {string|null} zoning.codeLink - Link to municipal zoning ordinance (premium field)
 * @property {number|null} zoning.id - Regrid zoning area ID (premium field)
 * @property {Object} geometry - GeoJSON geometry of parcel boundary
 * @property {Object} raw - Raw Regrid response fields for debugging
 */

/**
 * Regrid Service
 */
export class RegridService {
  constructor(client = null) {
    this.client = client || regridClient;
  }

  /**
   * Get parcels by boundary polygon
   * PRIMARY METHOD - Returns all parcels intersecting the boundary
   *
   * @param {Object} boundaryGeoJSON - GeoJSON Polygon or Feature with Polygon geometry
   * @param {Object} options - Query options
   * @param {number} [options.limit=10] - Max parcels to return
   * @param {boolean} [options.includeGeometry=true] - Include parcel geometry in response
   * @returns {Promise<ParcelData[]>} Array of normalized parcel data
   */
  async getParcelsByBoundary(boundaryGeoJSON, options = {}) {
    const { limit = 10, includeGeometry = true } = options;

    // Validate input geometry
    const validation = validateGeoJSON(boundaryGeoJSON);
    if (!validation.isValid) {
      throw new ValidationError(`Invalid boundary geometry: ${validation.errors.join(', ')}`);
    }

    // Extract polygon from Feature or use directly
    const polygon = boundaryGeoJSON.type === 'Feature'
      ? boundaryGeoJSON.geometry
      : boundaryGeoJSON;

    if (polygon.type !== 'Polygon') {
      throw new ValidationError('Boundary must be a Polygon geometry');
    }

    try {
      // Query Regrid API
      const response = await this.client.getParcelsByPolygon(polygon, { limit });

      // Parse and normalize response
      return this._parseRegridResponse(response, includeGeometry);

    } catch (error) {
      if (error instanceof APIError) {
        // Re-throw API errors with context
        throw new APIError(
          `Failed to fetch parcels by boundary: ${error.message}`,
          error.code,
          { originalError: error, boundary: polygon }
        );
      }
      throw error;
    }
  }

  /**
   * Get parcels by point coordinate
   * FALLBACK METHOD - Use if polygon method fails or for simple lookups
   *
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {Object} options - Query options
   * @param {number} [options.radius=50] - Search radius in meters
   * @param {number} [options.limit=10] - Max parcels to return
   * @param {boolean} [options.includeGeometry=true] - Include parcel geometry
   * @returns {Promise<ParcelData[]>} Array of normalized parcel data
   */
  async getParcelsByPoint(lat, lon, options = {}) {
    const { radius = 50, limit = 10, includeGeometry = true } = options;

    try {
      const response = await this.client.getParcelsByPoint(lat, lon, { radius, limit });
      return this._parseRegridResponse(response, includeGeometry);

    } catch (error) {
      if (error instanceof APIError) {
        throw new APIError(
          `Failed to fetch parcels by point: ${error.message}`,
          error.code,
          { originalError: error, coordinates: { lat, lon } }
        );
      }
      throw error;
    }
  }

  /**
   * Parse and normalize Regrid API response
   * @private
   */
  _parseRegridResponse(response, includeGeometry = true) {
    // Validate response structure
    if (!response || !response.parcels) {
      throw new APIError('Invalid Regrid response: missing parcels object', 'INVALID_RESPONSE');
    }

    const { parcels } = response;

    if (!parcels.features || !Array.isArray(parcels.features)) {
      throw new APIError('Invalid Regrid response: missing features array', 'INVALID_RESPONSE');
    }

    // No parcels found
    if (parcels.features.length === 0) {
      return [];
    }

    // Normalize each parcel
    return parcels.features.map(feature => this._normalizeParcel(feature, includeGeometry));
  }

  /**
   * Normalize a single parcel feature into our schema
   * @private
   */
  _normalizeParcel(feature, includeGeometry = true) {
    const fields = feature.properties?.fields;

    if (!fields) {
      throw new APIError('Invalid parcel feature: missing properties.fields', 'INVALID_PARCEL');
    }

    const normalized = {
      id: feature.id?.toString() || fields.ll_uuid || null,
      parcelnumb: fields.parcelnumb || null,
      address: fields.address || null,
      city: fields.city || null,
      county: fields.county || null,
      state: fields.state2 || null,
      zip: fields.szip || null,

      // Zoning information
      zoning: {
        code: fields.zoning || null,
        description: fields.zoning_description || null,
        type: fields.zoning_type || null,          // Premium field
        subtype: fields.zoning_subtype || null,    // Premium field
        codeLink: fields.zoning_code_link || null, // Premium field - CRITICAL for Claude!
        id: fields.zoning_id || null,              // Premium field
      },

      // Metadata
      metadata: {
        usecode: fields.usecode || null,
        usedesc: fields.usedesc || null,
        lotSizeAcres: fields.gisacre || null,
        lotSizeSqFt: fields.ll_gissqft || null,
        yearBuilt: fields.yearbuilt || null,
        owner: fields.owner || null,
        ll_uuid: fields.ll_uuid || null,
      },

      // Include geometry if requested
      ...(includeGeometry && { geometry: feature.geometry }),

      // Raw response for debugging/advanced use
      raw: fields,
    };

    return normalized;
  }

  /**
   * Check if parcel has premium zoning fields
   * @param {ParcelData} parcel - Normalized parcel data
   * @returns {boolean}
   */
  hasPremiumZoning(parcel) {
    return !!(
      parcel.zoning.type ||
      parcel.zoning.subtype ||
      parcel.zoning.codeLink ||
      parcel.zoning.id
    );
  }

  /**
   * Check if parcel has zoning code link (required for Claude integration)
   * @param {ParcelData} parcel - Normalized parcel data
   * @returns {boolean}
   */
  hasZoningCodeLink(parcel) {
    return !!parcel.zoning.codeLink;
  }

  /**
   * Get summary of parcels
   * @param {ParcelData[]} parcels - Array of parcels
   * @returns {Object} Summary statistics
   */
  getSummary(parcels) {
    return {
      count: parcels.length,
      hasPremiumFields: parcels.some(p => this.hasPremiumZoning(p)),
      hasZoningLinks: parcels.filter(p => this.hasZoningCodeLink(p)).length,
      uniqueZoningCodes: [...new Set(parcels.map(p => p.zoning.code).filter(Boolean))],
      uniqueJurisdictions: [...new Set(parcels.map(p => `${p.city}, ${p.state}`).filter(c => c !== ', '))],
    };
  }
}

// Export singleton instance
export default new RegridService();
