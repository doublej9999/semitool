import { Layers } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'ALD Cycle & Precursor Exposure Calculator',
  path: '/tools/ald-cycle-calculator',
  description:
    'Atomic layer deposition (ALD) cycle timing, Langmuir precursor exposure saturation (θ), growth per cycle (GPC), and total thickness solver.',
  keywords: [
    'ald',
    'atomic layer deposition',
    'ald cycle',
    'gpc',
    'growth per cycle',
    'precursor exposure',
    'langmuir',
    'saturation curve',
    'tma',
    'al2o3',
    'hfo2',
    'tio2',
    'precursor consumption',
    'purge time',
    'pulse time',
  ],
  category: 'Thin Films & Deposition',
  icon: Layers,
  createdAt: '2026-09-15',
});
