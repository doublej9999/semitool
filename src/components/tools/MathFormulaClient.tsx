'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface MathFormulaClientProps {
  math: string;
  block?: boolean;
  className?: string;
  label?: string;
}

/**
 * Client-side twin of MathFormula. Renders a lightweight placeholder during
 * SSR/first paint and pulls KaTeX (~270 KB min) in as a dynamic chunk, so
 * client calculators that need math do not carry it in their route bundle.
 * Server pages keep using the synchronous MathFormula instead.
 */
export function MathFormulaClient({ math, block = false, className, label }: MathFormulaClientProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import('katex').then((katex) => {
      if (cancelled) return;
      setHtml(
        katex.default.renderToString(math, {
          displayMode: block,
          throwOnError: false,
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [math, block]);

  if (block) {
    return (
      <div className={clsx('formula-latex-card', className)}>
        {label ? <div className="formula-latex-label">{label}</div> : null}
        <div
          className="formula-latex-body"
          {...(html === null
            ? { children: <code className="formula-latex-fallback">{math}</code> }
            : { dangerouslySetInnerHTML: { __html: html } })}
        />
      </div>
    );
  }

  if (html === null) {
    return <code className={clsx('formula-latex-fallback', className)}>{math}</code>;
  }

  return (
    <span
      className={clsx('formula-latex-inline', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default MathFormulaClient;
