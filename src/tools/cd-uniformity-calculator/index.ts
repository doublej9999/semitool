
import { Ruler } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'CD Uniformity Calculator',
  path: '/tools/cd-uniformity-calculator',
  description:
    'Paste critical dimension measurements to get the mean, range, 3 sigma and the three uniformity percentages used across the industry.',
  keywords: [
    'cd uniformity', 'cdu', 'critical dimension', 'uniformity percent', 'range over mean', 'half range', 'coefficient of variation',
    '3 sigma', 'across wafer', 'within wafer', 'metrology', 'line width', 'measurement sites',
  ],
  category: 'Lithography & Etch',
  icon: Ruler,
  createdAt: '2026-09-11',
  isNew: true,
});
