
import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import ReturnLossCalculator from '@/tools/return-loss-calculator/Calculator';
import { tool } from '@/tools/return-loss-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/return-loss-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function ReturnLossCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Return Loss (RL)'), math: '\\text{RL}\\,[\\text{dB}] = -20 \\log_{10}|\\Gamma|' },
        { kind: 'math', label: msg('Reflection Coefficient Magnitude'), math: '|\\Gamma| = 10^{-\\frac{\\text{RL}}{20}}' },
        { kind: 'math', label: msg('Voltage Standing Wave Ratio (VSWR)'), math: '\\text{VSWR} = \\frac{1 + |\\Gamma|}{1 - |\\Gamma|}' },
        { kind: 'math', label: msg('Mismatch Attenuation Loss'), math: '\\text{ML}\\,[\\text{dB}] = -10 \\log_{10}\\left(1 - |\\Gamma|^2\\right)' },
        { kind: 'list', items: [msg('**Return loss** — the reflected power as a ratio in dB, always 0 dB or more for a passive load, and infinite for a perfect match.'), msg('**Reflection coefficient |Γ|** — the reflected amplitude, from 0 (matched) to 1 (open or short).'), msg('**VSWR** — the standing wave ratio, 1 for a perfect match and rising without limit as |Γ| approaches 1.'), msg('**Mismatch loss** — the fraction of incident power that never reaches the load, in dB.')] },
      ]}
      notes={[
        msg('Return loss uses the factor 20 because the reflection coefficient is an amplitude, while mismatch loss uses the factor 10 because it is a power ratio. Reaching for 10 log10 on a return loss is the classic way to get an answer that is wrong by a factor of two in dB.'),
        msg('The three parameters are not independent: any one of them fixes the other two. That is why the tool takes whichever you have and prints all of them, instead of asking you to convert by hand.'),
        msg('A passive load has |Γ| below 1. At exactly 1 the load reflects everything and both VSWR and mismatch loss go to infinity, so a reflection coefficient of 1 or a return loss of 0 dB is rejected as a not-a-passive-load reading.'),
        msg('Return loss is an impedance match figure and says nothing about where the reflected energy goes in a real system: it can be absorbed by a termination, or resonate between a source and a load. The dB figures are ratios, not a guarantee about a particular network.'),
        msg('A return loss of 20 dB means 1% of the power is reflected and the mismatch loss is only 0.044 dB, which is why a modest match is usually enough: the delivered power barely changes even though the reflected power sounds large.'),
      ]}
      faq={[
        {
          question: msg('What return loss is a VSWR of 2?'),
          answer: msg('About 9.54 dB. A VSWR of 2 is |Γ| = (2 − 1) / (2 + 1) = 0.333, and −20 log10(0.333) = 9.54 dB. The reflected power is 11.1% and the mismatch loss is 0.51 dB. The common pairs to remember are 1.22 for 20 dB, 1.5 for 14 dB and 2.0 for 9.5 dB.'),
        },
        {
          question: msg('What is the difference between return loss and mismatch loss?'),
          answer: msg('Return loss measures the reflected power relative to the incident power (−20 log10|Γ|), while mismatch loss measures the power actually lost to the mismatch (−10 log10(1 − |Γ|²)). At 20 dB return loss the reflected power is 1% but the mismatch loss is only 0.044 dB, so a good match costs almost nothing even though the reflection ratio sounds large.'),
        },
        {
          question: msg('What does an infinite return loss mean?'),
          answer: msg('A perfect match: |Γ| = 0, no reflection, VSWR = 1 and zero mismatch loss. It is what a matched load looks like. In practice a real connector or antenna reaches 20 to 30 dB, not infinity; the tool shows a dash if you enter a zero reflection coefficient because the dB value is not finite.'),
        },
        {
          question: msg('Can return loss be negative?'),
          answer: msg('Not for a passive load. Return loss is defined as −20 log10|Γ| with |Γ| at most 1, so it is 0 dB or more, and a negative reading usually means the convention was flipped or the measuring instrument reported |S11| in dB directly. If you have a |S11| in dB, that number is already the return loss; this tool rejects a negative value for that reason.'),
        },
      ]}
    >
      <ReturnLossCalculator />
    </ToolPageShell>
  );
}
