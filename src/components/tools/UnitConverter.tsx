
'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';
import { useUrlParamsState } from '@/lib/use-url-state';
/**
 * One unit a converter can express a value in.
 *
 * `id` is the key the conversion functions use; `label` is what the reader
 * sees, so a unit like the ångström can be shown as "Å" without the maths
 * having to parse a display string.
 */
export interface ConverterUnit {
  id: string;
  label: string;
}

export type ConverterResult =
  | { ok: true; values: Record<string, number> }
  | { ok: false; errors: string[] };

/** The converter's rendering, independent of where {raw, unit} lives. */
interface ConverterViewProps {
  /** Heading of the input panel. */
  title: string;
  /** Heading of the result panel. */
  resultTitle: string;
  units: readonly ConverterUnit[];
  /** Unit featured as the headline number next to the table. */
  headlineUnit: string;
  initialValue: string;
  initialUnit: string;
  /** Pure conversion; called on every render with the current value and unit. */
  convert: (value: number, unit: string) => ConverterResult;
  /** Extra fields (gas, reference temperature, mode) rendered above the value. */
  controls?: ReactNode;
  /** Explanation rendered under the table. */
  note?: ReactNode;
  /** The value as typed, empty string meaning "nothing typed yet". */
  raw: string;
  unit: string;
  onRawChange: (raw: string) => void;
  onUnitChange: (unit: string) => void;
}

type ConverterConfig = Omit<ConverterViewProps, 'raw' | 'unit' | 'onRawChange' | 'onUnitChange'>;

interface UnitConverterProps extends ConverterConfig {
  /**
   * Namespace for the URL keys when the converter syncs itself: a prefix of
   * "thickness" reads and writes `?thicknessValue=…&thicknessUnit=…`. Give
   * each converter on a page a distinct prefix so their keys cannot collide.
   * Without a prefix the converter never touches the URL.
   */
  urlKeyPrefix?: string;
  /**
   * Controlled value and unit. When both are provided the converter renders
   * exactly these and never touches the URL; the owner syncs instead — which
   * is what a page that already runs its own useUrlParamsState must do, since
   * that hook rewrites the whole query string.
   */
  value?: string;
  unit?: string;
  onValueChange?: (value: string) => void;
  onUnitChange?: (unit: string) => void;
}

/** Empty input means "nothing typed yet", not zero. */
export function converterNumber(raw: string): number {
  return raw.trim() === '' ? Number.NaN : Number(raw);
}

/**
 * Fixed point for everyday magnitudes and exponential only when a fixed-point
 * number stops being readable, so a table of sccm, m³/h and mol/min stays
 * legible in every row.
 */
export function formatValue(value: number, significant = 6): string {
  if (!Number.isFinite(value)) return '—';
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude < 1e-4 || magnitude >= 1e6)) return value.toExponential(4);
  return Number(value.toPrecision(significant)).toString();
}

/**
 * Value plus unit in, every supported unit out.
 *
 * The conversion itself lives in `src/lib`, so this component only owns the
 * two things a converter needs: which number and unit went in, and how the
 * answer is laid out. Keeping the maths outside means each converter is
 * testable without a DOM.
 */
export default function UnitConverter(props: UnitConverterProps) {
  const { urlKeyPrefix, value, unit, onValueChange, onUnitChange, ...config } = props;

  // Controlled: the owner holds {value, unit} (and any URL sync).
  if (value !== undefined && unit !== undefined) {
    return (
      <ConverterView
        {...config}
        raw={value}
        unit={unit}
        onRawChange={onValueChange ?? noop}
        onUnitChange={onUnitChange ?? noop}
      />
    );
  }

  // Uncontrolled with a URL namespace: the converter syncs itself.
  if (urlKeyPrefix !== undefined) {
    return <UrlSyncedConverter urlKeyPrefix={urlKeyPrefix} {...config} />;
  }

  // Plain uncontrolled: state lives here, URL untouched.
  return <LocalStateConverter {...config} />;
}

const noop = () => {};

