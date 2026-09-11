
import { Activity } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Arrhenius Rate Calculator',
  path: '/tools/arrhenius-calculator',
  description:
    'Arrhenius rate from a prefactor and an activation energy, and the activation energy extracted from two rates measured at two temperatures.',
  keywords: [
    'arrhenius', 'activation energy', 'prefactor', 'frequency factor', 'rate constant', 'temperature dependence',
    'boltzmann', 'eV', 'two point', 'extract Ea', 'reaction rate', 'diffusivity',
  ],
  category: 'Thermal & Diffusion',
  icon: Activity,
  createdAt: '2026-09-11',
  isNew: true,
});
