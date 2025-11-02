/**
 * Regrid API Exploration Script
 *
 * This script tests the Regrid API to understand:
 * - Response structure and format
 * - Available zoning fields (especially premium fields)
 * - Error handling scenarios
 * - Rate limiting behavior
 *
 * Run with: node src/modules/zoningIntelligence/__tests__/regrid-api-test.js
 */

import dotenv from 'dotenv';
dotenv.config();

// Test coordinates - trying common trial counties
// Trial tokens typically include: Travis TX, King WA, Hennepin MN, Franklin OH, etc.
const TEST_CASES = [
  {
    name: 'Austin, TX (Travis County)',
    lat: 30.2672,
    lon: -97.7431,
    radius: 50
  },
  {
    name: 'Seattle, WA (King County)',
    lat: 47.6062,
    lon: -122.3321,
    radius: 50
  },
  {
    name: 'Minneapolis, MN (Hennepin County)',
    lat: 44.9778,
    lon: -93.2650,
    radius: 50
  },
  {
    name: 'Columbus, OH (Franklin County)',
    lat: 39.9612,
    lon: -82.9988,
    radius: 50
  },
  {
    name: 'Anchorage, AK',
    lat: 61.2181,
    lon: -149.9003,
    radius: 50
  }
];

// Get token from environment
const REGRID_TOKEN = process.env.VITE_REGRID_TOKEN;

if (!REGRID_TOKEN) {
  console.error('❌ Error: VITE_REGRID_TOKEN not found in environment');
  console.error('Please create a .env file with your Regrid token:');
  console.error('  VITE_REGRID_TOKEN=your_token_here');
  process.exit(1);
}

/**
 * Fetch parcel data by coordinates
 */
async function fetchParcelByPoint(lat, lon, radius = 50) {
  const url = `https://app.regrid.com/api/v2/parcels/point?token=${REGRID_TOKEN}&lat=${lat}&lon=${lon}&radius=${radius}&limit=5`;

  console.log(`\n🔍 Fetching: GET ${url.replace(REGRID_TOKEN, 'TOKEN_HIDDEN')}`);

  const startTime = Date.now();
  const response = await fetch(url);
  const elapsed = Date.now() - startTime;

  console.log(`⏱️  Response time: ${elapsed}ms`);
  console.log(`📊 Status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Analyze parcel response structure
 */
function analyzeResponse(data, testName) {
  console.log(`\n═══════════════════════════════════════`);
  console.log(`📍 Test: ${testName}`);
  console.log(`═══════════════════════════════════════`);

  if (!data.features || data.features.length === 0) {
    console.log('⚠️  No parcels found');
    return;
  }

  console.log(`\n✅ Found ${data.features.length} parcel(s)`);

  // Analyze first parcel in detail
  const parcel = data.features[0];
  const props = parcel.properties;

  console.log('\n📦 Parcel Properties:');
  console.log(`   ID: ${props.id || 'N/A'}`);
  console.log(`   Address: ${props.address || 'N/A'}`);
  console.log(`   City: ${props.city || 'N/A'}, ${props.state || 'N/A'} ${props.zip || 'N/A'}`);
  console.log(`   County: ${props.county || 'N/A'}`);

  console.log('\n🏛️  Zoning Information:');
  console.log(`   zoning: ${props.zoning || 'N/A'}`);
  console.log(`   zoning_description: ${props.zoning_description || 'N/A'}`);
  console.log(`   zoning_type: ${props.zoning_type || 'N/A'} ${props.zoning_type ? '⭐ PREMIUM' : '❌ Not available'}`);
  console.log(`   zoning_subtype: ${props.zoning_subtype || 'N/A'} ${props.zoning_subtype ? '⭐ PREMIUM' : '❌ Not available'}`);
  console.log(`   zoning_code_link: ${props.zoning_code_link || 'N/A'} ${props.zoning_code_link ? '⭐ PREMIUM' : '❌ Not available'}`);
  console.log(`   zoning_id: ${props.zoning_id || 'N/A'} ${props.zoning_id ? '⭐ PREMIUM' : '❌ Not available'}`);

  console.log('\n📐 Geometry:');
  console.log(`   Type: ${parcel.geometry?.type || 'N/A'}`);
  console.log(`   Has coordinates: ${parcel.geometry?.coordinates ? 'Yes' : 'No'}`);

  console.log('\n📋 All Available Fields:');
  const allFields = Object.keys(props).sort();
  console.log(`   Total fields: ${allFields.length}`);
  console.log(`   Fields: ${allFields.slice(0, 20).join(', ')}...`);

  // Check for zoning-related fields
  const zoningFields = allFields.filter(f =>
    f.toLowerCase().includes('zoning') ||
    f.toLowerCase().includes('zone')
  );
  if (zoningFields.length > 0) {
    console.log(`\n🎯 Zoning-related fields found: ${zoningFields.join(', ')}`);
  }

  // Save full response for inspection
  return {
    summary: {
      address: props.address,
      zoning: props.zoning,
      hasPremiumZoning: !!(props.zoning_type || props.zoning_code_link),
      zoningCodeLink: props.zoning_code_link
    },
    fullParcel: parcel
  };
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Regrid API Exploration');
  console.log('================================\n');

  const results = [];

  for (const testCase of TEST_CASES) {
    try {
      const data = await fetchParcelByPoint(
        testCase.lat,
        testCase.lon,
        testCase.radius
      );

      const analysis = analyzeResponse(data, testCase.name);
      results.push({
        testCase,
        success: true,
        analysis
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.log(`\n❌ Error testing ${testCase.name}:`);
      console.log(`   ${error.message}`);
      results.push({
        testCase,
        success: false,
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n\n═══════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════\n');

  const successful = results.filter(r => r.success);
  console.log(`✅ Successful: ${successful.length}/${results.length}`);

  const withPremium = successful.filter(r => r.analysis?.summary.hasPremiumZoning);
  console.log(`⭐ Premium zoning fields: ${withPremium.length}/${successful.length}`);

  const withCodeLink = successful.filter(r => r.analysis?.summary.zoningCodeLink);
  console.log(`🔗 Zoning code links: ${withCodeLink.length}/${successful.length}`);

  if (withCodeLink.length > 0) {
    console.log('\n📝 Sample zoning code links:');
    withCodeLink.forEach(r => {
      console.log(`   ${r.analysis.summary.zoningCodeLink}`);
    });
  }

  // Save detailed results
  const fs = await import('fs');
  const outputPath = './regrid-api-test-results.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Detailed results saved to: ${outputPath}`);
}

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
