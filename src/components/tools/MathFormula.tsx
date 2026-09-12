import katex from 'katex';
import clsx from 'clsx';

interface MathFormulaProps {
  math: string;
  block?: boolean;
  className?: string;
  label?: string;
}

export function MathFormula({ math, block = false, className, label }: MathFormulaProps) {
  const html = katex.renderToString(math, {
    displayMode: block,
    throwOnError: false,
  });

  if (block) {
    return (
      <div className={clsx('formula-latex-card', className)}>
        {label ? <div className="formula-latex-label">{label}</div> : null}
        <div
          className="formula-latex-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  }

  return (
    <span
      className={clsx('formula-latex-inline', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default MathFormula;
