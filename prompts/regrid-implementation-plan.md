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
- **Geometry-to-parcel resolution**: Research Regrid REST API first (preferred). Only use MVT tile decoding if REST doesn't support coordinate-based lookup. MVT requires `@mapbox/vector-tile`/`pbf` dependencies and Web Mercator tile math.
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
- **Architecture Alignment**: Follow existing SOLID patterns:
  - Domain services in `src/domain/`
  - API clients in `src/services/api/`
  - Utilities in `src/utils/`
  - Constants/schemas in `src/constants/`
- Keep module UI-agnostic with clear async APIs (e.g., `ZoningIntelligenceService.fetchZoningRegulationsForBoundary(boundaryGeoJson)`).
- Provide configuration to toggle live Claude/Regrid calls vs. mocked responses for development/testing.

## Architecture Overview

Following the existing clean architecture pattern:

```
src/
├── domain/
│   ├── RegridService.js              # NEW: Regrid API interactions
│   ├── OrdinanceService.js           # NEW: Ordinance fetching with caching
│   ├── ClaudeParserService.js        # NEW: Claude API for parsing ordinances
│   ├── ZoningIntelligenceService.js  # NEW: Main orchestrator
│   └── (existing: ZoningService.js, ValidationService.js, etc.)
│
├── services/api/
│   ├── RegridAPIClient.js            # NEW: Regrid-specific API client
│   ├── ClaudeAPIClient.js            # NEW: Claude Messages API client
│   └── (existing: APIClient.js, ZoningAPIService.js)
│
├── utils/
│   ├── geometryUtils.js              # NEW: Geometry operations (centroid extraction)
│   ├── ordinanceCache.js             # NEW: Cache management for ordinances
│   └── (existing: unitConversions.js, validators.js, etc.)
│
├── constants/
│   ├── zoningSchema.js               # NEW: ZoningRegulationsResult typedef
│   ├── claudePrompts.js              # NEW: Prompt templates
│   └── (existing: validationRules.js, giraffeFlows.js)
│
└── config/
    └── regridConfig.js               # NEW: Regrid API configuration
```

## Implementation Checklist

### Phase 1: Foundation & Schema Definition
- [ ] Define `ZoningRegulationsResult` TypeScript/JSDoc schema in `src/constants/zoningSchema.js`
  - Include all field types, enums for units (FEET | METERS), confidence scoring structure
  - Define validation schema for Claude responses
- [ ] Create `src/utils/geometryUtils.js` with:
  - `getCentroid(boundaryGeoJSON)` → { lat, lng }
  - `validateGeoJSON(geometry)` → boolean
  - Utilities for geometry hashing/comparison
- [ ] Document boundary geometry flow:
  - Trace how geometry is stored/retrieved in current app
  - Define input contract: what GeoJSON format to expect
  - Confirm `envelopeFactory.js` is the correct source
- [ ] Create mock data fixtures:
  - Sample Regrid API responses (with `zoning_type`, `zoning_code_link`)
  - Sample ordinance HTML/text
  - Sample Claude structured responses

### Phase 2: Regrid Integration
- [ ] Research Regrid API capabilities:
  - Check if REST endpoint exists for coordinate-based parcel lookup
  - Document API authentication requirements
  - Identify rate limits and quotas
  - Test API with sample coordinates
- [ ] Implement `src/services/api/RegridAPIClient.js`:
  - Extend `APIClient` base class
  - Add Regrid token authentication
  - Implement retry logic with exponential backoff
  - Add request logging for debugging
- [ ] Implement `src/domain/RegridService.js`:
  - `getParcelByCoordinates(lat, lng, options)` → parcel data
  - `getParcelByGeometry(boundaryGeoJSON, options)` → parcel data (uses centroid)
  - Handle multiple parcels scenario (return array or closest?)
  - Error handling for no parcel found
  - Mock mode toggle for testing
  - Validate and normalize Regrid responses
- [ ] Unit tests:
  - Test centroid extraction with various GeoJSON shapes
  - Test Regrid response parsing (mock responses)
  - Test error scenarios (no parcel, API failure, invalid token)
- [ ] Integration test with real Regrid API (mark as slow/optional in CI)

