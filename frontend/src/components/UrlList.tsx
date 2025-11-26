import { useEffect, useState, useCallback, memo, useMemo } from 'react';
import { api } from '../api';
import type { PaginatedResponse, ShortUrl } from '../types';
import { AppError, NotificationType } from '../types';
import { useNotification } from '../contexts/NotificationContext';
import { useUrl } from '../contexts/UrlContext';
import { useRetry } from '../hooks/useRetry';
import { useClipboard } from '../hooks/useClipboard';
import { SUCCESS_MESSAGES, LOADING_MESSAGES } from '../constants';

/**
 * URL list with:
 * - Pagination
 * - Retry logic
 * - Error handling
 * - Accessibility features
 * - Performance optimizations (memo, useMemo, useCallback)
 * - Loading states
 */
export const UrlList = memo(function UrlList() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { addNotification } = useNotification();
  const { refreshKey } = useUrl();
  const { executeWithRetry } = useRetry();
  const { copied, copyToClipboard } = useClipboard();

  const loadUrls = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await executeWithRetry(() => api.getAllUrls(page, 10));
      setData(response);
    } catch (err) {
      const errorMessage = err instanceof AppError 
        ? err.message 
        : 'Failed to load URLs';
      setError(errorMessage);
      addNotification(errorMessage, NotificationType.ERROR);
    } finally {
      setLoading(false);
    }
  }, [executeWithRetry, addNotification]);

  useEffect(() => {
    loadUrls(currentPage);
  }, [currentPage, refreshKey, loadUrls]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    
    // Announce page change to screen readers
    setTimeout(() => {
      const element = document.querySelector('[role="status"][aria-live="polite"]');
      if (element) {
        element.textContent = `Page ${page} loaded`;
      }
    }, 500);
  }, []);

  const handleCopy = useCallback(async (url: ShortUrl) => {
    const success = await copyToClipboard(url.shortUrl, url.shortCode);
    if (success) {
      addNotification(SUCCESS_MESSAGES.URL_COPIED, NotificationType.SUCCESS, 2000);
    }
  }, [copyToClipboard, addNotification]);

  // Memoize table rows to prevent unnecessary re-renders
  const tableRows = useMemo(() => {
    if (!data?.data) return null;

    return data.data.map((url) => (
      <UrlRow 
        key={url.shortCode} 
        url={url} 
        isCopied={copied[url.shortCode] || false}
        onCopy={handleCopy}
      />
    ));
  }, [data?.data, copied, handleCopy]);

  if (loading && !data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6" role="status" aria-live="polite">
        <p className="text-center text-gray-600">
          {LOADING_MESSAGES.FETCHING_URLS}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6" role="alert">
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => loadUrls(currentPage)}
          className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 focus-visible-ring"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-600">
          No shortened URLs yet. Create one above!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
      />
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          All Shortened URLs
        </h2>
        <button
          onClick={() => loadUrls(currentPage)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm focus-visible-ring"
          aria-label="Refresh URL list"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Short Code
              </th>
              <th 
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Original URL
              </th>
              <th 
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Short URL
              </th>
              <th 
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Clicks
              </th>
              <th 
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableRows}
          </tbody>
        </table>
      </div>

      {data.pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
});

/**
 * Memoized table row component
 */
const UrlRow = memo(function UrlRow({ 
  url, 
  isCopied, 
  onCopy 
}: { 
  url: ShortUrl; 
  isCopied: boolean;
  onCopy: (url: ShortUrl) => void;
}) {
  const formattedDate = useMemo(() => {
    return new Date(url.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [url.createdAt]);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="font-mono text-sm font-medium text-blue-600">
          {url.shortCode}
        </span>
      </td>
      <td className="px-4 py-4">
        <div 
          className="text-sm text-gray-900 max-w-xs truncate" 
          title={url.originalUrl}
        >
          {url.originalUrl}
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <a
            href={url.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline focus-visible-ring rounded"
            aria-label={`Short URL ${url.shortUrl}. Opens in new window`}
          >
            {url.shortUrl}
          </a>
          <button
            onClick={() => onCopy(url)}
            className="text-gray-400 hover:text-gray-600 focus-visible-ring rounded p-1"
            title={isCopied ? 'Copied!' : 'Copy to clipboard'}
            aria-label={isCopied ? 'URL copied' : 'Copy URL to clipboard'}
          >
            {isCopied ? '✓' : '📋'}
          </button>
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <span 
            className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
            aria-label={`${url.clicks} clicks`}
          >
            {url.clicks}
          </span>
          {url.clicks > 0 && (
            <span 
              title="This URL has been accessed" 
              aria-label="URL has been accessed"
              className="text-green-500"
            >
              ✓
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
        <time dateTime={url.createdAt}>{formattedDate}</time>
      </td>
    </tr>
  );
});

/**
 * Memoized pagination component
 */
const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  total,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav 
      className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200"
      aria-label="Pagination"
    >
      <div className="text-sm text-gray-600">
        Showing page {currentPage} of {totalPages} ({total} total URLs)
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus-visible-ring"
          aria-label="Go to previous page"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus-visible-ring"
          aria-label="Go to next page"
        >
          Next
        </button>
      </div>
    </nav>
  );
});
