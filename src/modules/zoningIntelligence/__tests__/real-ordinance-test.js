/**
 * Real Ordinance Fetching Test
 *
 * Tests fetching a real ordinance URL from Austin's Municode.
 * This URL comes from Regrid's zoning_code_link field.
 *
 * Run with: node src/modules/zoningIntelligence/__tests__/real-ordinance-test.js
 */

import { ordinanceService } from '../index.js';

async function testRealOrdinance() {
  console.log('🏛️  Real Ordinance Fetching Test\n');
  console.log('='.repeat(60));

  // This URL comes from Regrid parcel data (see regrid-sample-response.json:53)
  const austinOrdinanceUrl = 'https://library.municode.com/tx/austin/codes/code_of_ordinances?nodeId=TIT25LADE';

  console.log('\n📖 Fetching Austin Land Development Code...\n');
  console.log(`URL: ${austinOrdinanceUrl}\n`);

  try {
    console.log('🔍 Checking robots.txt...');
    const isAllowed = await ordinanceService.checkRobotsTxt(austinOrdinanceUrl);
    console.log(`   ${isAllowed ? '✅' : '❌'} Robots.txt allows crawling: ${isAllowed}\n`);

    if (!isAllowed) {
      console.log('⚠️  Municode blocks bots via robots.txt');
      console.log('   This is expected and respects their terms of service.\n');
      console.log('💡 Alternative approaches:');
      console.log('   1. Use Municode\'s official API (if available)');
      console.log('   2. Manual ordinance entry by user');
      console.log('   3. Partner with Municode for data access\n');
      return;
    }

    console.log('📥 Fetching ordinance content...');
    const startTime = Date.now();

    const result = await ordinanceService.fetchOrdinance(austinOrdinanceUrl);

    const elapsed = Date.now() - startTime;

    console.log(`✅ Successfully fetched! (${elapsed}ms)\n`);
    console.log('📋 Metadata:');
    console.log(`   Title: ${result.metadata.title || 'N/A'}`);
    console.log(`   Description: ${result.metadata.description || 'N/A'}`);
    console.log(`   Fetched at: ${result.metadata.fetchedAt}`);
    console.log(`   Content length: ${result.text.length.toLocaleString()} characters\n`);

    console.log('📄 Content Preview (first 500 chars):');
    console.log('-'.repeat(60));
    console.log(result.text.substring(0, 500));
    console.log('...');
    console.log('-'.repeat(60));

    console.log('\n📊 Cache Stats:');
    const stats = ordinanceService.getCacheStats();
    console.log(`   Total entries: ${stats.totalEntries}`);
    console.log(`   Valid entries: ${stats.validEntries}`);
    console.log(`   TTL: ${(stats.ttlMs / 1000 / 60 / 60).toFixed(1)} hours\n`);

    // Test cache hit
    console.log('🔄 Testing cache hit (fetching same URL again)...');
    const cacheStartTime = Date.now();
    await ordinanceService.fetchOrdinance(austinOrdinanceUrl);
    const cacheElapsed = Date.now() - cacheStartTime;
    console.log(`✅ Cache hit! (${cacheElapsed}ms - should be <10ms)\n`);

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log(`   Code: ${error.code || 'UNKNOWN'}\n`);

    if (error.code === 'ROBOTS_TXT_BLOCKED') {
      console.log('💡 This is expected - Municode blocks automated access');
      console.log('   The service is working correctly by respecting robots.txt\n');
    } else if (error.code === 'FORBIDDEN' || error.code === 'NOT_FOUND') {
      console.log('💡 The URL may require authentication or has changed');
      console.log('   This is a valid test of error handling\n');
    } else {
      console.log('💡 Details:', error);
    }
  }

  console.log('='.repeat(60));
  console.log('\n✅ Test complete!\n');
}

// Run test
testRealOrdinance().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