### Phase 3: Ordinance Fetching & Caching
- [ ] Implement `src/utils/ordinanceCache.js`:
  - Cache interface: `get(url)`, `set(url, content)`, `has(url)`, `clear()`
  - Use Map for simple in-memory cache (upgrade to IndexedDB if needed)
  - Add TTL (time-to-live) for cache entries
  - Add cache size limits
- [ ] Implement `src/domain/OrdinanceService.js`:
  - `fetchOrdinance(url, options)` → { text, metadata }
  - Check cache first before fetching
  - Fetch robots.txt and respect crawl rules
  - Rate limiting implementation (1 req/sec default)
  - Custom User-Agent header
  - Convert HTML → Markdown (use library like `turndown`)
  - Extract metadata (title, last modified, etc.)
  - Error handling for 404, 403, timeout, etc.
  - Mock mode for testing
- [ ] Add retry logic with exponential backoff to `APIClient`:
  - Configurable max retries
  - Backoff strategy (e.g., 1s, 2s, 4s, 8s)
  - Only retry on transient errors (500s, timeouts)
- [ ] Unit tests:
  - Test cache hit/miss scenarios
  - Test rate limiting (verify delays between requests)
  - Test HTML → Markdown conversion
  - Test error handling
- [ ] Integration test with real ordinance URLs (optional/manual)

### Phase 4: Claude Integration
- [ ] Define prompt templates in `src/constants/claudePrompts.js`:
  - System prompt with:
    - Output JSON schema definition
    - Instructions for extraction
    - Rules for handling missing/ambiguous data
    - Examples of successful parses (2-3 few-shot examples)
  - User prompt template:
    - Insert ordinance content
    - Specify zoning district
    - Request specific fields
- [ ] Implement `src/services/api/ClaudeAPIClient.js`:
  - Authenticate with Claude API key
  - `sendMessage(systemPrompt, userPrompt, options)` → response
  - Support for prompt caching (cache ordinance, vary queries)
  - Token counting/estimation
  - Model selection (default to Claude 3.5 Sonnet)
  - Extended thinking support for complex ordinances
  - Error handling for API failures, rate limits
- [ ] Implement `src/domain/ClaudeParserService.js`:
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
- [ ] Unit tests:
  - Test prompt generation with various inputs
  - Test JSON response parsing (mock Claude responses)
  - Test schema validation (valid and invalid responses)
  - Test error handling (malformed JSON, missing required fields)
  - Test confidence scoring logic
- [ ] Integration test with real Claude API (mark as expensive/optional)

### Phase 5: Orchestration
- [ ] Implement `src/domain/ZoningIntelligenceService.js`:
  - `fetchZoningRegulationsForBoundary(boundaryGeoJSON, options)` → ZoningRegulationsResult
  - Orchestration flow:
    1. Extract centroid from geometry (GeometryUtils)
    2. Fetch parcel data from Regrid (RegridService)
    3. Fetch ordinance content (OrdinanceService)
    4. Parse with Claude (ClaudeParserService)
    5. Aggregate metadata and return complete result
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
- [ ] Create `src/config/regridConfig.js`:
  - Regrid API token and base URL
  - Claude API key
  - Cache configuration (TTL, size limits)
  - Rate limit settings
  - Toggle for mock vs. live mode
- [ ] Integration tests:
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
- [ ] Update `ARCHITECTURE.md`:
  - Add section for Zoning Intelligence Module
  - Document service responsibilities
  - Explain data flow
  - Provide configuration guide
  - Include usage examples
- [ ] Create usage examples:
  - Basic usage in React component
  - Error handling patterns
  - Mock mode for development
  - Cache management
- [ ] Code documentation:
  - Ensure all functions have JSDoc comments
  - Document schemas with examples
  - Add inline comments for complex logic

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

### Architecture Alignment
- Follows existing SOLID principles
- Services in `domain/` handle business logic
- API clients in `services/api/` handle external integrations
- Utilities are pure functions in `utils/`
- Constants and schemas in `constants/`
- Configuration in `config/`

### Testing Strategy
- Unit tests for each service independently
- Integration tests for service combinations
- E2E tests (optional) for full pipeline
- Mock mode eliminates external API dependencies for development
