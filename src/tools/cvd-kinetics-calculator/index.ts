import { Waves } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'CVD & Epitaxy Kinetics Calculator',
  path: '/tools/cvd-kinetics-calculator',
  description:
    'Simulate CVD and epitaxial thin-film growth kinetics using the Grove boundary layer model, Arrhenius surface reaction velocity, and susceptor depletion dynamics.',
  keywords: [
    'cvd',
    'chemical vapor deposition',
    'epitaxy',
    'epi',
    'growth rate',
    'grove model',
    'boundary layer',
    'mass transport',
    'surface reaction',
    'arrhenius',
    'silane',
    'lpcvd',
    'teos',
    'polysilicon',
  ],
  category: 'Thin Film & Deposition',
  icon: Waves,
  createdAt: '2026-09-15',
});
