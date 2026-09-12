import { Wind } from 'lucide-react';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Cleanroom Classification & Airflow Calculator',
  path: '/tools/cleanroom-converter',
  description:
    'Calculate ISO 14644-1 and US FED-STD-209E cleanroom particle concentration limits, HVAC air change rates (ACH), total required CFM / m³/h airflow, and fan filter unit (FFU) ceiling coverage.',
  keywords: [
    'cleanroom calculator',
    'iso 14644-1',
    'fed-std-209e',
    'cleanroom classification',
    'air changes per hour',
    'ach calculator',
    'cleanroom airflow',
    'ffu calculator',
    'fan filter unit',
    'hepa coverage',
    'laminar flow',
    'particle concentration',
    'class 100 to iso 5',
    'fab cleanroom',
  ],
  category: 'Unit Conversion',
  icon: Wind,
  createdAt: '2026-09-11',
});
