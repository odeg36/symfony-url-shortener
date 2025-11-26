import { describe, it, expect } from 'vitest';
import { validateUrl } from '../urlValidator';
import { ERROR_MESSAGES } from '../../constants';

describe('urlValidator', () => {
  describe('validateUrl', () => {
    it('should validate a correct URL', () => {
      const result = validateUrl('https://example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty URLs', () => {
      const result = validateUrl('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ERROR_MESSAGES.URL_REQUIRED);
    });

    it('should reject URLs that are too short', () => {
      const result = validateUrl('http://a');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ERROR_MESSAGES.URL_TOO_SHORT);
    });

    it('should reject URLs that are too long', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2100);
      const result = validateUrl(longUrl);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ERROR_MESSAGES.URL_TOO_LONG);
    });

    it('should reject URLs with invalid protocol', () => {
      const result = validateUrl('ftp://example.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ERROR_MESSAGES.INVALID_PROTOCOL);
    });

    it('should reject URLs with invalid domain', () => {
      const result = validateUrl('https://a');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ERROR_MESSAGES.URL_TOO_SHORT);
    });

    it('should accept localhost', () => {
      const result = validateUrl('http://localhost:8080');
      expect(result.isValid).toBe(true);
    });

    it('should trim whitespace', () => {
      const result = validateUrl('  https://example.com  ');
      expect(result.isValid).toBe(true);
    });

    it('should reject malformed URLs', () => {
      const result = validateUrl('not a url');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ERROR_MESSAGES.URL_TOO_SHORT);
    });
  });
});
