import { GitFork } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Split-Lot & DOE Recipe Overlay Calculator',
  path: '/tools/split-lot-calculator',
  description:
    'Split-lot and Design of Experiments (DOE) recipe overlay matrix, multi-wafer parameter variance tracking, response delta comparisons, and run-sheet export.',
  keywords: [
    'split lot',
    'doe',
    'design of experiments',
    'recipe overlay',
    'recipe split',
    'fab traveler',
    'process delta',
    'process tuning',
    'cleanroom run sheet',
  ],
  category: 'Yield & Quality',
  icon: GitFork,
  createdAt: '2026-09-15',
});
