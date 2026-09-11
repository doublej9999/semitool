import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import DieCostCalculator from '@/tools/die-cost-calculator/Calculator';
import { tool } from '@/tools/die-cost-calculator';
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

export default function DieCostCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p className="formula-expression">Total wafer cost = wafer cost + additional cost</p>
          <p className="formula-expression">Cost per gross die = total wafer cost ÷ gross die</p>
          <p className="formula-expression">Cost per good die = total wafer cost ÷ good die</p>
          <p className="formula-expression">Cost multiplier = gross die ÷ good die = 1 ÷ yield</p>
          <p className="formula-expression">Scrap cost per wafer = total wafer cost × (1 - yield)</p>
          <ul className="info-list">
            <li>
              <strong>Yield</strong> — good die ÷ gross die, the same ratio as the Yield Calculator.
            </li>
            <li>
              <strong>Cost per gross die</strong> — what one die position costs before any yield loss.
            </li>
            <li>
              <strong>Cost per good die</strong> — what one sellable die costs once scrap is paid for.
            </li>
            <li>
              <strong>Additional cost</strong> — any per-wafer charge such as test or packaging, added before dividing.
            </li>
          </ul>
        </>
      }
      notes={[
        'The default wafer cost is a placeholder for the arithmetic, not a market price, and no currency conversion is applied — ¥ is a label for whatever currency you enter.',
        'Cost per good die divides by good die only, so the scrapped die carry their share of the wafer. That is why it equals the cost per gross die multiplied by 1 ÷ yield.',
        'Yield here is a die-count ratio. Losses that occur after this step — packaging, final test, field returns — are not included unless you fold them into the good die count.',
        'This is a generic calculation and may not match a specific fab, customer, equipment or finance specification.',
      ]}
      faq={[
        {
          question: 'What is the difference between cost per gross die and cost per good die?',
          answer:
            'They share the same numerator — the total wafer cost — and differ only in the denominator. Cost per gross die divides by every die position, so it ignores yield loss. Cost per good die divides by the die that survived, so each good die pays for the ones that were scrapped. Use the second number for quoting and the first only as a build-up step.',
        },
        {
          question: 'Why is cost per good die higher by exactly 1 ÷ yield?',
          answer:
            'Because the numerator is unchanged and the denominator shrinks from gross die to good die. Dividing by good die instead of gross die multiplies the result by gross ÷ good, which is 1 ÷ yield. At 96.8% yield, for example, a good die costs about 1.033 times a die position.',
        },
        {
          question: 'Should test or packaging cost go in the additional field?',
          answer:
            'Any charge that applies per wafer regardless of how many die pass belongs in the additional cost field, because it is a fixed cost of processing that wafer. Costs that apply only to die that ship — such as per-unit packaging or final test — are better modelled per die than per wafer, so add them to the cost per good die afterwards.',
        },
        {
          question: 'Does the calculator convert my currency?',
          answer:
            'No. The ¥ symbol is a label only and no exchange rate or price list is applied. Enter the wafer cost in one currency and every result comes back in that same currency.',
        },
      ]}
    >
      <DieCostCalculator />
    </ToolPageShell>
  );
}
