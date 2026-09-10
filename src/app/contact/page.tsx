import type { Metadata } from 'next';
import { REPO_URL, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Report an incorrect formula, an unclear unit or a missing tool. SemiTools issues and corrections are tracked on GitHub.',
  alternates: { canonical: '/contact' },
};

export default function Contact() {
  return (
    <div className="prose-page">
      <div className="eyebrow">CONTACT</div>
      <h1>Contact {SITE_NAME}</h1>
      <p>
        Found an incorrect formula, an unclear unit or a useful tool idea? Open an issue on the project tracker — that is
        where corrections and new tool requests are handled.
      </p>
      <ul className="contact-list">
        <li>
          <strong>Bug report or formula correction</strong>
          <br />
          <a className="text-link" href={`${REPO_URL}/issues/new`} target="_blank" rel="noopener noreferrer">
            Open a GitHub issue
          </a>
        </li>
        <li>
          <strong>Source code and release history</strong>
          <br />
          <a className="text-link" href={REPO_URL} target="_blank" rel="noopener noreferrer">
            github.com/doublej9999/semitool
          </a>
        </li>
      </ul>
      <h2>When reporting a calculation issue</h2>
      <p>
        Include the tool, the exact inputs with units, the result you expected, the result you got, and any reference
        formula or specification you are comparing against. That is usually enough to fix the tool without a follow-up
        question.
      </p>
    </div>
  );
}
