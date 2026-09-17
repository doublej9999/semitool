'use client';

import { useCallback } from 'react';
import { useLocale, type SupportedLocale } from '../context';
import { resolveCopyMessage, type CopyParams, type CopyResource } from './types';
import { SHARED_COPY } from './shared';
import { TOOL_COPY_LOADERS } from './resources/registry';

export type { CopyLocale, CopyMessages, CopyParams, CopyResource } from './types';
export { COPY_LOCALES, interpolateCopy, resolveCopyMessage } from './types';

const toolCache = new Map<string, CopyResource>();
const toolPending = new Map<string, Promise<CopyResource | undefined>>();

export function lookupCopy(resource: CopyResource | undefined, locale: SupportedLocale, msgid: string, params?: CopyParams): string {
  if (locale === 'en') return resolveCopyMessage(resource, undefined, locale, msgid, params);
  return resolveCopyMessage(resource, SHARED_COPY[locale], locale, msgid, params);
}

export function getToolCopy(toolId: string | undefined): CopyResource | undefined {
  return toolId ? toolCache.get(toolId) : undefined;
}

export function registerToolCopy(toolId: string, resource: CopyResource): void {
  toolCache.set(toolId, resource);
}

/** Loads one generated tool chunk for tests and future route-level preloading. */
export function ensureToolCopy(toolId: string): Promise<CopyResource | undefined> {
  const cached = toolCache.get(toolId);
  if (cached) return Promise.resolve(cached);
  const pending = toolPending.get(toolId);
  if (pending) return pending;
  const loader = TOOL_COPY_LOADERS[toolId];
  if (!loader) return Promise.resolve(undefined);
  const load = loader().then((resource) => {
    registerToolCopy(toolId, resource);
    toolPending.delete(toolId);
    return resource;
  });
  toolPending.set(toolId, load);
  return load;
}

/** Reactive translator for one statically imported tool resource. */
export function useToolCopy(resource?: CopyResource) {
  const locale = useLocale();
  return useCallback(
    (msgid: string, params?: CopyParams) => lookupCopy(resource, locale, msgid, params),
    [resource, locale],
  );
}
