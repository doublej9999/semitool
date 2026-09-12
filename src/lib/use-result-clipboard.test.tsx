import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCopyToClipboard } from './use-result-clipboard';

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    // Only fake the timers the hook uses so React's scheduler stays real.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    // jsdom has no clipboard implementation: stub writeText on the navigator.
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('copies via navigator.clipboard and flips copied back after the reset timeout', async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.copied).toBe(false);

    let outcome: boolean | undefined;
    await act(async () => {
      outcome = await result.current.copy('1.234 um');
    });

    expect(outcome).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('1.234 um');
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.copied).toBe(false);
  });

  it('honors a custom reset timeout', async () => {
    const { result } = renderHook(() => useCopyToClipboard(500));

    await act(async () => {
      await result.current.copy('x');
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.copied).toBe(false);
  });

  it('returns false and never flips copied when the write rejects', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });

    const { result } = renderHook(() => useCopyToClipboard());

    let outcome: boolean | undefined;
    await act(async () => {
      outcome = await result.current.copy('nope');
    });

    expect(outcome).toBe(false);
    expect(result.current.copied).toBe(false);
  });
});
