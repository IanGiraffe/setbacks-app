# Source Directory Structure

**Last Updated:** November 1, 2025

This document provides an overview of the `src/` directory structure for the Setbacks App, a React application for generating building envelope setbacks.

## 📁 Directory Overview

```
src/
├── components/          # React UI components
├── domain/             # Business logic and domain services
├── hooks/              # Custom React hooks
├── constants/          # Application constants and configurations
├── config/             # Parameter configuration
├── services/           # External API and data services
│   └── api/           # HTTP API clients
├── utils/              # Utility functions and helpers
├── assets/             # Static assets (images, icons)
├── main.jsx           # Application entry point
├── App.jsx            # Root application component
├── App.css            # Component-specific styles
└── index.css          # Global styles and Tailwind imports
```

## 📄 Root Files

### `main.jsx`
- **Purpose**: Application entry point and React DOM mounting
- **Responsibilities**: 
  - Renders the root App component
  - Sets up React StrictMode
  - Imports global styles

### `App.jsx`
- **Purpose**: Root application component wrapper
- **Responsibilities**:
  - Renders the main SetbacksApp component
  - Provides top-level application structure
  - Imports component-specific styles

### `index.css`
- **Purpose**: Global application styles and Tailwind CSS imports
- **Contains**:
  - Tailwind CSS directives (@tailwind base, components, utilities)
  - Global CSS reset and base styles
  - Root element styling for full-height layout

### `App.css`
- **Purpose**: Component-specific styles (legacy from React template)
- **Contains**:
  - Logo animations and hover effects
  - Card component styles
  - Media queries for reduced motion

## 📁 Domain Directory (`/domain/`)

Business logic and domain services following clean architecture principles:

### `GiraffeAdapter.js`
- **Purpose**: Isolates all Giraffe SDK interactions from the rest of the application
- **Responsibilities**:
  - Creates and updates raw sections (envelopes) in Giraffe
  - Manages selected features and envelope features
  - Builds envelope feature GeoJSON structure
  - Extracts envelope parameters from features
  - Retrieves analytics from Giraffe SDK via `getAnalytics()`
  - Provides `debugAnalytics()` method for troubleshooting analytics issues
- **Architecture**: Provides a clean interface for Giraffe operations following Dependency Inversion Principle
- **Debug Support**: Built-in debugging method to inspect analytics structure when measures return null

### `ProfileService.js`
- **Purpose**: Domain service for managing zoning parameter profiles
- **Responsibilities**:
  - Creates, updates, validates profiles
  - Compares and sorts profiles
  - Searches and filters profiles
  - Imports/exports profiles to JSON
  - Manages profile name uniqueness
- **Architecture**: Pure business logic, independent of storage mechanism

### `ValidationService.js`
- **Purpose**: Orchestrates design validation by coordinating analytics and rules
- **Responsibilities**:
  - Validates envelopes against zoning parameters
  - Extracts design measurements from Giraffe analytics
  - Provides validation summaries for UI display
  - Identifies breaches and compliance status
- **Architecture**: Encapsulates validation business logic

### `ZoningService.js`
- **Purpose**: Business logic for managing zoning parameters
- **Responsibilities**:
  - Provides default zoning parameters in specified units
  - Validates individual and all zoning parameters
  - Converts parameters between units (feet/meters)
  - Merges custom setbacks with standard parameters
  - Determines if parameters need unit conversion
- **Architecture**: Handles validation, defaults, and unit conversions

## 📁 Hooks Directory (`/hooks/`)

Custom React hooks for state management and operations:

### `useEnvelope.js`
- **Purpose**: Manages envelope operations (create, update, select)
- **State**: Tracks envelope generation, errors, selected envelope
- **Operations**: `createEnvelope()`, `updateEnvelope()`, `saveEnvelope()`
- **Integration**: Listens to Giraffe state for envelope selection changes

### `useProfiles.js`
- **Purpose**: Manages zoning parameter profiles
- **State**: Tracks profiles, loading status, errors
- **Operations**: `saveProfile()`, `updateProfile()`, `deleteProfile()`, `loadProfile()`, `compare()`, `search()`
- **Persistence**: Saves to Giraffe projectApp public storage

