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
├── api/                  # API clients
│   └── RegridAPIClient.js
├── config/               # Configuration and API keys
│   └── index.js
├── schemas/              # Type definitions and data structures
│   └── index.js
├── services/             # Business logic services
│   ├── RegridService.js      # Phase 2: Parcel lookup
│   └── OrdinanceService.js   # Phase 3: Ordinance fetching
├── utils/                # Utility functions
│   ├── geometry.js           # GeoJSON operations
│   ├── units.js              # Imperial unit utilities
│   ├── validation.js         # Input validation
│   ├── errors.js             # Error handling
│   └── ordinanceCache.js     # Phase 3: Ordinance caching
└── __tests__/            # Tests and demos
    ├── ordinance-integration.js
    └── ordinance-demo.js
```

## Configuration

Set environment variables in `.env`:

```env
VITE_REGRID_TOKEN=your_regrid_token_here
VITE_CLAUDE_API_KEY=your_claude_api_key_here
```

## Usage

### Phase 1: Configuration & Utilities

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

### Phase 2: Regrid Integration

```javascript
import { regridService } from './modules/zoningIntelligence';

// Fetch parcels by point
const parcels = await regridService.getParcelsByPoint(30.2672, -97.7431, {
  radius: 5000,
  limit: 10
});

// Fetch parcels by boundary
const boundary = {
  type: 'Feature',
  geometry: { type: 'Polygon', coordinates: [...] }
};
const parcels = await regridService.getParcelsByBoundary(boundary);

// Get summary
const summary = regridService.getSummary(parcels);
console.log(`Found ${summary.count} parcels`);
```

### Phase 3: Ordinance Fetching

```javascript
import { ordinanceService, OrdinanceService } from './modules/zoningIntelligence';

// Fetch ordinance from URL (uses singleton with defaults)
const result = await ordinanceService.fetchOrdinance('https://example.com/zoning-code');
console.log(result.text); // Markdown content
console.log(result.metadata.title); // "Zoning Code Chapter 5"

// Custom configuration
const customService = new OrdinanceService({
  requestsPerSecond: 2,    // Rate limit
  maxRetries: 5,           // Retry attempts
  retryDelayMs: 2000,      // Initial retry delay
  mockMode: false          // Use real fetching
});

// Fetch with options
const result = await customService.fetchOrdinance(url, {
  useCache: true,          // Use cached version if available (default)
  checkRobots: true        // Check robots.txt (default)
});

// Cache management
console.log(ordinanceService.getCacheStats());
ordinanceService.clearCache();
ordinanceService.pruneCache(); // Remove expired entries
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

### Phase 2: Regrid Integration (Completed)
- ✅ Researched Regrid API capabilities
- ✅ Implemented `api/RegridAPIClient.js`
- ✅ Implemented `services/RegridService.js`
- ✅ Integration tests with real Regrid API

### Phase 3: Ordinance Fetching & Caching (Completed)
- ✅ Implemented `services/OrdinanceService.js`:
  - `fetchOrdinance(url, options)` → { text, metadata }
  - Cache-first strategy using `utils/ordinanceCache.js`
  - Robots.txt checking and compliance
  - Rate limiting (1 req/sec default, configurable)
  - Custom User-Agent header
  - HTML → Markdown conversion using Turndown
  - Metadata extraction (title, last modified, description)
  - Error handling for 404, 403, timeout, etc.
  - Mock mode for testing
- ✅ Implemented retry logic with exponential backoff:
  - Configurable max retries (default: 3)
  - Exponential backoff (1s, 2s, 4s, 8s)
  - Only retries on transient errors (500s, timeouts)
- ✅ Implemented `utils/ordinanceCache.js`:
  - In-memory cache with TTL support (24hr default)
  - Cache statistics and pruning
  - Case-insensitive URL matching
- ✅ Integration tests covering all features

## Notes

- All measurements use imperial units (feet, square feet, acres)
- GeoJSON coordinates use [longitude, latitude] format
- Error handling includes retry logic for network failures
- Configuration validation prevents runtime errors
- Unit conversions for external integrations (e.g., Giraffe) handled outside module
