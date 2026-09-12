import { Zap } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Plasma Sheath & Debye Length Calculator',
  path: '/tools/plasma-sheath-calculator',
  description:
    'Electron Debye length, Bohm velocity, Child-Langmuir RF bias sheath thickness, plasma frequency, and ion collisionality regime for RIE/ICP/PECVD.',
  keywords: [
    'plasma sheath',
    'debye length',
    'bohm velocity',
    'bohm criterion',
    'child langmuir',
    'plasma frequency',
    'rf bias',
    'rie etch',
    'icp plasma',
    'sheath capacitance',
    'floating potential',
    'mean free path',
    'semiconductor plasma',
  ],
  category: 'Lithography & Etch',
  icon: Zap,
  createdAt: '2026-09-15',
});