### `useValidation.js`
- **Purpose**: Manages design validation state
- **State**: Tracks validation results and validation status
- **Operations**: `validate()`, `clearValidation()`, `getValidationSummary()`, `getBreaches()`
- **Strategy**: Validates on-demand to avoid rate limiting

### `useZoningData.js`
- **Purpose**: Manages zoning parameter state with unit conversion
- **State**: Tracks parameters, current unit, custom setbacks
- **Operations**: `updateParameter()`, `changeUnit()`, `addCustomSetback()`, `removeCustomSetback()`, `validate()`, `resetToDefaults()`
- **Architecture**: Encapsulates all zoning data logic following Single Responsibility Principle

## 📁 Constants Directory (`/constants/`)

Application constants and configuration values:

### `giraffeFlows.js`
- **Purpose**: Centralized configuration for Giraffe SDK flow IDs and parameters
- **Exports**:
  - `GIRAFFE_FLOWS` - Flow and input IDs for envelope creation
  - `GIRAFFE_PROPERTIES` - Usage types, layer IDs, default styling
  - `DEFAULT_SIDE_INDICES` - Maps property edges to setback types
  - `createSetbackSteps()` - Helper function for setback step configuration
- **Benefits**: Isolates Giraffe-specific magic strings for easy updates

### `validationRules.js`
- **Purpose**: Defines validation thresholds, rules, and severity levels
- **Exports**:
  - `VALIDATION_STATUS` - Status constants (compliant, breach, warning, unknown)
  - `VALIDATION_TYPES` - Types of validations (height, FAR, density, etc.)
  - `GIRAFFE_MEASURES` - Measure keys for analytics extraction
  - `VALIDATION_MESSAGES` - Message templates for validation results
  - `VALIDATION_TOLERANCE` - Tolerance thresholds for floating-point precision

## 📁 Config Directory (`/config/`)

Application configuration and parameter definitions:

### `zoningParameters.js`
- **Purpose**: Centralized configuration for all zoning parameters
- **Architecture**: Modular design for easy API integration
- **Exports**:
  - `ZONING_PARAMETERS` - Non-spatial constraints (height, FAR, density)
  - `SETBACK_PARAMETERS` - Spatial constraints (front, side, rear setbacks)
  - `getDefaultParameters()` - Returns default values for all parameters
  - `requiresUnitConversion()` - Checks if parameter needs unit conversion
  - `getParameterConfig()` - Retrieves configuration for specific parameter
- **Future Integration**:
  - Structure designed to be easily replaced/augmented with API data
  - Example API integration patterns included in comments
  - Parameters can be fetched from external zoning APIs by jurisdiction

## 📁 Components Directory (`/components/`)

React UI components organized by functionality:

### `SetbacksApp.jsx`
- **Purpose**: Main application component and state management
- **Responsibilities**:
  - Manages setback form state and validation
  - Handles envelope generation workflow
  - Integrates with Giraffe SDK for GIS operations
  - Coordinates between child components
  - Loads default parameters from configuration
  - Supports dynamic parameter updates (ready for API integration)
- **Architecture**: Uses custom hooks for state management (useEnvelope, useZoningData, useValidation, useProfiles)

### `SetbackForm.jsx`
- **Purpose**: Form component for zoning parameter inputs
- **Responsibilities**:
  - Renders input fields for all zoning parameters (height, FAR, density)
  - Renders input fields for setback values (front, side, rear)
  - Supports custom setback types with inline editable labels
  - Handles form validation and user input
  - Supports unit conversion (feet/meters) for distance-based parameters
  - Dynamically generates form fields from parameter configuration

### `ProfileManager.jsx`
- **Purpose**: UI component for managing zoning parameter profiles
- **Responsibilities**:
  - Provides dropdown selector for saved profiles
  - Detects unsaved changes to current parameters
  - Allows saving/updating/deleting profiles
  - Compares multiple profiles with visual table display
  - Integrates with form for seamless profile management
- **Features**: Smart save functionality, comparison tool, inline editing

