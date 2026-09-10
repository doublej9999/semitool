import { tool as waferDieCalculator } from './wafer-die-calculator';
import { tool as waferMapGenerator } from './wafer-map-generator';
import { tool as waferMarkCalculator } from './wafer-mark-calculator';
import { tool as yieldCalculator } from './yield-calculator';
import type { Tool, ToolCategory } from './tools.types';

/**
 * Central tool registry — the single source of truth for navigation.
 *
 * Order in this array drives the sidebar, the home grid and the related-tool
 * lists. Only light navigation metadata lives here: it is imported by the
 * client sidebar and the command palette, so long page copy (FAQ answers,
 * formula text, notes) stays in the route files.
 */
export const tools: Tool[] = [
  waferDieCalculator,
  waferMapGenerator,
  waferMarkCalculator,
  yieldCalculator,
];

export const categories: string[] = [...new Set(tools.map((tool) => tool.category))];

export const toolsByCategory: ToolCategory[] = categories.map((name) => ({
  name,
  components: tools.filter((tool) => tool.category === name),
}));

export function getTool(path: string): Tool | undefined {
  return tools.find((tool) => tool.path === path);
}

/**
 * Related tools for a tool page: same category first, then the rest of the
 * registry, so a small registry still fills the list.
 */
export function getRelatedTools(path: string, limit = 3): Tool[] {
  const current = getTool(path);
  const pool = tools.filter((tool) => tool.path !== path);

  const sameCategory = pool.filter((tool) => tool.category === current?.category);
  const others = pool.filter((tool) => tool.category !== current?.category);

  return [...sameCategory, ...others].slice(0, limit);
}
