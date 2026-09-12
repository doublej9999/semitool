import { FileSearch } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'STDF / KLARF Explorer',
  path: '/tools/stdf-klarf-explorer',
  description:
    'Parse ATE STDF V4 and KLA KLARF files in the browser: per-test Cpk statistics, sparkline trends, bin distribution, yield, defect clusters and one-click SPC hand-off.',
  keywords: [
    'stdf', 'stdf v4', 'klarf', 'ptr', 'prr', 'mir', 'parametric test', 'ate datalog',
    'cpk', 'bin distribution', 'soft bin', 'hard bin', 'yield', 'defect inspection',
    'wafer test data', 'sparkline', 'spc export', 'test limits',
  ],
  category: 'Metrology & Layout',
  icon: FileSearch,
  createdAt: '2026-09-13',
  isNew: true,
});
