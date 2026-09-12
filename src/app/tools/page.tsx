import type { Metadata } from 'next';
import ToolExplorer from '@/components/tools/ToolExplorer';
import ToolsPageHero from '@/components/tools/ToolsPageHero';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Toolbox',
  description:
    'Browse every SemiTools calculator: wafer mark formatting, estimated gross die per wafer, interactive wafer maps with CSV/JSON export, and yield / reject rate.',
  keywords: ['semiconductor tools', 'wafer calculator', 'toolbox', 'engineering calculators'],
  alternates: { canonical: '/tools' },
  openGraph: {
    title: `Toolbox — ${SITE_NAME}`,
    description: 'Browse every SemiTools calculator for wafer marking, die estimation, wafer maps and yield.',
    url: '/tools',
    type: 'website',
  },
};

export default function ToolsPage() {
  return (
    <div className="page">
      <ToolsPageHero />
      <ToolExplorer />
    </div>
  );
}
