/**
 * Regrid API Client
 *
 * Handles all HTTP communication with Regrid Parcel API v2.
 * Provides methods for querying parcels by polygon or point coordinates.
 *
 * @see https://support.regrid.com/api/parcel-api-endpoints
 */

import { getConfig } from '../config/index.js';
import { APIError } from '../utils/errors.js';

/**
 * Regrid API Client
 */
export class RegridAPIClient {
  constructor(config = null) {
    this.config = config || getConfig();
    this.baseUrl = 'https://app.regrid.com/api/v2';
  }

  /**
   * Get parcels that intersect a polygon boundary
   * PRIMARY METHOD - Use this for user-drawn boundaries
   *
   * @param {Object} polygon - GeoJSON Polygon geometry
   * @param {Object} options - Query options
   * @param {number} [options.limit=10] - Maximum parcels to return (1-1000)
   * @param {number} [options.radius=0] - Optional buffer in meters around polygon
   * @returns {Promise<Object>} Regrid API response
   */
  async getParcelsByPolygon(polygon, options = {}) {
    const { limit = 10, radius = 0 } = options;

    // Validate polygon
    if (!polygon || polygon.type !== 'Polygon') {
      throw new APIError('Invalid polygon geometry. Must be GeoJSON Polygon type.', 'INVALID_GEOMETRY');
    }

    const params = new URLSearchParams({
      token: this.config.regrid.token,
      geojson: JSON.stringify(polygon),
      limit: Math.min(Math.max(1, limit), 1000), // Clamp between 1-1000
    });

    if (radius > 0) {
      params.append('radius', Math.min(radius, 32000)); // Max 32km
    }

    const url = `${this.baseUrl}/parcels/area?${params}`;

    return this._fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Get parcels near a point coordinate
   * FALLBACK METHOD - Use if polygon method fails
   *
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {Object} options - Query options
   * @param {number} [options.radius=50] - Search radius in meters (1-32000)
   * @param {number} [options.limit=10] - Maximum parcels to return (1-1000)
   * @returns {Promise<Object>} Regrid API response
   */
  async getParcelsByPoint(lat, lon, options = {}) {
    const { radius = 50, limit = 10 } = options;

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      throw new APIError('Invalid coordinates. lat and lon must be numbers.', 'INVALID_COORDINATES');
    }
    if (lat < -90 || lat > 90) {
      throw new APIError('Invalid latitude. Must be between -90 and 90.', 'INVALID_LATITUDE');
    }
    if (lon < -180 || lon > 180) {
      throw new APIError('Invalid longitude. Must be between -180 and 180.', 'INVALID_LONGITUDE');
    }

    const params = new URLSearchParams({
      token: this.config.regrid.token,
      lat: lat.toString(),
      lon: lon.toString(),
      radius: Math.min(Math.max(1, radius), 32000).toString(),
      limit: Math.min(Math.max(1, limit), 1000).toString(),
    });

    const url = `${this.baseUrl}/parcels/point?${params}`;

    return this._fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Internal fetch wrapper with error handling and retries
   * @private
   */
  async _fetch(url, options, retries = 3) {
    const startTime = Date.now();

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, options);
        const elapsed = Date.now() - startTime;

        if (!response.ok) {
          const errorText = await response.text();

          // Parse error message if JSON
          let errorMessage = errorText;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorText;
          } catch (e) {
            // Not JSON, use raw text
          }

          // Retry on server errors (5xx) or rate limits (429)
          if ((response.status >= 500 || response.status === 429) && attempt < retries) {
            const backoffMs = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
            await this._sleep(backoffMs);
            continue;
          }

          throw new APIError(
            `Regrid API error (${response.status}): ${errorMessage}`,
            this._getErrorCode(response.status),
            { status: response.status, response: errorText }
          );
        }

        const data = await response.json();
        return data;

      } catch (error) {
        // Network errors
        if (error instanceof APIError) {
          throw error;
        }

        if (attempt < retries) {
          const backoffMs = Math.pow(2, attempt) * 1000;
          await this._sleep(backoffMs);
          continue;
        }

        throw new APIError(
          `Network error: ${error.message}`,
          'NETWORK_ERROR',
          { originalError: error }
        );
      }
    }

    throw new APIError('Max retries exceeded', 'MAX_RETRIES_EXCEEDED');
  }

  /**
   * Map HTTP status codes to error codes
   * @private
   */
  _getErrorCode(status) {
    const errorCodeMap = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      429: 'RATE_LIMITED',
      500: 'SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };
    return errorCodeMap[status] || 'UNKNOWN_ERROR';
  }

  /**
   * Sleep utility for retry backoff
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export default new RegridAPIClient();
