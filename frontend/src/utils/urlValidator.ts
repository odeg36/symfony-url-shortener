import type { ValidationResult } from '../types';
import { ERROR_MESSAGES, VALIDATION_RULES } from '../constants';

/**
 * Validate URL with comprehensive checks
 */
export function validateUrl(urlString: string): ValidationResult {
  const trimmedUrl = urlString.trim();

  // Check if empty
  if (!trimmedUrl) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.URL_REQUIRED,
    };
  }

  // Check minimum length
  if (trimmedUrl.length < VALIDATION_RULES.URL_MIN_LENGTH) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.URL_TOO_SHORT,
    };
  }

  // Check maximum length
  if (trimmedUrl.length > VALIDATION_RULES.URL_MAX_LENGTH) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.URL_TOO_LONG,
    };
  }

  // Validate URL format
  try {
    const parsedUrl = new URL(trimmedUrl);

    // Check protocol
    if (!(VALIDATION_RULES.ALLOWED_PROTOCOLS as readonly string[]).includes(parsedUrl.protocol)) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.INVALID_PROTOCOL,
      };
    }

    // Check if has domain
    if (!parsedUrl.hostname || parsedUrl.hostname.length < 3) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.INVALID_DOMAIN,
      };
    }

    // Check for valid domain format (at least one dot)
    if (!parsedUrl.hostname.includes('.') && parsedUrl.hostname !== 'localhost') {
      return {
        isValid: false,
        error: ERROR_MESSAGES.INVALID_DOMAIN,
      };
    }
  } catch {
    return {
      isValid: false,
      error: ERROR_MESSAGES.URL_FORMAT_INVALID,
    };
  }

  return { isValid: true };
}
