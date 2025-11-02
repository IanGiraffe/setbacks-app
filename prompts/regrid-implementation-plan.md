# Regrid Zoning Intelligence Module Plan

## Goal
- Deliver a standalone service that turns project boundary geometry into parcel zoning intelligence by: (1) querying Regrid for `zoning_type` and `zoning_code_link`, (2) retrieving the referenced ordinance content, and (3) using Claude Messages API with structured prompts to populate a standardized dimensional regulations template consumable across apps.

## Current Status
- Still in planning. No parcel lookup or LLM orchestration exists. `ZoningAPIService` is a stub, and `envelopeFactory.js` confirms boundary geometry is already available for reuse.

## Inputs
- Boundary geometry (GeoJSON) from the project or envelope flows.
- Regrid access token and tile/parcel API endpoints.
- Claude API credentials (Messages API).
- Optional context: jurisdiction hints, cached parcel IDs, prior ordinance fetches.

## Outputs
- `ZoningRegulationsResult` schema capturing:
  - `source`: dataset identifiers, retrieval timestamps, API versions (Regrid, Claude model).
  - `parcel`: IDs, centroid, jurisdiction, geometry hashes, confidence score (0-1).
  - `zoning`: district name/code, ordinance URL, supporting metadata, effective dates.
  - `standards`: normalized dimensional fields (setbacks, height, FAR, density, building/impervious cover, lot size, frontage, buffers, use compatibility) with:
    - Values with proper units (enums: FEET | METERS)
    - Field-level confidence flags (0-1)
    - Conditional notes/exceptions
  - `usePermissions`: allowed/conditional/prohibited use groupings when derivable.
  - `validation`: { isValid: boolean, errors: string[] }
  - `missingFields`: array of fields not found in ordinance
  - `ambiguities`: array of regulations requiring manual review
  - `notes`: caveats, manual follow-up items, missing data markers.
  - `raw`: optional ordinance excerpts and Claude reasoning for traceability.

## Key Considerations
- **Geometry-to-parcel resolution**: ✅ **RESOLVED** - Use Regrid REST API `/parcels/area` endpoint. Pass user's drawn polygon directly (no centroid calculation or MVT tiles needed). Returns all parcels intersecting the boundary.
- **Ordinance fetching**:
  - Implement caching layer (IndexedDB or Map) to avoid redundant fetches
  - Check robots.txt before scraping
  - Rate limiting (max 1 req/sec recommended)
  - Proper User-Agent identification
  - Retry logic with exponential backoff
  - Convert HTML → Markdown for better Claude parsing
- **Claude API Integration**:
  - Use Messages API (NOT Agent Skills - those are containerized code execution environments without network access)
  - Use prompt caching (cache ordinance text, vary queries) to reduce costs
  - Define structured output schema in system prompt with few-shot examples
  - Handle token limits (ordinances can be 10k+ tokens; may need chunking)
  - Use Claude 3.5 Sonnet for balance; extended thinking for complex ordinances
  - Validate Claude responses against schema
- **Modular Architecture**:
  - Module is **self-contained** in `src/modules/zoning-intelligence/`
  - All dependencies internal to module folder for **portability**
  - Public API exposed via single `index.js` export
  - Can be copied to other projects with minimal configuration
- **Module Independence**:
  - No dependencies on app-specific code (domain services, etc.)
  - Self-contained API clients, utilities, and schemas
  - Configuration via `config/moduleConfig.js`
  - All tests contained within `__tests__/` folder
- Keep module UI-agnostic with clear async APIs (e.g., `ZoningIntelligence.fetchZoningRegulationsForBoundary(boundaryGeoJson)`).
- Provide configuration to toggle live Claude/Regrid calls vs. mocked responses for development/testing.

## Architecture Overview

**Modular, Portable Design**: The module is structured to be **self-contained and reusable** across multiple projects. Simply copy the `zoning-intelligence/` folder to another project, configure API keys, and use.

```
src/
├── modules/
│   └── zoning-intelligence/          # STANDALONE MODULE (portable across projects)
│       ├── index.js                  # Public API - only export point
│       ├── services/
│       │   ├── RegridService.js
│       │   ├── OrdinanceService.js
│       │   ├── ClaudeParserService.js
│       │   └── ZoningIntelligenceService.js
│       ├── api/
│       │   ├── RegridAPIClient.js
│       │   └── ClaudeAPIClient.js
│       ├── utils/
│       │   ├── geometryUtils.js
│       │   └── ordinanceCache.js
│       ├── schemas/
│       │   ├── zoningSchema.js
│       │   └── claudePrompts.js
│       ├── config/
│       │   └── moduleConfig.js       # Module-specific configuration
│       ├── __tests__/                # All tests contained in module
│       │   ├── unit/
│       │   ├── integration/
│       │   └── fixtures/             # Mock data
│       ├── README.md                 # Module documentation
│       └── package.json              # Optional: list dependencies
│
├── domain/                            # App-specific domain services
│   ├── ZoningService.js
│   └── ValidationService.js
│
└── services/api/                      # App's other API clients
    └── APIClient.js
```

