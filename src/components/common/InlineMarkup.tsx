import { Fragment } from 'react';

/**
 * Renders a translated string that may carry inline `**emphasis**` markup.
 *
 * Used by the localized SEO blocks on tool pages: a copy value stays a plain
 * string (translatable by a single lookup) while still supporting the bold lead-in
 * the English source uses, e.g. `**Gross die** — number of die positions`.
 */
export default function InlineMarkup({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index}>{part}</strong>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
