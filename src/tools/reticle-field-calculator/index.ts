
import { Grid3x3 } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Reticle Field Calculator',
  path: '/tools/reticle-field-calculator',
  description:
    'Fit dice into a lithography field: dice per field, field utilisation, scribe lane effect, shots per wafer and the dice they can carry.',
  keywords: [
    'reticle', 'field size', 'shot', 'shots per wafer', 'stepper', 'scanner', 'dies per field', 'die per field',
    'scribe lane', 'kerf', 'lithography', 'exposure field', 'field utilisation',
  ],
  category: 'Metrology & Layout',
  icon: Grid3x3,
  createdAt: '2026-09-11',
});
