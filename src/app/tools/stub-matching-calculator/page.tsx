
import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import StubMatchingCalculator from '@/tools/stub-matching-calculator/Calculator';
import { tool } from '@/tools/stub-matching-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function StubMatchingCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Normalized Line-Length Tan Parameter"
            math="t = \tan(\beta d) = \frac{-x \pm \sqrt{x^2 + (1 - r)(r - r^2 - x^2)}}{1 - r}"
          />
          <MathFormula
            block
            label="Input Admittance Transformation"
            math="y_{\text{in}} = \frac{1 + j t z}{z + j t} = 1 + j b"
          />
          <MathFormula
            block
            label="Short-Circuited Stub Length"
            math="\cot(\beta l) = b \implies l_{\text{short}} = \frac{\lambda_g}{2\pi} \operatorname{arccot}(b)"
          />
          <MathFormula
            block
            label="Open-Circuited Stub Length"
            math="\tan(\beta l) = -b \implies l_{\text{open}} = \frac{\lambda_g}{2\pi} \arctan(-b)"
          />
          <MathFormula
            block
            label="Guided Wavelength in Microstrip"
            math="\lambda_g = \frac{c}{f \sqrt{\varepsilon_r}}"
          />
<ul className="info-list">
            <li>
              <strong>r, x</strong> — the load resistance and reactance normalised to Z₀.
            </li>
            <li>
              <strong>d</strong> — the distance from the load to the stub plane, where the line presents a purely
              real admittance.
            </li>
            <li>
              <strong>b</strong> — the normalised susceptance left over at that plane, which the stub has to
              cancel.
            </li>
          </ul>
        </>
      }
      notes={[
        'A single shunt stub matches any load at one frequency, and there are always two distances that work. They are equally valid, so the choice is practical: pick the one that puts the stub somewhere you can actually place it on the board, or the one with a shorter stub.',
        'Each distance comes with both a short-circuited and an open-circuited stub length. A short stub is the shorter of the two for a positive susceptance, an open stub for a negative one; an open stub also avoids a via, which is why it is usually preferred on a top-layer trace.',
        'A load of exactly Z₀ is already matched and has no stub solution. The tool reports that instead of returning a zero-length stub, and it also rejects a load with no solution at the impedance level entered.',
        'The last column of the table is a check rather than an output: the reported distance and stub length are fed back through the transmission-line equations and the resulting normalised admittance is compared with 1. Values near machine precision mean the placement genuinely matches.',
        'The line is lossless and the stub is ideal. Real stub matches drift with frequency and with the stub length tolerance, and an open stub radiates slightly; a matched narrowband result on paper still needs a tolerance check on the artwork.',
      ]}
      faq={[
        {
          question: 'Why are there two solutions?',
          answer:
            'Because the condition is that the line presents a real admittance of Y₀, and the tangent of the electrical distance satisfies a quadratic, which has two roots. Both put the line at the right conductance with a different residual susceptance, and each is then cancelled by its own stub length. They are therefore both correct matches at the design frequency.',
        },
        {
          question: 'Which is better, a short stub or an open stub?',
          answer:
            'Electrically they are equivalent at the design frequency. Practically the open stub needs no via to ground and is easier to trim, but it radiates a little and is sensitive to solder mask and nearby metal. The short stub needs a via, which adds inductance, but it is shielded and mechanically robust.',
        },
        {
          question: 'Why does the stub length change so much between the two solutions?',
          answer:
            'Because the residual susceptance flips sign. At one distance the line is inductive at the stub plane and the stub has to supply capacitance, at the other it is capacitive and the stub supplies inductance. Since a short stub is inductive for lengths below a quarter wave and capacitive above, the two solutions land on opposite sides of a quarter wavelength.',
        },
        {
          question: 'Can this match a load to a complex source impedance?',
          answer:
            'Set Z₀ to the impedance you are matching to, because the calculation normalises against it. That works whenever the source is real. A genuinely complex source impedance needs the normalisation done against a real reference first, or an additional element for its reactance.',
        },
      ]}
    >
      <StubMatchingCalculator />
    </ToolPageShell>
  );
}
