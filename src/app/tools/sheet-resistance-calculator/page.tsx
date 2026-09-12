import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import SheetResistanceCalculator from '@/tools/sheet-resistance-calculator/Calculator';
import { tool } from '@/tools/sheet-resistance-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function SheetResistanceCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Collinear Four-Point Probe Sheet Resistance"
            math="R_s = \frac{\pi}{\ln 2} \left( \frac{V}{I} \right) \approx 4.53236 \left( \frac{V}{I} \right)"
          />
          <MathFormula
            block
            label="Material Resistivity"
            math="\rho = R_s \cdot t"
          />
          <MathFormula
            block
            label="Electrical Conductivity"
            math="\sigma = \frac{1}{\rho}"
          />
          <MathFormula
            block
            label="Thin-Film Geometric Ratio"
            math="\text{Ratio} = \frac{t}{s}"
          />
<ul className="info-list">
            <li>
              <strong>pi / ln 2 = 4.5324</strong> — the geometric factor of a collinear four-point probe on a thin film.
              It comes from the two-dimensional spreading of the current between the outer probes.
            </li>
            <li>
              <strong>Sheet resistance</strong> — in ohms per square. It is a property of the film, not of the square
              size: any square patch of the same film has the same sheet resistance.
            </li>
            <li>
              <strong>Thin-film ratio</strong> — the thin-film relation assumes the film is much thinner than the probe
              spacing. The tool prints the ratio it used so you can judge the result instead of trusting it blindly.
            </li>
          </ul>
        </>
      }
      notes={[
        'This uses the standard thin-film four-point probe relation with a collinear probe and the geometric factor pi / ln 2. Enter the current you forced and the voltage you measured.',
        'Probe spacing cancels in the thin-film limit, so the sheet resistance does not depend on it. The spacing still matters because it sets the thin-film ratio, which is why the tool reports that ratio.',
        'When the film thickness is comparable to the probe spacing the two-dimensional assumption breaks down: in that regime the measured value also depends on the spacing and you need a thickness correction instead of this relation.',
        'Real measurements also depend on probe geometry, contact placement and whether the film is insulating underneath. This is a textbook relation used to interpret a measurement, not a claim of compliance with any metrology standard.',
        'Resistivity is derived from sheet resistance and your stated thickness, so its accuracy cannot be better than the thickness you enter.',
      ]}
      faq={[
        {
          question: 'What is the difference between sheet resistance and resistivity?',
          answer:
            'Resistivity is a bulk property of the material, in ohm-centimetres. Sheet resistance is what a thin film looks like from above, in ohms per square: it is the resistivity divided by the thickness. Two films of the same material but different thickness have the same resistivity and different sheet resistance.',
        },
        {
          question: 'Why is the factor pi / ln 2?',
          answer:
            'In a thin film the current from the outer probe tips spreads in two dimensions rather than three. Solving the potential field for four collinear contacts on a two-dimensional sheet gives a resistance of (pi / ln 2) times the ratio of the measured voltage to the forced current. The factor is about 4.5324.',
        },
        {
          question: 'Why does probe spacing not change the answer?',
          answer:
            'In the thin-film limit the current spreading pattern scales with the spacing, and so does the voltage drop between the inner probes. The two scale together, so the spacing cancels in the ratio V / I and the sheet resistance is independent of it. That is the convenience of the measurement, and also why the tool warns when the film is too thick for the assumption to hold.',
        },
        {
          question: 'What does the thickness / spacing ratio tell me?',
          answer:
            'It tells you whether the thin-film assumption is reasonable. The tool flags the result when the ratio exceeds 0.5, meaning the film is no longer thin compared with the probe spacing. In that regime treat the number as indicative only and apply a proper thickness correction.',
        },
      ]}
    >
      <SheetResistanceCalculator />
    </ToolPageShell>
  );
}
