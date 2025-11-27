import { Sparkles, Coffee, Link2 } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationProvider } from './contexts/NotificationContext';
import { UrlProvider } from './contexts/UrlContext';
import { NotificationContainer } from './components/NotificationContainer';
import { UrlShortenerForm } from './components/UrlShortenerForm';
import { ShortenedUrlDisplay } from './components/ShortenedUrlDisplay';
import { UrlList } from './components/UrlList';
import { useUrl } from './contexts/UrlContext';
import { useOnlineStatus } from './hooks/useOnlineStatus';

/**
 * Main app content with offline detection
 */
function AppContent() {
  const { lastShortenedUrl } = useUrl();
  const isOnline = useOnlineStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Offline indicator */}
      {!isOnline && (
        <div 
          className="bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium"
          role="alert"
          aria-live="assertive"
        >
        You are currently offline. Some features may not work.
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Link2 className="w-8 h-8" aria-hidden="true" />
            <span>URL Shortener</span>
          </h1>
          <p className="text-gray-600 mb-4">
            Create short, memorable links in seconds
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">How it works:</span> Enter a long URL, get a short link.
              When someone clicks your short link, they're automatically redirected to the original URL
              and the click is tracked!
            </p>
          </div>
        </header>

        <main className="max-w-8xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side - Form and Success Message */}
            <div className="space-y-6">
              <UrlShortenerForm />

              {lastShortenedUrl && (
                <ShortenedUrlDisplay shortUrl={lastShortenedUrl} />
              )}
            </div>

            {/* Right side - URL List (takes 2 columns) */}
            <div className="lg:col-span-2">
              <UrlList />
            </div>
          </div>
        </main>

        <footer className="text-center mt-12 text-gray-600 text-sm">
          <p className="flex items-center justify-center gap-1.5">
            Crafted with a lot of coffee 
            <Coffee className="w-4 h-4 inline" aria-hidden="true" />. 
            Built with React, TypeScript & Symfony magic 
            <Sparkles className="w-4 h-4 inline" aria-hidden="true" />. 
          </p>
        </footer>
      </div>

      {/* Notification system */}
      <NotificationContainer />
    </div>
  );
}

/**
 * Root App component with all providers and error boundary
 */
function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // In production, send to error tracking service (e.g., Sentry)
        if (import.meta.env.PROD) {
          console.error('Error boundary caught:', error, errorInfo);
          // Example: Sentry.captureException(error, { extra: errorInfo });
        }
      }}
    >
      <NotificationProvider>
        <UrlProvider>
          <AppContent />
        </UrlProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
