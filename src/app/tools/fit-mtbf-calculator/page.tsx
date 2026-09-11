
import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import FitMtbfCalculator from '@/tools/fit-mtbf-calculator/Calculator';
import { tool } from '@/tools/fit-mtbf-calculator';
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

export default function FitMtbfCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p className="formula-expression">λ = failures / (devices × hours)</p>
          <p className="formula-expression">FIT = λ × 1e9</p>
          <p className="formula-expression">MTBF = 1 / λ</p>
          <p className="formula-expression">DPPM(t) = (1 − exp(−λ t)) × 1e6</p>
          <ul className="info-list">
            <li>
              <strong>λ</strong> — the failure rate per device-hour, the one number everything else is derived from.
            </li>
            <li>
              <strong>FIT</strong> — the same rate as failures per billion device-hours, which is how a component
              datasheet quotes it.
            </li>
            <li>
              <strong>MTBF</strong> — the inverse of the rate, in hours and in years at 8760 hours each.
            </li>
            <li>
              <strong>DPPM over a mission</strong> — the fraction expected to fail in the stated time, per million, so a
              FIT rate becomes a number comparable with a quality target.
            </li>
          </ul>
        </>
      }
      notes={[
        '1 − exp(−λt) is evaluated as −expm1(−λt) so that a small rate keeps its significant digits: at a low FIT the naive form would cancel to zero and print a DPPM of 0 instead of the correct small number.',
        'The exponential model means a constant failure rate, which is what FIT and MTBF are defined under. It ignores the burn-in tail and the wear-out rise, so a rate fitted over one window is not a licence to extrapolate decades out.',
        'Zero failures gives a rate of exactly zero and an unbounded MTBF. That is not a result, it is a missing measurement: the honest output is a one-sided confidence bound, and the tool says "no failures" rather than printing a large number that would look precise.',
        'The mission time for the DPPM row is a separate input because a FIT figure means nothing as a DPPM until a time is stated. The default is one year of 8760 hours, not one year of 365 days at some other duty cycle.',
        'The equivalent sigma is a one-sided normal conversion of the same failure fraction, offered only so a FIT rate can be compared with a sigma-based quality target; the physics of a failure mode is not normal and the figure is a convenience, not a statement about a distribution.',
      ]}
      faq={[
        {
          question: 'What is the difference between FIT and MTBF?',
          answer: 'They are the same information in two units: FIT is the failure rate per billion device-hours and MTBF is its reciprocal in hours. A rate of 10 FIT is 10e-9 per hour, so the MTBF is 1e8 hours. Neither is a lifetime; both describe a constant rate.',
        },
        {
          question: 'How do I turn a FIT rate into a DPPM?',
          answer: 'Multiply the FIT rate by the time and remember it is a probability: DPPM = (1 − exp(−FIT × t / 1e9)) × 1e6. Over 1000 hours, 10,000 FIT is about 9950 DPPM, and the tool prints this for whatever mission time you set.',
        },
        {
          question: 'What if my test had no failures?',
          answer: 'The measured rate is zero and the MTBF is unbounded, which is a statement about the test rather than the part. Report a one-sided upper confidence bound on the rate instead, for example the bound that a chi-square limit gives, and state the device-hours so the reader can judge how much evidence there is.',
        },
        {
          question: 'Is MTBF the average life of a part?',
          answer: 'No. Under a constant failure rate MTBF is the mean time between failures of a repairable population, and about 37% of parts are expected to have survived one MTBF. It is not the time by which half have failed, which is 0.693 MTBF, nor a wear-out lifetime.',
        },
      ]}
    >
      <FitMtbfCalculator />
    </ToolPageShell>
  );
}
