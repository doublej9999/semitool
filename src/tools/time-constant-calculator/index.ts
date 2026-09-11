
import { Timer } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'RC Time Constant Calculator',
  path: '/tools/time-constant-calculator',
  description:
    'RC time constant from resistance and capacitance, with the 10-90% rise time, the 1% and 0.1% settling times, the -3 dB corner frequency and the time constant in every time unit.',
  keywords: [
    'time constant', 'rc time constant', 'rc circuit', 'rise time', 'settling time', 'corner frequency', 'cutoff frequency',
    'tau', 'r c', 'resistance capacitance', 'bandwidth', 'time units',
  ],
  category: 'Unit Conversion',
  icon: Timer,
  createdAt: '2026-09-11',
});
