
import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import MicrostripCalculator from '@/tools/microstrip-calculator/Calculator';
import { tool } from '@/tools/microstrip-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function MicrostripCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Characteristic Impedance (Hammerstad-Jensen)"
            math="Z_0 = \frac{\eta_0}{2\pi \sqrt{\varepsilon_{\text{eff}}}} \ln\left( \frac{F(u)}{u} + \sqrt{1 + \left(\frac{2}{u}\right)^2} \right)"
          />
          <MathFormula
            block
            label="Geometry Correction Factor"
            math="F(u) = 6 + (2\pi - 6) \exp\left( -\left[\frac{30.666}{u}\right]^{0.7528} \right), \quad u = \frac{w}{h}"
          />
          <MathFormula
            block
            label="Effective Dielectric Constant"
            math="\varepsilon_{\text{eff}} = \frac{\varepsilon_r + 1}{2} + \frac{\varepsilon_r - 1}{2} \left( 1 + \frac{10}{u} \right)^{-a \cdot b}"
          />
          <MathFormula
            block
            label="Guided Wavelength"
            math="\lambda_g = \frac{c}{f \sqrt{\varepsilon_{\text{eff}}}}"
          />
<ul className="info-list">
            <li>
              <strong>u</strong> — the trace width divided by the substrate height, which is the only geometric
              ratio the model uses.
            </li>
            <li>
              <strong>ε_eff</strong> — the effective permittivity, always between 1 and εr because part of the
              field travels in air above the trace.
            </li>
            <li>
              <strong>λ_g</strong> — the guided wavelength, shorter than the free-space wavelength by √ε_eff.
            </li>
          </ul>
        </>
      }
      notes={[
        'The impedance of a microstrip depends on width divided by height, not on either dimension alone. Doubling both the trace width and the substrate thickness leaves the impedance unchanged, which is why the tool always reports the ratio next to the impedance.',
        'Part of the field travels in air above the trace and part in the substrate, so the effective permittivity sits between 1 and εr and moves toward εr as the trace gets wider. Guided wavelength and delay follow from the effective value, not from εr.',
        'This is the Hammerstad-Jensen quasi-static closed form, good to a couple of percent over roughly 0.01 < W/H < 100. It ignores dispersion, so at higher frequencies the impedance drifts and the effective permittivity rises; it also ignores copper thickness, solder mask, radiation and any discontinuity.',
        'In the impedance to width direction the Hammerstad synthesis fit alone carries about 1% error, so the answer is refined by solving the forward model numerically. The width that is reported reproduces the requested impedance, and the impedance column shows the achieved value so you can see the agreement.',
        'Solder mask, plating and finite ground planes shift the result by a few percent, so treat the width as a starting point for a field solver or a test coupon rather than as a finished artwork dimension.',
      ]}
      faq={[
        {
          question: 'How wide is a 50 ohm trace on FR-4?',
          answer:
            'On 1.6 mm FR-4 with εr = 4.4, a 50 ohm trace is about 3.0 mm wide, which is a width-to-height ratio near 1.9. That wide trace is exactly why RF boards use thinner substrates or higher-permittivity material: 50 ohm at 0.5 mm height only needs a ratio near 1.9, so a much narrower line.',
        },
        {
          question: 'Why is the guided wavelength shorter than in free space?',
          answer:
            'Because the field sees a dielectric. The velocity is c/√ε_eff, so the guided wavelength is the free-space wavelength divided by √ε_eff. For FR-4 with a W/H near 1.9 the effective permittivity is about 3.33, so the guided wavelength is about 55% of the free-space value at the same frequency.',
        },
        {
          question: 'What is the difference between εr and ε_eff?',
          answer:
            'εr is the bulk permittivity of the substrate material. ε_eff is what the propagating mode actually sees, and it is always lower because some of the field is in air. A 4.4 substrate can present an effective permittivity anywhere from about 3.0 for a narrow trace to nearly 4.4 for a very wide one.',
        },
        {
          question: 'Why does the tool say the model is quasi-static?',
          answer:
            'Because it solves the fields as if they were static. That is accurate while the substrate is a small fraction of a wavelength thick, roughly below 5 GHz on FR-4. Above that, dispersion raises the effective permittivity and lowers the impedance, and a frequency-dependent model is needed.',
        },
      ]}
    >
      <MicrostripCalculator />
    </ToolPageShell>
  );
}
