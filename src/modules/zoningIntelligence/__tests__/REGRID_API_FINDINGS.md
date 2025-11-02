# Regrid API Exploration Findings

**Date**: 2025-11-02
**Token Type**: Trial/Premium (has premium zoning fields)
**Geographic Coverage**: Travis County, TX (Austin area) + 6 other counties

---

## 1. API Overview

### Authentication & Base URL
- **Base URL**: `https://app.regrid.com/api/v2/`
- **Authentication**: Token as query parameter `?token=<your_token>`
- **Version**: API v2 (current)

### Key Endpoint for Our Use Case
**`/parcels/area`** - ⭐ **PRIMARY METHOD** - Lookup parcels by polygon geometry

```
GET https://app.regrid.com/api/v2/parcels/area
  ?token=<token>
  &geojson=<url_encoded_geojson_polygon>
  &limit=<max_results>    // Default: 20, Max: 1000
```

**This is the correct approach for our use case:**
- User draws boundary polygon on map
- We pass that exact polygon to `/parcels/area`
- Returns ALL parcels that intersect the boundary
- No centroid calculation or radius needed!

**Alternative: `/parcels/point`** - Fallback method using centroid

```
GET https://app.regrid.com/api/v2/parcels/point
  ?token=<token>
  &lat=<latitude>
  &lon=<longitude>
  &radius=<meters>        // Default: 50, Max: 32000
  &limit=<max_results>    // Default: 20, Max: 1000
```

Use only if `/parcels/area` fails or for simple point-based lookups.

---

## 2. Response Structure

### Top-Level
```json
{
  "parcels": {
    "type": "FeatureCollection",
    "features": [...]
  }
}
```

### Feature Structure
```json
{
  "type": "Feature",
  "id": 174379035,
  "geometry": {
    "type": "Polygon",
    "coordinates": [[...]]
  },
  "properties": {
    "headline": "501 Congress Ave",
    "path": "/us/tx/travis/austin/221341",
    "ll_uuid": "2bdda38b-6af8-43fe-9bf0-5ed01c20bef3",
    "context": {
      "headline": "Austin, TX",
      "name": "Austin, TX",
      "path": "/us/tx/travis/austin",
      "active": true
    },
    "fields": {
      // 95+ fields with all parcel data
    }
  }
}
```

**Important**: All useful data is in `properties.fields`, not at the top level!

---

## 3. Zoning Fields (CRITICAL for Phase 2 & 3)

### ✅ Available Standard Fields
- `zoning` - Municipality's zoning code
  - Example: `"CBD-CURE"`
- `zoning_description` - Human-readable description
  - Example: `"Central Business Central Urban Redevelopment"`

### ⭐ Available PREMIUM Fields (Token has access!)
- `zoning_type` - Standardized category
  - Example: `"Mixed"`, `"Commercial"`, `"Residential"`
- `zoning_subtype` - Standardized subcategory
  - Example: `"Mixed Use"`, `"Core Commercial"`, `"Single-family"`
- `zoning_code_link` - **🎯 CRITICAL for Phase 3** - Link to municipal code
  - Example: `"https://library.municode.com/tx/austin/codes/code_of_ordinances?nodeId=TIT25LADE"`
  - This is what we'll fetch and pass to Claude!
- `zoning_id` - Regrid's internal zoning area ID
  - Example: `17172340`

---

## 4. Other Useful Fields

### Location/Identity
- `parcelnumb` - County parcel number
- `address`, `city`, `county`, `state2`, `szip`
- `lat`, `lon` - Parcel centroid coordinates
- `ll_uuid` - Regrid's stable unique identifier

### Property Details
- `usecode`, `usedesc` - Current land use
- `gisacre`, `ll_gisacre` - Lot size in acres
- `ll_gissqft` - Lot size in square feet
- `yearbuilt` - Year of construction
- `owner` - Current owner name

### Building/Footprint
- `ll_bldg_footprint_sqft` - Building footprint area
- `ll_bldg_count` - Number of buildings

### Legal
- `legaldesc` - Legal description
- `lot`, `subdivision` - Lot and subdivision info

### Assessment/Value
- `parval`, `landval`, `improvval` - Property values
- `taxyear`, `saledate` - Tax and sale information

---

## 5. API Performance

- **Response Time**: 150-650ms typical
- **Successful Requests**: 100% success rate in testing
- **Rate Limiting**: No issues observed with 300-500ms delays between requests

---

## 6. Integration Considerations

### For Phase 2 Implementation

