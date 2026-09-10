import Fuse from 'fuse.js';
import type { IFuseOptions } from 'fuse.js';
import type { Tool } from '@/tools/tools.types';

/**
 * Fuzzy search used by the command palette (Ctrl/Cmd + K) and the toolbox page.
 *
 * Mirrors the behaviour of the it-tools command palette: `name` outweighs the
 * description, keywords are searchable, and results are grouped by category
 * with a per-category cap so one big category cannot flood the list.
 */
const FUSE_OPTIONS: IFuseOptions<Tool> = {
  keys: [
    { name: 'name', weight: 3 },
    { name: 'keywords', weight: 2 },
    { name: 'description', weight: 1 },
    { name: 'category', weight: 1 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

export function searchTools(query: string, tools: Tool[]): Tool[] {
  const trimmed = query.trim();

  // fuse.js matches everything against an empty query; keep "no query" explicit.
  if (trimmed.length === 0) {
    return tools;
  }

  return new Fuse(tools, FUSE_OPTIONS).search(trimmed).map((result) => result.item);
}

export interface ToolGroup {
  category: string;
  tools: Tool[];
}

export function groupByCategory(tools: Tool[], perCategoryLimit?: number): ToolGroup[] {
  const order: string[] = [];

  for (const tool of tools) {
    if (!order.includes(tool.category)) {
      order.push(tool.category);
    }
  }

  return order.map((category) => {
    const matches = tools.filter((tool) => tool.category === category);
    return {
      category,
      tools: typeof perCategoryLimit === 'number' ? matches.slice(0, perCategoryLimit) : matches,
    };
  });
}
