import type { Metadata } from 'next';
import ContactPageContent from '@/components/pages/ContactPageContent';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Report an incorrect formula, an unclear unit or a missing tool. SemiTools issues and corrections are tracked on GitHub.',
  alternates: { canonical: '/contact' },
};

export default function Contact() {
  return <ContactPageContent />;
}
