
import { ShieldCheck } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  path: '/tools/fit-mtbf-calculator',
  name: 'FIT & MTBF Calculator',
  description:
    'Failure rate, FIT and MTBF from a life test, with the DPPM implied over a mission time and the time to a given failing fraction.',
  category: 'Yield & Quality',
  icon: ShieldCheck,
  keywords: [
    'fit',
    'mtbf',
    'failure rate',
    'reliability',
    'dppm',
    'life test',
    'burn in',
    'failures per billion hours',
  ],
  createdAt: '2026-09-11',
});
