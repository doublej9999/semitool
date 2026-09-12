
import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import WeibullLifeCalculator from '@/tools/weibull-life-calculator/Calculator';
import { tool } from '@/tools/weibull-life-calculator';
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

export default function WeibullLifeCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Two-Parameter Cumulative Weibull Failure Probability"
            math="F(t) = 1 - \exp\left( -\left[\frac{t}{\eta}\right]^\beta \right)"
          />
          <MathFormula
            block
            label="Bernard Median Rank Regression Plotting Position"
            math="\text{Rank}_i = \frac{i - 0.3}{n + 0.4}"
          />
          <MathFormula
            block
            label="Linearized Weibull Transformation"
            math="\ln\left( -\ln[1 - F(t)] \right) = \beta \ln(t) - \beta \ln(\eta)"
          />
          <MathFormula
            block
            label="Reliability B(p) Percentile Life"
            math="B(p) = \eta \cdot \left[ -\ln(1 - p) \right]^{1/\beta}"
          />
          <MathFormula
            block
            label="Mean Time Between Failures (Gamma Function)"
            math="\text{MTBF} = \eta \cdot \Gamma\left( 1 + \frac{1}{\beta} \right)"
          />
<ul className="info-list">
            <li>
              <strong>β (shape)</strong> — the slope of the fitted line. Below 1 the failure rate falls with time,
              near 1 it is flat, above 1 it rises.
            </li>
            <li>
              <strong>η (scale)</strong> — the time by which 63.2 % of the population has failed, not the mean.
            </li>
            <li>
              <strong>B(p) life</strong> — the time by which a fraction p has failed; B10 is the usual headline.
            </li>
          </ul>
        </>
      }
      notes={[
        'The failure times are fitted by least squares against the median rank, which is the standard way to turn a handful of ordered failures into a line. The i-th of n failures gets the rank (i − 0.3)/(n + 0.4), an approximation to the median rank that behaves well at small sample sizes.',
        'The correlation coefficient is reported next to the fit because a Weibull line through five or six points can look convincing and still be meaningless. A low correlation means the data does not support the Weibull assumption and the B10 figure is not one to design around.',
        'Every unit entered is treated as a failure. Run-out and suspended units need a censored estimator, which this fit is not, so entering a test that ended early as if it had failed biases η downward.',
        'η is the 63.2 percentile, not the mean. The mean is η·Γ(1 + 1/β), which for β above 1 is below η, and for β below 1 is above it. Reading η as MTBF overstates life for wear-out data.',
        'A handful of failures cannot resolve the shape parameter well: with six points the uncertainty on β is wide, and because B10 depends on β through a power, the uncertainty on B10 is wider still. The fit is a summary of the data in hand, not a prediction with confidence bounds.',
      ]}
      faq={[
        {
          question: 'What does a β of about 1 mean?',
          answer:
            'It means a constant failure rate, so the failures are random and exponential assumptions apply. β above 1 indicates wear out, where the failure rate rises with time and replacements or a preventive limit help. β below 1 indicates infant mortality, where the failure rate falls as early defects burn out and screening is the usual answer.',
        },
        {
          question: 'Why is η not the average life?',
          answer:
            'Because η is defined as the time by which 63.2 % of the population has failed, regardless of the shape. The average is η·Γ(1 + 1/β), which equals η only when β = 1. For a wear-out distribution with β = 2 the mean is about 0.886 η, so quoting η as MTBF claims more life than the data supports.',
        },
        {
          question: 'How many failures do I need?',
          answer:
            'More than you would like. Five or six points give a usable slope estimate, but the confidence interval on β is wide and B10 inherits it through an exponent. Below about five failures the fit is really a summary of what happened rather than a model, and the correlation coefficient next to the fit is the honest indicator of how much to trust it.',
        },
        {
          question: 'Can it handle units that had not failed at the end of the test?',
          answer:
            'No, and that limitation matters. A run-out unit is right-censored data: it tells you the life exceeded the test time, and dropping it loses information while counting it as a failure invents one. A censored fit needs a maximum likelihood estimator, which is a different calculation.',
        },
      ]}
    >
      <WeibullLifeCalculator />
    </ToolPageShell>
  );
}
