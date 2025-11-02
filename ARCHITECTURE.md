# Architecture Documentation

This document describes the architecture of the Setbacks App, following SOLID principles, KISS (Keep It Simple, Stupid), and YAGNI (You Aren't Gonna Need It).

## Overview

The application follows a modular, maintainable architecture with clear separation of concerns. It consists of a main application layer for setback envelope generation and validation, plus a standalone zoning intelligence module for automated zoning regulation extraction.

## Architecture Principles Applied

### SOLID Principles

1. **Single Responsibility Principle (SRP)**
   - Each module has one clear purpose
   - Domain services handle business logic
   - Components handle only UI rendering
   - Hooks manage state and side effects

2. **Open/Closed Principle (OCP)**
   - Easy to extend with new validation rules without modifying existing code
   - New parameter types can be added through configuration
   - Modules can be integrated without changing core logic

3. **Liskov Substitution Principle (LSP)**
   - Services implement consistent interfaces
   - API adapters can be swapped without breaking functionality

4. **Interface Segregation Principle (ISP)**
   - Hooks expose only necessary methods
   - Services provide focused, task-specific interfaces

5. **Dependency Inversion Principle (DIP)**
   - Components depend on abstractions (hooks) not concrete implementations
   - Business logic is isolated from external dependencies (Giraffe SDK)

## Directory Structure

```
src/
├── components/          # React UI components
│   ├── SetbacksApp.jsx          # Main container (orchestration only)
│   ├── SetbackForm.jsx          # Form for zoning parameters
│   ├── ValidationPanel.jsx      # Displays validation results
│   ├── ProjectBoundaryStatus.jsx
│   └── UnitsToggle.jsx
│
├── domain/              # Business logic layer
│   ├── GiraffeAdapter.js        # Isolates Giraffe SDK interactions
│   ├── ZoningService.js         # Zoning parameter management
│   ├── ValidationService.js     # Design validation orchestration
│   └── ProfileService.js        # Profile management
│
├── hooks/               # Custom React hooks
│   ├── useZoningData.js         # Zoning parameter state management
│   ├── useEnvelope.js           # Envelope operations
│   └── useValidation.js         # Validation state management
│
├── services/            # External service integrations
│   ├── envelopeService.js
│   └── api/                     # API integration layer
│       ├── APIClient.js         # Generic HTTP client
│       └── ZoningAPIService.js  # Zoning API integration (skeleton)
│
├── modules/             # Standalone, reusable modules
│   └── zoning-intelligence/     # Zoning regulation extraction module
│       ├── index.js             # Public API
│       ├── services/            # Business logic
│       ├── api/                 # External API clients
│       ├── utils/               # Utilities
│       ├── schemas/             # Data schemas and prompts
│       ├── config/              # Module configuration
│       └── __tests__/           # Module tests
│
├── utils/               # Utility functions
│   ├── unitConversions.js
│   ├── validators.js            # Pure validation functions
│   ├── measurementUtils.js      # Giraffe analytics extraction
│   ├── envelopeFactory.js
│   └── cn.js
│
├── constants/           # Configuration and constants
│   ├── validationRules.js       # Validation thresholds and rules
│   └── giraffeFlows.js          # Giraffe SDK configuration
│
└── config/              # Application configuration
    └── zoningParameters.js
```

## Core Application Architecture

### Domain Layer

**Purpose**: Encapsulate all business logic, isolated from UI and external dependencies.

#### GiraffeAdapter
- Isolates ALL Giraffe SDK interactions
- Provides clean interface for Giraffe operations
- Builds and parses envelope features
- Handles unit conversions between imperial (feet) and metric (meters) for Giraffe SDK
- Location: `src/domain/GiraffeAdapter.js`

#### ZoningService
- Manages zoning parameter business logic
- Handles validation and unit conversions
- Provides defaults and configuration
- Converts parameters to meters for Giraffe SDK (which requires metric)
- Location: `src/domain/ZoningService.js`

**Note on Units**: US zoning ordinances are always in imperial units (feet, acres). The Giraffe SDK requires metric units (meters). Unit conversion happens at the boundary between the application and Giraffe SDK via `ZoningService.convertToMeters()` and `ZoningService.convertFromMeters()`.

#### ValidationService
- Orchestrates design validation
- Coordinates between Giraffe analytics and validation rules
- Provides validation summaries and breach detection
- Location: `src/domain/ValidationService.js`

### Custom Hooks

**Purpose**: Manage state and side effects with clean, reusable interfaces.

#### useZoningData
- Manages all zoning parameter state
- Handles unit conversions for display
- Manages custom setback types
- Location: `src/hooks/useZoningData.js`

**Example Usage:**
```javascript
const zoningData = useZoningData(UNITS.FEET);
zoningData.updateParameter('maxHeight', 50);
zoningData.changeUnit(UNITS.METERS);
```

#### useEnvelope
- Manages envelope creation/update operations
- Tracks selected envelope
- Handles loading states and errors
- Location: `src/hooks/useEnvelope.js`

**Example Usage:**
```javascript
const envelope = useEnvelope();
await envelope.saveEnvelope(paramsInMeters, customSetbacks);
```

#### useValidation
- Manages validation state
- Auto-validates on envelope/parameter changes
- Provides breach detection
- Location: `src/hooks/useValidation.js`

**Example Usage:**
```javascript
const validation = useValidation(envelope.selectedEnvelope, zoningParams);
const breaches = validation.getBreaches();
```

### Utilities

#### validators.js
- Pure validation functions (easily testable)
- Height, FAR, density validation
- No side effects, no external dependencies
- Location: `src/utils/validators.js`

**Example:**
```javascript
import { validateHeightFeet } from '../utils/validators';
const result = validateHeightFeet(45, 40);
// { status: 'breach', message: '...', isCompliant: false }
```

#### measurementUtils.js
- Extract measurements from Giraffe analytics
- Format measurements for display
- Location: `src/utils/measurementUtils.js`

### Constants

#### validationRules.js
- Validation status constants
- Giraffe measure keys
- Validation message templates
- Tolerance thresholds
- Location: `src/constants/validationRules.js`

#### giraffeFlows.js
- Giraffe flow IDs and configuration
- Removes magic strings from code
- Centralized Giraffe SDK constants
- Location: `src/constants/giraffeFlows.js`

## Zoning Intelligence Module

### Overview

A **self-contained, portable module** for automated zoning regulation extraction. The module integrates Regrid parcel API data with Claude AI to parse zoning ordinances and return structured dimensional regulations.

**Location**: `src/modules/zoning-intelligence/`

### Module Architecture

The module is designed to be **completely independent** and **reusable across projects**. It can be copied to any project with minimal configuration changes.

```
zoning-intelligence/
├── index.js                          # Public API (only export point)
├── services/
│   ├── RegridService.js              # Regrid API interactions
│   ├── OrdinanceService.js           # Ordinance fetching with caching
│   ├── ClaudeParserService.js        # Claude API for parsing ordinances
│   └── ZoningIntelligenceService.js  # Main orchestrator
├── api/
│   ├── RegridAPIClient.js            # Regrid-specific API client
│   └── ClaudeAPIClient.js            # Claude Messages API client
├── utils/
│   ├── geometryUtils.js              # Geometry operations (centroid extraction)
│   └── ordinanceCache.js             # Cache management for ordinances
├── schemas/
│   ├── zoningSchema.js               # ZoningRegulationsResult typedef
│   └── claudePrompts.js              # Prompt templates for Claude
├── config/
│   └── moduleConfig.js               # Module-specific configuration
├── __tests__/                        # All module tests
│   ├── unit/
│   ├── integration/
│   └── fixtures/                     # Mock data
└── README.md                         # Module documentation
```

### Module Public API

The module exposes a single, clean interface via `index.js`:

```javascript
import { ZoningIntelligence } from '../modules/zoning-intelligence';

// Main method
const result = await ZoningIntelligence.fetchZoningRegulationsForBoundary(
  boundaryGeoJSON,
  { useMocks: false, cacheEnabled: true }
);

// Configuration
ZoningIntelligence.configure({
  regridApiKey: 'your-key',
  claudeApiKey: 'your-key'
});

// Utilities
ZoningIntelligence.clearCache();
```

### Module Data Flow

```
Boundary Geometry (GeoJSON)
  → GeometryUtils.getCentroid()
  → RegridService.getParcelByGeometry()
  → Regrid API (parcel data with zoning_type, zoning_code_link)
  → OrdinanceService.fetchOrdinance() [with caching]
  → HTML → Markdown conversion
  → ClaudeParserService.parseOrdinance()
  → Claude Messages API (structured output)
  → Schema validation
  → ZoningRegulationsResult
```

### Module Services

#### RegridService
- Fetches parcel data from Regrid API using geometry coordinates
- Handles coordinate-based parcel lookup
- Normalizes Regrid responses
- Provides mock mode for testing
- Location: `modules/zoning-intelligence/services/RegridService.js`

#### OrdinanceService
- Fetches zoning ordinance content from URLs (from Regrid `zoning_code_link`)
- Implements caching to reduce redundant fetches
- Respects robots.txt and implements rate limiting
- Converts HTML to Markdown for better Claude parsing
- Location: `modules/zoning-intelligence/services/OrdinanceService.js`

#### ClaudeParserService
- Uses Claude Messages API to parse ordinance text
- Applies structured prompts with few-shot examples
- Validates responses against schema
- Calculates confidence scores for extracted data
- Identifies missing fields and ambiguities
- Location: `modules/zoning-intelligence/services/ClaudeParserService.js`

#### ZoningIntelligenceService
- Main orchestrator that chains all services
- Manages error handling at each stage
- Aggregates metadata and returns complete result
- Location: `modules/zoning-intelligence/services/ZoningIntelligenceService.js`

### Output Schema

The module returns a `ZoningRegulationsResult` with the following structure:

```javascript
{
  source: {
    regridApiVersion: string,
    claudeModel: string,
    timestamp: string
  },
  parcel: {
    id: string,
    centroid: { lat, lng },
    jurisdiction: string,
    confidence: number  // 0-1
  },
  zoning: {
    district: string,
    ordinanceUrl: string,
    effectiveDate: string
  },
  standards: {
    setbacks: {
      frontSetback: number,      // always in feet
      sideSetback: number,
      rearSetback: number,
      notes: string
    },
    height: {
      maxFeet: number | null,
      maxStories: number | null,
      notes: string
    },
    far: { max: number | null, notes: string },
    density: { max: number | null, unit: string, notes: string },
    coverage: {
      building: { maxPercent: number | null },
      impervious: { maxPercent: number | null }
    },
    lot: {
      minSize: { value: number | null, unit: string },
      minFrontage: { value: number | null, unit: string }
    },
    fieldConfidence: { /* field: 0-1 score */ }
  },
  validation: {
    isValid: boolean,
    errors: string[]
  },
  missingFields: string[],
  ambiguities: string[],
  notes: string,
  raw: {
    ordinanceExcerpts: string,
    claudeReasoning: string
  }
}
```

**Note on Units**: All dimensional values from zoning ordinances are returned in **imperial units (feet, acres, square feet)** as that is the native format for US zoning codes. Applications can convert to metric as needed for integration with systems like Giraffe SDK.

### Module Portability

**Design Goals:**
- ✅ **Self-contained**: No dependencies on app-specific code
- ✅ **Configurable**: API keys and settings via module config
- ✅ **Testable**: All tests contained within module
- ✅ **Documented**: README travels with module
- ✅ **Reusable**: Copy folder to new project and configure

**To use in another project:**
1. Copy `src/modules/zoning-intelligence/` folder
2. Configure API keys in `config/moduleConfig.js`
3. Install dependencies (if using separate `package.json`)
4. Import and use: `import { ZoningIntelligence } from './modules/zoning-intelligence'`

## Data Flow

### 1. Zoning Input Flow
```
User Input → useZoningData hook → ZoningService (validation) → State Update
```

### 2. Envelope Creation Flow
```
User clicks Generate
  → useEnvelope.saveEnvelope()
  → ZoningService.convertToMeters()  // Giraffe requires metric
  → GiraffeAdapter.buildEnvelopeFeature()
  → GiraffeAdapter.createRawSection()
  → Giraffe SDK
```

### 3. Validation Flow
```
Envelope selected
  → useValidation auto-triggers
  → ValidationService.validateEnvelope()
  → GiraffeAdapter.getAnalytics()
  → measurementUtils.extractDesignMeasurements()
  → validators.validateDesign()
  → ValidationPanel displays results
```

### 4. Zoning Intelligence Flow (Module)
```
User provides boundary geometry
  → ZoningIntelligence.fetchZoningRegulationsForBoundary()
  → Module orchestration (Regrid → Ordinance → Claude → Validation)
  → ZoningRegulationsResult returned
  → Application updates zoning parameters
```

## Validation System

The validation system compares design metrics from Giraffe analytics against zoning parameters:

### Validation Types

1. **Height (Feet)**: Compares `max provided height (ft)` from Giraffe analytics to `MAX HEIGHT (ft)` parameter
2. **Height (Stories)**: Compares `max provided height (stories)` to `MAX HEIGHT (stories)` parameter
3. **FAR**: Compares `Provided FAR` to `MAX FAR` parameter
4. **Density**: Compares `Provided Density` to `MAX Density` parameter
5. **Setback Encroachment**: Handled within Giraffe

### Breach Detection

- Breaches are displayed in **red** with clear warning messages
- Each validation shows:
  - Status (✓ compliant, ✗ breach, ? unknown)
  - Provided value vs. Maximum allowed value
  - Clear message indicating compliance or breach

### Auto-Validation

Validation automatically triggers when:
- An envelope is selected
- Zoning parameters change
- Design is modified in Giraffe

## Integration Points

### Giraffe SDK Integration
- **Purpose**: 3D building envelope generation and analytics
- **Adapter**: `GiraffeAdapter.js` isolates all Giraffe SDK interactions
- **Unit Conversion**: Converts imperial (feet) to metric (meters) for Giraffe input
- **Analytics**: Extracts design measurements for validation

### Regrid API Integration (Module)
- **Purpose**: Parcel data and zoning ordinance URLs
- **Service**: `RegridService` handles API interactions
- **Data Used**: `zoning_type`, `zoning_code_link` fields
- **Caching**: Parcel lookups can be cached to reduce API calls

### Claude API Integration (Module)
- **Purpose**: Parse unstructured ordinance text into structured data
- **Service**: `ClaudeParserService` manages Claude Messages API
- **Approach**: Structured prompts with few-shot examples
- **Optimization**: Prompt caching reduces costs for repeated ordinance queries

## Testing Strategy

### Unit Tests

1. **Pure Functions** (validators.js)
   - Test all validation functions with various inputs
   - Test edge cases and tolerances

2. **Services** (ZoningService, ValidationService)
   - Test business logic
   - Mock Giraffe adapter

3. **Utilities** (measurementUtils, unitConversions)
   - Test conversions and extractions

4. **Module Services** (RegridService, ClaudeParserService, etc.)
   - Test with mock API responses
   - Test error handling
   - Location: `modules/zoning-intelligence/__tests__/unit/`

### Integration Tests

1. **Hooks** (useZoningData, useEnvelope, useValidation)
   - Test state management
   - Test side effects

2. **Components** (ValidationPanel, SetbackForm)
   - Test rendering with various states
   - Test user interactions

3. **Module Pipeline** (full orchestration)
   - Test with mocked external services
   - Test error propagation
   - Location: `modules/zoning-intelligence/__tests__/integration/`

### E2E Tests (Optional)
- Full pipeline with real APIs
- Expensive (Claude API costs)
- Useful for validation before deployment

## Benefits of This Architecture

### Maintainability
- Clear separation of concerns
- Easy to locate and fix bugs
- Each file has a single, clear purpose
- Modular design allows independent development

### Testability
- Pure functions are easily unit tested
- Business logic isolated from UI
- Services can be mocked
- Module has self-contained tests

### Extensibility
- Add new validations by extending validators
- Add new parameters through configuration
- Add modules without touching core logic
- Modules are portable across projects

### Readability
- Business logic clearly separated
- Self-documenting with JSDoc comments
- Clean API boundaries

### Reusability
- Hooks can be used in other components
- Services can be used outside React
- Utilities are framework-agnostic
- Modules are portable to other projects

### Portability (Modules)
- Self-contained module structure
- Copy-paste to new projects
- Minimal configuration needed
- Consistent API across projects

## Performance Considerations

- Auto-validation debounced to prevent excessive API calls
- Memo hooks used for expensive computations
- Validation only triggers when necessary
- Giraffe SDK calls minimized through adapter pattern
- Ordinance caching reduces redundant fetches
- Claude prompt caching reduces API costs
- Rate limiting respects external API quotas

## Security Considerations

- API keys stored in configuration, not hardcoded
- No sensitive data logged
- Ordinance scraping respects robots.txt and rate limits
- Module can run in mock mode for development (no external API calls)

## Conclusion

This architecture follows industry best practices and provides a solid foundation for development. The system features:

- ✅ Modular and maintainable structure
- ✅ SOLID principles throughout
- ✅ Clean separation between app and modules
- ✅ Portable, reusable modules
- ✅ Comprehensive validation system
- ✅ Ready for external API integrations
- ✅ Professionally structured
- ✅ Easy to extend and test
- ✅ Self-contained module for cross-project use
