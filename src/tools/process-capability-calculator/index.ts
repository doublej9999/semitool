import { Target } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Process Capability Calculator',
  path: '/tools/process-capability-calculator',
  description: 'Compute Cp, Cpk and the out-of-spec fraction from spec limits, a process mean and a standard deviation.',
  keywords: [
    'cp cpk', 'process capability', 'capability index', 'pp ppk', 'cpk calculator', 'spec limits', 'usl lsl',
    'process sigma', 'out of spec', 'ppm', 'sigma level', 'spc', 'process control', 'semiconductor',
  ],
  category: 'Yield & Quality',
  icon: Target,
  createdAt: '2026-09-11',
  isNew: true,
});
