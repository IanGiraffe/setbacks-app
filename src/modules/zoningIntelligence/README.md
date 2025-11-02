# Zoning Intelligence Module

## Goal
- Deliver a standalone service that turns project boundary geometry into parcel zoning intelligence by: (1) querying Regrid for `zoning_type` and `zoning_code_link`, (2) retrieving the referenced ordinance content, and (3) using Claude Messages API with structured prompts to populate a standardized dimensional regulations template consumable across apps.

For context:
Here is the regrid documentation: `https://support.regrid.com/api/section/parcel-api`

Here is the regrid Parcel Schema: `https://support.regrid.com/parcel-data/schema`

## Overview

This module provides intelligent zoning research capabilities by:
- Querying parcel data from Regrid API
- Enriching parcels with zoning regulations
- Using Claude AI to interpret and structure zoning codes
- Caching results for performance

## Phase 1: Foundations (Current)

### Completed
- ✅ Module directory structure
- ✅ Type definitions and schemas
- ✅ Utility functions (geometry, units, validation, errors)
- ✅ Configuration management
- ✅ Documentation

### Structure

```
zoningIntelligence/
├── api/              # API clients (Phase 2)
├── config/           # Configuration and API keys
├── schemas/          # Type definitions and data structures
├── services/         # Business logic services (Phase 2)
└── utils/            # Utility functions
    ├── geometry.js   # GeoJSON operations
    ├── units.js      # Imperial unit utilities
    ├── validation.js # Input validation
    └── errors.js     # Error handling
```

## Configuration

Set environment variables in `.env`:

```env
VITE_REGRID_TOKEN=your_regrid_token_here
VITE_CLAUDE_API_KEY=your_claude_api_key_here
```

## Usage (Phase 1)

```javascript
import {
  getConfig,
  validateConfig,
  formatDistance,
  parseDistance,
  getBoundingBox,
  validateBoundaryInput
} from './modules/zoningIntelligence';

// Check configuration
const configCheck = validateConfig();
if (!configCheck.valid) {
  console.error('Missing config:', configCheck.missing);
}

// Format and parse units
const display = formatDistance(15, 1); // "15.0 ft"
const parsed = parseDistance("15 ft"); // 15

// Validate boundary
const boundary = {
  type: 'Feature',
  geometry: { type: 'Polygon', coordinates: [...] }
};
const validation = validateBoundaryInput(boundary);
```

## Schemas

### ParcelData
Parcel information from Regrid API with geometry and properties.

### ZoningRegulation
Structured zoning regulations including setbacks, height limits, FAR, density, etc.
All values stored in imperial units (feet, square feet, acres).

### BoundaryInput
GeoJSON Feature with Polygon/MultiPolygon geometry for parcel queries.

## Utilities

### Geometry
- `getBoundingBox()` - Calculate bounding boxes
- `getCentroid()` - Find polygon centroids
- `calculateArea()` - Calculate areas in square feet
- `pointInPolygon()` - Point-in-polygon tests
- `createBuffer()` - Buffer geometries by distance in feet

### Units
- `sqFeetToAcres()` / `acresToSqFeet()` - Area conversions
- `formatDistance()` / `formatArea()` - Display formatting with units
- `parseDistance()` - Parse user input ("15 ft", "15'", "15")
- `parseArea()` - Parse area input ("5000 sq ft", "0.5 acres")

### Validation
- `validateBoundaryInput()` - Validate GeoJSON boundaries
- `validateZoningRegulation()` - Validate regulation data
- `validateRange()` - Numeric range validation
- `sanitizeInput()` - String sanitization

### Error Handling
- `ZoningIntelligenceError` - Custom error class
- `handleApiError()` - API error handling
- `withRetry()` - Retry wrapper for flaky operations
- `getUserFriendlyMessage()` - User-facing error messages

## Assumptions (Phase 1)

1. **Boundary Format**: Accepts GeoJSON Features with Polygon/MultiPolygon geometry
2. **Units**: All values stored and returned in imperial units (feet, square feet, acres)
3. **Regrid API**: Will query using MVT tiles endpoint (to be tested in Phase 2)
4. **Cache**: Simple in-memory cache (IndexedDB in future phases)
5. **Conversions**: Unit conversions to metric (for Giraffe integration) handled outside this module

### Phase 2: Regrid Integration
- [ ] Research Regrid API capabilities:
  - Check if REST endpoint exists for coordinate-based parcel lookup
  - Document API authentication requirements
  - Identify rate limits and quotas
  - Test API with sample coordinates
- [ ] Implement `api/RegridAPIClient.js`:
  - HTTP client for Regrid API (may extend base client pattern if needed)
  - Add Regrid token authentication
  - Implement retry logic with exponential backoff
  - Add request logging for debugging
- [ ] Implement `services/RegridService.js`:
  - `getParcelByCoordinates(lat, lng, options)` → parcel data
  - `getParcelByGeometry(boundaryGeoJSON, options)` → parcel data (uses centroid)
  - Handle multiple parcels scenario (return array or closest?)
  - Error handling for no parcel found
  - Mock mode toggle for testing
  - Validate and normalize Regrid responses
- [ ] Unit tests in `__tests__/unit/`:
  - Test centroid extraction with various GeoJSON shapes
  - Test Regrid response parsing (mock responses)
  - Test error scenarios (no parcel, API failure, invalid token)
- [ ] Integration test with real Regrid API in `__tests__/integration/` (mark as slow/optional in CI)

## Notes

- All measurements use imperial units (feet, square feet, acres)
- GeoJSON coordinates use [longitude, latitude] format
- Error handling includes retry logic for network failures
- Configuration validation prevents runtime errors
- Unit conversions for external integrations (e.g., Giraffe) handled outside module
