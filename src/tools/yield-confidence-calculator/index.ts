import { Activity } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Yield Confidence Interval Calculator',
  path: '/tools/yield-confidence-calculator',
  description: 'Put a confidence interval around a measured yield with the Wilson and Clopper-Pearson methods, and size a sample.',
  keywords: [
    'confidence interval', 'yield interval', 'wilson interval', 'clopper pearson', 'binomial', 'sample size',
    'margin of error', 'half width', 'sampling plan', 'how many units to test', 'yield', 'ppm', 'semiconductor',
  ],
  category: 'Yield & Quality',
  icon: Activity,
  createdAt: '2026-09-11',
});
