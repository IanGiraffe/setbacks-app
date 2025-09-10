# Envelope Generator Application Summary

## 1. High-Level Overview

The **Envelope Generator** is a building envelope generator designed as a plugin or applet for the Giraffe platform—a tool for urban planning and architecture. Its primary function is to let users define setback distances (front, side, rear) and a maximum building height based on a selected project boundary within Giraffe. The app then generates a 3D representation of the permissible building envelope and sends it back to the Giraffe platform.

-   **User Interface:** Simple form for inputting parameters.
-   **Units:** Toggle between imperial (feet) and metric (meters), with automatic conversions.

---

## 2. Core Technologies

-   **Frontend Framework:** React 19
-   **Build Tool:** Vite
-   **Styling:** Tailwind CSS with PostCSS, using `clsx` and `tailwind-merge` for class name management
-   **Animations:** Framer Motion
-   **Linting:** ESLint
-   **Platform Integration:** `@gi-nx/iframe-sdk` and `@gi-nx/iframe-sdk-react` for communication with the Giraffe host application

---

## 3. Project Structure

The project follows a standard React application structure:

```
public/         # Contains static assets.
src/            # The main application source code.
├── assets/       # Static assets like images and SVGs used within the app.
├── components/   # Contains the React components that make up the UI.
├── services/     # For logic that interacts with external APIs.
└── utils/        # Contains helper functions and utilities.
```

-   `App.jsx`: The root React component.
-   `main.jsx`: The entry point of the application.

---

## 4. Application Flow

1.  **Initialization:** The application loads inside an iframe within the Giraffe platform.
2.  **Project Boundary Check:** It uses the `@gi-nx/iframe-sdk-react` hook `useGiraffeState('project')` to check for a project boundary from the Giraffe host environment.
3.  **User Input:**
    -   If a project boundary is found, a form is displayed for user input (`Max Height`, `Front Setback`, etc.).
    -   If no boundary is found, a message prompts the user to define one.
4.  **Unit Selection:** The user can toggle between "feet" and "meters."
5.  **Envelope Generation:**
    -   User clicks "Generate Envelope."
    -   The application converts inputs to meters.
    -   It constructs a GeoJSON feature object.
    -   It uses `rpc.invoke('createRawSection', ...)` from the SDK to send the feature to Giraffe.
6.  **State Updates:** The UI updates to reflect loading or error states.

---

## 5. Giraffe Platform Integration

-   **Reading State:** Reads project geometry from Giraffe using `useGiraffeState('project')`.
-   **Executing Commands:** Creates objects in Giraffe by invoking the `createRawSection` remote procedure call (RPC).
-   The `envelopeService.js` file contains more advanced logic for creating, finding, and updating envelopes, but the main `SetbacksApp.jsx` component currently only implements the creation logic directly.

---

## 6. Key Components

-   **`SetbacksApp.jsx`**: The main component that orchestrates the application, manages state, and handles the generation logic.
-   **`SetbackForm.jsx`**: A form component for user input fields.
-   **`UnitsToggle.jsx`**: A component to switch between feet and meters.
-   **`ProjectBoundaryStatus.jsx`**: Displays a message if a project boundary is not detected.

---

## 7. Services and Utilities

-   **`services/envelopeService.js`**: Defines an `EnvelopeService` class with methods to `createEnvelope`, `findExistingEnvelope`, and `updateEnvelope`. This service is not currently used by `SetbacksApp.jsx`.
-   **`utils/unitConversions.js`**: A set of pure functions for converting values between feet and meters.
-   **`utils/cn.js`**: A utility for conditionally combining Tailwind CSS class names.