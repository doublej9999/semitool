import { Atom } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Ion Implantation & Doping Calculator',
  path: '/tools/ion-implantation-calculator',
  description:
    'Projected range Rp, straggle delta Rp, peak concentration and junction depth from implant energy, species and dose in silicon.',
  keywords: [
    'ion implantation',
    'projected range',
    'straggle',
    'lss theory',
    'junction depth',
    'doping profile',
    'boron',
    'arsenic',
    'phosphorus',
  ],
  category: 'Thermal & Diffusion',
  icon: Atom,
  createdAt: '2026-09-12',
  isNew: true,
});
