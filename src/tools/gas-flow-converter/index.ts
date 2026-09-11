
import { Wind } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Gas Flow Converter',
  path: '/tools/gas-flow-converter',
  description:
    'Convert gas flow between sccm, slm, m³/h, cfm, mol/min, mol/h and g/min for a chosen gas and a stated reference temperature.',
  keywords: [
    'sccm to slm', 'slm to sccm', 'sccm calculator', 'mass flow converter', 'mfc flow', 'gas flow units',
    'sccm to mol', 'sccm to g/min', 'standard litre per minute', 'm3/h to slm', 'cfm to slm', 'gas flow calculator',
  ],
  category: 'Unit Conversion',
  icon: Wind,
  createdAt: '2026-09-11',
});
