import { FlaskConical } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Wet Bench Chemical Lifetime & Spike Calculator',
  path: '/tools/wet-bench-calculator',
  description:
    'RCA clean (SC-1/SC-2), SPM Piranha, and BOE etch bath lifetime, chemical spike dosing, and dissolved silicon loading decay.',
  keywords: [
    'wet bench',
    'rca clean',
    'sc-1',
    'sc-2',
    'piranha',
    'spm',
    'boe',
    'chemical spike',
    'bath life',
    'etch bath',
  ],
  category: 'Wet Process & Clean',
  icon: FlaskConical,
  createdAt: '2026-09-15',
  isNew: true,
});
