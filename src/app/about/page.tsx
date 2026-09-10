import type { Metadata } from 'next';
import { REPO_URL, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About',
  description:
    'SemiTools is a set of browser-based semiconductor calculators that state their formula, units and scope instead of hiding assumptions in a black box.',
  alternates: { canonical: '/about' },
};

export default function About() {
  return (
    <div className="prose-page">
      <div className="eyebrow">ABOUT</div>
      <h1>Engineering tools, without the friction.</h1>
      <p>
        {SITE_NAME} is a focused collection of browser-based calculators for semiconductor engineers, equipment engineers,
        yield engineers and students.
      </p>
      <h2>Transparent by design</h2>
      <p>
        Inputs are processed locally in your browser. Each tool explains its formula and assumptions so you can check the
        result before using it in your workflow.
      </p>
      <h2>Generic calculations</h2>
      <p>
        Results may not match a specific fab, customer, equipment, MES or manufacturing specification. Always verify against
        your controlled process documentation.
      </p>
      <h2>Source code</h2>
      <p>
        The project is open source. Issues, formula corrections and tool requests are handled on{' '}
        <a className="text-link" href={REPO_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        .
      </p>
    </div>
  );
}
