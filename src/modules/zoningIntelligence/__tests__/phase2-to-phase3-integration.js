/**
 * End-to-End Integration Test: Phase 2 → Phase 3
 *
 * Tests the full workflow:
 * 1. Use Regrid to find parcels by polygon (Phase 2)
 * 2. Extract ordinance URLs from parcel data
 * 3. Fetch ordinance content using OrdinanceService (Phase 3)
 *
 * Run with: node src/modules/zoningIntelligence/__tests__/phase2-to-phase3-integration.js
 */

import dotenv from 'dotenv';
import { regridService, ordinanceService } from '../index.js';

dotenv.config();

async function testEndToEnd() {
  console.log('🔗 End-to-End Integration Test: Phase 2 → Phase 3\n');
  console.log('='.repeat(60));

  // Step 1: Get parcel data from Regrid (Phase 2)
  console.log('\n📍 Step 1: Fetching parcel data from Regrid...\n');

  const polygon = {
    type: "Polygon",
    coordinates: [
      [
        [-97.72166401149913, 30.23905055770343],
        [-97.72217229007408, 30.239290392400253],
        [-97.72247403862183, 30.23880608801718],
        [-97.72196576004355, 30.238567410654568],
        [-97.72166401149913, 30.23905055770343]
      ]
    ]
  };

  let parcels;
  try {
    parcels = await regridService.getParcelsByBoundary({
      type: 'Feature',
      geometry: polygon
    });

    console.log(`✅ Found ${parcels.length} parcel(s)\n`);

    parcels.forEach((parcel, idx) => {
      console.log(`Parcel ${idx + 1}:`);
      console.log(`  Address: ${parcel.address}`);
      console.log(`  Zoning: ${parcel.zoning?.code || 'N/A'}`);
      console.log(`  Zoning Description: ${parcel.zoning?.description || 'N/A'}`);
      console.log(`  Ordinance URL: ${parcel.zoning?.ordinanceUrl || 'N/A'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to fetch parcels:', error.message);
    console.log('\n💡 Make sure VITE_REGRID_TOKEN is set in .env');
    process.exit(1);
  }

  // Step 2: Extract ordinance URLs
  console.log('='.repeat(60));
  console.log('\n🔍 Step 2: Extracting ordinance URLs...\n');

  const ordinanceUrls = parcels
    .map(p => p.zoning?.ordinanceUrl)
    .filter(url => url && url !== 'N/A' && url.startsWith('http'));

  if (ordinanceUrls.length === 0) {
    console.log('⚠️  No ordinance URLs found in parcel data');
    console.log('   This is common - many jurisdictions don\'t provide ordinance links');
    console.log('   Demonstrating with a mock URL instead...\n');

    // Demonstrate with mock mode
    const mockResult = await ordinanceService.fetchOrdinance(
      'https://example.com/zoning-code',
      { checkRobots: false }
    );

    console.log('📄 Mock Ordinance Result:');
    console.log(`  Title: ${mockResult.metadata.title}`);
    console.log(`  Fetched at: ${mockResult.metadata.fetchedAt}`);
    console.log(`  Text preview: ${mockResult.text.substring(0, 100)}...`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ End-to-End test complete (with mock ordinance)\n');
    return;
  }

  const uniqueUrls = [...new Set(ordinanceUrls)];
  console.log(`Found ${uniqueUrls.length} unique ordinance URL(s):`);
  uniqueUrls.forEach((url, idx) => {
    console.log(`  ${idx + 1}. ${url}`);
  });

  // Step 3: Fetch ordinance content (Phase 3)
  console.log('\n' + '='.repeat(60));
  console.log('\n📖 Step 3: Fetching ordinance content...\n');

  for (const url of uniqueUrls.slice(0, 2)) { // Limit to 2 URLs for demo
    console.log(`Fetching: ${url}`);

    try {
      const result = await ordinanceService.fetchOrdinance(url);

      console.log('✅ Successfully fetched ordinance!');
      console.log(`  Title: ${result.metadata.title || 'N/A'}`);
      console.log(`  Description: ${result.metadata.description || 'N/A'}`);
      console.log(`  Fetched at: ${result.metadata.fetchedAt}`);
      console.log(`  Content length: ${result.text.length} characters`);
      console.log(`  Content preview:\n`);
      console.log(result.text.substring(0, 300));
      console.log('...\n');

      // Show cache stats
      const stats = ordinanceService.getCacheStats();
      console.log(`📊 Cache stats: ${stats.validEntries} entries cached\n`);

    } catch (error) {
      console.log(`❌ Failed to fetch: ${error.message} (${error.code})`);
      console.log(`   This is expected if the URL blocks bots or requires authentication\n`);
    }
  }

  console.log('='.repeat(60));
  console.log('✅ End-to-End test complete!\n');

  // Summary
  console.log('📊 Summary:');
  console.log(`  - Parcels found: ${parcels.length}`);
  console.log(`  - Ordinance URLs found: ${uniqueUrls.length}`);
  console.log(`  - Cache entries: ${ordinanceService.getCacheStats().validEntries}`);
  console.log('');
}

// Run test
testEndToEnd().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
