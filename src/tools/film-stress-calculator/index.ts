
import { Waves } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Film Stress Calculator',
  path: '/tools/film-stress-calculator',
  description:
    'Thin-film stress from wafer curvature with the Stoney relation: substrate biaxial modulus, curvature from radius or bow, and the thickness-ratio validity check.',
  keywords: [
    'film stress', 'stoney', 'wafer curvature', 'bow', 'radius of curvature', 'biaxial modulus', 'tensile', 'compressive',
    'stressed film', 'thin film', 'deposition stress', 'sagitta', 'scan',
  ],
  category: 'Thin Film & Deposition',
  icon: Waves,
  createdAt: '2026-09-11',
});
