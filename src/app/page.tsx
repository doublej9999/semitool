import type { Metadata } from 'next';
import HomePageContent from '@/components/home/HomePageContent';
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return <HomePageContent />;
}
