import type { ReactNode } from 'react';
import ToolCard from './ToolCard';
import ToolPageHeader from './ToolPageHeader';
import I18nHeading from './I18nHeading';
import { ProcessWorkflowBar } from './ProcessWorkflowBar';
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
  formula?: ReactNode;
  /** Assumptions and limitations worth stating explicitly. */
  notes?: string[];
  children: ReactNode;
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
      <ToolPageHeader toolPath={tool.path} />

      <div className="tool-page-content">{children}</div>

      <ProcessWorkflowBar currentToolPath={tool.path} />
      {formula ? (
        <section className="info-card" aria-labelledby="formula-heading">
          <I18nHeading id="formula-heading" translationKey="formulaMethod" fallback="Formula and method" />
          <div className="info-body">{formula}</div>
        </section>
      ) : null}

      {notes && notes.length > 0 ? (
        <section className="info-card" aria-labelledby="notes-heading">
          <I18nHeading id="notes-heading" translationKey="notesAssumptions" fallback="Notes and assumptions" />
          <ul className="info-list">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="faq" aria-labelledby="faq-heading">
        <I18nHeading id="faq-heading" translationKey="faq" fallback="FAQ" />
        {faq.map((item) => (
          <details className="faq-item" key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>

      <section className="related-tools" aria-labelledby="related-heading">
        <I18nHeading id="related-heading" translationKey="relatedTools" fallback="Related tools" />
        <div className="tool-grid">
          {related.map((candidate) => (
            <ToolCard key={candidate.path} path={candidate.path} />
          ))}
        </div>
      </section>
    </article>
  );
}
