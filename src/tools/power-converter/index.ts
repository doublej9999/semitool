
import { Zap } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Power Converter',
  path: '/tools/power-converter',
  description:
    'Convert power between watts, milliwatts, microwatts, kilowatts, horsepower, BTU/h, cal/s, ft·lbf/s and the decibel units dBm and dBW.',
  keywords: [
    'power converter', 'watt to dbm', 'dbm to watt', 'dbm to mw', 'dbw', 'horsepower to watts', 'btu/h', 'cal/s',
    'milliwatt', 'kilowatt', 'decibel milliwatt', 'tx power', 'power units',
  ],
  category: 'Unit Conversion',
  icon: Zap,
  createdAt: '2026-09-11',
});
