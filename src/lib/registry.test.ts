import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getRelatedTools, getTool, tools, toolsByCategory } from '@/tools';
import { groupByCategory, searchTools } from './search';

describe('tool registry', () => {
  it('registers unique tools under /tools/', () => {
    const paths = tools.map((tool) => tool.path);

    expect(paths.length).toBeGreaterThanOrEqual(4);
    expect(new Set(paths).size).toBe(paths.length);

    for (const tool of tools) {
      expect(tool.path.startsWith('/tools/'), tool.path).toBe(true);
      expect(tool.name.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.keywords.length).toBeGreaterThan(2);
      expect(tool.category.length).toBeGreaterThan(0);
    }
  });

  it('has a route file for every registered path', () => {
    for (const tool of tools) {
      const page = join(process.cwd(), 'src', 'app', tool.path, 'page.tsx');
      expect(existsSync(page), `missing page for ${tool.path}`).toBe(true);
    }
  });

  it('groups every tool exactly once', () => {
    const grouped = toolsByCategory.flatMap((group) => group.components.map((tool) => tool.path));

    expect(grouped.sort()).toEqual(tools.map((tool) => tool.path).sort());
  });

  it('looks tools up by path', () => {
    expect(getTool('/tools/yield-calculator')?.name).toBe('Yield Calculator');
    expect(getTool('/tools/does-not-exist')).toBeUndefined();
  });

  it('never lists the current tool as its own related tool', () => {
    for (const tool of tools) {
      const related = getRelatedTools(tool.path);

      expect(related.length).toBeGreaterThan(0);
      expect(related.some((candidate) => candidate.path === tool.path)).toBe(false);
    }
  });
});

describe('tool search', () => {
  it('returns the full list for an empty query', () => {
    expect(searchTools('', tools)).toEqual(tools);
    expect(searchTools('   ', tools)).toEqual(tools);
  });

  it('ranks a name match first', () => {
    expect(searchTools('mark', tools)[0].path).toBe('/tools/wafer-mark-calculator');
  });

  it('matches keywords, not only names', () => {
    const paths = searchTools('edge exclusion', tools).map((tool) => tool.path);

    expect(paths).toContain('/tools/wafer-die-calculator');
  });

  it('groups results by category in registry order', () => {
    const groups = groupByCategory(tools);

    expect(groups.map((group) => group.category)).toEqual(toolsByCategory.map((group) => group.name));
  });

  it('applies the per-category cap used by the command palette', () => {
    const groups = groupByCategory(tools, 1);

    expect(groups.length).toBeGreaterThan(0);
    expect(groups.every((group) => group.tools.length <= 1)).toBe(true);
  });
});
