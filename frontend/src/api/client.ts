import type { ShortUrl, PaginatedResponse, ApiErrorResponse } from '../types';
import { AppError, ErrorType } from '../types';
import { API_CONFIG, ERROR_MESSAGES } from '../constants';

/**
 * Production-ready API client with retry logic, timeout, and proper error handling
 */
class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_CONFIG.BASE_URL, timeout: number = API_CONFIG.TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Make a fetch request with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = this.timeout
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AppError(
          ERROR_MESSAGES.TIMEOUT_ERROR,
          ErrorType.NETWORK,
          408,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Handle API errors with proper error types
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: ApiErrorResponse = {};
      
      try {
        errorData = await response.json();
      } catch {
        // Response body might not be JSON
      }

      const message = errorData.message || errorData.error || ERROR_MESSAGES.UNKNOWN_ERROR;

      // Map HTTP status codes to error types
      let errorType: ErrorType;
      switch (response.status) {
        case 400:
        case 422:
          errorType = ErrorType.VALIDATION;
          break;
        case 404:
          errorType = ErrorType.NOT_FOUND;
          break;
        case 429:
          errorType = ErrorType.RATE_LIMIT;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorType = ErrorType.SERVER;
          break;
        default:
          errorType = ErrorType.UNKNOWN;
      }

      throw new AppError(message, errorType, response.status, errorData);
    }

    return response.json();
  }

  /**
   * Shorten a URL
   */
  async shortenUrl(url: string, signal?: AbortSignal): Promise<ShortUrl> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/urls/shorten`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
          signal,
        }
      );

      return this.handleResponse<ShortUrl>(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      // Network or unknown errors
      if (error instanceof TypeError) {
        throw new AppError(
          ERROR_MESSAGES.NETWORK_ERROR,
          ErrorType.NETWORK,
          undefined,
          error
        );
      }

      throw new AppError(
        ERROR_MESSAGES.UNKNOWN_ERROR,
        ErrorType.UNKNOWN,
        undefined,
        error
      );
    }
  }

  /**
   * Get all URLs with pagination
   */
  async getAllUrls(
    page: number = 1,
    limit: number = API_CONFIG.DEFAULT_PAGE_SIZE,
    signal?: AbortSignal
  ): Promise<PaginatedResponse> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/urls?page=${page}&limit=${limit}`,
        { signal }
      );

      return this.handleResponse<PaginatedResponse>(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof TypeError) {
        throw new AppError(
          ERROR_MESSAGES.NETWORK_ERROR,
          ErrorType.NETWORK,
          undefined,
          error
        );
      }

      throw new AppError(
        ERROR_MESSAGES.UNKNOWN_ERROR,
        ErrorType.UNKNOWN,
        undefined,
        error
      );
    }
  }

  /**
   * Get URL statistics by short code
   */
  async getUrlStats(shortCode: string, signal?: AbortSignal): Promise<ShortUrl> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/urls/${shortCode}/stats`,
        { signal }
      );

      return this.handleResponse<ShortUrl>(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof TypeError) {
        throw new AppError(
          ERROR_MESSAGES.NETWORK_ERROR,
          ErrorType.NETWORK,
          undefined,
          error
        );
      }

      throw new AppError(
        ERROR_MESSAGES.UNKNOWN_ERROR,
        ErrorType.UNKNOWN,
        undefined,
        error
      );
    }
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export class for testing
export { ApiClient };
