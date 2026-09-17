import type { Metadata } from 'next';
import OfflinePageContent from '@/components/pages/OfflinePageContent';

export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false },
};

export default function OfflinePage() {
  return <OfflinePageContent />;
}
