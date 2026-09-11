
import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import TimeConstantCalculator from '@/tools/time-constant-calculator/Calculator';
import { tool } from '@/tools/time-constant-calculator';
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

export default function TimeConstantCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p className="formula-expression">τ = R · C</p>
          <p className="formula-expression">v(t) = 1 − exp(−t / τ)</p>
          <p className="formula-expression">t(10–90%) = τ ln 9 ≈ 2.197 τ</p>
          <p className="formula-expression">t(1%) = τ ln 100 ≈ 4.605 τ &nbsp; t(0.1%) = τ ln 1000 ≈ 6.908 τ</p>
          <p className="formula-expression">f₋₃dB = 1 / (2 π τ)</p>
          <ul className="info-list">
            <li>
              <strong>τ = R C</strong> — the time to reach 63.2% of the final value, in seconds when R is in ohms and C in
              farads.
            </li>
            <li>
              <strong>10–90% rise</strong> — the usual slew figure, τ ln 9, not τ itself.
            </li>
            <li>
              <strong>settling</strong> — the time to come within 1% or 0.1% of the final value, τ ln 100 and τ ln 1000.
            </li>
            <li>
              <strong>corner frequency</strong> — the same τ sets the −3 dB bandwidth, 1 / (2 π τ).
            </li>
          </ul>
        </>
      }
      notes={[
        'The rise and settling figures are the exact ln values for a first-order step, not the rounded 2.2 τ, 4.6 τ and 5 τ rules of thumb, though they agree to the first decimal.',
        'τ is reported in seconds, milliseconds, microseconds, nanoseconds and picoseconds from one value, because a time constant is exactly where a unit slip is most likely: a 50 Ω / 1 pF node is 50 ps, which is 0.05 ns or 5e-11 s.',
        'The capacitor is treated as ideal. Real parts have equivalent series resistance and inductance, so a measured rise time is often slower than R C alone predicts, and the corner is not a single pole once the leads matter.',
        'R and C must both be positive; the tool rejects zero or negative values rather than returning an infinite or negative time constant.',
      ]}
      faq={[
        {
          question: 'What does a time constant of one mean?',
          answer: 'It means the circuit reaches 63.2% of its final value in one τ, and about 99.3% in five τ. After one τ the remaining error is 1/e, or about 36.8%, which is why a single τ is never enough to call a node settled.',
        },
        {
          question: 'Why is the 10–90% rise time 2.2 τ rather than τ?',
          answer: 'Because the 10% and 90% points are both partway up the same exponential. Solving 0.1 = 1 − exp(−t/τ) and 0.9 = 1 − exp(−t/τ) and subtracting gives τ (ln 9 − ln 1) = τ ln 9 ≈ 2.197 τ. The widely quoted 2.2 τ is this value rounded.',
        },
        {
          question: 'How do I convert a time constant to a bandwidth?',
          answer: 'f = 1 / (2 π τ). A 1 µs time constant is a 159.15 kHz corner, and a 50 ps constant is about 3.18 GHz. This is the −3 dB point of a single-pole response, so it is the bandwidth at which the output has fallen to 70.7%.',
        },
        {
          question: 'Can I use this for an RC delay or a thermal time constant?',
          answer: 'The arithmetic is the same for any first-order system with a single storage element, so a thermal mass with a thermal resistance behaves identically. The inputs are labelled as resistance and capacitance because that is the electrical case, and a lumped RC model is an approximation the moment a real network has more than one pole.',
        },
      ]}
    >
      <TimeConstantCalculator />
    </ToolPageShell>
  );
}
