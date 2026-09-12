import { Flame } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Chip Thermal Resistance & Junction Temperature Calculator',
  path: '/tools/thermal-resistance-calculator',
  description:
    'Steady-state junction temperature, package thermal resistance (θJC), TIM layer (BLT and k), heat sink (θSA) and thermal margin.',
  keywords: [
    'thermal resistance',
    'junction temperature',
    'theta jc',
    'theta ja',
    'tim',
    'bond line thickness',
    'thermal interface material',
    'heat sink',
    'chip cooling',
    'tj max',
  ],
  category: 'Thermal & Diffusion',
  icon: Flame,
  createdAt: '2026-09-12',
});
