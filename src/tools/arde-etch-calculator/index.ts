import { Flame } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  id: 'arde-etch-calculator',
  name: 'ARDE & Microloading Calculator',
  path: '/tools/arde-etch-calculator',
  description:
    'Aspect-ratio-dependent etching (RIE lag), pattern microloading, and selectivity simulation',
  keywords: ['arde', 'rie lag', 'microloading', 'aspect ratio', 'etch rate', 'selectivity'],
  category: 'Lithography & Etch',
  icon: Flame,
  createdAt: '2026-09-15',
  isNew: true,
});
