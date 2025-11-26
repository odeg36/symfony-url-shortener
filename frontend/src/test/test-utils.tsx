import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { NotificationProvider } from '../contexts/NotificationContext';
import { UrlProvider } from '../contexts/UrlContext';

interface AllTheProvidersProps {
  children: ReactNode;
}

/**
 * Wrapper with all providers for testing
 */
function AllTheProviders({ children }: AllTheProvidersProps) {
  return (
    <NotificationProvider>
      <UrlProvider>
        {children}
      </UrlProvider>
    </NotificationProvider>
  );
}

/**
 * Custom render function that includes all providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Re-export everything from Testing Library
 */
export * from '@testing-library/react';
export { renderWithProviders as render };
