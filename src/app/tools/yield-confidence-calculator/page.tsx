import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import YieldConfidenceCalculator from '@/tools/yield-confidence-calculator/Calculator';
import { tool } from '@/tools/yield-confidence-calculator';
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

export default function YieldConfidenceCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Binomial Point Estimator"
            math="\hat{p} = \frac{k_{\text{passes}}}{n_{\text{tested}}}"
          />
          <MathFormula
            block
            label="Wilson Score Interval Center"
            math="p_{\text{center}} = \frac{\hat{p} + \frac{z^2}{2n}}{1 + \frac{z^2}{n}}"
          />
          <MathFormula
            block
            label="Wilson Score Confidence Half-Width"
            math="w = \frac{z}{1 + \frac{z^2}{n}} \sqrt{\frac{\hat{p}(1 - \hat{p})}{n} + \frac{z^2}{4n^2}}"
          />
          <MathFormula
            block
            label="Clopper-Pearson Exact Interval"
            math="B\left(\frac{\alpha}{2}; k, n - k + 1\right) \le p \le B\left(1 - \frac{\alpha}{2}; k + 1, n - k\right)"
          />
          <MathFormula
            block
            label="Required Sample Size for Precision w"
            math="n = \frac{z^2 p(1 - p)}{w^2}"
          />
<ul className="info-list">
            <li>
              <strong>Wilson score</strong> — closed form, well behaved at yields near 0% or 100%, and the usual default.
            </li>
            <li>
              <strong>Clopper-Pearson</strong> — the exact interval from the binomial distribution; its coverage is at
              least the nominal level, and near the middle of the range it is the wider of the two.
            </li>
            <li>
              <strong>Sample size</strong> — how many units to test for a target half-width, using the normal
              approximation.
            </li>
          </ul>
        </>
      }
      notes={[
        'The interval assumes independent binomial sampling from a large population, so it captures sampling uncertainty only. Process drift, clustering of defects and systematic losses sit outside this model.',
        'Wafer-level sampling is really without replacement, so for a sample that is a large share of the lot the hypergeometric interval would be slightly narrower. The binomial model is the standard choice when the sample is small relative to the lot.',
        'The sample-size figure comes from the normal approximation, which is a planning estimate. The interval actually achieved can differ a little, especially near 0% or 100% yield.',
        'These intervals describe a measured pass rate. They do not model defect-density yield loss — the Yield Model and Defect Density tools cover that side.',
      ]}
      faq={[
        {
          question: 'Why report two intervals instead of one?',
          answer:
            'They answer the same question with different guarantees. Wilson is the modern default and behaves well at yields near 0% or 100%. Clopper-Pearson is the exact method: to keep coverage at or above the nominal level it is deliberately conservative, and near the middle of the range it is the wider of the two — at a 0% or 100% result the two can differ slightly. Showing both keeps you honest about the choice.',
        },
        {
          question: 'What does a 95% confidence interval actually mean?',
          answer:
            'If you repeated the whole test many times and built the interval each time, about 95% of those intervals would contain the true yield. It is a statement about the method, not a 95% probability that the fixed true yield lies inside this particular interval.',
        },
        {
          question: 'How many units do I need for a given precision?',
          answer:
            'Use the planning section: enter the yield you expect and the half-width you want, in percentage points. The result is the number of units to test. A yield near 50% is the worst case and needs the largest sample, and halving the half-width roughly quadruples the sample.',
        },
        {
          question: 'Should I use zero-failure sampling?',
          answer:
            'If you test a sample and nothing fails, the interval is one-sided in effect — the lower bound is 0% and the upper bound is what the sample can rule out. The calculator handles this: with zero passes the Clopper-Pearson lower bound is exactly 0%, and with all passes the upper bound is exactly 100%.',
        },
      ]}
    >
      <YieldConfidenceCalculator />
    </ToolPageShell>
  );
}
