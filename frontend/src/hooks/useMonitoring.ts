import { useEffect } from 'react';

interface PerformanceMetrics {
  name: string;
  duration: number;
  startTime: number;
}

/**
 * Hook for monitoring component performance
 * In production, this would send metrics to a monitoring service
 */
export function usePerformanceMonitor(componentName: string): void {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const metrics: PerformanceMetrics = {
        name: componentName,
        duration,
        startTime,
      };

      // In development, log to console
      if (import.meta.env.DEV) {
        console.log(`[Performance] ${componentName}: ${duration.toFixed(2)}ms`);
      }

      // In production, send to monitoring service
      if (import.meta.env.PROD) {
        // Example: sendToMonitoringService(metrics);
        void metrics; // Suppress unused variable warning
      }
    };
  }, [componentName]);
}

/**
 * Hook for tracking user interactions
 */
export function useAnalytics() {
  const trackEvent = (
    eventName: string,
    properties?: Record<string, unknown>
  ): void => {
    if (import.meta.env.DEV) {
      console.log('[Analytics]', eventName, properties);
    }

    if (import.meta.env.PROD) {
      // Example: analytics.track(eventName, properties);
    }
  };

  const trackPageView = (pageName: string): void => {
    trackEvent('page_view', { page: pageName });
  };

  return {
    trackEvent,
    trackPageView,
  };
}

/**
 * Hook for error tracking
 */
export function useErrorTracking() {
  const captureError = (
    error: Error,
    context?: Record<string, unknown>
  ): void => {
    if (import.meta.env.DEV) {
      console.error('[Error Tracking]', error, context);
    }

    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(error, { extra: context });
    }
  };

  const captureMessage = (
    message: string,
    level: 'info' | 'warning' | 'error' = 'info'
  ): void => {
    if (import.meta.env.DEV) {
      console.log(`[${level.toUpperCase()}]`, message);
    }

    if (import.meta.env.PROD) {
      // Example: Sentry.captureMessage(message, level);
    }
  };

  return {
    captureError,
    captureMessage,
  };
}