function ConverterView({
  title,
  resultTitle,
  units,
  headlineUnit,
  initialValue,
  initialUnit,
  convert,
  controls,
  note,
  raw,
  unit,
  onRawChange,
  onUnitChange,
}: ConverterViewProps) {
  const locale = useLocale();
  const t = getTranslation(locale);
  const [copied, setCopied] = useState(false);

  const result = convert(converterNumber(raw), unit);
  const labelOf = (id: string) => units.find((entry) => entry.id === id)?.label ?? id;
  const headline = units.find((entry) => entry.id === headlineUnit) ?? units[0];

  const copyResult = async () => {
    if (!result.ok) return;

    const lines = [
      `${raw} ${labelOf(unit)}`,
      ...units.map((entry) => `${entry.label}: ${formatValue(result.values[entry.id])}`),
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="calc-grid">
      <section className="panel" aria-labelledby="converter-inputs">
        <h2 id="converter-inputs">{title}</h2>

        {controls}

        <div className="field">
          <label htmlFor="converter-value">{t.valueLabel}</label>
          <div className="inline-field">
            <input
              id="converter-value"
              type="number"
              step="any"
              value={raw}
              onChange={(event) => onRawChange(event.target.value)}
            />
            <select
              aria-label={t.unitColumn || 'Value unit'}
              value={unit}
              onChange={(event) => onUnitChange(event.target.value)}
              style={{ flex: '0 0 auto', width: 'auto' }}
            >
              {units.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="action-row">
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              onRawChange(initialValue);
              onUnitChange(initialUnit);
            }}
          >
            <RotateCcw size={14} aria-hidden="true" /> {t.reset}
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="converter-result">
        <h2 id="converter-result">{resultTitle}</h2>

        {!result.ok ? (
          <div className="error" role="alert">
            {result.errors.map((message) => (
              <div key={message}>{message}</div>
            ))}
          </div>
        ) : (
          <>
            <span className="unit">{t.equalTo}</span>
            <div className="result-value" aria-live="polite">
              {formatValue(result.values[headline.id])}
              <span className="result-suffix"> {headline.label}</span>
            </div>

            <table className="model-table">
              <thead>
                <tr>
                  <th scope="col">{t.unitColumn}</th>
                  <th scope="col">{t.valueColumn}</th>
                </tr>
              </thead>
              <tbody>
                {units.map((entry) => (
                  <tr key={entry.id}>
                    <th scope="row">{entry.label}</th>
                    <td className="mono">{formatValue(result.values[entry.id])}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {note}

            <div className="action-row">
              <button className="button primary" type="button" onClick={copyResult}>
                <Copy size={15} aria-hidden="true" /> {copied ? t.copied : t.copyResult}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function LocalStateConverter(config: ConverterConfig) {
  const [raw, setRaw] = useState(config.initialValue);
  const [unit, setUnit] = useState(config.initialUnit);

  return (
    <ConverterView
      {...config}
      raw={raw}
      unit={unit}
      onRawChange={setRaw}
      onUnitChange={setUnit}
    />
  );
}

/**
 * Uncontrolled and URL-synced: {raw, unit} live in one object whose keys are
 * namespaced by the prefix, so useUrlParamsState hydrates them from the query
 * string on load and rewrites them (debounced) as the visitor types. The raw
 * string is stored as typed, so what goes into the URL is exactly what comes
 * back out.
 */
function UrlSyncedConverter({ urlKeyPrefix, ...config }: { urlKeyPrefix: string } & ConverterConfig) {
  const valueKey = `${urlKeyPrefix}Value`;
  const unitKey = `${urlKeyPrefix}Unit`;
  const [state, setState] = useState<Record<string, string>>(() => ({
    [valueKey]: config.initialValue,
    [unitKey]: config.initialUnit,
  }));
  useUrlParamsState(state, setState);

  return (
    <ConverterView
      {...config}
      raw={state[valueKey] ?? config.initialValue}
      unit={state[unitKey] ?? config.initialUnit}
      onRawChange={(next) => setState((current) => ({ ...current, [valueKey]: next }))}
      onUnitChange={(next) => setState((current) => ({ ...current, [unitKey]: next }))}
    />
  );
}