1. **✅ RECOMMENDED: Use `/parcels/area` with user's drawn polygon**
   ```javascript
   // User draws polygon on map via GI-NX
   const userPolygon = {
     type: "Polygon",
     coordinates: [[
       [-97.7429, 30.2670],
       [-97.7429, 30.2676],
       [-97.7423, 30.2676],
       [-97.7423, 30.2670],
       [-97.7429, 30.2670]  // Close the polygon
     ]]
   };

   // Pass directly to Regrid - NO transformation needed!
   const url = `https://app.regrid.com/api/v2/parcels/area` +
               `?token=${REGRID_TOKEN}` +
               `&geojson=${encodeURIComponent(JSON.stringify(userPolygon))}` +
               `&limit=10`;

   const response = await fetch(url);
   const data = await response.json();

   // Get ALL parcels that intersect the boundary
   const parcels = data.parcels.features;  // Could be multiple parcels!
   ```

   **Benefits:**
   - ✅ Gets all parcels intersecting the drawn boundary
   - ✅ No centroid calculation needed
   - ✅ No radius guessing
   - ✅ Handles multi-parcel selections automatically
   - ✅ More accurate to user intent

2. **Response path is different from docs**
   ```javascript
   // ❌ Documented (doesn't work)
   data.features

   // ✅ Actual structure
   data.parcels.features
   ```

3. **Access nested fields correctly**
   ```javascript
   const parcel = data.parcels.features[0];
   const zoning = parcel.properties.fields.zoning;
   const link = parcel.properties.fields.zoning_code_link;
   ```

4. **Handle multiple parcels**
   ```javascript
   // User might draw around multiple parcels
   data.parcels.features.forEach(parcel => {
     const fields = parcel.properties.fields;
     console.log(`${fields.address}: ${fields.zoning}`);
   });
   ```

### For Phase 3 (Claude Integration)

The `zoning_code_link` field is **available and working**! This is critical for our workflow:

1. User draws boundary polygon
2. Call Regrid `/parcels/area` → Get parcel(s) with `zoning_code_link`
3. Fetch zoning ordinance from link
4. Pass ordinance + boundary geometry to Claude
5. Claude extracts setback requirements

**Sample Zoning Code Link**:
```
https://library.municode.com/tx/austin/codes/code_of_ordinances?nodeId=TIT25LADE
```

This links directly to the relevant section of the municipal code!

---

## 7. Error Handling

### Common Issues
1. **"No parcels found"**
   - Cause: Outside coverage area OR polygon doesn't intersect any parcels
   - Solution: Verify location is in Travis County, TX (Austin area) for trial token

2. **"An access token is required"**
   - Cause: Token not passed correctly
   - Solution: Ensure `?token=<token>` in query string

3. **Empty features array**
   - Cause: Location outside of trial token's 7 counties
   - Solution: Test with Austin, TX coordinates (see test files)

4. **"Polygon too large"**
   - Cause: Polygon exceeds 80 square miles limit
   - Solution: User should draw smaller boundaries (typical parcels are <1 acre)

---

## 8. Sample Code

### Recommended: Polygon Search
```javascript
const REGRID_TOKEN = 'your_token';

// User draws this polygon on the map
const userBoundary = {
  type: "Polygon",
  coordinates: [[
    [-97.7429, 30.2670],
    [-97.7429, 30.2676],
    [-97.7423, 30.2676],
    [-97.7423, 30.2670],
    [-97.7429, 30.2670]
  ]]
};

// Query Regrid with the polygon
const url = `https://app.regrid.com/api/v2/parcels/area` +
            `?token=${REGRID_TOKEN}` +
            `&geojson=${encodeURIComponent(JSON.stringify(userBoundary))}` +
            `&limit=10`;

const response = await fetch(url);
const data = await response.json();
const parcels = data.parcels.features;

console.log(`Found ${parcels.length} parcel(s)`);

parcels.forEach(parcel => {
  const fields = parcel.properties.fields;
  console.log('Address:', fields.address);
  console.log('Zoning:', fields.zoning);
  console.log('Zoning Link:', fields.zoning_code_link);
  console.log('---');
});
```

### Example Result
```
Found 4 parcel(s)
Address: 501 CONGRESS AVE
Zoning: CBD-CURE
Zoning Link: https://library.municode.com/tx/austin/codes/code_of_ordinances?nodeId=TIT25LADE
---
Address: 515 CONGRESS AVE
Zoning: CBD-CURE
Zoning Link: https://library.municode.com/tx/austin/codes/code_of_ordinances?nodeId=TIT25LADE
---
...
```

---

## 9. Next Steps for Implementation

### Phase 2 Tasks
1. ✅ API exploration complete
2. ⏳ Create `RegridAPIClient.js` wrapper
   - Implement `/parcels/area` endpoint (primary)
   - Implement `/parcels/point` endpoint (fallback)
3. ⏳ Create `RegridService.js` business logic
4. ⏳ Integrate with user's drawn boundary polygon
   - Get polygon from GI-NX drawing tools
   - Pass directly to Regrid (no transformation needed)
5. ⏳ Display zoning data in UI
   - Handle single or multiple parcels
   - Show zoning code, description, type

### Phase 3 Preparation
- We have confirmed access to `zoning_code_link`
- These links point to municode.com (standardized format)
- Links go directly to relevant zoning sections
- Ready for Claude integration when Phase 3 begins

---

## 10. Test Files Created

- `regrid-polygon-test.js` - **⭐ RECOMMENDED** - Tests `/parcels/area` endpoint ✅
- `regrid-simple-test.js` - Simple point-based example
- `regrid-api-test.js` - Comprehensive test suite
- `regrid-coverage-test.js` - Coverage area detection
- `regrid-sample-response.json` - Full API response example

**To test polygon search** (recommended):
```bash
node src/modules/zoningIntelligence/__tests__/regrid-polygon-test.js
```

**To test point search** (fallback):
```bash
node src/modules/zoningIntelligence/__tests__/regrid-simple-test.js
```
