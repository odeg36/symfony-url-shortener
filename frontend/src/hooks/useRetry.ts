import { useCallback, useRef } from 'react';
import type { RetryConfig } from '../types';
import { RETRY_CONFIG } from '../constants';

interface UseRetryReturn {
  executeWithRetry: <T>(
    fn: () => Promise<T>,
    config?: Partial<RetryConfig>
  ) => Promise<T>;
}

/**
 * Hook for executing functions with exponential backoff retry logic
 */
export function useRetry(): UseRetryReturn {
  const abortedRef = useRef(false);

  const wait = useCallback((ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }, []);

  const executeWithRetry = useCallback(async <T,>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> => {
    const {
      maxAttempts = RETRY_CONFIG.maxAttempts,
      initialDelay = RETRY_CONFIG.initialDelay,
      maxDelay = RETRY_CONFIG.maxDelay,
      backoffMultiplier = RETRY_CONFIG.backoffMultiplier,
    } = config;

    let lastError: Error | unknown;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (abortedRef.current) {
        throw new Error('Retry aborted');
      }

      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry on last attempt
        if (attempt === maxAttempts) {
          break;
        }

        // Don't retry on certain error types (e.g., validation errors)
        if (error instanceof Error && error.message.includes('validation')) {
          throw error;
        }

        // Log retry attempt in development
        if (import.meta.env.DEV) {
          console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`);
        }

        // Wait with exponential backoff
        await wait(Math.min(delay, maxDelay));
        delay *= backoffMultiplier;
      }
    }

    throw lastError;
  }, [wait]);

  return {
    executeWithRetry,
  };
}
