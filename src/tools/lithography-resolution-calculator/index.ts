
import { Aperture } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Lithography Resolution Calculator',
  path: '/tools/lithography-resolution-calculator',
  description:
    'Rayleigh resolution and depth of focus from wavelength, numerical aperture and the k1 and k2 process factors.',
  keywords: [
    'lithography', 'rayleigh', 'resolution', 'depth of focus', 'dof', 'numerical aperture', 'na', 'k1', 'k2',
    'half pitch', 'critical dimension', 'photolithography', 'immersion', 'euv', 'arf', 'krf', 'stepper',
  ],
  category: 'Lithography & Etch',
  icon: Aperture,
  createdAt: '2026-09-11',
  isNew: true,
});
