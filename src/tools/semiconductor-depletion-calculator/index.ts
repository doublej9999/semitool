import { Split } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'PN Junction Depletion Calculator',
  path: '/tools/semiconductor-depletion-calculator',
  description:
    'Built-in potential, depletion width, electric field, junction capacitance and breakdown voltage under reverse bias for PN junctions.',
  keywords: [
    'pn junction',
    'depletion width',
    'built-in potential',
    'junction capacitance',
    'electric field',
    'doping',
    'reverse bias',
    'space charge region',
    'breakdown voltage',
  ],
  category: 'Metrology & Layout',
  icon: Split,
  createdAt: '2026-09-12',
  isNew: true,
});
