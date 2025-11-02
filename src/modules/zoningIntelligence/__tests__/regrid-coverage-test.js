/**
 * Regrid Coverage Test
 * Determines which geographic areas are accessible with your token
 */

import dotenv from 'dotenv';
dotenv.config();

const REGRID_TOKEN = process.env.VITE_REGRID_TOKEN;

if (!REGRID_TOKEN) {
  console.error('❌ Error: VITE_REGRID_TOKEN not found');
  process.exit(1);
}

// Try different approaches to find ANY parcel
async function findAnyParcel() {
  console.log('🔍 Searching for accessible parcels...\n');

  // Approach 1: Wide radius search in major cities
  const cities = [
    { name: 'Austin, TX', lat: 30.2672, lon: -97.7431 },
    { name: 'Seattle, WA', lat: 47.6062, lon: -122.3321 },
    { name: 'Phoenix, AZ', lat: 33.4484, lon: -112.0740 },
    { name: 'Denver, CO', lat: 39.7392, lon: -104.9903 },
  ];

  console.log('📍 Testing with large radius (5000m)...');
  for (const city of cities) {
    try {
      const url = `https://app.regrid.com/api/v2/parcels/point?token=${REGRID_TOKEN}&lat=${city.lat}&lon=${city.lon}&radius=5000&limit=1`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        console.log(`✅ Found parcels in ${city.name}!`);
        console.log(`   County: ${data.features[0].properties.county}, ${data.features[0].properties.state}`);
        console.log(`   Address: ${data.features[0].properties.address || 'N/A'}`);
        return data.features[0];
      } else {
        console.log(`❌ No parcels in ${city.name}`);
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.log(`⚠️  Error testing ${city.name}: ${error.message}`);
    }
  }

  // Approach 2: Try query endpoint with state filter
  console.log('\n🔎 Trying query endpoint for any Texas parcel...');
  try {
    const url = `https://app.regrid.com/api/v2/parcels/query?token=${REGRID_TOKEN}&query={"state":"TX"}&limit=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      console.log(`✅ Found Texas parcel via query!`);
      console.log(`   County: ${data.features[0].properties.county}, ${data.features[0].properties.state}`);
      return data.features[0];
    }
  } catch (error) {
    console.log(`⚠️  Query endpoint error: ${error.message}`);
  }

  // Approach 3: Try the coverage/stats endpoint if it exists
  console.log('\n📊 Checking API metadata...');
  try {
    const url = `https://app.regrid.com/api/v2/parcels/point?token=${REGRID_TOKEN}&lat=0&lon=0&radius=1&limit=1`;
    const response = await fetch(url);
    const data = await response.json();
    console.log('Response metadata:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`⚠️  Metadata check error: ${error.message}`);
  }

  return null;
}

findAnyParcel().then(parcel => {
  if (parcel) {
    console.log('\n✅ SUCCESS! Your token has access to data.');
    console.log('\n📦 Sample Parcel Data:');
    console.log(JSON.stringify(parcel, null, 2));
  } else {
    console.log('\n❌ Could not find any accessible parcels.');
    console.log('\n💡 Possible reasons:');
    console.log('   1. Trial token may be expired (30-day limit)');
    console.log('   2. Token may not have any geographic access');
    console.log('   3. Token may be invalid');
    console.log('\n📧 Contact Regrid support: [email protected]');
  }
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
