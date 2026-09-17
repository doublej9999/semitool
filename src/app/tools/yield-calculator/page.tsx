import type { Metadata } from 'next';
import ToolPageShell, { type FaqItem, type FormulaBlock } from '@/components/tools/ToolPageShell';
import YieldCalculator from '@/tools/yield-calculator/Calculator';
import { tool } from '@/tools/yield-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/yield-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

const FORMULA: FormulaBlock[] = [
  {
    kind: 'math',
    label: msg('Line Yield Percentage'),
    math: 'Y = \\frac{N_{\\text{good}}}{N_{\\text{gross}}} \\times 100\\%',
  },
  {
    kind: 'math',
    label: msg('Defect Reject Rate'),
    math: '\\text{Reject Rate} = \\frac{N_{\\text{defect}}}{N_{\\text{gross}}} \\times 100\\%',
  },
  {
    kind: 'list',
    items: [
      msg('**Gross die** — number of die positions considered (must be greater than 0).'),
      msg('**Good die** — die that passed; cannot be negative and cannot exceed gross die.'),
      msg('**Defect die** — rejected die; cannot be negative. Good plus defect die may be less than gross die when some positions are skipped or unclassified.'),
      msg('Rounding is applied for display only; the underlying value keeps full precision.'),
    ],
  },
];

const NOTES = [
  msg('Yield here is a die-count ratio (often called sort or final yield when fed with test results). It is not a defect-density model such as Poisson, Murphy or negative binomial.'),
  msg('This is a generic calculation and may not match a specific fab, customer, equipment or MES specification.'),
];

const FAQ: FaqItem[] = [
  {
    question: msg('What is the difference between yield and reject rate?'),
    answer: msg('Yield is the share of gross die that are good, and reject rate is the share that are defective. Both are expressed against the same denominator, so with a clean dataset they add up to 100%. If some die are skipped or unclassified, the two values no longer reach 100% and the unclassified count is shown separately.'),
  },
  {
    question: msg('Which number should I use as gross die?'),
    answer: msg('Use the total number of die positions that entered the step you are measuring — for wafer sort that is every probed position, including ones that failed. Using only good die as the denominator always returns 100% and hides the loss.'),
  },
  {
    question: msg('Why does the calculator refuse good die greater than gross die?'),
    answer: msg('It is arithmetically impossible and almost always means a data-entry or mapping mistake (for example a partial wafer count mixed with a full-wafer total). The calculator reports the specific violation instead of printing a yield above 100%.'),
  },
  {
    question: msg('Is 100% yield accepted as valid input?'),
    answer: msg('Yes. With zero defect die the yield is exactly 100% and the reject rate is 0%. The edge cases that are rejected are gross die of zero (division by zero) and negative counts.'),
  },
];

export default function YieldCalculatorPage() {
  return (
    <ToolPageShell tool={tool} copy={copy} formula={FORMULA} notes={NOTES} faq={FAQ}>
      <YieldCalculator />
    </ToolPageShell>
  );
}
