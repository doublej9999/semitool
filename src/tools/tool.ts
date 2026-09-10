import type { Tool } from './tools.types';

/**
 * Identity helper used by every `src/tools/<slug>/index.ts` file.
 *
 * It exists to give tool definitions a single shape and to keep the registry
 * typed: a tool that forgets `keywords` or `category` fails type-checking
 * instead of silently disappearing from the sidebar or the search palette.
 */
export function defineTool(tool: Tool): Tool {
  const missing = ([
    ['name', tool.name],
    ['path', tool.path],
    ['description', tool.description],
    ['category', tool.category],
  ] as const).filter(([, value]) => !value || value.trim().length === 0);

  if (missing.length > 0) {
    throw new Error(`defineTool(${tool.path || 'unknown'}): missing ${missing.map(([key]) => key).join(', ')}`);
  }

  if (!tool.path.startsWith('/')) {
    throw new Error(`defineTool(${tool.name}): path must start with "/" (got "${tool.path}")`);
  }

  return tool;
}
