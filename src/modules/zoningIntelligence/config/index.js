/**
 * Zoning Intelligence Module Configuration
 *
 * Manages API keys and configuration for external services.
 * Uses environment variables for secure credential storage.
 */

/**
 * Module configuration
 * @typedef {Object} ZoningConfig
 * @property {Object} regrid - Regrid API configuration
 * @property {string} regrid.token - Regrid API token
 * @property {string} regrid.baseUrl - Base URL for Regrid tiles
 * @property {Object} claude - Claude API configuration
 * @property {string} claude.apiKey - Claude API key
 * @property {string} claude.model - Claude model version to use
 * @property {Object} cache - Cache configuration
 * @property {number} cache.ttl - Time-to-live for cached data (milliseconds)
 * @property {number} cache.maxSize - Maximum cache entries
 */

/**
 * Get environment variable - works in both Node.js and Vite
 * @param {string} key - Environment variable key
 * @returns {string|undefined}
 */
function getEnvVar(key) {
  // Vite environment (browser/build)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  // Node.js environment (tests, server)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

/**
 * Get configuration from environment or fallback to defaults
 * @returns {ZoningConfig}
 */
export function getConfig() {
  return {
    regrid: {
      token: getEnvVar('VITE_REGRID_TOKEN') || '',
      baseUrl: 'https://tiles.regrid.com/api/v1/sources/parcel/layers/cd7da01c214eb04c81a9307dfde8fa60f01b3e4d',
      tilesEndpoint: '{z}/{x}/{y}.mvt'
    },
    claude: {
      apiKey: getEnvVar('VITE_CLAUDE_API_KEY') || '',
      model: 'claude-3-5-sonnet-20241022'
    },
    cache: {
      ttl: 1000 * 60 * 60 * 24, // 24 hours
      maxSize: 100 // Max cached parcels
    }
  };
}

/**
 * Validate that required configuration is present
 * @returns {Object} Validation result with missing keys
 */
export function validateConfig() {
  const config = getConfig();
  const missing = [];

  if (!config.regrid.token) {
    missing.push('VITE_REGRID_TOKEN');
  }
  if (!config.claude.apiKey) {
    missing.push('VITE_CLAUDE_API_KEY');
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

export default getConfig();
