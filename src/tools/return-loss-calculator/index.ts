
import { Radar } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Return Loss & VSWR Calculator',
  path: '/tools/return-loss-calculator',
  description:
    'Return loss, reflection coefficient, VSWR, mismatch loss and the reflected and delivered power fractions, converted between each other.',
  keywords: [
    'return loss', 'vswr', 'reflection coefficient', 'mismatch loss', 'swr', 'standing wave ratio', 'impedance match',
    'reflected power', 'db return loss', 's11', 'antenna match', 'rf mismatch',
  ],
  category: 'RF & Signal',
  icon: Radar,
  createdAt: '2026-09-11',
  isNew: true,
});
