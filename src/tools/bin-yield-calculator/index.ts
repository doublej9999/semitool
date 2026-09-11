
import { PieChart } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  path: '/tools/bin-yield-calculator',
  name: 'Bin Yield Calculator',
  description:
    'Roll up wafer-sort bin counts into per-bin yield, cumulative yield, the pass fraction and the defect rate in DPPM.',
  category: 'Yield & Quality',
  icon: PieChart,
  keywords: [
    'bin yield',
    'wafer sort',
    'bin map',
    'cumulative yield',
    'pass bin',
    'dppm',
    'datalog',
    'bin rollup',
  ],
  createdAt: '2026-09-11',
  isNew: true,
});
