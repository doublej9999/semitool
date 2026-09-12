import { Disc } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  id: 'cmp-endpoint-calculator',
  name: 'CMP Endpoint & Pad Life Calculator',
  path: '/tools/cmp-endpoint-calculator',
  description:
    'Chemical mechanical planarization motor current endpoint, optical fringe timing, and pad conditioning wear',
  keywords: ['cmp', 'endpoint', 'pad life', 'conditioning', 'optical fringe', 'preston', 'planarization'],
  category: 'Thin Film & Deposition',
  icon: Disc,
  createdAt: '2026-09-15',
  isNew: true,
});
