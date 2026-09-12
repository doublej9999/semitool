import type { Metadata } from 'next';
import AboutPageContent from '@/components/pages/AboutPageContent';
export const metadata: Metadata = {
  title: 'About',
  description:
    'SemiTools is a set of browser-based semiconductor calculators that state their formula, units and scope instead of hiding assumptions in a black box.',
  alternates: { canonical: '/about' },
};

export default function About() {
  return <AboutPageContent />;
}
