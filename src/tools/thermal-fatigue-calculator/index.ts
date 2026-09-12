import { Repeat } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Coffin-Manson Thermal Fatigue Calculator',
  path: '/tools/thermal-fatigue-calculator',
  description:
    'Thermal cycling fatigue life (Nf), shear strain range, solder alloy ductility (SAC305/SnPb) and field acceleration factor.',
  keywords: [
    'coffin-manson',
    'thermal fatigue',
    'solder joint reliability',
    'thermal cycling',
    'tct',
    'sac305',
    'engelmaier',
    'dnp',
    'strain range',
    'acceleration factor',
  ],
  category: 'Yield & Quality',
  icon: Repeat,
  createdAt: '2026-09-12',
});
