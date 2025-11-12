/**
 * Unit tests for OrdinanceService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import OrdinanceService from '../../services/OrdinanceService.js';
import ordinanceCache from '../../utils/ordinanceCache.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('OrdinanceService', () => {
  let service;

  beforeEach(() => {
    service = new OrdinanceService({ mockMode: false });
    ordinanceCache.clear();
    vi.clearAllMocks();
  });

  describe('Mock Mode', () => {
    it('should return mock data when mockMode is enabled', async () => {
      const mockService = new OrdinanceService({ mockMode: true });
      const result = await mockService.fetchOrdinance('https://example.com/ordinance');

      expect(result.text).toContain('Mock Ordinance');
      expect(result.metadata.mock).toBe(true);
      expect(result.metadata.url).toBe('https://example.com/ordinance');
    });
  });

  describe('Cache Operations', () => {
    it('should return cached result on cache hit', async () => {
      const url = 'https://example.com/ordinance';
      const cachedData = {
        text: '# Cached Ordinance',
        metadata: { title: 'Cached', url }
      };

      ordinanceCache.set(url, cachedData.text, cachedData.metadata);

      const result = await service.fetchOrdinance(url);

      expect(result.text).toBe(cachedData.text);
      expect(result.metadata.title).toBe('Cached');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should fetch fresh data when cache is disabled', async () => {
      const url = 'https://example.com/ordinance';
      const html = '<html><head><title>Test</title></head><body><h1>Content</h1></body></html>';

      ordinanceCache.set(url, 'Cached content', { title: 'Cached' });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => html
      });

      const result = await service.fetchOrdinance(url, { useCache: false });

      expect(fetch).toHaveBeenCalled();
      expect(result.text).toContain('Content');
    });

    it('should cache fetched ordinances', async () => {
      const url = 'https://example.com/ordinance';
      const html = '<html><head><title>Test</title></head><body><h1>Content</h1></body></html>';

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: async () => 'User-agent: *\nAllow: /'
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => html
        });

      await service.fetchOrdinance(url);

      expect(ordinanceCache.has(url)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting between requests', async () => {
      const url1 = 'https://example.com/ordinance1';
      const url2 = 'https://example.com/ordinance2';
      const html = '<html><body>Content</body></html>';

      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => html
      });

      const start = Date.now();
      await service.fetchOrdinance(url1, { checkRobots: false });
      await service.fetchOrdinance(url2, { checkRobots: false });
      const elapsed = Date.now() - start;

      // Should take at least 1 second due to rate limiting
      expect(elapsed).toBeGreaterThanOrEqual(900);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on server errors (500s)', async () => {
      const url = 'https://example.com/ordinance';
      const html = '<html><body>Success</body></html>';

      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => html
        });

      const result = await service.fetchOrdinance(url, { checkRobots: false });

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(result.text).toBeDefined();
    });

    it('should not retry on client errors (404)', async () => {
      const url = 'https://example.com/ordinance';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(
        service.fetchOrdinance(url, { checkRobots: false })
      ).rejects.toThrow('HTTP 404');

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries', async () => {
      const url = 'https://example.com/ordinance';

      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(
        service.fetchOrdinance(url, { checkRobots: false })
      ).rejects.toThrow();

      expect(fetch).toHaveBeenCalledTimes(3); // maxRetries default is 3
    });
  });

  describe('HTML to Markdown Conversion', () => {
    it('should convert HTML to Markdown', async () => {
      const url = 'https://example.com/ordinance';
      const html = '<html><body><h1>Title</h1><p>Paragraph</p></body></html>';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => html
      });

      const result = await service.fetchOrdinance(url, { checkRobots: false });

      expect(result.text).toContain('Title');
      expect(result.text).toContain('Paragraph');
      expect(result.text).not.toContain('<html>');
    });
  });

  describe('Metadata Extraction', () => {
    it('should extract title from HTML', async () => {
      const url = 'https://example.com/ordinance';
      const html = '<html><head><title>Zoning Code Chapter 5</title></head><body>Content</body></html>';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => html
      });

      const result = await service.fetchOrdinance(url, { checkRobots: false });

      expect(result.metadata.title).toBe('Zoning Code Chapter 5');
    });

    it('should extract description from meta tags', async () => {
      const url = 'https://example.com/ordinance';
      const html = '<html><head><meta name="description" content="City zoning regulations"></head><body>Content</body></html>';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => html
      });

      const result = await service.fetchOrdinance(url, { checkRobots: false });

      expect(result.metadata.description).toBe('City zoning regulations');
    });

    it('should include fetchedAt timestamp', async () => {
      const url = 'https://example.com/ordinance';
      const html = '<html><body>Content</body></html>';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => html
      });

      const result = await service.fetchOrdinance(url, { checkRobots: false });

      expect(result.metadata.fetchedAt).toBeDefined();
      expect(new Date(result.metadata.fetchedAt)).toBeInstanceOf(Date);
    });
  });

  describe('Robots.txt Handling', () => {
    it('should respect robots.txt allow rules', async () => {
      const url = 'https://example.com/ordinance';
      const robotsTxt = 'User-agent: *\nAllow: /';
      const html = '<html><body>Content</body></html>';

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: async () => robotsTxt
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => html
        });

      const result = await service.fetchOrdinance(url);

      expect(result.text).toBeDefined();
    });

    it('should respect robots.txt disallow rules', async () => {
      const url = 'https://example.com/ordinance';
      const robotsTxt = 'User-agent: *\nDisallow: /';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => robotsTxt
      });

      await expect(
        service.fetchOrdinance(url)
      ).rejects.toThrow('disallowed by robots.txt');
    });

    it('should allow fetching if robots.txt fails', async () => {
      const url = 'https://example.com/ordinance';
      const html = '<html><body>Content</body></html>';

      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => html
        });

      const result = await service.fetchOrdinance(url);

      expect(result.text).toBeDefined();
    });

    it('should skip robots.txt check when disabled', async () => {
      const url = 'https://example.com/ordinance';
      const html = '<html><body>Content</body></html>';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => html
      });

      const result = await service.fetchOrdinance(url, { checkRobots: false });

      expect(result.text).toBeDefined();
      expect(fetch).toHaveBeenCalledTimes(1); // Only ordinance fetch, no robots.txt
    });
  });

  describe('Error Handling', () => {
    it('should throw APIError for invalid URLs', async () => {
      await expect(
        service.fetchOrdinance('not-a-url')
      ).rejects.toThrow('Invalid URL');
    });

    it('should throw APIError for 404 responses', async () => {
      const url = 'https://example.com/ordinance';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(
        service.fetchOrdinance(url, { checkRobots: false })
      ).rejects.toThrow('404');
    });

    it('should throw APIError for 403 responses', async () => {
      const url = 'https://example.com/ordinance';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      await expect(
        service.fetchOrdinance(url, { checkRobots: false })
      ).rejects.toThrow('403');
    });

    it('should throw APIError on network failures', async () => {
      const url = 'https://example.com/ordinance';

      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(
        service.fetchOrdinance(url, { checkRobots: false })
      ).rejects.toThrow('Failed to fetch ordinance');
    });
  });

  describe('Cache Management', () => {
    it('should return cache statistics', () => {
      ordinanceCache.set('url1', 'text1', {});
      ordinanceCache.set('url2', 'text2', {});

      const stats = service.getCacheStats();

      expect(stats.totalEntries).toBeGreaterThanOrEqual(2);
      expect(stats.validEntries).toBeGreaterThanOrEqual(2);
    });

    it('should clear cache', () => {
      ordinanceCache.set('url1', 'text1', {});
      service.clearCache();

      const stats = service.getCacheStats();
      expect(stats.totalEntries).toBe(0);
    });

    it('should prune expired entries', async () => {
      const shortTtlCache = new (await import('../../utils/ordinanceCache.js')).OrdinanceCache(100);
      shortTtlCache.set('url1', 'text1', {});

      await new Promise(resolve => setTimeout(resolve, 150));

      const removed = shortTtlCache.prune();
      expect(removed).toBe(1);
    });
  });
});
