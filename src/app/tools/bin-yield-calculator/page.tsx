
import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import BinYieldCalculator from '@/tools/bin-yield-calculator/Calculator';
import { tool } from '@/tools/bin-yield-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function BinYieldCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Bin Share"
            math="\text{Bin Share} = \frac{\text{Count}_i}{N_{\text{total}}} \times 100\%"
          />
          <MathFormula
            block
            label="Cumulative Yield"
            math="Y_{\text{cum}} = \sum_{i \in \text{Pass}} \frac{\text{Count}_i}{N_{\text{total}}} \times 100\%"
          />
          <MathFormula
            block
            label="Defect DPPM"
            math="\text{DPPM} = (1 - Y_{\text{pass fraction}}) \times 10^6"
          />
<ul className="info-list">
            <li>
              <strong>Per-bin share</strong> — each bin as a fraction of all die tested, which is what a sort yield
              actually reports.
            </li>
            <li>
              <strong>Cumulative</strong> — the running total as the bins are added from the largest down, so the depth
              to reach a given yield is visible.
            </li>
            <li>
              <strong>Fail DPPM</strong> — every die outside the pass bin, per million, for comparing with a customer
              DPPM target.
            </li>
          </ul>
        </>
      }
      notes={[
        'The pass bin is the one marked with a *; if nothing is marked the largest bin is assumed to be the pass bin and the result says so, because on most wafer sorts the good bin dominates but that is an assumption rather than a fact.',
        'The bin count is a real count from a datalog, so the rollup is exact arithmetic: no yield model is applied and no defect density is assumed. The DPPM printed here is the measured sort defect rate, which is not the same as a customer-return DPPM.',
        'Repeated labels are summed so a bin split across two lines does not silently drop die, and lines beginning with # are ignored so a header copied with the data does not break the parse.',
        'A malformed line is reported with its number instead of being skipped, because silently ignoring an unreadable line would understate the total die and inflate the yield.',
        'The order is by descending count rather than by bin number. That is deliberate for a yield rollup: it puts the pass bin and the largest failure modes first, which is the order a failure analysis reads them in.',
      ]}
      faq={[
        {
          question: 'How do I enter the pass bin?',
          answer: 'Put a * after its count, for example "PASS 9000 *". If no bin is marked, the tool assumes the largest bin is the pass bin and tells you it made that assumption. Marking it explicitly is safer whenever the largest bin is not the good bin.',
        },
        {
          question: 'What format does the input take?',
          answer: 'One bin per line as "<bin> <count>", where the separator can be a space, a comma, a semicolon or a tab, so a line pasted from a datalog works. Lines starting with # are treated as comments and repeated bin labels are summed.',
        },
        {
          question: 'How is the fail DPPM calculated?',
          answer: 'It is every die outside the pass bin as a fraction of the total, times one million. If the pass bin holds 90% of the die, the fail DPPM is 100,000. It is a measured sort figure, not a defect-density estimate, so it already includes every failing bin.',
        },
        {
          question: 'Can I compare two wafers or two lots?',
          answer: 'Run each bin list separately and compare the pass fraction and the leading failure bins. The per-bin shares are what make the comparison meaningful, since a total yield alone hides a shift from one failure mode to another that happens to leave the total unchanged.',
        },
      ]}
    >
      <BinYieldCalculator />
    </ToolPageShell>
  );
}
