import ToolCard from './ToolCard';
import ToolPageActions from './ToolPageActions';
import { getRelatedTools } from '@/tools';
import { absoluteUrl } from '@/lib/site';
import type { Tool } from '@/tools/tools.types';

export interface FaqItem {
  question: string;
  answer: string;
}

interface ToolPageShellProps {
  tool: Tool;
  /** Tool-specific questions; rendered as a native `details` accordion for SEO and a11y. */
  faq: FaqItem[];
  /** Formula / method block, rendered below the tool. */
  formula?: React.ReactNode;
  /** Assumptions and limitations worth stating explicitly. */
  notes?: string[];
  children: React.ReactNode;
}

/**
 * Layout shared by every tool page (it-tools `tool.layout.vue` equivalent):
 * category eyebrow + H1 + separator + description, then the tool itself, then
 * the SEO content blocks (formula, notes, FAQ, related tools).
 */
export default function ToolPageShell({ tool, faq, formula, notes, children }: ToolPageShellProps) {
  const related = getRelatedTools(tool.path);

  // Structured data: the FAQ block is emitted as FAQPage so search engines can
  // surface it, and the tool itself as a free SoftwareApplication.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: tool.name,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any (web browser)',
        description: tool.description,
        url: absoluteUrl(tool.path),
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  };

  return (
    <article className="tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="tool-page-header">
        <p className="eyebrow">
          {tool.category} / {tool.isNew ? 'NEW TOOL' : 'TOOL'}
        </p>
        <h1>{tool.name}</h1>
        <span className="tool-page-separator" aria-hidden="true" />
        <p className="tool-page-desc">{tool.description}</p>
        <ToolPageActions toolName={tool.name} />
      </header>

      <div className="tool-page-content">{children}</div>

      {formula ? (
        <section className="info-card" aria-labelledby="formula-heading">
          <h2 id="formula-heading">Formula and method</h2>
          <div className="info-body">{formula}</div>
        </section>
      ) : null}

      {notes && notes.length > 0 ? (
        <section className="info-card" aria-labelledby="notes-heading">
          <h2 id="notes-heading">Notes and assumptions</h2>
          <ul className="info-list">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="faq" aria-labelledby="faq-heading">
        <h2 id="faq-heading">FAQ</h2>
        {faq.map((item) => (
          <details className="faq-item" key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>

      <section className="related-tools" aria-labelledby="related-heading">
        <h2 id="related-heading">Related tools</h2>
        <div className="tool-grid">
          {related.map((candidate) => (
            <ToolCard key={candidate.path} path={candidate.path} />
          ))}
        </div>
      </section>
    </article>
  );
}
