
import { Percent } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  path: '/tools/yield-dppm-calculator',
  name: 'Yield ⇄ DPPM Calculator',
  description:
    'Convert between yield, defect rate in DPPM or DPB and the equivalent sigma level, in any direction.',
  category: 'Yield & Quality',
  icon: Percent,
  keywords: [
    'yield to dppm',
    'dppm',
    'defective parts per million',
    'sigma level',
    'cpk equivalent',
    'dpb',
    'parts per billion',
  ],
  createdAt: '2026-09-11',
});