### Module Public API (`index.js`)

```javascript
// src/modules/zoning-intelligence/index.js
import { ZoningIntelligenceService } from './services/ZoningIntelligenceService.js';

export const ZoningIntelligence = {
  // Main method
  fetchZoningRegulationsForBoundary: (geometry, options) =>
    ZoningIntelligenceService.fetchZoningRegulationsForBoundary(geometry, options),

  // Configuration
  configure: (config) => { /* Set API keys, cache settings, etc. */ },

  // Utilities
  clearCache: () => { /* Clear ordinance cache */ }
};

// Export schemas for TypeScript/JSDoc users
export * from './schemas/zoningSchema.js';
```

### Usage in This App

```javascript
// src/components/ZoningForm.jsx
import { ZoningIntelligence } from '../modules/zoning-intelligence';

const handleFetchZoning = async (boundaryGeometry) => {
  const result = await ZoningIntelligence.fetchZoningRegulationsForBoundary(
    boundaryGeometry,
    { useMocks: false, cacheEnabled: true }
  );

  if (result.validation.isValid) {
    setZoningData(result.standards);
  }
};
```

### Reusing in Other Projects

1. **Copy module**: `cp -r src/modules/zoning-intelligence /path/to/other-project/src/modules/`
2. **Configure**: Update API keys in `moduleConfig.js`
3. **Install deps**: Add any required packages (turndown, etc.)
4. **Import & use**: Same import pattern works across projects

## Implementation Checklist

### Phase 1: Module Foundation & Schema Definition
- [ ] Create module directory structure:
  - Create `src/modules/zoning-intelligence/` folder
  - Add subdirectories: `services/`, `api/`, `utils/`, `schemas/`, `config/`, `__tests__/`
- [ ] Define `ZoningRegulationsResult` TypeScript/JSDoc schema in `schemas/zoningSchema.js`
  - Include all field types, confidence scoring structure
  - Define validation schema for Claude responses
- [ ] Create `utils/geometryUtils.js` with:
  - `validateGeoJSON(geometry)` → boolean
  - `getCentroid(boundaryGeoJSON)` → { lat, lng } (fallback only, not primary method)
  - Utilities for geometry hashing/comparison
- [ ] Create `utils/ordinanceCache.js`:
  - Cache interface: `get(url)`, `set(url, content)`, `has(url)`, `clear()`
  - Use Map for simple in-memory cache (upgrade to IndexedDB if needed)
  - Add TTL (time-to-live) for cache entries
  - Add cache size limits
- [ ] Create `config/moduleConfig.js`:
  - Configuration object for API keys (Regrid, Claude)
  - Cache settings (TTL, size limits)
  - Rate limiting settings
  - Mock mode toggles
  - Export `configure()` method for runtime configuration
- [ ] Document boundary geometry flow:
  - Trace how geometry is stored/retrieved in current app
  - Define input contract: what GeoJSON format to expect
  - Confirm `envelopeFactory.js` is the correct source
- [ ] Create mock data fixtures in `__tests__/fixtures/`:
  - Sample Regrid API responses (with `zoning_type`, `zoning_code_link`)
  - Sample ordinance HTML/text
  - Sample Claude structured responses
- [ ] Create module `README.md`:
  - Module purpose and features
  - Installation/setup instructions
  - API documentation
  - Usage examples
  - Configuration guide

### Phase 2: Regrid Integration
- [x] Research Regrid API capabilities:
  - ✅ REST endpoint `/parcels/area` exists for polygon-based parcel lookup (PRIMARY METHOD)
  - ✅ Alternative `/parcels/point` endpoint for coordinate-based lookup (FALLBACK)
  - ✅ Token authentication via query parameter `?token=<token>`
  - ✅ No time-based rate limits found; trial token has 2000 parcel limit
  - ✅ Successfully tested with Austin, TX parcels
  - ✅ Premium zoning fields confirmed available: `zoning_type`, `zoning_subtype`, `zoning_code_link`, `zoning_id`
  - ✅ **Key Finding**: Use `/parcels/area` with user's drawn polygon - NO centroid calculation needed!
  - 📄 See: `src/modules/zoningIntelligence/__tests__/REGRID_API_FINDINGS.md`
- [ ] Implement `api/RegridAPIClient.js`:
  - HTTP client for Regrid API v2
  - Add Regrid token authentication (query parameter)
  - **PRIMARY**: `getParcelsByPolygon(geojson, options)` → array of parcels
  - **FALLBACK**: `getParcelsByPoint(lat, lon, radius, options)` → array of parcels
  - Implement retry logic with exponential backoff
  - Add request logging for debugging
  - Handle response structure: `data.parcels.features` (not `data.features`)
