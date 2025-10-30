# Application Structure Visualization

## Component & Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         SetbacksApp.jsx                         │
│                     (Container/Orchestrator)                    │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ useZoningData│  │ useEnvelope  │  │ useValidation│        │
│  │              │  │              │  │              │        │
│  │ - parameters │  │ - selected   │  │ - results    │        │
│  │ - currentUnit│  │ - isLoading  │  │ - isValidating│       │
│  │ - custom     │  │ - save()     │  │ - validate() │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│         │                  │                  │                │
└─────────┼──────────────────┼──────────────────┼────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
  │ SetbackForm   │  │ (Envelope     │  │ValidationPanel│
  │               │  │  creation/    │  │               │
  │ - Input fields│  │  update)      │  │ - Breach msgs │
  │ - Unit toggle │  │               │  │ - Status      │
  │ - Generate btn│  │               │  │ - Compliance  │
  └───────────────┘  └───────────────┘  └───────────────┘
```

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                         │
│  (React Components - UI only, no business logic)                │
│                                                                  │
│  SetbacksApp  SetbackForm  ValidationPanel  ProjectBoundary     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       STATE MANAGEMENT                          │
│              (Custom Hooks - state + side effects)              │
│                                                                  │
│  useZoningData()    useEnvelope()    useValidation()            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BUSINESS LOGIC                            │
│           (Domain Services - pure business logic)               │
│                                                                  │
│  ZoningService    ValidationService    GiraffeAdapter           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         UTILITIES                               │
│               (Pure functions - no state, no I/O)               │
│                                                                  │
│  validators    measurementUtils    unitConversions              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL DEPENDENCIES                        │
│                 (SDKs, APIs, External Systems)                  │
│                                                                  │
│  Giraffe SDK    Zoning APIs (future)    Browser APIs            │
└─────────────────────────────────────────────────────────────────┘
```

## Validation Flow (Step 4)

```
┌───────────────┐
│ User selects  │
│   envelope    │
└───────┬───────┘
        │
        ▼
┌───────────────────────┐
│ useValidation detects │
│   selection change    │
└───────┬───────────────┘
        │
        ▼
┌──────────────────────────────┐
│ ValidationService.validate() │
└───────┬──────────────────────┘
        │
        ├─────────────────────┐
        │                     │
        ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│ GiraffeAdapter   │  │ Get zoning       │
│ .getAnalytics()  │  │ parameters       │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         ▼                     ▼
┌────────────────────┐  ┌──────────────┐
│ measurementUtils   │  │ Validation   │
│ .extract...()      │  │ thresholds   │
└────────┬───────────┘  └──────┬───────┘
         │                     │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ validators          │
         │ .validateDesign()   │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ ValidationPanel     │
         │ displays results    │
         │                     │
         │ ✓ Compliant (green) │
         │ ✗ Breach (red)      │
         └─────────────────────┘
```

## Module Dependencies

```
SetbacksApp
  ├── useZoningData
  │   └── ZoningService
  │       ├── zoningParameters (config)
  │       └── unitConversions (util)
  │
  ├── useEnvelope
  │   └── GiraffeAdapter
  │       ├── Giraffe SDK
  │       └── giraffeFlows (constants)
  │
  └── useValidation
      └── ValidationService
          ├── GiraffeAdapter
          │   └── Giraffe SDK
          ├── measurementUtils
          │   └── validationRules (constants)
          └── validators
              └── validationRules (constants)
```

## File Size Distribution

```
Domain Layer (Business Logic)
├── GiraffeAdapter.js       ~240 lines  ████████████████████
├── ZoningService.js        ~115 lines  ██████████
└── ValidationService.js    ~100 lines  ████████

Custom Hooks (State Management)
├── useZoningData.js        ~170 lines  ██████████████
├── useEnvelope.js          ~200 lines  ████████████████
└── useValidation.js        ~80 lines   ███████

Utilities (Pure Functions)
├── validators.js           ~180 lines  ███████████████
├── measurementUtils.js     ~65 lines   █████
└── unitConversions.js      ~125 lines  ██████████

Components (UI)
├── SetbacksApp.jsx         ~170 lines  ██████████████  (was 356!)
├── ValidationPanel.jsx     ~150 lines  ████████████
└── SetbackForm.jsx         ~380 lines  ████████████████████████████

Constants
├── validationRules.js      ~80 lines   ███████
└── giraffeFlows.js         ~50 lines   ████
```

