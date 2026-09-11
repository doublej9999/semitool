
import { LayoutGrid } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Film Thickness Uniformity Calculator',
  path: '/tools/film-uniformity-calculator',
  description:
    'Thickness uniformity across a wafer from a list of readings: mean, range, sample sigma, three sigma and the percentage uniformly conventions, with a target check.',
  keywords: [
    'film uniformity', 'thickness uniformity', 'wafer uniformity', 'non-uniformity', 'deposition uniformity',
    'range over mean', 'three sigma', 'sigma', 'standard deviation', 'thickness map', 'across wafer', 'target thickness',
  ],
  category: 'Thin Film & Deposition',
  icon: LayoutGrid,
  createdAt: '2026-09-11',
});
