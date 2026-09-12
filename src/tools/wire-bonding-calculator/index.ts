import { Activity } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Wire Bonding Parasitics & Fusing Current Calculator',
  path: '/tools/wire-bonding-calculator',
  description:
    'Calculate bond wire self-inductance, high-frequency AC resistance, skin effect, Preece fusing current, and continuous safe DC current limits for Au, Cu, Al and Ag wires.',
  keywords: [
    'wire bonding',
    'bond wire inductance',
    'skin effect',
    'preece fusing current',
    'bond wire parasitics',
    'gold wire bonding',
    'copper wire bonding',
    'jedec safe current',
    'loop inductance',
    'ac resistance',
  ],
  category: 'Metrology & Layout',
  icon: Activity,
  createdAt: '2026-09-12',
  isNew: true,
});
