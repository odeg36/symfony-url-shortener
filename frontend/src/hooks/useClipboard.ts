import { useState, useCallback } from 'react';

interface CopiedState {
  [key: string]: boolean;
}

interface UseClipboardReturn {
  copied: CopiedState;
  copyToClipboard: (text: string, key?: string) => Promise<boolean>;
  resetCopied: (key?: string) => void;
}

/**
 * Hook for managing clipboard operations with feedback
 * Tracks multiple copied states for different items
 */
export function useClipboard(resetDelay: number = 2000): UseClipboardReturn {
  const [copied, setCopied] = useState<CopiedState>({});

  const copyToClipboard = useCallback(async (text: string, key: string = 'default'): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(prev => ({ ...prev, [key]: true }));
      
      // Reset after delay
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [key]: false }));
      }, resetDelay);
      
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, [resetDelay]);

  const resetCopied = useCallback((key?: string) => {
    if (key) {
      setCopied(prev => ({ ...prev, [key]: false }));
    } else {
      setCopied({});
    }
  }, []);

  return {
    copied,
    copyToClipboard,
    resetCopied,
  };
}
