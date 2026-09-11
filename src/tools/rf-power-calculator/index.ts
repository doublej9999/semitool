
import { RadioTower } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'RF Power Calculator',
  path: '/tools/rf-power-calculator',
  description:
    'RF power between dBm, dBW, W and mW and the voltage it drives into a real load: RMS, peak and peak-to-peak for a chosen system impedance.',
  keywords: [
    'rf power', 'dbm to vrms', 'dbm to volts', 'vrms to dbm', 'power to voltage', '50 ohm', 'peak to peak', 'vpp',
    'impedance', 'transmit power', 'signal level', 'dbm calculator',
  ],
  category: 'RF & Signal',
  icon: RadioTower,
  createdAt: '2026-09-11',
});
