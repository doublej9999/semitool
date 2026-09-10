import type { LucideIcon } from 'lucide-react';

/**
 * A single tool card / page entry.
 *
 * `category` is the grouping key used by the sidebar and the home grid.
 * `isNew` is set explicitly per tool (instead of being derived from `createdAt`)
 * so that server and client always render the same badge and never disagree
 * during hydration.
 */
export interface Tool {
  /** Display name, also used as the H1 on the tool page. */
  name: string;
  /** Absolute route, e.g. `/tools/wafer-die-calculator`. */
  path: string;
  /** One-line summary used in cards, search results and meta description fallbacks. */
  description: string;
  /** Extra search terms for the command palette and site search. */
  keywords: string[];
  /** Grouping key, e.g. `Wafer & Die`. */
  category: string;
  /** Sidebar / card icon. */
  icon: LucideIcon;
  /** ISO date the tool was published. */
  createdAt: string;
  /** Shows a "New" badge next to the name. */
  isNew?: boolean;
}

export interface ToolCategory {
  name: string;
  components: Tool[];
}

export type ToolWithCategory = Tool & { category: string };
