import { Gauge } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Four-Point Probe Calculator (ASTM F84)',
  path: '/tools/four-point-probe-calculator',
  description:
    'ASTM F84 / SEMI MF84 collinear four-point probe sheet resistance, wafer resistivity, thickness correction factor, and NIST dopant density inversion.',
  keywords: [
    'four point probe',
    'astm f84',
    'semi mf84',
    'sheet resistance',
    'resistivity',
    'thickness correction',
    'dopant density',
    'irvin curves',
    'carrier mobility',
    'wafer metrology',
  ],
  category: 'Metrology & Layout',
  icon: Gauge,
  createdAt: '2026-09-15',
});
