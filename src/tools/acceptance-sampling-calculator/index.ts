import { ClipboardCheck } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Acceptance Sampling Calculator',
  description:
    'Judge a lot inspection plan by its operating characteristic: the probability of accepting a lot at a given defect rate, and the zero acceptance sample needed to reject a lot as bad as a stated fraction.',
  path: '/tools/acceptance-sampling-calculator',
  keywords: [
    'acceptance sampling',
    'oc curve',
    'ltpd',
    'aql',
    'consumer risk',
    'producer risk',
    'sample plan',
    'lot inspection',
    'binomial acceptance',
    'hypergeometric',
  ],
  category: 'Yield & Quality',
  icon: ClipboardCheck,
  createdAt: '2026-09-11',
  isNew: true,
});
