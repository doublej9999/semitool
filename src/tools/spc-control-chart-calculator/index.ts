import { LineChart } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'SPC Control Chart Calculator',
  description:
    'X-bar and R control limits from subgroup data, with the out-of-limit points and seven-in-a-row runs flagged, plus the within-subgroup sigma estimate.',
  path: '/tools/spc-control-chart-calculator',
  keywords: [
    'spc control chart',
    'xbar r chart',
    'control limits',
    'western electric rules',
    'run rule',
    'statistical process control',
    'ucl lcl',
    'out of control',
    'subgroup data',
    'process stability',
  ],
  category: 'Yield & Quality',
  icon: LineChart,
  createdAt: '2026-09-11',
  isNew: true,
});
