import { Lightbulb } from 'lucide-react';
import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      //hasError: true,
      //error: {message: 'Error', name: ''},
      //errorInfo: {componentStack: ''},
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler (e.g., for error reporting service)
    this.props.onError?.(error, errorInfo);

    this.setState({
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error && errorInfo) {
      if (fallback) {
        return fallback(error, errorInfo, this.handleReset);
      }

      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-8 h-8" aria-hidden="true" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Something went wrong
                </h1>
                <p className="text-gray-600 mt-1">
                  We're sorry for the inconvenience. The application encountered an error.
                </p>
              </div>
            </div>

            {import.meta.env.DEV && (
              <div className="mb-6">
                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Error:</p>
                      <pre className="bg-red-50 p-3 rounded text-xs overflow-auto text-red-900">
                        {error.toString()}
                      </pre>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Stack Trace:</p>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  </div>
                </details>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Reload Page
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-6 text-center">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return children;
  }
}
