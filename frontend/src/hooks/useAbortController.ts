import { useRef, useCallback, useEffect } from 'react';

interface UseAbortControllerReturn {
  abort: () => void;
  reset: () => void;
}

/**
 * Hook for managing AbortController instances
 * Automatically aborts pending requests on unmount
 */
export function useAbortController(): UseAbortControllerReturn {
  const controllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();
  }, []);

  const abort = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  // Initialize controller
  useEffect(() => {
    reset();
    
    // Cleanup on unmount
    return () => {
      abort();
    };
  }, [abort, reset]);

  return {
    abort,
    reset,
  };
}
