/**
 * Ordinance Fetching Service
 *
 * Handles fetching, caching, and parsing of zoning ordinance documents.
 */

import TurndownService from 'turndown';
import robotsParser from 'robots-parser';
import ordinanceCache from '../utils/ordinanceCache.js';
import { APIError } from '../utils/errors.js';

/**
 * Rate limiter for ordinance fetching
 */
class RateLimiter {
  constructor(requestsPerSecond = 1) {
    this.minDelay = 1000 / requestsPerSecond;
    this.lastRequestTime = 0;
  }

  /**
   * Wait until next request is allowed
   */
  async waitIfNeeded() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minDelay) {
      const waitTime = this.minDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }
}

class OrdinanceService {
  constructor(options = {}) {
    this.rateLimiter = new RateLimiter(options.requestsPerSecond || 1);
    this.maxRetries = options.maxRetries || 3;
    this.retryDelayMs = options.retryDelayMs || 1000;
    this.mockMode = options.mockMode || false;
    this.userAgent = options.userAgent || 'ZoningIntelligenceBot/1.0 (Setbacks App; +https://github.com/your-repo)';
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    this.robotsCache = new Map();
  }

  /**
   * Check robots.txt for URL
   * @param {string} url - URL to check
   * @returns {Promise<boolean>} True if allowed
   */
  async checkRobotsTxt(url) {
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

      // Check cache
      if (this.robotsCache.has(robotsUrl)) {
        const robots = this.robotsCache.get(robotsUrl);
        return robots.isAllowed(url, this.userAgent);
      }

      // Fetch robots.txt
      const response = await fetch(robotsUrl);
      const robotsTxt = response.ok ? await response.text() : '';

      const robots = robotsParser(robotsUrl, robotsTxt);
      this.robotsCache.set(robotsUrl, robots);

      return robots.isAllowed(url, this.userAgent);
    } catch (error) {
      // If robots.txt fails, allow by default
      console.warn(`Failed to fetch robots.txt for ${url}:`, error.message);
      return true;
    }
  }

  /**
   * Extract metadata from HTML
   * @param {string} html - HTML content
   * @param {string} url - Source URL
   * @returns {Object} Metadata
   */
  extractMetadata(html, url) {
    const metadata = {
      url,
      fetchedAt: new Date().toISOString()
    };

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    // Extract last modified from meta tags
    const lastModifiedMatch = html.match(/<meta[^>]+name=["']last-modified["'][^>]+content=["']([^"']+)["']/i);
    if (lastModifiedMatch) {
      metadata.lastModified = lastModifiedMatch[1];
    }

    // Extract description
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    if (descMatch) {
      metadata.description = descMatch[1].trim();
    }

    return metadata;
  }

  /**
   * Convert HTML to Markdown
   * @param {string} html - HTML content
   * @returns {string} Markdown text
   */
  htmlToMarkdown(html) {
    try {
      return this.turndownService.turndown(html);
    } catch (error) {
      console.warn('Failed to convert HTML to Markdown:', error.message);
      // Fallback: strip HTML tags
      return html.replace(/<[^>]*>/g, '');
    }
  }

  /**
   * Fetch ordinance with retry logic
   * @param {string} url - Ordinance URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  async fetchWithRetry(url, options = {}) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.rateLimiter.waitIfNeeded();

        const response = await fetch(url, {
          ...options,
          headers: {
            'User-Agent': this.userAgent,
            ...options.headers
          }
        });

        // Only retry on transient errors (500s, timeouts)
        if (response.ok || response.status < 500) {
          return response;
        }

        lastError = new Error(`Server error: ${response.status} ${response.statusText}`);
        console.warn(`Attempt ${attempt}/${this.maxRetries} failed with status ${response.status}`);
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt}/${this.maxRetries} failed:`, error.message);
      }

      // Wait before retrying with exponential backoff
      if (attempt < this.maxRetries) {
        const backoffDelay = this.retryDelayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }

    throw lastError;
  }

  /**
   * Fetch ordinance from URL
   * @param {string} url - Ordinance URL
   * @param {Object} options - Options
   * @param {boolean} options.useCache - Use cached version if available (default: true)
   * @param {boolean} options.checkRobots - Check robots.txt (default: true)
   * @returns {Promise<Object>} { text, metadata }
   */
  async fetchOrdinance(url, options = {}) {
    const { useCache = true, checkRobots = true } = options;

    // Mock mode
    if (this.mockMode) {
      return {
        text: `# Mock Ordinance\n\nThis is a mock ordinance for ${url}`,
        metadata: {
          url,
          title: 'Mock Ordinance',
          fetchedAt: new Date().toISOString(),
          mock: true
        }
      };
    }

    // Check cache first
    if (useCache && ordinanceCache.has(url)) {
      console.log(`Cache hit for ${url}`);
      return ordinanceCache.get(url);
    }

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      throw new APIError(`Invalid URL: ${url}`, 'INVALID_URL', { url });
    }

    // Check robots.txt
    if (checkRobots) {
      const allowed = await this.checkRobotsTxt(url);
      if (!allowed) {
        throw new APIError(
          `Fetching ${url} is disallowed by robots.txt`,
          'ROBOTS_TXT_BLOCKED',
          { url }
        );
      }
    }

    // Fetch ordinance
    let response;
    try {
      response = await this.fetchWithRetry(url);
    } catch (error) {
      throw new APIError(
        `Failed to fetch ordinance from ${url}: ${error.message}`,
        'FETCH_FAILED',
        { url, error: error.message }
      );
    }

    // Handle HTTP errors
    if (!response.ok) {
      const errorCode = {
        404: 'NOT_FOUND',
        403: 'FORBIDDEN',
        401: 'UNAUTHORIZED',
        500: 'SERVER_ERROR'
      }[response.status] || 'HTTP_ERROR';

      throw new APIError(
        `HTTP ${response.status}: ${response.statusText}`,
        errorCode,
        { url, status: response.status }
      );
    }

    // Get HTML content
    const html = await response.text();

    // Extract metadata
    const metadata = this.extractMetadata(html, url);

    // Convert to Markdown
    const text = this.htmlToMarkdown(html);

    // Cache result
    ordinanceCache.set(url, text, metadata);

    return { text, metadata };
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return ordinanceCache.getStats();
  }

  /**
   * Clear cache
   */
  clearCache() {
    ordinanceCache.clear();
  }

  /**
   * Prune expired cache entries
   * @returns {number} Number of entries removed
   */
  pruneCache() {
    return ordinanceCache.prune();
  }
}

export default OrdinanceService;