- [ ] Implement `services/RegridService.js`:
  - **PRIMARY**: `getParcelsByBoundary(boundaryGeoJSON, options)` → parcel data array
    - Pass polygon directly to `/parcels/area` (no transformation)
    - Returns ALL parcels intersecting the boundary
  - **FALLBACK**: `getParcelByPoint(lat, lng, radius, options)` → parcel data
    - Use if polygon method fails
  - Handle multiple parcels scenario (return array with all parcels)
  - Error handling for no parcel found, API failure, coverage issues
  - Mock mode toggle for testing
  - Validate and normalize Regrid responses
  - Extract zoning data from `properties.fields` path
- [ ] Unit tests in `__tests__/unit/`:
  - Test polygon passthrough (no transformation)
  - Test Regrid response parsing (mock responses)
  - Test error scenarios (no parcel, API failure, invalid token, outside coverage)
  - Test multiple parcel handling
- [ ] Integration test with real Regrid API in `__tests__/integration/`:
  - Use Austin, TX test coordinates (known working area)
  - Verify polygon search returns multiple parcels
  - Verify all premium zoning fields present

### Phase 3: Ordinance Fetching & Caching
- [ ] Implement `services/OrdinanceService.js`:
  - `fetchOrdinance(url, options)` → { text, metadata }
  - Check cache first before fetching (uses `utils/ordinanceCache.js`)
  - Fetch robots.txt and respect crawl rules
  - Rate limiting implementation (1 req/sec default)
  - Custom User-Agent header
  - Convert HTML → Markdown (use library like `turndown`)
  - Extract metadata (title, last modified, etc.)
  - Error handling for 404, 403, timeout, etc.
  - Mock mode for testing
- [ ] Add retry logic with exponential backoff:
  - Configurable max retries in service
  - Backoff strategy (e.g., 1s, 2s, 4s, 8s)
  - Only retry on transient errors (500s, timeouts)
- [ ] Unit tests in `__tests__/unit/`:
  - Test cache hit/miss scenarios
  - Test rate limiting (verify delays between requests)
  - Test HTML → Markdown conversion
  - Test error handling
- [ ] Integration test with real ordinance URLs in `__tests__/integration/` (optional/manual)

### Phase 4: Claude Integration
- [ ] Define prompt templates in `schemas/claudePrompts.js`:
  - System prompt with:
    - Output JSON schema definition
    - Instructions for extraction
    - Rules for handling missing/ambiguous data
    - Examples of successful parses (2-3 few-shot examples)
  - User prompt template:
    - Insert ordinance content
    - Specify zoning district
    - Request specific fields
- [ ] Implement `api/ClaudeAPIClient.js`:
  - Authenticate with Claude API key
  - `sendMessage(systemPrompt, userPrompt, options)` → response
  - Support for prompt caching (cache ordinance, vary queries)
  - Token counting/estimation
  - Model selection (default to Claude 3.5 Sonnet)
  - Extended thinking support for complex ordinances
  - Error handling for API failures, rate limits
- [ ] Implement `services/ClaudeParserService.js`:
  - `parseOrdinance(ordinanceText, zoningDistrict, options)` → ZoningRegulationsResult
  - Build system and user prompts from templates
  - Call Claude API
  - Parse JSON response from Claude
  - Validate response against `zoningSchema`
  - Calculate confidence scores
  - Identify missing fields and ambiguities
  - Mock mode for testing (return fixture data)
  - Handle parsing failures gracefully
- [ ] Schema validation:
  - Validate Claude response matches `ZoningRegulationsResult`
  - Log validation errors
  - Return partial results if some fields valid
- [ ] Unit tests in `__tests__/unit/`:
  - Test prompt generation with various inputs
  - Test JSON response parsing (mock Claude responses)
  - Test schema validation (valid and invalid responses)
  - Test error handling (malformed JSON, missing required fields)
  - Test confidence scoring logic
- [ ] Integration test with real Claude API in `__tests__/integration/` (mark as expensive/optional)

### Phase 5: Orchestration & Public API
- [ ] Implement `services/ZoningIntelligenceService.js`:
  - `fetchZoningRegulationsForBoundary(boundaryGeoJSON, options)` → ZoningRegulationsResult
  - Orchestration flow:
    1. Validate geometry (GeometryUtils)
    2. Fetch parcel data from Regrid using polygon (RegridService) - returns array of parcels
    3. Handle multiple parcels (process first, or all, based on options)
    4. Fetch ordinance content (OrdinanceService)
    5. Parse with Claude (ClaudeParserService)
    6. Aggregate metadata and return complete result
  - Error handling at each stage:
    - Geometry invalid → return error
    - No parcel found → return error with details
    - Ordinance fetch failed → retry or return error
    - Claude parse failed → return partial/error
  - Options parameter:
    - `useMocks`: boolean (default false)
    - `cacheEnabled`: boolean (default true)
    - `forceRefresh`: boolean (ignore cache)
  - Logging throughout pipeline for debugging
