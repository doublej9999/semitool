
import { Layers } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Etch Rate & Selectivity Calculator',
  path: '/tools/etch-rate-calculator',
  description:
    'Etch rate from before and after thickness, selectivity against the masking layer and the overetch percentage.',
  keywords: [
    'etch rate', 'selectivity', 'overetch', 'endpoint', 'thickness removed', 'plasma etch', 'wet etch', 'mask loss',
    'remaining thickness', 'material removal', 'nanometres per minute', 'process window',
  ],
  category: 'Lithography & Etch',
  icon: Layers,
  createdAt: '2026-09-11',
  isNew: true,
});
