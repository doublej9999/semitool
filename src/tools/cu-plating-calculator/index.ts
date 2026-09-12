import { Layers } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  path: '/tools/cu-plating-calculator',
  name: 'Copper Electroplating & Damascene Calculator',
  description:
    'Copper electrochemical deposition (ECD), Dual Damascene trench superfilling, seed layer terminal effect, and Faraday electrolysis kinetics.',
  category: 'Thin Film & Deposition',
  keywords: [
    'copper plating',
    'ecd',
    'electroplating',
    'damascene',
    'superfilling',
    'faraday law',
    'terminal effect',
    'current density',
    'sps accelerator',
    'peg suppressor',
    'overburden',
    'electrolysis',
  ],
  icon: Layers,
  createdAt: '2026-09-16',
  isNew: true,
});
