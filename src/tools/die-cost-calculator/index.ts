import { Coins } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Die Cost Calculator',
  path: '/tools/die-cost-calculator',
  description: 'Turn wafer cost and die counts into cost per gross die, cost per good die and scrap cost.',
  keywords: [
    'cost per die', 'cost per good die', 'die cost', 'wafer cost', 'cogs', 'scrap cost', 'yield loss',
    'cost multiplier', 'quoting', 'semiconductor', 'wafer', 'economics',
  ],
  category: 'Yield & Quality',
  icon: Coins,
  createdAt: '2026-09-11',
  isNew: true,
});
