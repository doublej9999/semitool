import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import DieCostCalculator from '@/tools/die-cost-calculator/Calculator';
import { tool } from '@/tools/die-cost-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/die-cost-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function DieCostCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Total Fab Wafer Cost'), math: 'C_{\\text{total}} = C_{\\text{wafer}} + C_{\\text{mask}} + C_{\\text{probe}}' },
        { kind: 'math', label: msg('Cost per Gross Die'), math: 'C_{\\text{gross}} = \\frac{C_{\\text{total}}}{\\text{Gross Die}}' },
        { kind: 'math', label: msg('Cost per Good Die'), math: 'C_{\\text{good}} = \\frac{C_{\\text{total}}}{\\text{Good Die}} = \\frac{C_{\\text{gross}}}{Y}' },
        { kind: 'math', label: msg('Cost Multiplier Factor'), math: 'M_{\\text{cost}} = \\frac{1}{Y} = \\frac{\\text{Gross Die}}{\\text{Good Die}}' },
        { kind: 'math', label: msg('Yield Scrap Cost per Wafer'), math: 'C_{\\text{scrap}} = C_{\\text{total}} \\times (1 - Y)' },
        { kind: 'list', items: [msg('**Yield** — good die ÷ gross die, the same ratio as the Yield Calculator.'), msg('**Cost per gross die** — what one die position costs before any yield loss.'), msg('**Cost per good die** — what one sellable die costs once scrap is paid for.'), msg('**Additional cost** — any per-wafer charge such as test or packaging, added before dividing.')] },
      ]}
      notes={[
        msg('The default wafer cost is a placeholder for the arithmetic, not a market price, and no currency conversion is applied — ¥ is a label for whatever currency you enter.'),
        msg('Cost per good die divides by good die only, so the scrapped die carry their share of the wafer. That is why it equals the cost per gross die multiplied by 1 ÷ yield.'),
        msg('Yield here is a die-count ratio. Losses that occur after this step — packaging, final test, field returns — are not included unless you fold them into the good die count.'),
        msg('This is a generic calculation and may not match a specific fab, customer, equipment or finance specification.'),
      ]}
      faq={[
        {
          question: msg('What is the difference between cost per gross die and cost per good die?'),
          answer:
            msg('They share the same numerator — the total wafer cost — and differ only in the denominator. Cost per gross die divides by every die position, so it ignores yield loss. Cost per good die divides by the die that survived, so each good die pays for the ones that were scrapped. Use the second number for quoting and the first only as a build-up step.'),
        },
        {
          question: msg('Why is cost per good die higher by exactly 1 ÷ yield?'),
          answer:
            msg('Because the numerator is unchanged and the denominator shrinks from gross die to good die. Dividing by good die instead of gross die multiplies the result by gross ÷ good, which is 1 ÷ yield. At 96.8% yield, for example, a good die costs about 1.033 times a die position.'),
        },
        {
          question: msg('Should test or packaging cost go in the additional field?'),
          answer:
            msg('Any charge that applies per wafer regardless of how many die pass belongs in the additional cost field, because it is a fixed cost of processing that wafer. Costs that apply only to die that ship — such as per-unit packaging or final test — are better modelled per die than per wafer, so add them to the cost per good die afterwards.'),
        },
        {
          question: msg('Does the calculator convert my currency?'),
          answer:
            msg('No. The ¥ symbol is a label only and no exchange rate or price list is applied. Enter the wafer cost in one currency and every result comes back in that same currency.'),
        },
      ]}
    >
      <DieCostCalculator />
    </ToolPageShell>
  );
}
