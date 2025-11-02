/**
 * Geometry Utilities
 *
 * Functions for working with GeoJSON geometries and spatial operations.
 */

/**
 * Validate GeoJSON geometry
 * @param {Object} geojson - GeoJSON object to validate
 * @returns {Object} {isValid: boolean, errors: string[]}
 */
export function validateGeoJSON(geojson) {
  const errors = [];

  if (!geojson || typeof geojson !== 'object') {
    return { isValid: false, errors: ['GeoJSON must be an object'] };
  }

  // Handle Feature wrapper
  if (geojson.type === 'Feature') {
    if (!geojson.geometry) {
      errors.push('Feature must have geometry property');
    }
    return errors.length === 0
      ? validateGeoJSON(geojson.geometry)
      : { isValid: false, errors };
  }

  // Validate geometry type
  const validTypes = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'];
  if (!validTypes.includes(geojson.type)) {
    errors.push(`Invalid geometry type: ${geojson.type}`);
  }

  // Validate coordinates
  if (!geojson.coordinates) {
    errors.push('Geometry must have coordinates property');
  } else if (!Array.isArray(geojson.coordinates)) {
    errors.push('Coordinates must be an array');
  } else if (geojson.coordinates.length === 0) {
    errors.push('Coordinates array cannot be empty');
  }

  // Validate Polygon structure
  if (geojson.type === 'Polygon') {
    if (!Array.isArray(geojson.coordinates[0])) {
      errors.push('Polygon coordinates must be an array of linear rings');
    } else if (geojson.coordinates[0].length < 4) {
      errors.push('Polygon linear ring must have at least 4 positions');
    } else {
      // Check if polygon is closed
      const first = geojson.coordinates[0][0];
      const last = geojson.coordinates[0][geojson.coordinates[0].length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        errors.push('Polygon linear ring must be closed (first and last positions must match)');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculate bounding box from GeoJSON geometry
 * @param {Object} geometry - GeoJSON geometry (Polygon or MultiPolygon)
 * @returns {Object} Bounding box {minLng, minLat, maxLng, maxLat}
 */
export function getBoundingBox(geometry) {
  const coordinates = geometry.type === 'MultiPolygon'
    ? geometry.coordinates.flat(2)
    : geometry.coordinates.flat(1);

  if (!coordinates.length) {
    throw new Error('Invalid geometry: no coordinates found');
  }

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  coordinates.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  });

  return { minLng, minLat, maxLng, maxLat };
}

/**
 * Calculate centroid of a polygon
 * @param {Object} geometry - GeoJSON Polygon geometry
 * @returns {Array} [lng, lat] coordinates of centroid
 */
export function getCentroid(geometry) {
  const coords = geometry.type === 'Polygon'
    ? geometry.coordinates[0]
    : geometry.coordinates[0][0];

  let sumLng = 0;
  let sumLat = 0;
  const count = coords.length - 1; // Exclude closing point

  for (let i = 0; i < count; i++) {
    sumLng += coords[i][0];
    sumLat += coords[i][1];
  }

  return [sumLng / count, sumLat / count];
}

/**
 * Calculate area of polygon in square feet (rough approximation)
 * Uses simple planar calculation - accurate for small areas
 * @param {Object} geometry - GeoJSON Polygon geometry
 * @returns {number} Area in square feet
 */
export function calculateArea(geometry) {
  const coords = geometry.type === 'Polygon'
    ? geometry.coordinates[0]
    : geometry.coordinates[0][0];

  if (coords.length < 3) return 0;

  // Get approximate latitude for conversion
  const lat = coords[0][1];
  const feetPerDegreeLat = 365221; // ~111320 meters * 3.28084
  const feetPerDegreeLng = feetPerDegreeLat * Math.cos(lat * Math.PI / 180);

  let area = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const x1 = coords[i][0] * feetPerDegreeLng;
    const y1 = coords[i][1] * feetPerDegreeLat;
    const x2 = coords[(i + 1) % (coords.length - 1)][0] * feetPerDegreeLng;
    const y2 = coords[(i + 1) % (coords.length - 1)][1] * feetPerDegreeLat;

    area += (x1 * y2) - (x2 * y1);
  }

  return Math.abs(area) / 2;
}

/**
 * Check if a point is inside a polygon
 * Ray casting algorithm
 * @param {Array} point - [lng, lat]
 * @param {Object} polygon - GeoJSON Polygon geometry
 * @returns {boolean} True if point is inside polygon
 */
export function pointInPolygon(point, polygon) {
  const [lng, lat] = point;
  const coords = polygon.coordinates[0];

  let inside = false;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const [xi, yi] = coords[i];
    const [xj, yj] = coords[j];

    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Convert GeoJSON Feature to simple geometry
 * @param {Object} feature - GeoJSON Feature
 * @returns {Object} Geometry object
 */
export function extractGeometry(feature) {
  if (!feature || feature.type !== 'Feature') {
    throw new Error('Invalid feature: must be GeoJSON Feature');
  }
  return feature.geometry;
}

/**
 * Create a buffer around a geometry (simplified)
 * Returns a bounding box expanded by buffer distance
 * @param {Object} geometry - GeoJSON geometry
 * @param {number} bufferFeet - Buffer distance in feet
 * @returns {Object} Bounding box {minLng, minLat, maxLng, maxLat}
 */
export function createBuffer(geometry, bufferFeet) {
  const bbox = getBoundingBox(geometry);
  const centroid = getCentroid(geometry);
  const lat = centroid[1];

  // Convert feet to degrees (approximation)
  const feetPerDegreeLat = 365221;
  const feetPerDegreeLng = feetPerDegreeLat * Math.cos(lat * Math.PI / 180);

  const bufferLat = bufferFeet / feetPerDegreeLat;
  const bufferLng = bufferFeet / feetPerDegreeLng;

  return {
    minLng: bbox.minLng - bufferLng,
    minLat: bbox.minLat - bufferLat,
    maxLng: bbox.maxLng + bufferLng,
    maxLat: bbox.maxLat + bufferLat
  };
}
