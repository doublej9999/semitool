import { ShieldAlert } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  path: '/tools/esd-estimator-calculator',
  name: 'ESD Protection Estimator',
  description:
    'Estimate on-chip ESD robustness (HBM, MM, CDM) from protection-device sizing — diode perimeter, GGNMOS gate width or supply clamp width — checked against JEDEC class targets with inverse sizing suggestions. Rule-of-thumb scaling, not silicon-validated sign-off.',
  category: 'Metrology & Layout',
  keywords: [
    'esd',
    'esd protection',
    'hbm',
    'human body model',
    'machine model',
    'cdm',
    'charged device model',
    'electrostatic discharge',
    'pad protection',
    'diode pair',
    'ggnmos',
    'snapback',
    'supply clamp',
    'power clamp',
    'jedec class',
    'js-001',
    'js-002',
    'tlp',
    'robustness',
    'io protection',
    'dfm',
    '静电',
    '静電気',
    '정전기',
  ],
  icon: ShieldAlert,
  createdAt: '2026-09-13',
  isNew: true,
});
