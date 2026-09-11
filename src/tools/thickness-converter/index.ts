
import { Ruler } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Thickness Converter',
  path: '/tools/thickness-converter',
  description:
    'Convert film thickness and length between ångström, nanometres, micrometres, mil, millimetres, centimetres, inches and metres.',
  keywords: [
    'thickness converter', 'angstrom to nm', 'nm to angstrom', 'micron to mil', 'mil to micron', 'um to nm',
    'film thickness', 'oxide thickness', 'length converter', 'inch to mm', 'mil to mm', 'angstrom converter',
  ],
  category: 'Unit Conversion',
  icon: Ruler,
  createdAt: '2026-09-11',
  isNew: true,
});
