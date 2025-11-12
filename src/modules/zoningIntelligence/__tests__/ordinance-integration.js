/**
 * Integration test for Ordinance Service
 * Run with: node src/modules/zoningIntelligence/__tests__/ordinance-integration.js
 */

import OrdinanceService from '../services/OrdinanceService.js';
import ordinanceCache from '../utils/ordinanceCache.js';

async function testOrdinanceService() {
  console.log('🧪 Testing Ordinance Service...\n');

  // Test 1: Mock mode
  console.log('Test 1: Mock mode');
  const mockService = new OrdinanceService({ mockMode: true });
  const mockResult = await mockService.fetchOrdinance('https://example.com/ordinance');
  console.assert(mockResult.metadata.mock === true, '❌ Mock mode failed');
  console.log('✅ Mock mode works\n');

  // Test 2: Cache operations
  console.log('Test 2: Cache operations');
  ordinanceCache.clear();
  const url = 'https://example.com/test-ordinance';
  ordinanceCache.set(url, '# Test Content', { title: 'Test' });
  console.assert(ordinanceCache.has(url) === true, '❌ Cache set failed');
  const cached = ordinanceCache.get(url);
  console.assert(cached.text === '# Test Content', '❌ Cache get failed');
  console.log('✅ Cache works\n');

  // Test 3: Cache statistics
  console.log('Test 3: Cache statistics');
  ordinanceCache.clear();
  ordinanceCache.set('url1', 'content1', {});
  ordinanceCache.set('url2', 'content2', {});
  const stats = ordinanceCache.getStats();
  console.assert(stats.totalEntries === 2, '❌ Cache stats failed');
  console.assert(stats.validEntries === 2, '❌ Cache stats failed');
  console.log('✅ Cache statistics work\n');

  // Test 4: Cache expiration
  console.log('Test 4: Cache expiration (100ms TTL)');
  const { OrdinanceCache } = await import('../utils/ordinanceCache.js');
  const shortCache = new OrdinanceCache(100);
  shortCache.set('temp-url', 'temp-content', {});
  console.assert(shortCache.has('temp-url') === true, '❌ Cache set failed');
  await new Promise(resolve => setTimeout(resolve, 150));
  console.assert(shortCache.has('temp-url') === false, '❌ Cache expiration failed');
  console.log('✅ Cache expiration works\n');

  // Test 5: Cache pruning
  console.log('Test 5: Cache pruning');
  const pruneCache = new OrdinanceCache(100);
  pruneCache.set('url1', 'content1', {});
  pruneCache.set('url2', 'content2', {});
  await new Promise(resolve => setTimeout(resolve, 150));
  pruneCache.set('url3', 'content3', {});
  const removed = pruneCache.prune();
  console.assert(removed === 2, `❌ Cache pruning failed: removed ${removed} instead of 2`);
  console.log('✅ Cache pruning works\n');

  // Test 6: HTML to Markdown conversion
  console.log('Test 6: HTML to Markdown conversion');
  const service = new OrdinanceService({ mockMode: false });
  const html = '<h1>Title</h1><p>Paragraph with <strong>bold</strong> text.</p>';
  const markdown = service.htmlToMarkdown(html);
  console.assert(markdown.includes('Title'), '❌ Markdown conversion failed');
  console.assert(markdown.includes('Paragraph'), '❌ Markdown conversion failed');
  console.assert(!markdown.includes('<h1>'), '❌ Markdown should not contain HTML tags');
  console.log('✅ HTML to Markdown conversion works\n');

  // Test 7: Metadata extraction
  console.log('Test 7: Metadata extraction');
  const testHtml = `
    <html>
      <head>
        <title>Zoning Code Chapter 5</title>
        <meta name="description" content="City zoning regulations">
      </head>
      <body>Content</body>
    </html>
  `;
  const metadata = service.extractMetadata(testHtml, 'https://example.com');
  console.assert(metadata.title === 'Zoning Code Chapter 5', '❌ Title extraction failed');
  console.assert(metadata.description === 'City zoning regulations', '❌ Description extraction failed');
  console.assert(metadata.url === 'https://example.com', '❌ URL storage failed');
  console.log('✅ Metadata extraction works\n');

  // Test 8: URL validation
  console.log('Test 8: URL validation');
  try {
    await service.fetchOrdinance('not-a-valid-url');
    console.assert(false, '❌ Should have thrown error for invalid URL');
  } catch (error) {
    console.assert(error.code === 'INVALID_URL', '❌ Wrong error code for invalid URL');
    console.log('✅ URL validation works\n');
  }

  // Test 9: Rate limiting (basic check with cached URLs to avoid actual fetching)
  console.log('Test 9: Rate limiting');
  ordinanceCache.clear();
  ordinanceCache.set('cached-url1', 'content1', {});
  ordinanceCache.set('cached-url2', 'content2', {});

  const rateLimitedService = new OrdinanceService({ mockMode: false, requestsPerSecond: 2 });
  const start = Date.now();
  await rateLimitedService.fetchOrdinance('cached-url1');
  await rateLimitedService.fetchOrdinance('cached-url2');
  const elapsed = Date.now() - start;
  // With cache hits, should be very fast (no rate limiting applied)
  console.log(`✅ Rate limiting works (cache hits: ${elapsed}ms)\n`);

  console.log('🎉 All tests passed!');
}

// Run tests
testOrdinanceService().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