### `ValidationPanel.jsx`
- **Purpose**: Displays design validation results
- **Responsibilities**:
  - Shows compliance/breach status with color-coded UI
  - Lists all validation results with detailed messages
  - Displays analytics data for debugging
  - Provides action guidance for non-compliant designs
- **Integration**: Consumes validation results from useValidation hook

### `ProjectBoundaryStatus.jsx`
- **Purpose**: Displays project boundary validation status
- **Responsibilities**:
  - Shows whether project boundary is properly defined
  - Provides user feedback for boundary requirements
  - Displays validation messages and warnings

### `UnitsToggle.jsx`
- **Purpose**: Unit selection toggle component
- **Responsibilities**:
  - Allows switching between feet and meters
  - Provides visual feedback for current unit selection
  - Triggers unit conversion in parent components

### `AnalyticsDebugPanel.jsx`
- **Purpose**: Debugging component for analytics issues (temporary use)
- **Responsibilities**:
  - Displays analytics structure in UI panel
  - Lists all available measures with values
  - Provides quick debug buttons for console logging
  - Shows category/usage structure
- **Use Case**: Temporarily add to app when analytics measures return null
- **Usage**: Import and add `<AnalyticsDebugPanel />` to SetbacksApp, remove after debugging

## 📁 Services Directory (`/services/`)

External API and data service integrations:

### `envelopeService.js`
- **Purpose**: Handles envelope creation and management via Giraffe SDK
- **Responsibilities**:
  - Creates building envelope features in GIS system
  - Manages envelope selection and updates
  - Handles API communication with Giraffe platform
  - Provides error handling for envelope operations
- **Note**: This service is largely superseded by `GiraffeAdapter` in the domain layer

### 📁 API Subdirectory (`/services/api/`)

HTTP API clients for external services:

#### `APIClient.js`
- **Purpose**: Generic HTTP client for making REST API requests
- **Methods**: `get()`, `post()`, `put()`, `delete()`
- **Features**:
  - Configurable base URL and default headers
  - Automatic JSON parsing
  - Error handling and logging
- **Usage**: Base class for all HTTP API integrations

#### `ZoningAPIService.js`
- **Purpose**: Service for fetching zoning data from external APIs
- **Status**: Skeleton implementation ready for integration
- **Methods**:
  - `fetchByParcelId()` - Fetch zoning by parcel ID
  - `fetchByAddress()` - Fetch zoning by address
  - `fetchByCoordinates()` - Fetch zoning by lat/lng
  - `mapAPIResponse()` - Map external API response to internal format
  - `isConfigured()` - Check if API integration is configured
- **Future Integration**:
  - Connect to city/county zoning APIs
  - Handle API authentication and rate limiting
  - Cache frequently accessed zoning data
  - See file comments for detailed integration guide

## 📁 Utils Directory (`/utils/`)

Utility functions and helper modules:

### `unitConversions.js`
- **Purpose**: Unit conversion utilities for measurements
- **Functions**:
  - `feetToMeters()` - Convert feet to meters
  - `metersToFeet()` - Convert meters to feet
  - `convertSetbacksUnits()` - Convert entire setback objects (skips dimensionless parameters)
  - `formatValueForUnit()` - Format values with appropriate decimal precision
  - `UNITS` constant - Available unit types
- **Smart Conversion**: Automatically excludes dimensionless parameters (FAR, density) from conversion

### `measurementUtils.js`
- **Purpose**: Extracts and formats measurements from Giraffe analytics
- **Functions**:
  - `extractMeasure()` - Extract specific measure value from analytics (ROBUST: searches all categories/usages)
  - `extractDesignMeasurements()` - Extract all design measurements
  - `hasValidAnalytics()` - Check if analytics data is available
  - `formatMeasurement()` - Format measurement for display
- **Analytics Structure**: Based on `rpc.invoke('getAnalyticsResult', [])` response format
- **Integration**: Works with Giraffe SDK analytics API
- **Robustness**: No longer hardcoded to specific category/usage names - searches through entire analytics structure
- **Debug Mode**: Built-in debug logging to troubleshoot when measures return null

