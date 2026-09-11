import { CircuitBoard } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Microstrip Calculator',
  description:
    'Microstrip trace impedance, effective permittivity, guided wavelength and delay per millimetre from the trace width and substrate, or solve for the trace width that reaches a target impedance.',
  path: '/tools/microstrip-calculator',
  keywords: [
    'microstrip calculator',
    'trace impedance',
    'characteristic impedance',
    'hammerstad jensen',
    'effective permittivity',
    'guided wavelength',
    'pcb trace width',
    '50 ohm trace',
    'delay per mm',
    'coplanar microstrip',
  ],
  category: 'RF & Signal',
  icon: CircuitBoard,
  createdAt: '2026-09-11',
});
