import { Gauge } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Carrier Mobility & Silicon Resistivity Calculator',
  path: '/tools/carrier-mobility-calculator',
  description:
    'Convert between dopant concentration, carrier mobility (Caughey-Thomas model), electrical conductivity and silicon resistivity for n-type and p-type silicon.',
  keywords: [
    'carrier mobility',
    'silicon resistivity',
    'caughey-thomas model',
    'dopant concentration',
    'electron mobility',
    'hole mobility',
    'electrical conductivity',
    'einstein relation',
    'wafer resistivity',
    'astm f723',
  ],
  category: 'Thermal & Diffusion',
  icon: Gauge,
  createdAt: '2026-09-12',
  isNew: true,
});
