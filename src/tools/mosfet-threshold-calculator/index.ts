import { Sliders } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'MOSFET Threshold & Gate Oxide Calculator',
  path: '/tools/mosfet-threshold-calculator',
  description:
    'Threshold voltage, equivalent oxide thickness (EOT), gate capacitance, flatband voltage, body effect and subthreshold swing for NMOS and PMOS transistors.',
  keywords: [
    'mosfet threshold',
    'vth calculator',
    'equivalent oxide thickness',
    'eot',
    'gate oxide capacitance',
    'cox',
    'body effect',
    'gamma',
    'subthreshold swing',
    'high-k metal gate',
    'hkmg',
    'flatband voltage',
    'nmos pmos',
  ],
  category: 'Metrology & Layout',
  icon: Sliders,
  createdAt: '2026-09-12',
  isNew: true,
});
