/**
 * Zoning Intelligence Module
 *
 * Main entry point for the zoning intelligence module.
 * Provides intelligent zoning regulation lookup and enrichment for parcels.
 *
 * @module zoningIntelligence
 */

// Configuration
export { getConfig, validateConfig } from './config/index.js';

// Schemas and types
export * from './schemas/index.js';

// Utilities
export * from './utils/index.js';

// API Clients (Phase 2)
export { RegridAPIClient } from './api/RegridAPIClient.js';
export { default as regridClient } from './api/RegridAPIClient.js';

// Services (Phase 2)
export { RegridService } from './services/RegridService.js';
export { default as regridService } from './services/RegridService.js';

// Public API for module consumers
import regridService from './services/RegridService.js';

/**
 * Main module API
 * @namespace ZoningIntelligence
 */
export const ZoningIntelligence = {
  /**
   * Fetch parcel data by boundary polygon
   * @param {Object} boundaryGeoJSON - GeoJSON Polygon or Feature
   * @param {Object} options - Query options
   * @returns {Promise<ParcelData[]>} Array of parcels
   */
  getParcelsByBoundary: (boundaryGeoJSON, options) =>
    regridService.getParcelsByBoundary(boundaryGeoJSON, options),

  /**
   * Fetch parcel data by point coordinates
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {Object} options - Query options
   * @returns {Promise<ParcelData[]>} Array of parcels
   */
  getParcelsByPoint: (lat, lon, options) =>
    regridService.getParcelsByPoint(lat, lon, options),

  /**
   * Get summary statistics for parcels
   * @param {ParcelData[]} parcels - Array of parcels
   * @returns {Object} Summary statistics
   */
  getSummary: (parcels) =>
    regridService.getSummary(parcels),
};

// Future Phase 3 exports (Claude integration)
// export { ClaudeService } from './services/ClaudeService.js';
// export { OrdinanceService } from './services/OrdinanceService.js';
