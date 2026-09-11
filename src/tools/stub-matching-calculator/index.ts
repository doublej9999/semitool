import { Antenna } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Shunt Stub Match Calculator',
  description:
    'Match a complex load with a single shunt stub: both stub distances from the load, the short-circuited and open-circuited stub lengths, and a re-simulation of the resulting input admittance.',
  path: '/tools/stub-matching-calculator',
  keywords: [
    'stub matching',
    'shunt stub',
    'single stub tuner',
    'open stub',
    'short stub',
    'transmission line matching',
    'complex load match',
    'guided wavelength',
    'smith chart stub',
    'impedance matching',
  ],
  category: 'RF & Signal',
  icon: Antenna,
  createdAt: '2026-09-11',
  isNew: true,
});
