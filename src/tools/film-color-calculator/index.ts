import { Palette } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Thin Film Color & Interference Calculator',
  path: '/tools/film-color-calculator',
  description:
    'Simulate visual interference color and optical reflectance spectrum for SiO2 and Si3N4 thin films on silicon under white light.',
  keywords: [
    'film color',
    'oxide color chart',
    'thermal oxide thickness',
    'optical interference',
    'refractive index',
    'reflectance spectrum',
    'pliskin chart',
    'sio2 color',
    'ellipsometry check',
  ],
  category: 'Thin Film & Deposition',
  icon: Palette,
  createdAt: '2026-09-11',
});
