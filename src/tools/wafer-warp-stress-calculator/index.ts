import { Layers } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Wafer Bow, Warp & Thin Film Stress Calculator',
  path: '/tools/wafer-warp-stress-calculator',
  description:
    'Calculate thin film residual stress via Stoney equation, wafer bow and warp curvature, thermal expansion mismatch stress, and critical cracking thickness.',
  keywords: [
    'stoney equation',
    'wafer bow',
    'wafer warp',
    'film stress',
    'thermal mismatch',
    'biaxial modulus',
    'thin film residual stress',
    'curvature',
  ],
  category: 'thin-film',
  icon: Layers,
  createdAt: '2026-09-17',
  isNew: true,
});
