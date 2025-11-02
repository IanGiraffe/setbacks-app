/**
 * Zoning Intelligence Schemas
 *
 * Defines data structures and types for the zoning intelligence module.
 * Follows JSDoc conventions consistent with the codebase.
 */

/**
 * Parcel data from Regrid API
 * @typedef {Object} ParcelData
 * @property {string} parcelId - Unique parcel identifier
 * @property {string} apn - Assessor's Parcel Number
 * @property {Object} geometry - GeoJSON geometry (Polygon or MultiPolygon)
 * @property {string} geometry.type - Geometry type
 * @property {Array} geometry.coordinates - Coordinate arrays
 * @property {Object} properties - Parcel properties from Regrid
 * @property {string} [properties.address] - Street address
 * @property {string} [properties.city] - City name
 * @property {string} [properties.state] - State code
 * @property {string} [properties.zip] - Postal code
 * @property {string} [properties.county] - County name
 * @property {number} [properties.area] - Lot area in square feet
 * @property {string} [properties.zoning] - Zoning designation
 * @property {string} [properties.owner] - Owner name
 */

/**
 * Zoning regulation data
 * @typedef {Object} ZoningRegulation
 * @property {string} jurisdiction - Jurisdiction name (city/county)
 * @property {string} zoningCode - Zoning code/designation (e.g., "R-1", "C-2")
 * @property {string} description - Human-readable description
 * @property {Object} regulations - Zoning regulations
 * @property {number} [regulations.maxHeight] - Max height in feet
 * @property {number} [regulations.maxHeightStories] - Max stories
 * @property {number} [regulations.maxFAR] - Max floor area ratio
 * @property {number} [regulations.maxDensity] - Max density (units/acre)
 * @property {Object} regulations.setbacks - Setback requirements in feet
 * @property {number} [regulations.setbacks.front] - Front setback in feet
 * @property {number} [regulations.setbacks.side] - Side setback in feet
 * @property {number} [regulations.setbacks.rear] - Rear setback in feet
 * @property {Object} [regulations.setbacks.custom] - Custom setback types
 * @property {Object} [regulations.lotCoverage] - Lot coverage requirements
 * @property {number} [regulations.lotCoverage.max] - Max coverage percentage
 * @property {Object} [regulations.parking] - Parking requirements
 * @property {string} metadata - Raw regulation text/metadata
 * @property {Date} lastUpdated - Last update timestamp
 * @property {string} source - Data source (e.g., "regrid", "manual")
 */

/**
 * Combined parcel with zoning intelligence
 * @typedef {Object} ParcelWithZoning
 * @property {ParcelData} parcel - Parcel data
 * @property {ZoningRegulation|null} zoning - Zoning regulations (null if not found)
 * @property {string} [error] - Error message if lookup failed
 * @property {Date} queriedAt - When this data was retrieved
 */

/**
 * Boundary input for parcel lookup
 * Assumes GeoJSON format compatible with Giraffe (see GiraffeAdapter.js)
 * @typedef {Object} BoundaryInput
 * @property {string} type - Always "Feature"
 * @property {Object} geometry - GeoJSON geometry
 * @property {string} geometry.type - Geometry type (Polygon, MultiPolygon)
 * @property {Array} geometry.coordinates - Coordinate arrays
 * @property {Object} [properties] - Optional properties
 */

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {ParcelWithZoning} data - Cached parcel data
 * @property {Date} timestamp - When cached
 * @property {number} ttl - Time-to-live in milliseconds
 */

/**
 * Query result for multiple parcels
 * @typedef {Object} ParcelQueryResult
 * @property {Array<ParcelWithZoning>} parcels - Array of parcels with zoning
 * @property {number} total - Total parcels found
 * @property {Object} bounds - Bounding box of query area
 * @property {Date} queriedAt - Query timestamp
 */

/**
 * Error types for the module
 * @enum {string}
 */
export const ERROR_TYPES = {
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  CONFIG_ERROR: 'CONFIG_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
};

/**
 * Standard error response
 * @typedef {Object} ModuleError
 * @property {string} type - Error type from ERROR_TYPES
 * @property {string} message - Human-readable error message
 * @property {Error} [originalError] - Original error object if applicable
 * @property {Object} [context] - Additional context about the error
 */

/**
 * Create a standardized error object
 * @param {string} type - Error type from ERROR_TYPES
 * @param {string} message - Error message
 * @param {Error} [originalError] - Original error
 * @param {Object} [context] - Additional context
 * @returns {ModuleError}
 */
export function createError(type, message, originalError = null, context = {}) {
  return {
    type,
    message,
    originalError,
    context,
    timestamp: new Date()
  };
}

/**
 * Validate parcel data structure
 * @param {Object} data - Data to validate
 * @returns {boolean} True if valid parcel data
 */
export function isValidParcelData(data) {
  return !!(
    data &&
    data.parcelId &&
    data.geometry &&
    data.geometry.type &&
    data.geometry.coordinates
  );
}

/**
 * Validate boundary input
 * @param {Object} boundary - Boundary to validate
 * @returns {boolean} True if valid boundary
 */
export function isValidBoundary(boundary) {
  return !!(
    boundary &&
    boundary.type === 'Feature' &&
    boundary.geometry &&
    boundary.geometry.coordinates &&
    (boundary.geometry.type === 'Polygon' || boundary.geometry.type === 'MultiPolygon')
  );
}
