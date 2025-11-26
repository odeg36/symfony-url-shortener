import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useClipboard } from '../useClipboard';

describe('useClipboard', () => {
  it('should copy text to clipboard', async () => {
    const { result } = renderHook(() => useClipboard());

    const success = await result.current.copyToClipboard('test text');

    expect(success).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
  });

  it('should track copied state', async () => {
    const { result } = renderHook(() => useClipboard(100));

    await act(async () => {
      await result.current.copyToClipboard('test', 'key1');
    });

    expect(result.current.copied['key1']).toBe(true);

    await waitFor(() => {
      expect(result.current.copied['key1']).toBe(false);
    }, { timeout: 200 });
  });

  it('should handle multiple keys', async () => {
    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copyToClipboard('text1', 'key1');
      await result.current.copyToClipboard('text2', 'key2');
    });

    expect(result.current.copied['key1']).toBe(true);
    expect(result.current.copied['key2']).toBe(true);
  });

  it('should handle clipboard errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('Failed'));

    const { result } = renderHook(() => useClipboard());
    const success = await result.current.copyToClipboard('test');

    expect(success).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
