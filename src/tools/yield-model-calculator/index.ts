import { ChartLine } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Yield Model Calculator',
  path: '/tools/yield-model-calculator',
  description:
    'Compare the Poisson, Murphy and Seeds yield models for a defect density and critical die area.',
  keywords: [
    'yield model', 'poisson', 'murphy', 'seeds', 'moore', 'defect density', 'critical area', 'defects per die',
    'ad', 'random defect', 'semiconductor', 'wafer', 'yield prediction',
  ],
  category: 'Yield & Quality',
  icon: ChartLine,
  createdAt: '2026-09-11',
  isNew: true,
});
