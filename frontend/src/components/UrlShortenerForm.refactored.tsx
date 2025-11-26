import { memo } from 'react';
import { LOADING_MESSAGES } from '../constants';
import { useUrlShortener } from '../hooks/useUrlShortener.refactored';

/**
 * URL shortening form with:
 * - Accessibility features (ARIA labels, roles, live regions)
 * - Keyboard navigation
 * - Loading states
 * - Error handling
 * - Focus management
 */
export const UrlShortenerForm = memo(function UrlShortenerForm() {
  const { url, loading, error, setUrl, handleSubmit } = useUrlShortener();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Shorten a URL
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label 
            htmlFor="url" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Enter URL to shorten
            <span className="text-red-500 ml-1" aria-label="required">*</span>
          </label>
          <input
            type="url"
            id="url"
            name="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/very-long-url"
            required
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'url-error' : undefined}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus-visible-ring disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            autoComplete="url"
          />
        </div>

        {error && (
          <div 
            id="url-error"
            role="alert" 
            aria-live="polite"
            aria-atomic="true"
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
          >
            <span className="sr-only">Error:</span>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !url.trim()}
          aria-busy={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus-visible-ring font-medium"
        >
          {loading ? (
            <>
              <span className="sr-only">{LOADING_MESSAGES.SHORTENING}</span>
              <span aria-hidden="true">
                {LOADING_MESSAGES.SHORTENING}
              </span>
            </>
          ) : (
            'Shorten URL'
          )}
        </button>
      </form>
    </div>
  );
});
