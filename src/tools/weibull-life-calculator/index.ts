import { Hourglass } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Weibull Life Calculator',
  description:
    'Fit a Weibull distribution to failure times by median rank: the shape and scale parameters, B1, B10 and B50 life, MTBF and the reliability at a mission time.',
  path: '/tools/weibull-life-calculator',
  keywords: [
    'weibull fit',
    'weibull analysis',
    'b10 life',
    'shape parameter beta',
    'scale parameter eta',
    'median rank',
    'failure analysis',
    'mtbf',
    'reliability calculation',
    'life data analysis',
  ],
  category: 'Yield & Quality',
  icon: Hourglass,
  createdAt: '2026-09-11',
  isNew: true,
});
