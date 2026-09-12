import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import SplitLotCalculator from '@/tools/split-lot-calculator/Calculator';
import { tool } from '@/tools/split-lot-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function SplitLotCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Absolute Split Delta"
            math="\Delta = \text{Value}_{\text{split}} - \text{Value}_{\text{POR}}"
          />
          <MathFormula
            block
            label="Percentage Relative Variation"
            math="\%\,\Delta = \left( \frac{\Delta}{\text{Value}_{\text{POR}}} \right) \times 100\%"
          />
<ul className="info-list">
            <li>
              <strong>Process of Record (POR) Baseline</strong> — the qualified baseline recipe against which experimental splits and wafer groups are evaluated.
            </li>
            <li>
              <strong>Split Wafers</strong> — physical wafer slots assigned to specific experimental recipe conditions (e.g. W#01-06 vs W#07-12) to isolate process variance.
            </li>
            <li>
              <strong>Target Response Metrics</strong> — measured inline metrology (etch rate, selectivity, oxide thickness, sheet resistance, CD bias) compared directly against POR targets.
            </li>
          </ul>
        </>
      }
      notes={[
        'When running split lots across process chambers, remember that chamber seasoning, memory effects, and wall deposits can create split-to-split crosstalk if seasoning steps are omitted.',
        'Always ensure wafer slot randomization or randomized block design in multi-factor experiments to prevent systematic cassette position bias.',
      ]}
      faq={[
        {
          question: 'What is a Split Lot in semiconductor manufacturing?',
          answer: 'A split lot is an experimental lot where subsets of wafers (splits) within the same 25-wafer FOUP/cassette are routed through different recipe parameters (such as RF power, pressure, temperature, or chemical concentrations) at a specific process step to directly evaluate process sensitivity and optimization with common upstream history.',
        },
        {
          question: 'How does this tool help cleanroom process integration engineers?',
          answer: 'It provides a clear parameter delta overlay matrix, automatic percentage change calculation against POR baseline, visual response bar charts, and CSV export formatted for cleanroom travelers and DOE analysis logs.',
        },
      ]}
    >
      <SplitLotCalculator />
    </ToolPageShell>
  );
}
