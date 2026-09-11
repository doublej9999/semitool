
'use client';

/**
 * Textarea for a pasted list of measurements, used by the uniformity tools.
 *
 * It only renders the field; parsing lives in `src/lib/series.ts` so the same
 * rules apply to every tool that accepts a list.
 */
export default function SeriesField({
  id,
  label,
  value,
  onChange,
  hint,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        rows={4}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <p className="note">{hint}</p> : null}
    </div>
  );
}
