
import { Flame } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Deal-Grove Thermal Oxide Calculator',
  path: '/tools/thermal-oxide-calculator',
  description:
    'Thermal oxide thickness from an oxidation time, or the time to reach a target thickness, using the Deal-Grove linear-parabolic model with an initial oxide and the silicon consumed.',
  keywords: [
    'thermal oxide', 'deal grove', 'oxidation', 'silicon dioxide', 'linear parabolic', 'dry oxidation', 'wet oxidation',
    'steam', 'oxidation time', 'oxide thickness', 'silicon consumed', 'furnace',
  ],
  category: 'Thermal & Diffusion',
  icon: Flame,
  createdAt: '2026-09-11',
  isNew: true,
});
