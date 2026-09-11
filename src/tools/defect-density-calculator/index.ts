import { Gauge } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Defect Density Calculator',
  path: '/tools/defect-density-calculator',
  description: 'Back-calculate defect density (D0) from a measured yield and the critical die area.',
  keywords: [
    'defect density', 'd0', 'dd', 'yield', 'poisson', 'murphy', 'seeds', 'critical area', 'defects per cm2',
    'back calculate', 'semiconductor', 'wafer', 'yield loss',
  ],
  category: 'Yield & Quality',
  icon: Gauge,
  createdAt: '2026-09-11',
  isNew: true,
});