- [ ] Create module `index.js` (public API):
  - Export `ZoningIntelligence` object with:
    - `fetchZoningRegulationsForBoundary()` method
    - `configure()` method for API keys and settings
    - `clearCache()` utility method
  - Export schemas and types for external use
  - Document all public methods with JSDoc
- [ ] Integration tests in `__tests__/integration/`:
  - Test full pipeline with mocked services
  - Test error propagation (what happens when each stage fails?)
  - Test cache behavior (verify ordinances are cached)
  - Test with various boundary geometries
- [ ] E2E test with real APIs and known good parcel (optional/manual)

### Phase 6: Validation & Documentation
- [ ] End-to-end validation:
  - Run full pipeline with known good test parcel
  - Verify output matches expected schema
  - Check confidence scores are reasonable
  - Verify missing fields and ambiguities are flagged
- [ ] Error scenario testing:
  - No parcel found for geometry
  - Missing `zoning_code_link` in Regrid response
  - Ordinance URL returns 404
  - Claude returns malformed JSON
  - Claude returns valid JSON but violates schema
  - Network timeouts at each stage
- [ ] Performance profiling:
  - Measure latency at each stage
  - Identify bottlenecks
  - Verify caching reduces latency
  - Estimate costs (Claude API tokens per ordinance)
- [ ] Update module `README.md`:
  - Complete API documentation with examples
  - Configuration guide (API keys, cache settings)
  - Installation instructions for new projects
  - Troubleshooting section
  - Known limitations
- [ ] Update project `ARCHITECTURE.md`:
  - Add section for Zoning Intelligence Module
  - Explain modular structure and portability
  - Document how to integrate module in this app
  - Explain data flow
  - Include usage examples
- [ ] Create usage examples in module:
  - Basic usage in React component
  - Error handling patterns
  - Mock mode for development
  - Cache management
  - Configuration examples
- [ ] Code documentation:
  - Ensure all functions have JSDoc comments
  - Document schemas with examples
  - Add inline comments for complex logic
  - Add `package.json` with dependencies list (optional)

## Validation Checklist
- [ ] Run end-to-end test with mocked Regrid/Claude demonstrating populated dimensional template
- [ ] Run end-to-end test with real APIs and known good parcel (optional)
- [ ] Exercise error paths:
  - Missing zoning metadata → graceful error message
  - Ordinance fetch failures → retry then fail with details
  - Claude schema violations → log and return partial results
- [ ] Verify output schema with stakeholders before full implementation
- [ ] Performance test: measure end-to-end latency (target: <10s)
- [ ] Cost analysis: estimate Claude API costs per parcel lookup
- [ ] Security review:
  - API keys properly secured (not committed to repo)
  - No sensitive data logged
  - Ordinance scraping respects robots.txt
- [ ] Code review: ensure follows existing architecture patterns

## Migration from Original Plan

### Key Changes
1. **Modular Structure**: All code self-contained in `src/modules/zoning-intelligence/` for portability
2. **Public API**: Single entry point via `index.js` instead of scattered exports
3. **Independent Tests**: All tests in module's `__tests__/` folder
4. **Module Configuration**: Config isolated in `config/moduleConfig.js`
5. **No External Dependencies**: Module doesn't depend on app-specific code

### Architecture Alignment
- **Module-first design**: Self-contained, portable module structure
- Services handle business logic (RegridService, OrdinanceService, ClaudeParserService)
- API clients handle external integrations (RegridAPIClient, ClaudeAPIClient)
- Utilities are pure functions (geometryUtils, ordinanceCache)
- Schemas define data contracts (zoningSchema, claudePrompts)
- Configuration centralized in module config

### Testing Strategy
- Unit tests for each service independently
- Integration tests for service combinations
- E2E tests (optional) for full pipeline
- Mock mode eliminates external API dependencies for development
- All tests self-contained in module's `__tests__/` folder

## Module Portability Benefits

### For This Project
✅ Clean separation of concerns
✅ Easy to test in isolation
✅ Clear API boundaries
✅ Can toggle mock mode during development

### For Other Projects
✅ Copy entire folder to new project
✅ No refactoring needed - just configuration
✅ Consistent API across all projects
✅ Shared bug fixes and improvements
✅ Can version module independently

### Future Enhancements
- Consider publishing as npm package
- Add TypeScript definitions for better DX
- Create CLI tool for testing module standalone
- Add telemetry/analytics hook points
