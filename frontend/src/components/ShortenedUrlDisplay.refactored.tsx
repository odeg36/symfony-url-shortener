import { memo } from 'react';
import type { ShortUrl } from '../types';
import { NotificationType } from '../types';
import { useClipboard } from '../hooks/useClipboard';
import { useNotification } from '../contexts/NotificationContext';
import { SUCCESS_MESSAGES } from '../constants';

interface ShortenedUrlDisplayProps {
  shortUrl: ShortUrl;
}

/**
 * Displays shortened URL with accessibility and UX improvements
 * - Proper ARIA labels
 * - Keyboard navigation
 * - Copy feedback
 * - Screen reader announcements
 */
export const ShortenedUrlDisplay = memo(function ShortenedUrlDisplay({ 
  shortUrl 
}: ShortenedUrlDisplayProps) {
  const { copied, copyToClipboard } = useClipboard();
  const { addNotification } = useNotification();
  
  const handleCopy = async () => {
    const success = await copyToClipboard(shortUrl.shortUrl, shortUrl.shortCode);
    if (success) {
      addNotification(SUCCESS_MESSAGES.URL_COPIED, NotificationType.SUCCESS, 2000);
    }
  };

  const isCopied = copied[shortUrl.shortCode] || false;

  return (
    <div 
      className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8"
      role="region"
      aria-label="Successfully shortened URL"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            ✅ URL Shortened Successfully!
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600 mb-1">Original URL:</p>
              <p className="text-sm text-gray-800 break-all">
                {shortUrl.originalUrl}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Shortened URL:</p>
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={shortUrl.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium break-all focus-visible-ring rounded"
                  aria-label={`Short URL: ${shortUrl.shortUrl}. Opens in new window`}
                >
                  {shortUrl.shortUrl}
                </a>
                
                <button
                  onClick={handleCopy}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm transition-colors whitespace-nowrap focus-visible-ring"
                  aria-label={isCopied ? 'URL copied to clipboard' : 'Copy URL to clipboard'}
                  aria-live="polite"
                >
                  {isCopied ? '✓ Copied!' : '📋 Copy'}
                </button>
                
                <a
                  href={shortUrl.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors whitespace-nowrap focus-visible-ring"
                  aria-label="Test redirect in new window"
                >
                  🔗 Test Redirect
                </a>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ Click the link above to be redirected to {shortUrl.originalUrl}
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-gray-600">Short Code: </span>
                <span 
                  className="font-mono font-medium bg-gray-100 px-2 py-1 rounded"
                  role="text"
                  aria-label={`Short code: ${shortUrl.shortCode}`}
                >
                  {shortUrl.shortCode}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Clicks: </span>
                <span 
                  className="font-semibold text-green-600"
                  aria-label={`${shortUrl.clicks} clicks`}
                >
                  {shortUrl.clicks}
                </span>
                <span className="text-xs text-gray-500 ml-1">
                  (updated on each redirect)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
