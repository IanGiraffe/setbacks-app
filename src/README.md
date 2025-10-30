# Source Directory Structure

This document provides an overview of the `src/` directory structure for the Setbacks App, a React application for generating building envelope setbacks.

## 📁 Directory Overview

```
src/
├── components/          # React UI components
├── config/             # Application configuration and parameters
├── services/           # External API and data services
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

### `SetbackForm.jsx`
- **Purpose**: Form component for zoning parameter inputs
- **Responsibilities**:
  - Renders input fields for all zoning parameters (height, FAR, density)
  - Renders input fields for setback values (front, side, rear)
  - Supports custom setback types with inline editable labels
  - Handles form validation and user input
  - Supports unit conversion (feet/meters) for distance-based parameters
  - Dynamically generates form fields from parameter configuration

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

## 📁 Services Directory (`/services/`)

External API and data service integrations:

### `envelopeService.js`
- **Purpose**: Handles envelope creation and management via Giraffe SDK
- **Responsibilities**:
  - Creates building envelope features in GIS system
  - Manages envelope selection and updates
  - Handles API communication with Giraffe platform
  - Provides error handling for envelope operations

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

### `envelopeFactory.js`
- **Purpose**: Factory functions for creating GeoJSON envelope features
- **Responsibilities**:
  - Generates properly formatted GeoJSON for building envelopes
  - Applies setback calculations to lot boundaries
  - Handles coordinate transformations and geometry operations

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

1. **Entry Point**: `main.jsx` → `App.jsx` → `SetbacksApp.jsx`
2. **User Input**: `SetbackForm.jsx` collects setback values
3. **Unit Conversion**: `unitConversions.js` handles measurement conversions
4. **Envelope Generation**: `envelopeFactory.js` creates GeoJSON features
5. **GIS Integration**: `envelopeService.js` communicates with Giraffe SDK
6. **Status Display**: `ProjectBoundaryStatus.jsx` shows validation results

## 🛠️ Key Dependencies

- **React**: UI framework and component system
- **@gi-nx/iframe-sdk**: Giraffe GIS platform integration
- **Framer Motion**: Animation library for UI transitions
- **Tailwind CSS**: Utility-first CSS framework

## 📝 Development Notes

- Components follow React functional component patterns with hooks
- State management is primarily handled in `SetbacksApp.jsx`
- Unit conversions are handled consistently through utility functions
- GIS operations are abstracted through service layer
- Styling uses Tailwind CSS with custom utility classes

## 🔌 Modular Architecture for API Integration

The application is designed with a **modular parameter system** to support easy integration with external zoning APIs:

### Current Architecture
- All zoning parameters are defined in `/config/zoningParameters.js`
- Parameters include metadata (type, units, defaults, validation rules)
- Components dynamically render based on configuration

### Adding API Integration
To integrate with external zoning APIs (e.g., by parcel ID or jurisdiction):

1. **Create a service layer** in `/services/zoningApiService.js`
2. **Fetch parameters** from external API
3. **Map API response** to the parameter structure defined in `zoningParameters.js`
4. **Update state** in `SetbacksApp.jsx` with fetched values

Example integration pattern:
```javascript
// In SetbacksApp.jsx
useEffect(() => {
  const fetchZoningData = async () => {
    const apiParams = await zoningApiService.getParameters(parcelId);
    setSetbacks(apiParams); // Replaces defaults with API values
  };

  if (parcelId) fetchZoningData();
}, [parcelId]);
```

### Benefits of This Design
- **Single Source of Truth**: All parameters defined in one config file
- **Type Safety**: Each parameter has defined units and validation
- **Easy Extension**: Add new parameters by updating config only
- **API-Ready**: Structure matches common zoning API response patterns
- **Hybrid Mode**: Can combine API data with manual overrides
