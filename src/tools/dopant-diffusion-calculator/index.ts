import { Flame } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Dopant Diffusion & Junction Depth Calculator',
  path: '/tools/dopant-diffusion-calculator',
  description:
    'Constant-source (erfc) and limited-source (Gaussian) dopant diffusion in Silicon, Arrhenius D(T) coefficients (B, P, As, Sb), junction depth (xj), and oxide mask thickness.',
  keywords: [
    'dopant diffusion',
    'junction depth',
    'xj',
    'fick law',
    'erfc',
    'gaussian diffusion',
    'predeposition',
    'drive-in',
    'boron diffusion',
    'phosphorus diffusion',
    'arsenic diffusion',
    'thermal budget',
    'oxide mask',
    'solid solubility',
  ],
  category: 'Thermal & Furnace',
  icon: Flame,
  createdAt: '2026-09-15',
});
