import { CircuitBoard } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  path: '/tools/layout-parasitics-calculator',
  name: 'IC Layout Parasitics Estimator',
  description:
    'Estimate interconnect resistance, plate and fringe capacitance, IR drop and RC delay from drawn layout geometry — the classic pre-tapeout sanity check for metal, poly and dielectric stacks.',
  category: 'Metrology & Layout',
  keywords: [
    'layout parasitics',
    'interconnect resistance',
    'wire capacitance',
    'rc delay',
    'ir drop',
    'sheet resistance',
    'fringe capacitance',
    'effective resistivity',
    'metal line',
    'pre-tapeout',
    '版图',
    '寄生',
    '配线电阻',
    'rc延迟',
    '配線寄生',
    '기생',
  ],
  icon: CircuitBoard,
  createdAt: '2026-09-13',
  isNew: true,
});
