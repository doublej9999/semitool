'use client';

import { useEffect, useCallback } from 'react';

/**
 * Hook to automatically serialize state parameters to URL query params,
 * and deserialize them on page load.
 *
 * Uses window.history.replaceState so back button is not flooded.
 */
export function useUrlParamsState<T extends Record<string, string | number | boolean>>(
  state: T,
  setState: React.Dispatch<React.SetStateAction<T>>,
) {
  // On mount: read URL search params and hydrate state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const search = new URLSearchParams(window.location.search);
      if (search.toString().length === 0) return;

      setState((prev) => {
        const next = { ...prev };
        let modified = false;

        for (const [key, val] of search.entries()) {
          if (key in prev) {
            const prevVal = prev[key];
            if (typeof prevVal === 'number') {
              const numVal = Number(val);
              if (Number.isFinite(numVal)) {
                // @ts-expect-error dynamic assignment
                next[key] = numVal;
                modified = true;
              }
            } else if (typeof prevVal === 'string') {
              // @ts-expect-error dynamic assignment
              next[key] = val;
              modified = true;
            } else if (typeof prevVal === 'boolean') {
              // @ts-expect-error dynamic assignment
              next[key] = val === 'true' || val === '1';
              modified = true;
            }
          }
        }

        return modified ? next : prev;
      });
    } catch {
      // Ignore URL parsing errors
    }
  }, [setState]);

  // When state changes: update URL query parameters without full navigation
  const syncToUrl = useCallback(
    (newState: T) => {
      if (typeof window === 'undefined') return;

      try {
        const search = new URLSearchParams();
        for (const [key, val] of Object.entries(newState)) {
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            search.set(key, String(val));
          }
        }

        const newUrl = `${window.location.pathname}?${search.toString()}`;
        window.history.replaceState(null, '', newUrl);
      } catch {
        // Ignore
      }
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      syncToUrl(state);
    }, 200);
    return () => clearTimeout(timer);
  }, [state, syncToUrl]);
}
