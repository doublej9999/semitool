
import { Zap } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Sheet Resistance Calculator',
  path: '/tools/sheet-resistance-calculator',
  description:
    'Sheet resistance, resistivity and conductivity from a four-point probe measurement, plus a converter between sheet resistance and resistivity.',
  keywords: [
    'sheet resistance', 'four point probe', '4pp', 'resistivity', 'conductivity', 'ohm per square', 'ohms/sq',
    'ohms per square', 'thin film', 'film thickness', 'metrology', 'semiconductor', 'probe spacing',
  ],
  category: 'Metrology & Layout',
  icon: Zap,
  createdAt: '2026-09-11',
  isNew: true,
});
