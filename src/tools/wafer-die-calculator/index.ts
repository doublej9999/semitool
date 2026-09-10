import { CircleDot } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Wafer Die Calculator',
  path: '/tools/wafer-die-calculator',
  description: 'Estimate usable dies per wafer from wafer diameter, die size, street width and edge exclusion.',
  keywords: [
    'wafer die', 'gross die', 'die per wafer', 'dpw', 'die count', 'pitch', 'street width',
    'edge exclusion', 'circular wafer', 'estimate', 'semiconductor', 'yield estimate',
  ],
  category: 'Wafer & Die',
  icon: CircleDot,
  createdAt: '2026-09-10',
  isNew: true,
});