### `analyticsDebugger.js`
- **Purpose**: Debug utilities for inspecting Giraffe analytics structure
- **Functions**:
  - `debugAnalyticsStructure()` - Log full analytics structure to console
  - `findMeasure()` - Locate where a specific measure exists in analytics
  - `listAllMeasures()` - List all available measures with their locations
- **Use Case**: Troubleshoot when analytics measures return null unexpectedly
- **Usage**: Import and call functions to inspect analytics structure in browser console

### `validators.js`
- **Purpose**: Pure validation functions for design compliance checking
- **Functions**:
  - `validateHeightFeet()` - Validate height in feet
  - `validateHeightStories()` - Validate height in stories
  - `validateFAR()` - Validate Floor Area Ratio
  - `validateDensity()` - Validate density
  - `validateDesign()` - Validate all design parameters
- **Note**: All measurements expected in feet (Giraffe analytics format)
- **Architecture**: Pure functions with no side effects

### `envelopeFactory.js`
- **Purpose**: Factory functions for creating GeoJSON envelope features
- **Responsibilities**:
  - Generates properly formatted GeoJSON for building envelopes
  - Applies setback calculations to lot boundaries
  - Handles coordinate transformations and geometry operations
- **Note**: Functionality largely moved to `GiraffeAdapter.buildEnvelopeFeature()`

### `cn.js`
- **Purpose**: Utility for conditional CSS class name concatenation
- **Usage**: Combines Tailwind CSS classes conditionally
- **Typical pattern**: `cn('base-class', condition && 'conditional-class')`

## 📁 Assets Directory (`/assets/`)

Static assets and media files:

### `react.svg`
- **Purpose**: React logo icon (from Vite template)
- **Usage**: Displayed in development/template components

## 🔄 Data Flow

### Application Initialization
1. **Entry Point**: `main.jsx` → `App.jsx` → `SetbacksApp.jsx`
2. **Hook Initialization**: Custom hooks initialize state and operations
   - `useZoningData()` - Loads default parameters
   - `useEnvelope()` - Subscribes to Giraffe state
   - `useProfiles()` - Loads saved profiles
   - `useValidation()` - Prepares validation system

### User Input Flow
3. **Parameter Input**: `SetbackForm.jsx` collects zoning parameters
4. **Profile Management**: `ProfileManager.jsx` handles save/load operations
5. **Unit Conversion**: `unitConversions.js` via `ZoningService`
6. **State Updates**: `useZoningData` manages parameter state

### Envelope Creation Flow
7. **User Action**: Click "Generate Envelope" button
8. **Parameter Validation**: `ZoningService.validateParameters()`
9. **Unit Conversion**: Convert to meters via `ZoningService.convertToMeters()`
10. **Feature Building**: `GiraffeAdapter.buildEnvelopeFeature()`
11. **Giraffe Creation**: `GiraffeAdapter.createRawSection()` or `updateRawSection()`
12. **State Update**: Giraffe state triggers `useEnvelope` update

### Validation Flow
13. **Envelope Selection**: User selects envelope in Giraffe
14. **Analytics Fetch**: `GiraffeAdapter.getAnalytics()`
15. **Measurement Extraction**: `measurementUtils.extractDesignMeasurements()`
16. **Validation Check**: `validators.validateDesign()`
17. **Results Display**: `ValidationPanel.jsx` shows compliance status

### Profile Flow
18. **Save Profile**: `ProfileManager` → `ProfileService.createProfile()` → `useProfiles.saveProfile()`
19. **Load Profile**: `ProfileManager` → `useProfiles.loadProfile()` → `onLoadProfile()` callback
20. **Compare Profiles**: `ProfileService.compareProfiles()` → Display comparison table

## 🛠️ Key Dependencies

- **React**: UI framework and component system
- **@gi-nx/iframe-sdk**: Giraffe GIS platform integration (RPC and state management)
- **@gi-nx/iframe-sdk-react**: React hooks for Giraffe state (`useGiraffeState`)
- **Framer Motion**: Animation library for UI transitions and micro-interactions
- **Tailwind CSS**: Utility-first CSS framework with custom configuration

## 📝 Development Notes

