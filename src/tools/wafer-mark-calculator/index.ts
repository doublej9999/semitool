import { ScanLine } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Wafer Mark Calculator',
  path: '/tools/wafer-mark-calculator',
  description: 'Generate, validate and format wafer marking codes from lot, wafer, product, layer and date inputs.',
  keywords: [
    'wafer mark', 'wafer id', 'laser mark', 'scribe', 'traceability', 'lot id', 'wafer number',
    'date code', 'product id', 'layer', 'zero padding', 'marking', 'semiconductor',
  ],
  category: 'Mark & Traceability',
  icon: ScanLine,
  createdAt: '2026-09-10',
  isNew: true,
});
