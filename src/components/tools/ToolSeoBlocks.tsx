'use client';

import InlineMarkup from '@/components/common/InlineMarkup';
import ToolCard from './ToolCard';
import { useToolCopy, type CopyResource } from '@/lib/i18n/tool-copy';
import { useTranslation } from '@/lib/i18n/use-translation';

export interface ToolFaqItem {
  question: string;
  answer: string;
}

/** Content model for the SEO blocks below a tool: serializable, locale-resolved. */
export type ToolFormulaBlock =
  | { kind: 'math'; label: string; html: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'text'; text: string };

interface ToolSeoBlocksProps {
  copy: CopyResource;
  faq: ToolFaqItem[];
  notes?: string[];
  formula?: ToolFormulaBlock[];
  relatedPaths: string[];
}

/**
 * Localized SEO blocks (formula, notes, FAQ, related tools).
 *
 * Client component so every string re-renders on a locale switch; the English
 * msgid is what the server renders, so the default-locale HTML — and the FAQ
 * structured data emitted by ToolPageShell — stays exactly as before.
 */
export default function ToolSeoBlocks({ copy, faq, notes, formula, relatedPaths }: ToolSeoBlocksProps) {
  const t = useToolCopy(copy);
  const ui = useTranslation();

  return (
    <>
      {formula && formula.length > 0 ? (
        <section className="info-card" aria-labelledby="formula-heading">
          <h2 id="formula-heading">{ui.formulaMethod}</h2>
          <div className="info-body">
            {formula.map((block, index) => {
              if (block.kind === 'math') {
                return (
                  <div className="formula-latex-card" key={index}>
                    <div className="formula-latex-label">{t(block.label)}</div>
                    <div className="formula-latex-body" dangerouslySetInnerHTML={{ __html: block.html }} />
                  </div>
                );
              }
              if (block.kind === 'list') {
                return (
                  <ul className="info-list" key={index}>
                    {block.items.map((item) => (
                      <li key={item}>
                        <InlineMarkup text={t(item)} />
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={index}>
                  <InlineMarkup text={t(block.text)} />
                </p>
              );
            })}
          </div>
        </section>
      ) : null}

      {notes && notes.length > 0 ? (
        <section className="info-card" aria-labelledby="notes-heading">
          <h2 id="notes-heading">{ui.notesAssumptions}</h2>
          <ul className="info-list">
            {notes.map((note) => (
              <li key={note}>
                <InlineMarkup text={t(note)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="faq" aria-labelledby="faq-heading">
        <h2 id="faq-heading">{ui.faq}</h2>
        {faq.map((item) => (
          <details className="faq-item" key={item.question}>
            <summary>{t(item.question)}</summary>
            <p>
              <InlineMarkup text={t(item.answer)} />
            </p>
          </details>
        ))}
      </section>

      <section className="related-tools" aria-labelledby="related-heading">
        <h2 id="related-heading">{ui.relatedTools}</h2>
        <div className="tool-grid">
          {relatedPaths.map((path) => (
            <ToolCard key={path} path={path} />
          ))}
        </div>
      </section>
    </>
  );
}
