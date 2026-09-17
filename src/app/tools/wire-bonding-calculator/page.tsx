import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import WireBondingCalculator from '@/tools/wire-bonding-calculator/Calculator';
import { tool } from '@/tools/wire-bonding-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/wire-bonding-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function WireBondingCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Bond Wire Loop Inductance (Rosa Formulation)'), math: 'L_{\\text{wire}} = 2 \\times 10^{-7} \\cdot L \\cdot \\left[ \\ln\\left(\\frac{4L}{d}\\right) - 1 + \\frac{\\mu_r}{4} \\right]' },
        { kind: 'math', label: msg('Skin Depth & DC Resistance'), math: '\\delta = \\sqrt{\\frac{\\rho}{\\pi f \\mu_0}}, \\quad R_{\\text{dc}} = \\frac{\\rho \\cdot L}{A}' },
        { kind: 'math', label: msg('Preece Fusing Burnout Current'), math: 'I_{\\text{fuse}} = k \\cdot d_{\\text{inches}}^{1.5}' },
        { kind: 'math', label: msg('JEDEC Continuous Safe Operating Current'), math: 'I_{\\text{safe}} = J_{\\max} \\cdot A_{\\text{cm}^2}' },
        { kind: 'list', items: [msg('**L_wire** — Self-inductance of straight circular bond wire loop according to the Rosa formulation.'), msg('**δ (Skin Depth)** — Depth at which high frequency AC current density falls to 1/e (37%) of surface value.'), msg('**I_fuse** — Short-term melting/fusing burnout current calculated from Preece empirical thermal equilibrium.'), msg('**I_safe** — Continuous DC operating current limit ensuring long-term reliability against electromigration and void formation.')] },
      ]}
      notes={[
        msg('Wire bond self-inductance generally follows the empirical rule-of-thumb of ~1 nH per millimetre of wire length for standard 1.0 mil (25.4 µm) bond wires.'),
        msg('At high frequencies (> 500 MHz), current crowds into the outer skin depth shell, multiplying effective AC resistance and causing signal attenuation.'),
        msg('Gold (Au) remains the industry benchmark for high-reliability ball bonding. Copper (Cu) offers superior thermal and electrical conductivity with higher stiffness, while Aluminium (Al) is standard in power modules.'),
      ]}
      faq={[
        {
          question: msg('Why is bond wire inductance critical in high-speed and power semiconductor packaging?'),
          answer:
            msg('Rapid current switching (di/dt) across parasitic bond wire inductance induces voltage transients (L di/dt), causing ground bounce, power supply rail ringing, and electromagnetic interference (EMI). Minimizing wire length or placing parallel bond wires reduces loop inductance.'),
        },
        {
          question: msg('How does the Preece fusing current differ from JEDEC continuous current ratings?'),
          answer:
            msg('The Preece fusing equation predicts catastrophic thermal burnout where the wire melts (typically > 1 A for 1 mil wire). In contrast, JEDEC and MIL-STD guidelines limit continuous DC current to approximately 0.3-0.5 A to prevent long-term electromigration mass transport and Kirkendall voiding at the bond interface.'),
        },
      ]}
    >
      <WireBondingCalculator />
    </ToolPageShell>
  );
}
