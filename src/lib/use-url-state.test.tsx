import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { useUrlParamsState } from './use-url-state';

type UrlState = {
  a: number;
  flag: boolean;
  name: string;
};

const INITIAL: UrlState = { a: 0, flag: false, name: '' };

/** Seeds the jsdom URL before mounting, as the real app would be loaded with. */
function seedUrl(query: string): void {
  window.history.replaceState(null, '', query ? `/?${query}` : '/');
}

function mountUrlState() {
  return renderHook(() => {
    const [state, setState] = useState<UrlState>(INITIAL);
    useUrlParamsState(state, setState);
    return { state, setState };
  });
}

describe('useUrlParamsState', () => {
  beforeEach(() => {
    // Only fake the timers the hook uses so React's scheduler stays real.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('hydrates number, string and boolean state from the URL on mount', () => {
    seedUrl('a=5&flag=true&name=foo');

    const { result } = mountUrlState();

    expect(result.current.state).toEqual({ a: 5, flag: true, name: 'foo' });
  });

  it.each([
    ['true', true],
    ['1', true],
    ['false', false],
    ['0', false],
    ['yes', false],
  ])('coerces boolean param %s to %s', (raw, expected) => {
    seedUrl(`flag=${raw}`);

    const { result } = mountUrlState();

    expect(result.current.state.flag).toBe(expected);
  });

  it('ignores unknown URL keys and non-finite numbers', () => {
    seedUrl('unknown=zzz&a=abc&name=');

    const { result } = mountUrlState();

    // `unknown` is not a state key, `a=abc` is not a finite number, and `name`
    // hydrates to the empty string it already holds: state is untouched.
    expect(result.current.state).toEqual(INITIAL);
  });

  it('syncs state changes back to the URL after the 200 ms debounce', () => {
    seedUrl('');
    const replaceState = vi.spyOn(window.history, 'replaceState');

    const { result } = mountUrlState();

    act(() => {
      result.current.setState({ a: 42, flag: true, name: 'bar' });
    });

    // Still debouncing: nothing written before the 200 ms elapse.
    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(replaceState).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(replaceState).toHaveBeenCalledWith(null, '', '/?a=42&flag=true&name=bar');
    expect(window.location.search).toBe('?a=42&flag=true&name=bar');
  });

  it('drops empty string values when serializing to the URL', () => {
    seedUrl('');
    const replaceState = vi.spyOn(window.history, 'replaceState');

    const { result } = mountUrlState();

    act(() => {
      result.current.setState({ a: 7, flag: false, name: '' });
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(replaceState).toHaveBeenCalledWith(null, '', '/?a=7&flag=false');
    expect(window.location.search).toBe('?a=7&flag=false');
  });

  it('re-serializes the hydrated state once the initial debounce elapses', () => {
    seedUrl('a=5&flag=true&name=foo');
    const replaceState = vi.spyOn(window.history, 'replaceState');

    mountUrlState();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(replaceState).toHaveBeenCalledWith(null, '', '/?a=5&flag=true&name=foo');
  });
});
