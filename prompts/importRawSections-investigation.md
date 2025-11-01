# importRawSections Investigation

## Problem Statement

When using `createRawSection` to create envelope features in Giraffe, the envelope flow (ID: `9ed6808627da407ca40b2f5fab01e326`) is referenced in the feature properties but does not automatically apply to the geometry. The envelope only renders correctly after manually triggering the flow using the Flow tool in the Giraffe platform.

## Developer Feedback

The developer indicated that this is likely because the flow referenced by the ID doesn't exist on the project. They recommended switching from:
- `createRawSection` (https://gi-docs.web.app/functions/project.createRawSection.html)
- to `importRawSections` (https://gi-docs.web.app/functions/project.importRawSections.html)

The key difference is that `importRawSections` includes a `flows` parameter option that allows importing the flow definition along with the features.

## What We Changed

### Initial Change
Replaced the direct RPC call in `SetbacksApp.jsx:180`:
```javascript
// Old:
await rpc.invoke('createRawSection', [envelopeFeature]);

// New:
await rpc.invoke('importRawSections', [[envelopeFeature], importOptions]);
```

## Attempted Solutions

### Attempt 1: Convert flow.inputs to nodes array
**Reasoning:** Assumed `GiraffeNodeGraph` requires a `nodes` array property.

**Implementation:**
```javascript
const flowGraph = {
  id: flow.id,
  nodes: Object.entries(flow.inputs).map(([nodeId, nodeData]) => ({
    id: nodeId,
    ...nodeData
  }))
};

const importOptions = { flows: [flowGraph] };
```

**Result:** ❌ Error: `e.nodes.forEach is not a function`

This confirmed that `nodes` should be an array, but there was a different issue.

---

### Attempt 2: Keep flow.inputs as object with nodes array
**Reasoning:** Maybe the flow needs both the array structure and to match feature references.

**Implementation:**
```javascript
const flowGraph = {
  id: flow.id,
  nodes: Object.entries(flow.inputs).map(([nodeId, nodeData]) => ({
    id: nodeId,
    ...nodeData
  }))
};

// Modified feature to only reference flow by ID
featureForImport.properties.flow = { id: flow.id };

const importOptions = { flows: [flowGraph] };
```

**Result:** ❌ Error: `Cannot read properties of undefined (reading '62f9968fb7ab458698ecc6b32cc20fef')`

Giraffe tried to look up the input node ID but couldn't find it in the expected location.

---

### Attempt 3: Simplified - flow ID only in feature, full definition in flows
**Reasoning:** The feature should only reference the flow by ID, and the complete definition should be in the `flows` parameter.

**Implementation:**
```javascript
const flowGraph = {
  id: flow.id,
  nodes: Object.entries(flow.inputs).map(([nodeId, nodeData]) => ({
    id: nodeId,
    ...nodeData
  }))
};

featureForImport.properties.flow = { id: flow.id };  // ID reference only

const importOptions = { flows: [flowGraph] };
```

**Result:** ⚠️ Partial success - Feature created but error: "Error evaluating section... Cannot read properties of undefined (reading 'forEach')"

The envelope was created in Giraffe but failed during geometry evaluation.

---

### Attempt 4: Keep inputs as object (current state - BROKEN)
**Reasoning:** Maybe `GiraffeNodeGraph` expects `inputs` as an object, not `nodes` as an array.

**Implementation:**
```javascript
const flowGraph = {
  id: flow.id,
  inputs: flow.inputs  // Keep as object
};

const importOptions = { flows: [flowGraph] };
```

**Result:** 🔄 Not yet tested - code is currently in this state

---

## Current Feature Structure

Our envelope features are structured like this:

```json
{
  "type": "Feature",
  "properties": {
    "usage": "Envelope",
    "id": "envelope_1761938357387",
    "flow": {
      "id": "9ed6808627da407ca40b2f5fab01e326",
      "inputs": {
        "62f9968fb7ab458698ecc6b32cc20fef": {
          "type": "envelope",
          "parameters": {
            "version": "beta",
            "maxHeight": 12.19,
            "maxHeightStories": 3,
            "maxFAR": 2,
            "maxDensity": 50,
            "sideIndices": {
              "rear": [],
              "side": [0, 2],
              "front": [1]
            },
            "setbackSteps": {
              "rear": [
                { "inset": 3.05, "height": 0 },
                { "inset": 3.05 }
              ],
              "side": [
                { "inset": 1.52, "height": 0 },
                { "inset": 1.52 }
              ],
              "front": [
                { "inset": 7.62, "height": 0 },
                { "inset": 7.62 }
              ]
            },
            "hasSetbackOutput": false
          }
        }
      }
    },
    "appId": "1",
    "color": "#7af3ff",
    "layerId": "setbacks",
    "projectId": "63923"
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [...]
  }
}
```

## What We Need to Proceed

### 1. GiraffeNodeGraph Type Definition
We need the complete TypeScript type definition for `GiraffeNodeGraph`. The SDK docs mention it but don't provide the structure:
```typescript
flows?: GiraffeNodeGraph[];
```

**Questions:**
- What properties does `GiraffeNodeGraph` have?
- Is it `nodes` (array) or `inputs` (object)?
- Are there other required properties besides `id`?

### 2. Working Example
A complete working example of `importRawSections` with flows would be extremely helpful. Specifically:
- An example feature GeoJSON
- The corresponding flow graph structure
- How they reference each other

### 3. Flow Import Pattern
**Key Question:** When using `importRawSections` with the `flows` parameter:
1. Should the feature's `properties.flow` contain the full definition or just an ID reference?
2. Should the flow definition in the `flows` array match exactly what's in the feature, or is it a different structure?
3. Is there a relationship/mapping that needs to be maintained between the feature and the flows array?

### 4. Envelope Flow Example
It would be helpful to see:
- A complete envelope flow export from Giraffe (if there's an export function)
- Or documentation specific to the envelope flow type
- Any examples from other apps that successfully use `importRawSections` with flows

## Files Modified

1. `src/domain/GiraffeAdapter.js` - Added `importRawSections` method (lines 23-55)
2. `src/components/SetbacksApp.jsx` - Modified envelope creation logic (lines 181-210)
3. `src/hooks/useEnvelope.js` - Updated to call `importRawSections` (line 60)

## Next Steps

1. **Revert to working state** - Use `createRawSection` to restore functionality
2. **Get clarification** from developer on:
   - The exact structure of `GiraffeNodeGraph`
   - A working example of envelope import with flows
   - Whether our feature structure is correct
3. **Test with correct structure** once we have the proper format
4. **Update GiraffeAdapter** to use the correct implementation

## Debug Logs Location

All debug output is in `SetbacksApp.jsx` lines 181-208. The logs show:
- Original envelope feature
- Flow graph structure being sent
- Feature structure being imported
- Import options with flows array

These can be helpful for the developer to see exactly what we're sending vs. what Giraffe expects.
