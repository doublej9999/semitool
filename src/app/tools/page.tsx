import type { Metadata } from 'next';
import ToolExplorer from '@/components/tools/ToolExplorer';
import { tools } from '@/tools';
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
      <header className="page-hero">
        <p className="kicker">Toolbox</p>
        <h1>Every SemiTools calculator</h1>
        <p className="lead">
          {tools.length} focused tools, each with explicit units, its formula on the page and a stated scope. Filter by name,
          keyword or unit — the list updates as you type and stays fully keyboard navigable.
        </p>
      </header>
      <ToolExplorer />
    </div>
  );
}
