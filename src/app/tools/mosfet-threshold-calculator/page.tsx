import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import MosfetThresholdCalculator from '@/tools/mosfet-threshold-calculator/Calculator';
import { tool } from '@/tools/mosfet-threshold-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/mosfet-threshold-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function MosfetThresholdCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Equivalent Oxide Thickness & Capacitance'), math: '\\text{EOT} = t_{\\text{ox}} \\left( \\frac{3.9}{\\varepsilon_r} \\right), \\quad C_{\\text{ox}} = \\frac{\\varepsilon_{\\text{ox}}}{t_{\\text{ox}}}' },
        { kind: 'math', label: msg('Zero-Bias Threshold Voltage (Long-Channel)'), math: 'V_{\\text{th}0} = V_{\\text{fb}} + 2\\phi_B + \\frac{\\sqrt{4 \\varepsilon_{\\text{si}} q N_{\\text{sub}} \\phi_B}}{C_{\\text{ox}}}' },
        { kind: 'math', label: msg('Substrate Reverse-Bias Body Effect'), math: 'V_{\\text{th}} = V_{\\text{th}0} + \\gamma \\left[ \\sqrt{2\\phi_B + V_{\\text{sb}}} - \\sqrt{2\\phi_B} \\right]' },
        { kind: 'math', label: msg('Subthreshold Swing'), math: 'S = \\ln(10) \\frac{k_B T}{q} \\left[ 1 + \\frac{C_{\\text{dep}}}{C_{\\text{ox}}} \\right]' },
        { kind: 'list', items: [msg('**EOT (Equivalent Oxide Thickness)** — physical thickness of high-k dielectric normalized to SiO₂ (εr = 3.9).'), msg('**Vth0** — zero-bias threshold voltage required to achieve strong inversion at the silicon surface.'), msg('**γ (Body Effect Coefficient)** — sensitivity of threshold voltage to substrate-to-source reverse bias.'), msg('**S (Subthreshold Swing)** — gate voltage required to increase subthreshold drain current by one order of magnitude (thermionic limit 60 mV/dec at 300 K).')] },
      ]}
      notes={[
        msg('Classical long-channel charge sheet model assumes uniform substrate doping and complete dopant ionization at 300 K.'),
        msg('Short-channel effects (DIBL, charge sharing, threshold rolloff) are not included; this tool models the 1D physical electrostatics of the gate stack.'),
        msg('High-k dielectrics like HfO₂ allow higher physical thickness tox (suppressing direct quantum tunneling gate leakage) while maintaining high Cox and low EOT.'),
      ]}
      faq={[
        {
          question: msg('What is the physical significance of the 60 mV/decade subthreshold swing limit?'),
          answer:
            msg('At room temperature (300 K), the thermal voltage kT/q is ~25.85 mV. The factor ln(10) * (kT/q) equals approximately 59.5 mV. Because the capacitive divider (1 + Cdep/Cox) is always strictly greater than 1 in planar bulk MOSFETs, the steepness of subthreshold turn-off cannot beat 60 mV/dec without negative capacitance or tunneling mechanisms (TFETs).'),
        },
        {
          question: msg('Why did the industry transition from poly-Si to High-k Metal Gate (HKMG)?'),
          answer:
            msg('Poly-silicon suffers from poly-depletion effects at high gate electric fields, adding an effective 0.3-0.5 nm parasitic dielectric layer. HKMG replaces poly with metal gates (eliminating poly depletion) and SiO₂ with high-k oxides like HfO₂ (enabling physical thicknesses > 1.8 nm while providing sub-1.0 nm EOT without dielectric breakdown).'),
        },
      ]}
    >
      <MosfetThresholdCalculator />
    </ToolPageShell>
  );
}
