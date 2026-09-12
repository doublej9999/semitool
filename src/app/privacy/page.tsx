import type { Metadata } from 'next';
import PrivacyPageContent from '@/components/pages/PrivacyPageContent';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'SemiTools runs every calculation in your browser, stores favorites in local storage and keeps no server-side copy of your inputs.',
  alternates: { canonical: '/privacy' },
};

export default function Privacy() {
  return <PrivacyPageContent />;
}