### Architecture Principles
- **Clean Architecture**: Domain logic isolated from UI and external dependencies
- **Separation of Concerns**: Business logic (domain), presentation (components), state (hooks)
- **Dependency Inversion**: External SDKs isolated through adapters (GiraffeAdapter)
- **Single Responsibility**: Each module has one clear purpose

### Code Organization
- Components follow React functional component patterns with custom hooks
- State management distributed across specialized hooks (useEnvelope, useZoningData, etc.)
- Business logic encapsulated in domain services (ProfileService, ValidationService, ZoningService)
- Unit conversions handled consistently through ZoningService and utility functions
- GIS operations abstracted through GiraffeAdapter
- Styling uses Tailwind CSS with custom utility classes and Framer Motion animations

### Data Flow Pattern
- **Hooks** manage state and side effects
- **Domain Services** contain pure business logic
- **Adapters** isolate external dependencies
- **Components** focus on presentation and user interaction
- **Constants** centralize configuration and magic strings

## 🔌 Modular Architecture for API Integration

The application is designed with a **clean, modular architecture** to support easy integration with external zoning APIs:

### Current Architecture
- **Configuration**: All zoning parameters defined in `/config/zoningParameters.js`
- **Domain Services**: Business logic in `/domain/` (ProfileService, ValidationService, ZoningService)
- **API Layer**: Skeleton implementation in `/services/api/` (APIClient, ZoningAPIService)
- **State Management**: Custom hooks in `/hooks/` (useZoningData, useEnvelope, etc.)
- **Components**: UI layer dynamically renders based on configuration

### API Integration Status
The application includes a **ready-to-use skeleton** for zoning API integration:

1. **`APIClient.js`**: Generic HTTP client with GET, POST, PUT, DELETE methods
2. **`ZoningAPIService.js`**: Skeleton service with methods for fetching zoning data:
   - `fetchByParcelId(parcelId, jurisdiction)`
   - `fetchByAddress(address, city, state)`
   - `fetchByCoordinates(lat, lng)`
   - `mapAPIResponse(apiResponse)` - Maps external API to internal format

### Adding External API Integration

To integrate with a real zoning API (see detailed guide in `ZoningAPIService.js`):

1. **Configure API endpoints** in `ZoningAPIService.js`
2. **Add authentication** (API keys, OAuth) to `APIClient`
3. **Implement API calls** in the skeleton methods
4. **Map API response** to match `zoningParameters.js` structure
5. **Integrate in component**:

```javascript
// In SetbacksApp.jsx
import { ZoningAPIService } from '../services/api/ZoningAPIService';

useEffect(() => {
  const fetchZoningData = async () => {
    if (ZoningAPIService.isConfigured()) {
      const apiParams = await ZoningAPIService.fetchByParcelId(
        parcelId, 
        jurisdiction
      );
      if (apiParams) {
        zoningData.updateParameters(apiParams); // Updates state via useZoningData
      }
    }
  };

  if (parcelId) fetchZoningData();
}, [parcelId]);
```

### Integration Points
- **Fetch**: Use `ZoningAPIService` to fetch data from external APIs
- **Validate**: Use `ZoningService.validateParameters()` to validate fetched data
- **Convert**: Use `ZoningService.convertToMeters()` for Giraffe SDK
- **Store**: Use `ProfileService` to save fetched configurations as profiles
- **Update**: Use `useZoningData` hook to update application state

### Benefits of This Design
- **Clean Architecture**: External APIs isolated through service layer
- **Ready for Integration**: Skeleton implementation with clear integration guide
- **Type Safety**: Parameters have defined units, types, and validation rules
- **Easy Extension**: Add new parameters by updating config only
- **API-Ready**: Structure matches common zoning API response patterns
- **Hybrid Mode**: Can combine API data with manual overrides
- **Testability**: Pure domain logic can be unit tested independently
- **Flexibility**: Swap or add multiple API providers without changing business logic

### Example Use Cases
1. **Parcel Lookup**: Fetch zoning by parcel ID from city/county APIs
2. **Address Search**: Get zoning parameters by street address
3. **GIS Integration**: Fetch zoning by lat/lng coordinates
4. **Multi-Jurisdiction**: Support multiple cities/counties with different APIs
5. **Caching**: Cache frequently accessed zoning data to reduce API calls
