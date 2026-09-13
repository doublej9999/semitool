import { ShieldCheck } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  path: '/tools/drc-rule-checker',
  name: 'DRC Rule-of-Thumb Checker',
  description:
    'Check drawn width, spacing, pitch and contact/via enclosure values against literature-typical design rules for 180 nm to 7 nm FinFET process families, with pass/fail margins and a per-layer rule table — a pre-layout sanity check, not a foundry DRC deck.',
  category: 'Metrology & Layout',
  keywords: [
    'drc',
    'design rules',
    'rule of thumb',
    'minimum width',
    'minimum spacing',
    'minimum pitch',
    'enclosure',
    'min area',
    'process node',
    '180nm',
    '28nm',
    'finfet',
    'tapeout',
    'dfm',
    'layout check',
    '设计规则',
    '线宽',
    '间距',
    '設計ルール',
    '설계 규칙',
  ],
  icon: ShieldCheck,
  createdAt: '2026-09-13',
  isNew: true,
});
