import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'SemiTools runs every calculation in your browser, stores favorites in local storage and keeps no server-side copy of your inputs.',
  alternates: { canonical: '/privacy' },
};

export default function Privacy() {
  return (
    <div className="prose-page">
      <div className="eyebrow">PRIVACY</div>
      <h1>Privacy</h1>
      <p>
        {SITE_NAME} does not require an account and does not send calculator inputs to a server. Calculations run in your
        browser.
      </p>
      <h2>Local processing</h2>
      <p>
        Do not enter confidential manufacturing data if your organization&rsquo;s policy prohibits it. This site does not
        provide a guarantee of data retention or security for future versions.
      </p>
      <h2>What is stored on your device</h2>
      <p>
        Only your interface preferences are stored, in this browser&rsquo;s local storage: the tools you starred as favorites
        and which sidebar categories you collapsed. Both stay on your device, are not transmitted, and can be removed by
        clearing site data.
      </p>
      <h2>Analytics</h2>
      <p>
        No third-party analytics, advertising or tracking scripts are loaded by these calculator pages.
      </p>
    </div>
  );
}
