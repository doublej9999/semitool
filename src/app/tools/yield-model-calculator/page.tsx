import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import YieldModelCalculator from '@/tools/yield-model-calculator/Calculator';
import { tool } from '@/tools/yield-model-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function YieldModelCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Average Defect Count per Die"
            math="\lambda = D_0 \times A"
          />
          <MathFormula
            block
            label="Poisson Random Defect Model"
            math="Y = \exp(-\lambda) = \exp(-D_0 \cdot A)"
          />
          <MathFormula
            block
            label="Murphy Triangular Defect Density Model"
            math="Y = \left[ \frac{1 - \exp(-D_0 \cdot A)}{D_0 \cdot A} \right]^2"
          />
          <MathFormula
            block
            label="Seeds (Moore) Negative Exponential Model"
            math="Y = \frac{1}{1 + D_0 \cdot A}"
          />
          <ul className="info-list">
            <li>
              <strong>D0</strong> — defect density in defects/cm² (the density of defects that are fatal to this die).
            </li>
            <li>
              <strong>A</strong> — critical area in cm², converted from mm² when that unit is selected.
            </li>
            <li>
              <strong>AD</strong> — expected number of killer defects per die; the single number that drives all three
              models.
            </li>
            <li>
              <strong>Y</strong> — modelled yield as a fraction. The page shows it in percent.
            </li>
          </ul>
        </>
      }
      notes={[
        'Poisson, Murphy and Seeds (Moore) are textbook models of how random defects are distributed across a wafer. They are model outputs, not measurements, and not a fab-, customer- or equipment-specific specification.',
        'The three agree at small AD and separate as AD grows: for the same AD, Poisson returns the lowest yield and Seeds the highest, with Murphy in between.',
        'Poisson assumes defects are spread uniformly and randomly; Murphy is derived from a triangular defect-density distribution, and Seeds corresponds to a clustered distribution.',
        'A measured yield can fall below every model here because systematic loss — edge die, parametric and test-escape failures — is not described by a random-defect model.',
      ]}
      faq={[
        {
          question: 'Which of the three models should I quote?',
          answer:
            'Poisson is the usual starting point for random defects, and it is the basis of most defect-density reporting. Murphy and Seeds bracket it: Murphy assumes a triangular distribution of defect density and Seeds a clustered one. If the model matters for the decision, state which one you used rather than showing a single number as if it were measured.',
        },
        {
          question: 'What is critical area, and why is it not just the die area?',
          answer:
            'Critical area is the part of the die where a defect of a given size actually causes a failure. It is usually smaller than the physical die area, and it comes from layout analysis rather than from the die dimensions. Entering the full die area instead of the critical area overstates the expected number of killer defects and therefore understates the yield.',
        },
        {
          question: 'Why do the models disagree?',
          answer:
            'They encode different assumptions about defect clustering. At a very small AD (few expected defects per die) a die is almost always either clean or hit once regardless of the distribution, so the models nearly coincide. As AD grows, clustering keeps more die completely defect-free than the uniform Poisson model predicts, so Murphy and Seeds return higher yields.',
        },
        {
          question: 'The result shows 100% — is that an error?',
          answer:
            'No. A defect density of zero returns 100% in every model, and at very small AD the values round to 100.00%. It means the expected number of killer defects per die is negligible at this area, not that the yield is guaranteed.',
        },
      ]}
    >
      <YieldModelCalculator />
    </ToolPageShell>
  );
}
