# Regrid API Quick Start

**TL;DR**: Pass the user's drawn polygon directly to `/parcels/area`. No centroid calculation or radius needed.

## The Simple Way ✅

```javascript
// 1. User draws polygon on map
const userPolygon = {
  type: "Polygon",
  coordinates: [[
    [-97.7429, 30.2670],
    [-97.7429, 30.2676],
    [-97.7423, 30.2676],
    [-97.7423, 30.2670],
    [-97.7429, 30.2670]  // Close polygon
  ]]
};

// 2. Query Regrid directly with polygon
const url = `https://app.regrid.com/api/v2/parcels/area` +
            `?token=${REGRID_TOKEN}` +
            `&geojson=${encodeURIComponent(JSON.stringify(userPolygon))}` +
            `&limit=10`;

const response = await fetch(url);
const data = await response.json();

// 3. Get all parcels that intersect the boundary
const parcels = data.parcels.features;  // Array of parcels!

// 4. Extract zoning data
parcels.forEach(parcel => {
  const fields = parcel.properties.fields;
  console.log('Address:', fields.address);
  console.log('Zoning Code:', fields.zoning);
  console.log('Zoning Type:', fields.zoning_type);
  console.log('Ordinance Link:', fields.zoning_code_link);
});
```

## Key Points

✅ **No centroid calculation** - pass polygon directly
✅ **No radius** - polygon defines search area
✅ **Returns multiple parcels** - handles all intersecting parcels
✅ **Premium fields available** - `zoning_type`, `zoning_subtype`, `zoning_code_link`

## Response Structure

```javascript
{
  "parcels": {                           // ⚠️ Note: NOT root-level "features"!
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "id": 174379035,
        "geometry": { ... },
        "properties": {
          "headline": "501 Congress Ave",
          "fields": {                    // ⚠️ All data is here!
            "address": "501 CONGRESS AVE",
            "zoning": "CBD-CURE",
            "zoning_description": "Central Business Central Urban Redevelopment",
            "zoning_type": "Mixed",      // ⭐ Premium
            "zoning_subtype": "Mixed Use", // ⭐ Premium
            "zoning_code_link": "https://...", // ⭐ Premium - Critical for Claude!
            "zoning_id": 17172340,       // ⭐ Premium
            // ... 95+ total fields
          }
        }
      }
    ]
  }
}
```

## Common Mistakes

❌ **Don't do this:**
```javascript
// Wrong - calculating centroid unnecessarily
const centroid = getCentroid(polygon);
fetch(`/parcels/point?lat=${centroid.lat}&lon=${centroid.lon}&radius=???`)
```

❌ **Don't do this:**
```javascript
// Wrong - trying to access features at wrong path
const parcels = data.features;  // undefined!
```

✅ **Do this:**
```javascript
// Correct - use polygon directly
fetch(`/parcels/area?geojson=${encodeURIComponent(JSON.stringify(polygon))}`)

// Correct - access nested features
const parcels = data.parcels.features;
```

## Testing

```bash
# Run the polygon test (recommended)
node src/modules/zoningIntelligence/__tests__/regrid-polygon-test.js

# Output:
# Found 4 parcel(s)
# Parcel 1: 501 CONGRESS AVE - CBD-CURE
# Parcel 2: 515 CONGRESS AVE - CBD-CURE
# ...
```

## For Implementation

When building `RegridAPIClient.js` and `RegridService.js`:

1. **Primary method**: `getParcelsByPolygon(polygon)` → uses `/parcels/area`
2. **Fallback method**: `getParcelsByPoint(lat, lon, radius)` → uses `/parcels/point`
3. **Return**: Array of parcels (not single parcel)
4. **Extract**: `data.parcels.features[].properties.fields.*`

## More Info

- Full documentation: [REGRID_API_FINDINGS.md](./REGRID_API_FINDINGS.md)
- Implementation plan: [regrid-implementation-plan.md](../../../prompts/regrid-implementation-plan.md)
