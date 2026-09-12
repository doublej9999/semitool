import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import TemperatureConverter from '@/tools/temperature-converter/Calculator';
import { tool } from '@/tools/temperature-converter';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
  keywords: tool.keywords,
  alternates: { canonical: tool.path },
  openGraph: {
    title: `${tool.name} — SemiTools`,
    description: tool.description,
    url: absoluteUrl(tool.path),
    type: 'website',
  },
};

export default function TemperatureConverterPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Celsius to Kelvin"
            math="T\,[\text{K}] = T\,[{^\circ}\text{C}] + 273.15"
          />
          <MathFormula
            block
            label="Celsius to Fahrenheit"
            math="T\,[{^\circ}\text{F}] = T\,[{^\circ}\text{C}] \times \frac{9}{5} + 32"
          />
          <MathFormula
            block
            label="Kelvin to Rankine"
            math="T\,[{^\circ}\text{R}] = T\,[\text{K}] \times \frac{9}{5}"
          />
          <MathFormula
            block
            label="Differential Temperature Interval"
            math="\Delta T\,[{^\circ}\text{F}] = \Delta T\,[{^\circ}\text{C}] \times \frac{9}{5}"
          />
<ul className="info-list">
            <li>
              <strong>Absolute temperature</strong> — a reading on a scale, converted with its offset.
            </li>
            <li>
              <strong>Temperature difference</strong> — a span or tolerance, converted by the scale factor alone, because
              the offset cancels.
            </li>
            <li>
              <strong>absolute zero</strong> — 0 K, which is -273.15 °C and -459.67 °F. Anything below it is rejected.
            </li>
          </ul>
        </>
      }
      notes={[
        'The offsets are exact: the kelvin is defined so that a Celsius step equals a kelvin step and water freezes at 273.15 K, and the Fahrenheit scale is fixed at 9/5 of a Celsius degree with a 32 ° offset.',
        'Absolute and difference are separate modes rather than one conversion, because a temperature and a temperature difference genuinely convert differently. Using the absolute conversion on a tolerance is a common and quiet mistake.',
        'A temperature below absolute zero is rejected. If you typed a negative number intending a difference — a cooling step, say — switch the mode above.',
        'Kelvin and Rankine are absolute scales that share a zero, so 0 K and 0 °R are the same temperature, while 0 °C and 0 °F are not.',
      ]}
      faq={[
        {
          question: 'Is 300 K hot or cold?',
          answer: 'It is a typical room temperature: 300 K is 26.85 °C, or 80.33 °F. Process temperatures read in kelvin are common in vacuum and cryogenic work, where an absolute scale avoids negative numbers entirely.',
        },
        {
          question: 'Why does a temperature difference convert differently from a temperature?',
          answer: 'Because the offset cancels in a difference. A 10 °C rise and a 10 K rise are the same size, and both are an 18 °F rise — but an absolute reading of 10 °C is 50 °F, not 18 °F. The conversion factor is 9/5 either way; only the offset is dropped for a difference, and the two results differ by exactly 32 °F worth of offset.',
        },
        {
          question: 'Where do Celsius and Fahrenheit read the same number?',
          answer: 'At exactly -40. Solving T = T x 9/5 + 32 gives T = -40, so -40 °C and -40 °F are the same temperature and the two scales cross there. It makes a handy sanity check on any converter.',
        },
        {
          question: 'Can a temperature be below absolute zero?',
          answer: 'Not as an ordinary reading. Absolute zero is 0 K, -273.15 °C or -459.67 °F, and nothing at rest can be colder. This tool rejects a value below it, which usually means a Fahrenheit or Celsius figure was entered as if it were a difference, or a scale was mixed up.',
        },
      ]}
    >
      <TemperatureConverter />
    </ToolPageShell>
  );
}
