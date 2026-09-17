
import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import TimeConstantCalculator from '@/tools/time-constant-calculator/Calculator';
import { tool } from '@/tools/time-constant-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/time-constant-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function TimeConstantCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('RC Circuit Characteristic Time Constant'), math: '\\tau = R \\cdot C' },
        { kind: 'math', label: msg('Capacitor Transient Voltage Rise'), math: 'v(t) = V_0 \\left( 1 - \\exp\\left(-\\frac{t}{\\tau}\\right) \\right)' },
        { kind: 'math', label: msg('Rise Time (10% to 90%)'), math: 't_{10-90} = \\tau \\ln(9) \\approx 2.197 \\cdot \\tau' },
        { kind: 'math', label: msg('Settling Time to 1% and 0.1% Residual Error'), math: 't_{1\\%} = \\tau \\ln(100) \\approx 4.605 \\tau, \\quad t_{0.1\\%} = \\tau \\ln(1000) \\approx 6.908 \\tau' },
        { kind: 'math', label: msg('Low-Pass Cutoff Corner Frequency (-3 dB)'), math: 'f_{-3\\text{dB}} = \\frac{1}{2\\pi R C} = \\frac{1}{2\\pi \\tau}' },
        { kind: 'list', items: [msg('**τ = R C** — the time to reach 63.2% of the final value, in seconds when R is in ohms and C in farads.'), msg('**10–90% rise** — the usual slew figure, τ ln 9, not τ itself.'), msg('**settling** — the time to come within 1% or 0.1% of the final value, τ ln 100 and τ ln 1000.'), msg('**corner frequency** — the same τ sets the −3 dB bandwidth, 1 / (2 π τ).')] },
      ]}
      notes={[
        msg('The rise and settling figures are the exact ln values for a first-order step, not the rounded 2.2 τ, 4.6 τ and 5 τ rules of thumb, though they agree to the first decimal.'),
        msg('τ is reported in seconds, milliseconds, microseconds, nanoseconds and picoseconds from one value, because a time constant is exactly where a unit slip is most likely: a 50 Ω / 1 pF node is 50 ps, which is 0.05 ns or 5e-11 s.'),
        msg('The capacitor is treated as ideal. Real parts have equivalent series resistance and inductance, so a measured rise time is often slower than R C alone predicts, and the corner is not a single pole once the leads matter.'),
        msg('R and C must both be positive; the tool rejects zero or negative values rather than returning an infinite or negative time constant.'),
      ]}
      faq={[
        {
          question: msg('What does a time constant of one mean?'),
          answer: msg('It means the circuit reaches 63.2% of its final value in one τ, and about 99.3% in five τ. After one τ the remaining error is 1/e, or about 36.8%, which is why a single τ is never enough to call a node settled.'),
        },
        {
          question: msg('Why is the 10–90% rise time 2.2 τ rather than τ?'),
          answer: msg('Because the 10% and 90% points are both partway up the same exponential. Solving 0.1 = 1 − exp(−t/τ) and 0.9 = 1 − exp(−t/τ) and subtracting gives τ (ln 9 − ln 1) = τ ln 9 ≈ 2.197 τ. The widely quoted 2.2 τ is this value rounded.'),
        },
        {
          question: msg('How do I convert a time constant to a bandwidth?'),
          answer: msg('f = 1 / (2 π τ). A 1 µs time constant is a 159.15 kHz corner, and a 50 ps constant is about 3.18 GHz. This is the −3 dB point of a single-pole response, so it is the bandwidth at which the output has fallen to 70.7%.'),
        },
        {
          question: msg('Can I use this for an RC delay or a thermal time constant?'),
          answer: msg('The arithmetic is the same for any first-order system with a single storage element, so a thermal mass with a thermal resistance behaves identically. The inputs are labelled as resistance and capacitance because that is the electrical case, and a lumped RC model is an approximation the moment a real network has more than one pole.'),
        },
      ]}
    >
      <TimeConstantCalculator />
    </ToolPageShell>
  );
}
