import { TrendingUp } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Curve Fitting & Parameter Extraction Calculator',
  path: '/tools/curve-fitting-calculator',
  description:
    'Extract semiconductor kinetic parameters: Arrhenius activation energy (Ea), Deal-Grove oxidation rate constants (B, B/A), and least-squares linear regression with R² goodness-of-fit.',
  keywords: [
    'curve fitting',
    'arrhenius fit',
    'activation energy',
    'deal-grove parameter',
    'linear regression',
    'parameter extraction',
    'kinetics',
    'oxidation rate constants',
    'diffusion activation energy',
  ],
  category: 'Thermal & Diffusion',
  icon: TrendingUp,
  createdAt: '2026-09-15',
});
