import { Disc } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'CMP Preston Removal Rate Calculator',
  path: '/tools/cmp-preston-calculator',
  description:
    'Preston removal rate (RR = Kp·P·V), linear velocity, polish time and thickness removed for dielectric, copper and tungsten CMP.',
  keywords: [
    'cmp preston',
    'chemical mechanical polishing',
    'removal rate',
    'preston equation',
    'teos cmp',
    'copper cmp',
    'tungsten cmp',
    'wiwnu',
    'polishing platen',
  ],
  category: 'Thin Film & Deposition',
  icon: Disc,
  createdAt: '2026-09-12',
});
