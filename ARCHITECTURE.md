# Architecture Documentation

This document describes the professional architecture refactoring of the Setbacks App, following SOLID principles, KISS (Keep It Simple, Stupid), and YAGNI (You Aren't Gonna Need It).

## Overview

The application has been refactored from a monolithic component structure to a modular, maintainable architecture with clear separation of concerns.

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
   - API integration can be added without changing core logic

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
│   ├── ValidationPanel.jsx      # NEW: Displays validation results
│   ├── ProjectBoundaryStatus.jsx
│   └── UnitsToggle.jsx
│
├── domain/             # NEW: Business logic layer
│   ├── GiraffeAdapter.js        # Isolates Giraffe SDK interactions
│   ├── ZoningService.js         # Zoning parameter management
│   └── ValidationService.js     # Design validation orchestration
│
├── hooks/              # NEW: Custom React hooks
│   ├── useZoningData.js         # Zoning parameter state management
│   ├── useEnvelope.js           # Envelope operations
│   └── useValidation.js         # Validation state management
│
├── services/           # External service integrations
│   ├── envelopeService.js       # Legacy (can be deprecated)
│   └── api/                     # NEW: API integration layer
│       ├── APIClient.js         # Generic HTTP client
│       └── ZoningAPIService.js  # Zoning API integration (skeleton)
│
├── utils/              # Utility functions
│   ├── unitConversions.js
│   ├── validators.js            # NEW: Pure validation functions
│   ├── measurementUtils.js      # NEW: Giraffe analytics extraction
│   ├── envelopeFactory.js
│   └── cn.js
│
├── constants/          # NEW: Configuration and constants
│   ├── validationRules.js       # Validation thresholds and rules
│   └── giraffeFlows.js          # Giraffe SDK configuration
│
└── config/             # Application configuration
    └── zoningParameters.js
```

## Key Components

### Domain Layer

**Purpose**: Encapsulate all business logic, isolated from UI and external dependencies.

#### GiraffeAdapter
- Isolates ALL Giraffe SDK interactions
- Provides clean interface for Giraffe operations
- Builds and parses envelope features
- Location: `src/domain/GiraffeAdapter.js`

#### ZoningService
- Manages zoning parameter business logic
- Handles validation and unit conversions
- Provides defaults and configuration
- Location: `src/domain/ZoningService.js`

#### ValidationService
- Orchestrates design validation
- Coordinates between Giraffe analytics and validation rules
- Provides validation summaries and breach detection
- Location: `src/domain/ValidationService.js`

### Custom Hooks

**Purpose**: Manage state and side effects with clean, reusable interfaces.

#### useZoningData
- Manages all zoning parameter state
- Handles unit conversions
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

## Data Flow

### 1. Zoning Input Flow
```
User Input → useZoningData hook → ZoningService (validation) → State Update
```

### 2. Envelope Creation Flow
```
User clicks Generate
  → useEnvelope.saveEnvelope()
  → ZoningService.convertToMeters()
  → GiraffeAdapter.buildEnvelopeFeature()
  → GiraffeAdapter.createRawSection()
  → Giraffe SDK
```

### 3. Validation Flow (Step 4 - NEW)
```
Envelope selected
  → useValidation auto-triggers
  → ValidationService.validateEnvelope()
  → GiraffeAdapter.getAnalytics()
  → measurementUtils.extractDesignMeasurements()
  → validators.validateDesign()
  → ValidationPanel displays results
```

## Validation System (Step 4 Implementation)

The validation system implements **Step 4** from your requirements:

### Validation Types

1. **Height (Feet)**: Compares `max provided height (ft)` from Giraffe analytics to `MAX HEIGHT (ft)` parameter
2. **Height (Stories)**: Compares `max provided height (stories)` to `MAX HEIGHT (stories)` parameter
3. **FAR**: Compares `Provided FAR` to `MAX FAR` parameter
4. **Density**: Compares `Provided Density` to `MAX Density` parameter
5. **Setback Encroachment**: Handled within Giraffe (as specified)

### Breach Detection

- Breaches are displayed in **red** with clear warning messages
- Each validation shows:
  - Status (✓ compliant, ✗ breach, ? unknown)
  - Provided value vs. Maximum allowed value
  - Clear message indicating compliance or breach

### Auto-Validation

- Validation automatically triggers when:
  - An envelope is selected
  - Zoning parameters change
  - Design is modified in Giraffe

## API Integration (Future)

The architecture is ready for API integration:

### ZoningAPIService (Skeleton) - see regris API, as this is just placeholder

Location: `src/services/api/ZoningAPIService.js`

**Provides methods for:**
- `fetchByParcelId()` - Fetch zoning by parcel ID
- `fetchByAddress()` - Fetch zoning by address
- `fetchByCoordinates()` - Fetch zoning by lat/lng

**Integration Guide:**
1. Update `ZONING_API_CONFIG` with real API endpoints
2. Add authentication to `APIClient`
3. Implement actual API calls
4. Update `mapAPIResponse()` to match API structure
5. Use in components:

```javascript
if (ZoningAPIService.isConfigured()) {
  const params = await ZoningAPIService.fetchByParcelId(parcelId, jurisdiction);
  zoningData.updateParameters(params);
}
```

## Testing Strategy

### Unit Tests (Recommended)

1. **Pure Functions** (validators.js)
   - Test all validation functions with various inputs
   - Test edge cases and tolerances

2. **Services** (ZoningService, ValidationService)
   - Test business logic
   - Mock Giraffe adapter

3. **Utilities** (measurementUtils, unitConversions)
   - Test conversions and extractions

### Integration Tests

1. **Hooks** (useZoningData, useEnvelope, useValidation)
   - Test state management
   - Test side effects

2. **Components** (ValidationPanel, SetbackForm)
   - Test rendering with various states
   - Test user interactions

## Migration Notes

### Backward Compatibility

- Original `SetbacksApp.jsx` backed up to `SetbacksApp.backup.jsx`
- All existing functionality preserved
- New validation features added without breaking changes

### What Changed

1. **SetbacksApp.jsx**: Refactored from 356 lines to 169 lines (52% reduction)
   - Removed all business logic
   - Delegated to custom hooks
   - Now only orchestrates between hooks and components

2. **New Files Created**: 13 new files for modular architecture

3. **No Breaking Changes**: All existing features work exactly as before

## Benefits of This Architecture

### Maintainability
- Clear separation of concerns
- Easy to locate and fix bugs
- Each file has a single, clear purpose

### Testability
- Pure functions are easily unit tested
- Business logic isolated from UI
- Services can be mocked

### Extensibility
- Add new validations by adding to `validators.js`
- Add new parameters through `zoningParameters.js`
- Add API integration without touching core logic

### Readability
- Component is 52% smaller
- Business logic clearly separated
- Self-documenting with JSDoc comments

### Reusability
- Hooks can be used in other components
- Services can be used outside React
- Utilities are framework-agnostic

## Future Enhancements

1. **API Integration**: Connect to real zoning APIs
2. **Caching**: Add caching layer for API responses
3. **Advanced Validations**: Add more complex validation rules
4. **Export/Import**: Export envelope configurations
5. **History**: Undo/redo for parameter changes
6. **Presets**: Save and load parameter presets

## Performance Considerations

- Auto-validation debounced to prevent excessive API calls
- Memo hooks used for expensive computations
- Validation only triggers when necessary
- Giraffe SDK calls minimized through adapter pattern

## Conclusion

This architecture transformation follows industry best practices and provides a solid foundation for future development. The code is now:

- ✅ Modular and maintainable
- ✅ Following SOLID principles
- ✅ Ready for API integration
- ✅ Fully functional with validation (Step 4 complete)
- ✅ Professionally structured
- ✅ Easy to extend and test
