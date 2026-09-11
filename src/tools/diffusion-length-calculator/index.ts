
import { Thermometer } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Diffusion Length Calculator',
  path: '/tools/diffusion-length-calculator',
  description:
    'Diffusion length and thermal budget from a diffusivity and a time: the characteristic length, the erfc length and the Gaussian sigma, plus the budget in square centimetres.',
  keywords: [
    'diffusion length', 'thermal budget', 'Dt', 'diffusivity', 'junction depth', 'erfc', 'gaussian', 'drive in',
    'anneal', 'dopant diffusion', 'square root Dt', 'process thermal budget',
  ],
  category: 'Thermal & Diffusion',
  icon: Thermometer,
  createdAt: '2026-09-11',
});
