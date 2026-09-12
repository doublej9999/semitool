import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import DefectDensityCalculator from '@/tools/defect-density-calculator/Calculator';
import { tool } from '@/tools/defect-density-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function DefectDensityCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Poisson Yield Model"
            math="D_0 = -\frac{\ln(Y)}{A}"
          />
          <MathFormula
            block
            label="Seeds (Moore) Yield Model"
            math="D_0 = \frac{1/Y - 1}{A}"
          />
          <MathFormula
            block
            label="Murphy Triangular Defect Model"
            math="Y = \left[ \frac{1 - \exp(-A D_0)}{A D_0} \right]^2"
          />
          <MathFormula
            block
            label="Defect Clustering Area Factor"
            math="A D_0 = D_0 \times A"
          />
<ul className="info-list">
            <li>
              <strong>Y</strong> — measured yield as a fraction, entered here in percent.
            </li>
            <li>
              <strong>A</strong> — critical area in cm², converted from mm² when that unit is selected.
            </li>
            <li>
              <strong>AD</strong> — expected number of killer defects per die implied by the yield.
            </li>
            <li>
              <strong>D0</strong> — defect density in defects/cm² that the model attributes to the yield loss.
            </li>
          </ul>
        </>
      }
      notes={[
        'This is the inverse of the yield-model direction: the same Poisson, Murphy and Seeds models solved for defect density.',
        'Murphy has no closed-form inverse, so AD is found numerically; the displayed value is accurate to the shown precision.',
        'The answer is model-dependent. Poisson is the most pessimistic interpretation of a yield loss and therefore reports the highest D0; Seeds reports the lowest.',
        'A 100% yield returns a defect density of zero, which describes this sample only — it is not evidence that the process has no defects. A 0% yield has no finite answer and is rejected.',
      ]}
      faq={[
        {
          question: 'Why does the defect density change with the area?',
          answer:
            'Because D0 is derived from AD, and AD is the yield loss expressed per die. For a fixed yield, a smaller critical area implies more defects per unit area, so D0 rises as A falls. A defect density is therefore only meaningful together with the area it was derived from — always report the two together.',
        },
        {
          question: 'Which number do I report as D0?',
          answer:
            'Poisson is the conventional basis for defect-density reporting, so it is the value most people mean when they say "D0". Murphy and Seeds are shown next to it so the model dependence is visible; if you publish a different model, name it explicitly.',
        },
        {
          question: 'Can I use this with a single wafer?',
          answer:
            'The arithmetic works, but a single wafer gives a very noisy estimate. Defect density is normally extracted from a large die count or across many wafers precisely because the underlying event is rare. Treat a single-wafer result as an indication, not a process figure.',
        },
        {
          question: 'Why is 0% yield rejected?',
          answer:
            'Because a zero yield implies an infinite defect density under every model here: the logarithm is unbounded, and the Seeds and Murphy projections also diverge. Zero means the measurement or the sample is unusable for this calculation rather than that the defect density is genuinely infinite.',
        },
      ]}
    >
      <DefectDensityCalculator />
    </ToolPageShell>
  );
}
