
import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import FitMtbfCalculator from '@/tools/fit-mtbf-calculator/Calculator';
import { tool } from '@/tools/fit-mtbf-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/fit-mtbf-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function FitMtbfCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Failure Rate (Hourly)'), math: '\\lambda = \\frac{N_{\\text{failures}}}{N_{\\text{devices}} \\times t_{\\text{hours}}}' },
        { kind: 'math', label: msg('Failures in Time (FIT Rate)'), math: '\\text{FIT} = \\lambda \\times 10^9' },
        { kind: 'math', label: msg('Mean Time Between Failures'), math: '\\text{MTBF} = \\frac{1}{\\lambda}' },
        { kind: 'math', label: msg('Cumulative Defective Part Probability'), math: '\\text{DPPM}(t) = \\left[ 1 - \\exp(-\\lambda t) \\right] \\times 10^6' },
        { kind: 'list', items: [msg('**λ** — the failure rate per device-hour, the one number everything else is derived from.'), msg('**FIT** — the same rate as failures per billion device-hours, which is how a component datasheet quotes it.'), msg('**MTBF** — the inverse of the rate, in hours and in years at 8760 hours each.'), msg('**DPPM over a mission** — the fraction expected to fail in the stated time, per million, so a FIT rate becomes a number comparable with a quality target.')] },
      ]}
      notes={[
        msg('1 − exp(−λt) is evaluated as −expm1(−λt) so that a small rate keeps its significant digits: at a low FIT the naive form would cancel to zero and print a DPPM of 0 instead of the correct small number.'),
        msg('The exponential model means a constant failure rate, which is what FIT and MTBF are defined under. It ignores the burn-in tail and the wear-out rise, so a rate fitted over one window is not a licence to extrapolate decades out.'),
        msg('Zero failures gives a rate of exactly zero and an unbounded MTBF. That is not a result, it is a missing measurement: the honest output is a one-sided confidence bound, and the tool says "no failures" rather than printing a large number that would look precise.'),
        msg('The mission time for the DPPM row is a separate input because a FIT figure means nothing as a DPPM until a time is stated. The default is one year of 8760 hours, not one year of 365 days at some other duty cycle.'),
        msg('The equivalent sigma is a one-sided normal conversion of the same failure fraction, offered only so a FIT rate can be compared with a sigma-based quality target; the physics of a failure mode is not normal and the figure is a convenience, not a statement about a distribution.'),
      ]}
      faq={[
        {
          question: msg('What is the difference between FIT and MTBF?'),
          answer: msg('They are the same information in two units: FIT is the failure rate per billion device-hours and MTBF is its reciprocal in hours. A rate of 10 FIT is 10e-9 per hour, so the MTBF is 1e8 hours. Neither is a lifetime; both describe a constant rate.'),
        },
        {
          question: msg('How do I turn a FIT rate into a DPPM?'),
          answer: msg('Multiply the FIT rate by the time and remember it is a probability: DPPM = (1 − exp(−FIT × t / 1e9)) × 1e6. Over 1000 hours, 10,000 FIT is about 9950 DPPM, and the tool prints this for whatever mission time you set.'),
        },
        {
          question: msg('What if my test had no failures?'),
          answer: msg('The measured rate is zero and the MTBF is unbounded, which is a statement about the test rather than the part. Report a one-sided upper confidence bound on the rate instead, for example the bound that a chi-square limit gives, and state the device-hours so the reader can judge how much evidence there is.'),
        },
        {
          question: msg('Is MTBF the average life of a part?'),
          answer: msg('No. Under a constant failure rate MTBF is the mean time between failures of a repairable population, and about 37% of parts are expected to have survived one MTBF. It is not the time by which half have failed, which is 0.693 MTBF, nor a wear-out lifetime.'),
        },
      ]}
    >
      <FitMtbfCalculator />
    </ToolPageShell>
  );
}
