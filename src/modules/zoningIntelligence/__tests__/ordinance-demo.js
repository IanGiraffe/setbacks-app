/**
 * Ordinance Service Demo
 *
 * Demonstrates Phase 3 functionality with mock mode.
 * Run with: node src/modules/zoningIntelligence/__tests__/ordinance-demo.js
 */

import { ordinanceService, OrdinanceService } from '../index.js';

async function demo() {
  console.log('🏗️  Ordinance Service Demo\n');
  console.log('='.repeat(50));

  // Demo 1: Basic usage with mock mode
  console.log('\n📋 Demo 1: Fetching ordinance in mock mode\n');

  const mockService = new OrdinanceService({ mockMode: true });
  const mockUrl = 'https://example.com/zoning-code';

  console.log(`Fetching: ${mockUrl}`);
  const result = await mockService.fetchOrdinance(mockUrl);

  console.log('\n✅ Result:');
  console.log('Text:', result.text);
  console.log('Title:', result.metadata.title);
  console.log('Fetched at:', result.metadata.fetchedAt);
  console.log('Mock mode:', result.metadata.mock);

  // Demo 2: Cache operations
  console.log('\n' + '='.repeat(50));
  console.log('\n📦 Demo 2: Cache operations\n');

  ordinanceService.clearCache();
  console.log('Cache cleared');

  // Fetch same URL twice to demonstrate caching
  console.log('\nFirst fetch (will be cached):');
  const start1 = Date.now();
  await mockService.fetchOrdinance(mockUrl);
  console.log(`Time: ${Date.now() - start1}ms`);

  console.log('\nSecond fetch (from cache):');
  const start2 = Date.now();
  await mockService.fetchOrdinance(mockUrl);
  console.log(`Time: ${Date.now() - start2}ms`);

  console.log('\nCache stats:');
  console.log(mockService.getCacheStats());

  // Demo 3: HTML to Markdown conversion
  console.log('\n' + '='.repeat(50));
  console.log('\n📝 Demo 3: HTML to Markdown conversion\n');

  const sampleHtml = `
    <html>
      <head>
        <title>Zoning Code Chapter 5: Dimensional Regulations</title>
        <meta name="description" content="Setback and height requirements">
      </head>
      <body>
        <h1>Section 5.1: Setbacks</h1>
        <p>All structures must maintain the following minimum setbacks:</p>
        <ul>
          <li><strong>Front yard:</strong> 15 feet</li>
          <li><strong>Side yard:</strong> 5 feet</li>
          <li><strong>Rear yard:</strong> 10 feet</li>
        </ul>
        <h2>Section 5.2: Height Limits</h2>
        <p>Maximum building height is <em>35 feet</em> or <em>2.5 stories</em>.</p>
      </body>
    </html>
  `;

  console.log('Converting HTML to Markdown...\n');
  const markdown = mockService.htmlToMarkdown(sampleHtml);
  console.log('Markdown output:');
  console.log('-'.repeat(50));
  console.log(markdown);
  console.log('-'.repeat(50));

  // Demo 4: Metadata extraction
  console.log('\n' + '='.repeat(50));
  console.log('\n🏷️  Demo 4: Metadata extraction\n');

  const metadata = mockService.extractMetadata(sampleHtml, mockUrl);
  console.log('Extracted metadata:');
  console.log(JSON.stringify(metadata, null, 2));

  // Demo 5: Error handling
  console.log('\n' + '='.repeat(50));
  console.log('\n❌ Demo 5: Error handling\n');

  const testService = new OrdinanceService({ mockMode: false });

  console.log('Testing invalid URL:');
  try {
    await testService.fetchOrdinance('not-a-valid-url');
  } catch (error) {
    console.log(`✅ Caught error: ${error.message} (${error.code})`);
  }

  // Demo 6: Rate limiting
  console.log('\n' + '='.repeat(50));
  console.log('\n⏱️  Demo 6: Rate limiting\n');

  const rateLimitedService = new OrdinanceService({
    mockMode: true,
    requestsPerSecond: 2
  });

  console.log('Fetching 3 URLs with 2 req/sec limit...');
  const startTime = Date.now();

  await rateLimitedService.fetchOrdinance('url1');
  console.log(`Request 1: ${Date.now() - startTime}ms`);

  await rateLimitedService.fetchOrdinance('url2');
  console.log(`Request 2: ${Date.now() - startTime}ms`);

  await rateLimitedService.fetchOrdinance('url3');
  console.log(`Request 3: ${Date.now() - startTime}ms`);

  console.log(`\nTotal time: ${Date.now() - startTime}ms`);

  console.log('\n' + '='.repeat(50));
  console.log('\n🎉 Demo complete!\n');
}

// Run demo
demo().catch(error => {
  console.error('❌ Demo failed:', error);
  process.exit(1);
});
