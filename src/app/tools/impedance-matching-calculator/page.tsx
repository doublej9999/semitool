
import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import ImpedanceMatchingCalculator from '@/tools/impedance-matching-calculator/Calculator';
import { tool } from '@/tools/impedance-matching-calculator';
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

export default function ImpedanceMatchingCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Matching Quality Factor (L-Network)"
            math="Q = \sqrt{\frac{R_{\text{high}}}{R_{\text{low}}} - 1}"
          />
          <MathFormula
            block
            label="Series Branch Reactance"
            math="X_{\text{series}} = Q \cdot R_{\text{low}}"
          />
          <MathFormula
            block
            label="Shunt Branch Reactance"
            math="X_{\text{shunt}} = \frac{R_{\text{high}}}{Q}"
          />
          <MathFormula
            block
            label="Fractional Bandwidth Approximation"
            math="\text{BW} \approx \frac{f_0}{Q}"
          />
<ul className="info-list">
            <li>
              <strong>Loaded Q</strong> — fixed by the resistance ratio alone, so it is the same for both the
              low-pass and the high-pass build.
            </li>
            <li>
              <strong>Shunt side</strong> — the shunt element always goes across the larger resistance, and the
              series element faces the smaller one.
            </li>
            <li>
              <strong>Series and shunt reactances</strong> — the reactances at f₀; each is then built as either an
              inductor or a capacitor depending on the topology.
            </li>
          </ul>
        </>
      }
      notes={[
        'The L network is the narrowest useful match: Q is not a design choice but a consequence of the resistance ratio. A 4:1 ratio forces Q = 1.73, so an octave of bandwidth is the most you can expect. When the ratio is large and the bandwidth matters, more sections are needed.',
        'Only the reactances are fixed by the ratio; whether each becomes an L or a C is free. The low-pass combination attenuates harmonics above the band, the high-pass combination blocks below it, and both match equally well.',
        'The two terminations are treated as real resistances. A complex load cannot be matched by an L network alone, because its reactance consumes part of the reactance budget; absorb it into the network or use the shunt stub tool instead.',
        'The bandwidth figure is the Q-based estimate for a single section with the loaded Q given, and it is quoted as a warning about how narrow the match is rather than as a measured response.',
        'Values are quoted at the design frequency. Moving 10% away from f₀ moves both elements off their ideal reactance and the match degrades faster the higher the Q.',
      ]}
      faq={[
        {
          question: 'Which of the two results should I build?',
          answer:
            'They both match. Pick the low-pass row when the source carries harmonics you want attenuated, and the high-pass row when you need to block something below the band. If neither matters, the low-pass row is the usual choice because inductors in series with the signal and a capacitor to ground also clean up the spectrum.',
        },
        {
          question: 'Why is the bandwidth not an input?',
          answer:
            'Because an L network has no spare degree of freedom. The ratio of the two resistances already sets Q, and Q sets the bandwidth. To choose a bandwidth you widen the match with a Pi or T network, which adds a degree of freedom, or you accept the L network and its fixed Q.',
        },
        {
          question: 'Can it match a complex load?',
          answer:
            'Not directly. The reactance of a complex load shifts the point the network has to reach, so one of the two elements has to absorb it and the other solutions disappear. Use the shunt stub calculator, which is built for a series R + jX load, or first cancel the load reactance with a series element.',
        },
        {
          question: 'Do the component values include parasitics?',
          answer:
            'No. These are ideal reactances at f₀. Real inductors have a self-resonant frequency and finite Q, and real capacitors have equivalent series inductance, so a built network will need the values pulled in slightly once the parts are chosen.',
        },
      ]}
    >
      <ImpedanceMatchingCalculator />
    </ToolPageShell>
  );
}
