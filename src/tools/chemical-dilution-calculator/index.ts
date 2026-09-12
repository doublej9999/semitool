import { Beaker } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Chemical Dilution & Wet Clean Calculator',
  path: '/tools/chemical-dilution-calculator',
  description:
    'RCA SC-1, SC-2, Piranha SPM, DHF, and BOE chemical dilution volumes, component mass/weight %, C1·V1=C2·V2 solver, and oxide etch rate estimation.',
  keywords: [
    'chemical dilution',
    'rca clean',
    'sc1 clean',
    'sc2 clean',
    'piranha etch',
    'spm',
    'dhf',
    'dilute hf',
    'boe',
    'buffered oxide etch',
    'wet bench',
    'c1v1 c2v2',
    'semiconductor cleaning',
    'oxide etch rate',
  ],
  category: 'Lithography & Etch',
  icon: Beaker,
  createdAt: '2026-09-15',
});
