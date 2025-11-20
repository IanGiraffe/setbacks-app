/**
 * Error Handling Utilities
 *
 * Centralized error handling and logging for the zoning intelligence module.
 */

import { ERROR_TYPES, createError } from '../schemas/index.js';

/**
 * Custom error class for module-specific errors
 */
export class ZoningIntelligenceError extends Error {
  constructor(type, message, originalError = null, context = {}) {
    super(message);
    this.name = 'ZoningIntelligenceError';
    this.type = type;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date();
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * API Error - for external API failures
 */
export class APIError extends Error {
  constructor(message, code = 'API_ERROR', details = {}) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
  }
}

/**
 * Validation Error - for input validation failures
 */
export class ValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.details = details;
    this.timestamp = new Date();
  }
}

/**
 * Handle API errors and convert to standard format
 * @param {Error} error - Original error
 * @param {string} operation - Operation that failed
 * @returns {Object} Standardized error object
 */
export function handleApiError(error, operation) {
  // Network errors
  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return createError(
      ERROR_TYPES.NETWORK_ERROR,
      `Network error during ${operation}`,
      error,
      { operation }
    );
  }

  // API-specific errors
  if (error.response) {
    const status = error.response.status;
    const statusText = error.response.statusText;

    if (status === 404) {
      return createError(
        ERROR_TYPES.NOT_FOUND,
        `Resource not found during ${operation}`,
        error,
        { operation, status }
      );
    }

    if (status === 401 || status === 403) {
      return createError(
        ERROR_TYPES.CONFIG_ERROR,
        'API authentication failed - check your API keys',
        error,
        { operation, status }
      );
    }

    if (status >= 500) {
      return createError(
        ERROR_TYPES.API_ERROR,
        `Server error during ${operation}: ${statusText}`,
        error,
        { operation, status }
      );
    }

    return createError(
      ERROR_TYPES.API_ERROR,
      `API error during ${operation}: ${statusText}`,
      error,
      { operation, status }
    );
  }

  // Generic error fallback
  return createError(
    ERROR_TYPES.API_ERROR,
    `Unexpected error during ${operation}: ${error.message}`,
    error,
    { operation }
  );
}

/**
 * Handle validation errors
 * @param {Array<string>} errors - Array of validation error messages
 * @param {Object} [context] - Additional context
 * @returns {Object} Standardized error object
 */
export function handleValidationError(errors, context = {}) {
  const message = Array.isArray(errors)
    ? `Validation failed: ${errors.join(', ')}`
    : 'Validation failed';

  return createError(
    ERROR_TYPES.VALIDATION_ERROR,
    message,
    null,
    { ...context, validationErrors: errors }
  );
}

/**
 * Handle cache errors
 * @param {Error} error - Original error
 * @param {string} operation - Cache operation that failed
 * @returns {Object} Standardized error object
 */
export function handleCacheError(error, operation) {
  return createError(
    ERROR_TYPES.CACHE_ERROR,
    `Cache operation failed: ${operation}`,
    error,
    { operation }
  );
}

/**
 * Log error to console with context
 * @param {Object|Error} error - Error to log
 * @param {Object} [additionalContext] - Additional context to log
 */
export function logError(error, additionalContext = {}) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    message: error.message || error,
    type: error.type || 'UNKNOWN',
    context: {
      ...error.context,
      ...additionalContext
    }
  };
}

/**
 * Create a user-friendly error message
 * @param {Object} error - Error object
 * @returns {string} User-friendly message
 */
export function getUserFriendlyMessage(error) {
  const typeMessages = {
    [ERROR_TYPES.API_ERROR]: 'Unable to connect to the zoning data service. Please try again.',
    [ERROR_TYPES.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
    [ERROR_TYPES.INVALID_INPUT]: 'Invalid input provided. Please check your data and try again.',
    [ERROR_TYPES.NOT_FOUND]: 'No zoning data found for this location.',
    [ERROR_TYPES.CONFIG_ERROR]: 'Configuration error. Please check your API keys.',
    [ERROR_TYPES.CACHE_ERROR]: 'Cache error occurred. Data will be fetched fresh.',
    [ERROR_TYPES.VALIDATION_ERROR]: 'Data validation failed. Please check your inputs.'
  };

  return typeMessages[error.type] || 'An unexpected error occurred. Please try again.';
}

/**
 * Retry wrapper for operations that may fail
 * @param {Function} operation - Async operation to retry
 * @param {number} [maxRetries=3] - Maximum retry attempts
 * @param {number} [delayMs=1000] - Delay between retries
 * @returns {Promise<*>} Operation result
 */
export async function withRetry(operation, maxRetries = 3, delayMs = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
}

/**
 * Safe async wrapper that catches and logs errors
 * @param {Function} operation - Async operation
 * @param {*} [fallbackValue=null] - Value to return on error
 * @returns {Promise<*>} Operation result or fallback
 */
export async function safeAsync(operation, fallbackValue = null) {
  try {
    return await operation();
  } catch (error) {
    logError(error);
    return fallbackValue;
  }
}
