/**
 * Test Regrid /parcels/area endpoint with polygon geometry
 * This is the correct approach for our use case!
 */

import dotenv from 'dotenv';
dotenv.config();

const REGRID_TOKEN = process.env.VITE_REGRID_TOKEN;

async function testPolygonSearch() {
  console.log('🚀 Testing Regrid /parcels/area endpoint\n');

  // Example: A rough polygon around a parcel in Austin
  // (In reality, this would come from the user's drawn boundary)
  const polygon = {
    type: "Polygon",
    coordinates: [
      [
        [
          -97.72166401149913,
          30.23905055770343
        ],
        [
          -97.72217229007408,
          30.239290392400253
        ],
        [
          -97.72247403862183,
          30.23880608801718
        ],
        [
          -97.72196576004355,
          30.238567410654568
        ],
        [
          -97.72166401149913,
          30.23905055770343
        ]
      ]
    ]
  };

  console.log('📐 Search polygon:');
  console.log(JSON.stringify(polygon, null, 2));

  // Method 1: Using /parcels/area endpoint
  console.log('\n🔍 Method 1: POST /parcels/area (polygon search)');
  try {
    const url = `https://app.regrid.com/api/v2/parcels/area?token=${REGRID_TOKEN}&geojson=${encodeURIComponent(JSON.stringify(polygon))}&limit=10`;

    const response = await fetch(url, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error ${response.status}:`, errorText);
    } else {
      const data = await response.json();

      if (data.parcels && data.parcels.features && data.parcels.features.length > 0) {
        console.log(`✅ Found ${data.parcels.features.length} parcel(s) intersecting the polygon!\n`);

        data.parcels.features.forEach((parcel, idx) => {
          const p = parcel.properties.fields;
          console.log(`Parcel ${idx + 1}:`);
          console.log(`  Address: ${p.address || 'N/A'}`);
          console.log(`  Zoning: ${p.zoning || 'N/A'} - ${p.zoning_description || 'N/A'}`);
          console.log(`  Zoning Link: ${p.zoning_code_link || 'N/A'}`);
          console.log('');
        });
      } else {
        console.log('❌ No parcels found');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Method 2: Point with minimal radius (1m) at centroid
  console.log('\n🔍 Method 2: GET /parcels/point with 1m radius at centroid');

  // Calculate centroid of polygon
  const coords = polygon.coordinates[0];
  const centroidLon = coords.reduce((sum, c) => sum + c[0], 0) / (coords.length - 1);
  const centroidLat = coords.reduce((sum, c) => sum + c[1], 0) / (coords.length - 1);

  console.log(`   Centroid: ${centroidLat}, ${centroidLon}`);

  try {
    const url = `https://app.regrid.com/api/v2/parcels/point?token=${REGRID_TOKEN}&lat=${centroidLat}&lon=${centroidLon}&radius=1&limit=5`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.parcels && data.parcels.features && data.parcels.features.length > 0) {
      console.log(`✅ Found ${data.parcels.features.length} parcel(s) at centroid with 1m radius!\n`);

      data.parcels.features.forEach((parcel, idx) => {
        const p = parcel.properties.fields;
        console.log(`Parcel ${idx + 1}:`);
        console.log(`  Address: ${p.address || 'N/A'}`);
        console.log(`  Zoning: ${p.zoning || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ No parcels found at centroid');
      console.log('   (Might need slightly larger radius, or polygon might not contain a parcel)');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('📊 RECOMMENDATION');
  console.log('═══════════════════════════════════════');
  console.log('Use POST /parcels/area with the user\'s drawn polygon.');
  console.log('This gives us ALL parcels that intersect the boundary,');
  console.log('which is exactly what the user intended to select!');
}

testPolygonSearch();
