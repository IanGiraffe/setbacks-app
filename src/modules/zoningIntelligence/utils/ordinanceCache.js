/**
 * Ordinance Caching Utility
 *
 * Simple in-memory cache for ordinance content with TTL support.
 * Future: Migrate to IndexedDB for persistence.
 */

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {string} text - Ordinance text content
 * @property {Object} metadata - Ordinance metadata
 * @property {number} timestamp - Cache timestamp
 * @property {string} url - Original URL
 */

class OrdinanceCache {
  constructor(ttlMs = 24 * 60 * 60 * 1000) { // 24 hour default TTL
    this.cache = new Map();
    this.ttlMs = ttlMs;
  }

  /**
   * Generate cache key from URL
   * @param {string} url - Ordinance URL
   * @returns {string} Cache key
   */
  _getCacheKey(url) {
    return url.toLowerCase().trim();
  }

  /**
   * Check if cache entry is still valid
   * @param {CacheEntry} entry - Cache entry
   * @returns {boolean} True if valid
   */
  _isValid(entry) {
    return entry && (Date.now() - entry.timestamp) < this.ttlMs;
  }

  /**
   * Get ordinance from cache
   * @param {string} url - Ordinance URL
   * @returns {Object|null} Cached ordinance or null
   */
  get(url) {
    const key = this._getCacheKey(url);
    const entry = this.cache.get(key);

    if (!this._isValid(entry)) {
      if (entry) {
        this.cache.delete(key);
      }
      return null;
    }

    return {
      text: entry.text,
      metadata: entry.metadata
    };
  }

  /**
   * Store ordinance in cache
   * @param {string} url - Ordinance URL
   * @param {string} text - Ordinance text content
   * @param {Object} metadata - Ordinance metadata
   */
  set(url, text, metadata = {}) {
    const key = this._getCacheKey(url);
    this.cache.set(key, {
      text,
      metadata,
      timestamp: Date.now(),
      url
    });
  }

  /**
   * Check if URL is in cache
   * @param {string} url - Ordinance URL
   * @returns {boolean} True if cached
   */
  has(url) {
    const key = this._getCacheKey(url);
    const entry = this.cache.get(key);
    return this._isValid(entry);
  }

  /**
   * Remove entry from cache
   * @param {string} url - Ordinance URL
   */
  delete(url) {
    const key = this._getCacheKey(url);
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const validEntries = entries.filter(e => this._isValid(e));

    return {
      totalEntries: this.cache.size,
      validEntries: validEntries.length,
      invalidEntries: this.cache.size - validEntries.length,
      ttlMs: this.ttlMs
    };
  }

  /**
   * Remove expired entries
   * @returns {number} Number of entries removed
   */
  prune() {
    const keysToDelete = [];

    for (const [key, entry] of this.cache.entries()) {
      if (!this._isValid(entry)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }
}

// Singleton instance
const ordinanceCache = new OrdinanceCache();

export default ordinanceCache;
export { OrdinanceCache };