## Data Flow for Common Operations

### 1. Change Unit System (Feet ↔ Meters)

```
User clicks unit toggle
  → UnitsToggle component
  → onUnitChange callback
  → useZoningData.changeUnit()
  → convertSetbacksUnits()
  → State updated
  → Form re-renders with converted values
```

### 2. Generate/Update Envelope

```
User clicks "Generate Envelope"
  → SetbackForm.onGenerate()
  → useZoningData.getParametersInMeters()
  → useEnvelope.saveEnvelope()
  → GiraffeAdapter.buildEnvelopeFeature()
  → GiraffeAdapter.createRawSection() or updateRawSection()
  → Giraffe SDK
  → Success/Error state updated
  → useValidation auto-triggers
```

### 3. Validate Design (Auto)

```
Envelope selected OR parameters change
  → useValidation detects change
  → ValidationService.validateEnvelope()
  → GiraffeAdapter.getAnalytics()
  → Extract measurements
  → validators.validateDesign()
  → Compare against thresholds
  → Return results
  → ValidationPanel updates
  → Red warnings if breaches detected
```

## Key Design Patterns Used

### 1. **Adapter Pattern**
- `GiraffeAdapter` wraps Giraffe SDK
- Isolates external dependency
- Easy to mock for testing

### 2. **Service Layer Pattern**
- Business logic in service classes
- Separated from UI and state
- Reusable across components

### 3. **Custom Hooks Pattern**
- Encapsulate state + effects
- Reusable state logic
- Clean component interfaces

### 4. **Pure Functions**
- Validators have no side effects
- Easy to test and reason about
- Predictable behavior

### 5. **Dependency Injection**
- Components receive hooks
- Services receive adapters
- Loosely coupled modules

## Benefits Summary

### Before Refactoring
```
┌────────────────────────────────────┐
│     SetbacksApp.jsx (356 lines)    │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Business Logic              │ │
│  │ State Management            │ │
│  │ UI Rendering                │ │
│  │ Giraffe SDK Calls           │ │
│  │ Validation Logic            │ │
│  │ Unit Conversions            │ │
│  │ Envelope Creation           │ │
│  └──────────────────────────────┘ │
│                                    │
│  ❌ Hard to test                   │
│  ❌ Hard to maintain               │
│  ❌ Tight coupling                 │
│  ❌ No separation of concerns      │
└────────────────────────────────────┘
```

### After Refactoring
```
┌────────────────────────────────────┐
│     SetbacksApp.jsx (169 lines)    │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ UI Orchestration ONLY       │ │
│  └──────────────────────────────┘ │
│           │                        │
│           ├─ useZoningData (state)│
│           ├─ useEnvelope (ops)    │
│           └─ useValidation (val)  │
│                                    │
│  ✅ Easy to test                   │
│  ✅ Easy to maintain               │
│  ✅ Loose coupling                 │
│  ✅ Clear separation of concerns   │
│  ✅ 52% smaller                    │
└────────────────────────────────────┘
```

## Testing Strategy Visualization

```
┌─────────────────────────────────────────────────┐
│                  UNIT TESTS                     │
│  (Fast, isolated, no external dependencies)    │
│                                                 │
│  validators.js       ████████████ 90% coverage │
│  measurementUtils.js ████████████ 90% coverage │
│  unitConversions.js  ████████████ 90% coverage │
│  ZoningService.js    ███████████  85% coverage │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│              INTEGRATION TESTS                  │
│     (Medium speed, tests interactions)          │
│                                                 │
│  useZoningData      ██████████   75% coverage  │
│  useEnvelope        ██████████   75% coverage  │
│  useValidation      ██████████   75% coverage  │
│  ValidationService  █████████    70% coverage  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│               COMPONENT TESTS                   │
│    (UI tests, user interactions)                │
│                                                 │
│  ValidationPanel    ████████     65% coverage  │
│  SetbackForm        ███████      60% coverage  │
│  SetbacksApp        ███████      60% coverage  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                  E2E TESTS                      │
│      (Slow, full workflow tests)                │
│                                                 │
│  Complete user flow ████         40% coverage  │
│  Edge cases        ███           30% coverage  │
└─────────────────────────────────────────────────┘
```
