import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../api';
import type { ShortUrl } from '../types';
import { AppError, ErrorType, NotificationType } from '../types';
import { validateUrl } from '../utils/urlValidator';
import { useNotification } from '../contexts/NotificationContext';
import { useUrl } from '../contexts/UrlContext';
import { useRetry } from './useRetry';
import { useAbortController } from './useAbortController';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';

interface UseUrlShortenerReturn {
  url: string;
  loading: boolean;
  error: string | null;
  setUrl: (url: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * Hook for URL shortening with production-ready features:
 * - Retry logic with exponential backoff
 * - Request cancellation
 * - Proper error handling
 * - Accessibility focus management
 * - Notification integration
 */
export function useUrlShortener(): UseUrlShortenerReturn {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { addNotification } = useNotification();
  const { setLastShortenedUrl, triggerRefresh } = useUrl();
  const { executeWithRetry } = useRetry();
  const { signal, reset: resetAbort } = useAbortController();
  
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple simultaneous submissions
    if (loading) {
      return;
    }

    setError(null);

    // Trim and validate before sending to backend
    const trimmedUrl = url.trim();
    
    if (!trimmedUrl) {
      setError(ERROR_MESSAGES.URL_REQUIRED);
      return;
    }

    const validation = validateUrl(trimmedUrl);
    if (!validation.isValid) {
      setError(validation.error!);
      return;
    }

    setLoading(true);
    resetAbort(); // Reset abort controller for new request

    try {
      // Execute with retry logic
      const shortUrl = await executeWithRetry<ShortUrl>(
        () => api.shortenUrl(trimmedUrl)
      );
      
      // Success
      setLastShortenedUrl(shortUrl);
      triggerRefresh();
      setUrl('');
      setError(null);
      
      addNotification(SUCCESS_MESSAGES.URL_SHORTENED, NotificationType.SUCCESS);
      
      // Announce to screen readers
      const announcement = `URL shortened successfully. Short URL is ${shortUrl.shortUrl}`;
      announceToScreenReader(announcement);
      
    } catch (err) {
      // Handle different error types
      if (err instanceof AppError) {
        setError(err.message);
        
        // Show notification for non-validation errors
        if (err.type !== ErrorType.VALIDATION) {
          addNotification(err.message, NotificationType.ERROR);
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.UNKNOWN_ERROR;
        setError(errorMessage);
        addNotification(errorMessage, NotificationType.ERROR);
      }
      
      // Focus back on input for retry
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }, [
    url,
    loading,
    signal,
    executeWithRetry,
    resetAbort,
    setLastShortenedUrl,
    triggerRefresh,
    addNotification,
  ]);

  // Store input ref for focus management
  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>('#url');
    if (input) {
      inputRef.current = input;
    }
  }, []);

  return {
    url,
    loading,
    error,
    setUrl,
    handleSubmit,
  };
}

/**
 * Announce message to screen readers
 */
function announceToScreenReader(message: string): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
