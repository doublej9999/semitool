import { Percent } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Yield Calculator',
  path: '/tools/yield-calculator',
  description: 'Calculate die yield and reject rate from gross, good and defect die counts.',
  keywords: [
    'yield', 'reject rate', 'good die', 'defect die', 'gross die', 'percentage',
    'quality', 'bin', 'testing', 'semiconductor', 'first pass yield',
  ],
  category: 'Yield & Quality',
  icon: Percent,
  createdAt: '2026-09-10',
});
