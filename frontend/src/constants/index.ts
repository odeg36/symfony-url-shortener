import type { RetryConfig } from '../types';

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  TIMEOUT: 30000, // 30 seconds
  DEFAULT_PAGE_SIZE: 2,
} as const;

/**
 * Retry configuration for failed requests
 */
export const RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  // API Errors
  INVALID_URL: 'The URL is invalid. Please enter a valid HTTP or HTTPS URL.',
  URL_NOT_FOUND: 'The shortened URL was not found.',
  SERVER_ERROR: 'A server error occurred. Please try again later.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  
  // Form Validation
  URL_REQUIRED: 'Please enter a URL to shorten.',
  URL_FORMAT_INVALID: 'Please enter a valid URL format (e.g., https://example.com).',
  URL_TOO_SHORT: 'URL is too short. Please enter a valid URL.',
  URL_TOO_LONG: 'URL is too long. Maximum length is 2048 characters.',
  INVALID_PROTOCOL: 'URL must start with http:// or https://',
  INVALID_DOMAIN: 'Invalid domain name.',
  
  // Generic Fallback
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  URL_SHORTENED: 'URL shortened successfully!',
  URL_COPIED: 'URL copied to clipboard!',
} as const;

/**
 * Loading messages
 */
export const LOADING_MESSAGES = {
  SHORTENING: 'Shortening your URL...',
  LOADING: 'Loading...',
  FETCHING_URLS: 'Fetching URLs...',
  RETRYING: 'Retrying...',
} as const;

/**
 * Validation constraints
 */
export const VALIDATION_RULES = {
  URL_MIN_LENGTH: 10,
  URL_MAX_LENGTH: 2048,
  ALLOWED_PROTOCOLS: ['http:', 'https:'] as const,
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  NOTIFICATION_DURATION: 5000, // 5 seconds
  DEBOUNCE_DELAY: 300, // 300ms
  COPY_SUCCESS_DURATION: 2000, // 2 seconds
} as const;

/**
 * Keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  SUBMIT_FORM: 'Enter',
  CLOSE_NOTIFICATION: 'Escape',
  COPY: 'c',
} as const;
