
import { Gauge } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Pressure & Vacuum Converter',
  path: '/tools/pressure-converter',
  description:
    'Convert pressure and vacuum readings between pascal, kPa, MPa, bar, mbar, Torr, mTorr, atmosphere and psi with exact definitions.',
  keywords: [
    'pressure converter', 'torr to mbar', 'mbar to torr', 'pa to torr', 'torr to pa', 'mtorr converter',
    'vacuum units', 'psi to bar', 'bar to psi', 'atm to torr', 'vacuum pressure', 'pressure unit conversion',
  ],
  category: 'Unit Conversion',
  icon: Gauge,
  createdAt: '2026-09-11',
  isNew: true,
});
