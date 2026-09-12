import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import YieldCalculator from '@/tools/yield-calculator/Calculator';
import { tool } from '@/tools/yield-calculator';
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

export default function YieldCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Line Yield Percentage"
            math="Y = \frac{N_{\text{good}}}{N_{\text{gross}}} \times 100\%"
          />
          <MathFormula
            block
            label="Defect Reject Rate"
            math="\text{Reject Rate} = \frac{N_{\text{defect}}}{N_{\text{gross}}} \times 100\%"
          />
<ul className="info-list">
            <li>
              <strong>Gross die</strong> — number of die positions considered (must be greater than 0).
            </li>
            <li>
              <strong>Good die</strong> — die that passed; cannot be negative and cannot exceed gross die.
            </li>
            <li>
              <strong>Defect die</strong> — rejected die; cannot be negative. Good plus defect die may be less than gross
              die when some positions are skipped or unclassified.
            </li>
            <li>
              Rounding is applied for display only; the underlying value keeps full precision.
            </li>
          </ul>
        </>
      }
      notes={[
        'Yield here is a die-count ratio (often called sort or final yield when fed with test results). It is not a defect-density model such as Poisson, Murphy or negative binomial.',
        'This is a generic calculation and may not match a specific fab, customer, equipment or MES specification.',
      ]}
      faq={[
        {
          question: 'What is the difference between yield and reject rate?',
          answer:
            'Yield is the share of gross die that are good, and reject rate is the share that are defective. Both are expressed against the same denominator, so with a clean dataset they add up to 100%. If some die are skipped or unclassified, the two values no longer reach 100% and the unclassified count is shown separately.',
        },
        {
          question: 'Which number should I use as gross die?',
          answer:
            'Use the total number of die positions that entered the step you are measuring — for wafer sort that is every probed position, including ones that failed. Using only good die as the denominator always returns 100% and hides the loss.',
        },
        {
          question: 'Why does the calculator refuse good die greater than gross die?',
          answer:
            'It is arithmetically impossible and almost always means a data-entry or mapping mistake (for example a partial wafer count mixed with a full-wafer total). The calculator reports the specific violation instead of printing a yield above 100%.',
        },
        {
          question: 'Is 100% yield accepted as valid input?',
          answer:
            'Yes. With zero defect die the yield is exactly 100% and the reject rate is 0%. The edge cases that are rejected are gross die of zero (division by zero) and negative counts.',
        },
      ]}
    >
      <YieldCalculator />
    </ToolPageShell>
  );
}
