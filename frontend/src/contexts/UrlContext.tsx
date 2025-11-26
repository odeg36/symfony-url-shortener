import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { ShortUrl } from '../types';

interface UrlContextValue {
  lastShortenedUrl: ShortUrl | null;
  setLastShortenedUrl: (url: ShortUrl | null) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const UrlContext = createContext<UrlContextValue | undefined>(undefined);

interface UrlProviderProps {
  children: ReactNode;
}

/**
 * Context for managing URL-related state across the application
 */
export function UrlProvider({ children }: UrlProviderProps) {
  const [lastShortenedUrl, setLastShortenedUrl] = useState<ShortUrl | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <UrlContext.Provider
      value={{
        lastShortenedUrl,
        setLastShortenedUrl,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </UrlContext.Provider>
  );
}

export function useUrl(): UrlContextValue {
  const context = useContext(UrlContext);
  if (!context) {
    throw new Error('useUrl must be used within UrlProvider');
  }
  return context;
}
