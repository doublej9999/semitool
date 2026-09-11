
import { Circle } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Wafer Area Calculator',
  path: '/tools/wafer-area-calculator',
  description:
    'Wafer area, usable area after edge exclusion, die area and the area-only die count upper bound, with utilisation against a measured die count.',
  keywords: [
    'wafer area', 'usable area', 'edge exclusion', 'utilization', 'utilisation', 'area utilisation', 'die area',
    'area only die count', 'wafer utilisation', 'semiconductor', 'wafer diameter',
  ],
  category: 'Wafer & Die',
  icon: Circle,
  createdAt: '2026-09-11',
  isNew: true,
});
