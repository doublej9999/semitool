import { LayoutGrid } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Wafer Map Generator',
  path: '/tools/wafer-map-generator',
  description: 'Generate a clickable SVG wafer map with die coordinates, rows, columns and defect status.',
  keywords: [
    'wafer map', 'die map', 'defect map', 'bin map', 'svg', 'row', 'column', 'coordinates',
    'good die', 'defect', 'skip', 'edge dies', 'statistics', 'visualization',
  ],
  category: 'Wafer & Die',
  icon: LayoutGrid,
  createdAt: '2026-09-10',
});
