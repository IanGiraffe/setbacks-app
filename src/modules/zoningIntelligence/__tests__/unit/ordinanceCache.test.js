/**
 * Unit tests for Ordinance Cache
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OrdinanceCache } from '../../utils/ordinanceCache.js';

describe('OrdinanceCache', () => {
  let cache;

  beforeEach(() => {
    cache = new OrdinanceCache(5000); // 5 second TTL for testing
  });

  describe('Basic Operations', () => {
    it('should store and retrieve ordinance', () => {
      const url = 'https://example.com/ordinance';
      const text = '# Test Ordinance';
      const metadata = { title: 'Test' };

      cache.set(url, text, metadata);
      const result = cache.get(url);

      expect(result).toBeDefined();
      expect(result.text).toBe(text);
      expect(result.metadata.title).toBe('Test');
    });

    it('should check if URL is cached', () => {
      const url = 'https://example.com/ordinance';

      expect(cache.has(url)).toBe(false);

      cache.set(url, 'Content', {});

      expect(cache.has(url)).toBe(true);
    });

    it('should delete cached entry', () => {
      const url = 'https://example.com/ordinance';
      cache.set(url, 'Content', {});

      expect(cache.has(url)).toBe(true);

      cache.delete(url);

      expect(cache.has(url)).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('url1', 'content1', {});
      cache.set('url2', 'content2', {});

      cache.clear();

      expect(cache.has('url1')).toBe(false);
      expect(cache.has('url2')).toBe(false);
    });
  });

  describe('TTL Behavior', () => {
    it('should return null for expired entries', async () => {
      const shortCache = new OrdinanceCache(100); // 100ms TTL
      const url = 'https://example.com/ordinance';

      shortCache.set(url, 'Content', {});
      expect(shortCache.has(url)).toBe(true);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(shortCache.has(url)).toBe(false);
      expect(shortCache.get(url)).toBeNull();
    });

    it('should remove expired entry on get', async () => {
      const shortCache = new OrdinanceCache(100);
      const url = 'https://example.com/ordinance';

      shortCache.set(url, 'Content', {});

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      shortCache.get(url);

      const stats = shortCache.getStats();
      expect(stats.totalEntries).toBe(0);
    });
  });

  describe('Cache Key Normalization', () => {
    it('should treat URLs case-insensitively', () => {
      cache.set('https://Example.COM/ordinance', 'Content', {});

      expect(cache.has('https://example.com/ordinance')).toBe(true);
      expect(cache.get('https://EXAMPLE.com/ORDINANCE')).toBeDefined();
    });

    it('should trim whitespace from URLs', () => {
      cache.set('  https://example.com/ordinance  ', 'Content', {});

      expect(cache.has('https://example.com/ordinance')).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should return accurate statistics', () => {
      cache.set('url1', 'content1', {});
      cache.set('url2', 'content2', {});

      const stats = cache.getStats();

      expect(stats.totalEntries).toBe(2);
      expect(stats.validEntries).toBe(2);
      expect(stats.invalidEntries).toBe(0);
      expect(stats.ttlMs).toBe(5000);
    });

    it('should count invalid entries correctly', async () => {
      const shortCache = new OrdinanceCache(100);

      shortCache.set('url1', 'content1', {});
      shortCache.set('url2', 'content2', {});

      await new Promise(resolve => setTimeout(resolve, 150));

      shortCache.set('url3', 'content3', {});

      const stats = shortCache.getStats();

      expect(stats.totalEntries).toBe(3);
      expect(stats.validEntries).toBe(1);
      expect(stats.invalidEntries).toBe(2);
    });
  });

  describe('Pruning', () => {
    it('should remove expired entries on prune', async () => {
      const shortCache = new OrdinanceCache(100);

      shortCache.set('url1', 'content1', {});
      shortCache.set('url2', 'content2', {});

      await new Promise(resolve => setTimeout(resolve, 150));

      shortCache.set('url3', 'content3', {});

      const removed = shortCache.prune();

      expect(removed).toBe(2);
      expect(shortCache.has('url1')).toBe(false);
      expect(shortCache.has('url2')).toBe(false);
      expect(shortCache.has('url3')).toBe(true);
    });

    it('should not remove valid entries', () => {
      cache.set('url1', 'content1', {});
      cache.set('url2', 'content2', {});

      const removed = cache.prune();

      expect(removed).toBe(0);
      expect(cache.has('url1')).toBe(true);
      expect(cache.has('url2')).toBe(true);
    });
  });

  describe('Metadata Storage', () => {
    it('should store complex metadata', () => {
      const url = 'https://example.com/ordinance';
      const metadata = {
        title: 'Test Ordinance',
        fetchedAt: new Date().toISOString(),
        description: 'A test ordinance',
        lastModified: '2024-01-01'
      };

      cache.set(url, 'Content', metadata);
      const result = cache.get(url);

      expect(result.metadata.title).toBe('Test Ordinance');
      expect(result.metadata.description).toBe('A test ordinance');
      expect(result.metadata.lastModified).toBe('2024-01-01');
    });

    it('should handle empty metadata', () => {
      const url = 'https://example.com/ordinance';

      cache.set(url, 'Content');
      const result = cache.get(url);

      expect(result.metadata).toBeDefined();
    });
  });
});
