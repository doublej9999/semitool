
import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import AcceptanceSamplingCalculator from '@/tools/acceptance-sampling-calculator/Calculator';
import { tool } from '@/tools/acceptance-sampling-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function AcceptanceSamplingCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Binomial Acceptance Probability"
            math="P(\text{accept}) = \sum_{k=0}^{c} \binom{n}{k} p^k (1 - p)^{n - k}"
          />
          <MathFormula
            block
            label="Poisson Approximation (small p)"
            math="P(\text{accept}) \approx \sum_{k=0}^{c} \frac{\lambda^k e^{-\lambda}}{k!}, \quad \lambda = n p"
          />
          <MathFormula
            block
            label="Zero-Acceptance Sample Size (c = 0)"
            math="n \ge \frac{\ln(\beta)}{\ln(1 - \text{LTPD})}"
          />
<ul className="info-list">
            <li>
              <strong>n, c</strong> — the sample size and the acceptance number: accept the lot on c defectives or
              fewer.
            </li>
            <li>
              <strong>LTPD</strong> — the lot tolerance percent defective, the defect rate the plan is meant to
              reject.
            </li>
            <li>
              <strong>Consumer risk β</strong> — the chance of accepting a lot that bad; 10 % is the usual choice.
            </li>
          </ul>
        </>
      }
      notes={[
        'A plan is described by its operating characteristic, not by its sample size. Two plans with the same n and different c discriminate completely differently, and only the curve shows which lots a plan will actually let through.',
        'The binomial is used while the sample is a small part of the lot, and the hypergeometric once the sample passes a tenth of the lot. The two distributions share a mean but the finite lot has a smaller spread, which pulls the tail in: the hypergeometric is stricter when the acceptance number sits below the mean and more forgiving when it sits above. The tool reports which one it used.',
        'A zero acceptance plan is the only one that puts real pressure on a defect rate. Allowing a defect or two in the sample gives the producer room to ship at a rate the plan accepts, so the acceptance number becomes the design target rather than the specification.',
        'The consumer risk is the chance of accepting a bad lot, and the producer risk is the chance of rejecting a good one. Reading the achieved probability at the LTPD shows the first directly; the two move together, so demanding both be small costs sample size fast.',
        'The plan assumes the sample is drawn at random and that a defective is either found or missed, so it says nothing about measuring a continuous parameter. For a measurable characteristic the sample size question is a different and usually much smaller one.',
      ]}
      faq={[
        {
          question: 'Why does a larger sample both help and cost?',
          answer:
            'It separates good lots from bad ones more sharply, because the sampling distribution of the defect count narrows relative to its mean as n grows. The cost is inspection time and possibly destructive testing, which is why acceptance plans are usually a compromise rather than a search for perfect discrimination.',
        },
        {
          question: 'What sample size do I need to reject a 5 % defect rate with 10 % risk?',
          answer:
            'Forty five pieces with zero acceptance. Setting P(accept) = (1 − 0.05)ⁿ at most 0.10 gives n at least 44.89, so 45, which accepts a 5 % lot with probability 0.0994. Allowing one defective instead would need a much larger sample for the same protection, which is the trade a zero acceptance plan makes.',
        },
        {
          question: 'Why does the tool switch distributions?',
          answer:
            'Because sampling without replacement from a finite lot is not the same as the binomial model of independent draws. Once the sample is more than about a tenth of the lot the difference matters, and using the binomial would misstate the risk. The distribution actually used is shown with the result so the number is never ambiguous.',
        },
        {
          question: 'Is a lot that passes inspection defect free?',
          answer:
            'No. Passing means the sample did not contain more than c defectives, which is entirely consistent with a defect rate that yields occasional defects in the shipped lot. The operating characteristic curve is the honest statement of that: it gives the probability of shipping a bad lot, never a guarantee of quality.',
        },
      ]}
    >
      <AcceptanceSamplingCalculator />
    </ToolPageShell>
  );
}
