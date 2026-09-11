
import { Thermometer } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Temperature Converter',
  path: '/tools/temperature-converter',
  description:
    'Convert temperatures and temperature differences between Celsius, Fahrenheit, kelvin and Rankine, with absolute-zero checking.',
  keywords: [
    'temperature converter', 'celsius to fahrenheit', 'c to f', 'f to c', 'kelvin converter', 'rankine',
    'temperature difference', 'delta temperature', 'process temperature', 'celsius to kelvin', 'fahrenheit to kelvin',
    '300 k to c',
  ],
  category: 'Unit Conversion',
  icon: Thermometer,
  createdAt: '2026-09-11',
  isNew: true,
});
