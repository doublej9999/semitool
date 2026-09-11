import { GitMerge } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'L-Network Impedance Match Calculator',
  description:
    'Match a real source to a real load with an L network: the loaded Q, the source and load side shunt placement, and the series and shunt inductor and capacitor values for both the low-pass and high-pass solutions.',
  path: '/tools/impedance-matching-calculator',
  keywords: [
    'l network matching',
    'impedance match calculator',
    'matching network',
    'loaded q',
    'shunt capacitor series inductor',
    'rf matching',
    '50 ohm match',
    'low pass match',
    'high pass match',
    'antenna matching',
  ],
  category: 'RF & Signal',
  icon: GitMerge,
  createdAt: '2026-09-11',
});
