import { Timer } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Throughput & OEE Calculator',
  path: '/tools/throughput-calculator',
  description: 'Turn process time, chamber count and availability / performance / quality into wafers per hour and OEE.',
  keywords: [
    'wph', 'wafers per hour', 'throughput', 'oee', 'overall equipment effectiveness', 'availability', 'performance',
    'utilization', 'cycle time', 'capacity', 'chambers', 'tool productivity', 'semiconductor', 'wafer fab',
  ],
  category: 'Yield & Quality',
  icon: Timer,
  createdAt: '2026-09-11',
  isNew: true,
});
