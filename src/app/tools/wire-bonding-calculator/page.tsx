import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import WireBondingCalculator from '@/tools/wire-bonding-calculator/Calculator';
import { tool } from '@/tools/wire-bonding-calculator';
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

export default function WireBondingCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p className="formula-expression">
            Lwire = 2e-7 × L × [ ln(4L / d) - 1 + µr / 4 ]
          </p>
          <p className="formula-expression">
            δ = √[ ρ / (π × f × µ0) ], &nbsp; Rdc = ρ × L / A
          </p>
          <p className="formula-expression">
            Ifuse = k × (dinches)^1.5 &nbsp; (Preece Equation)
          </p>
          <p className="formula-expression">
            I_safe = Jmax × Acm² &nbsp; (JEDEC Continuous Limit)
          </p>
          <ul className="info-list">
            <li>
              <strong>L_wire</strong> — Self-inductance of straight circular bond wire loop according to the Rosa formulation.
            </li>
            <li>
              <strong>δ (Skin Depth)</strong> — Depth at which high frequency AC current density falls to 1/e (37%) of surface value.
            </li>
            <li>
              <strong>I_fuse</strong> — Short-term melting/fusing burnout current calculated from Preece empirical thermal equilibrium.
            </li>
            <li>
              <strong>I_safe</strong> — Continuous DC operating current limit ensuring long-term reliability against electromigration and void formation.
            </li>
          </ul>
        </>
      }
      notes={[
        'Wire bond self-inductance generally follows the empirical rule-of-thumb of ~1 nH per millimetre of wire length for standard 1.0 mil (25.4 µm) bond wires.',
        'At high frequencies (> 500 MHz), current crowds into the outer skin depth shell, multiplying effective AC resistance and causing signal attenuation.',
        'Gold (Au) remains the industry benchmark for high-reliability ball bonding. Copper (Cu) offers superior thermal and electrical conductivity with higher stiffness, while Aluminium (Al) is standard in power modules.',
      ]}
      faq={[
        {
          question: 'Why is bond wire inductance critical in high-speed and power semiconductor packaging?',
          answer:
            'Rapid current switching (di/dt) across parasitic bond wire inductance induces voltage transients (L di/dt), causing ground bounce, power supply rail ringing, and electromagnetic interference (EMI). Minimizing wire length or placing parallel bond wires reduces loop inductance.',
        },
        {
          question: 'How does the Preece fusing current differ from JEDEC continuous current ratings?',
          answer:
            'The Preece fusing equation predicts catastrophic thermal burnout where the wire melts (typically > 1 A for 1 mil wire). In contrast, JEDEC and MIL-STD guidelines limit continuous DC current to approximately 0.3-0.5 A to prevent long-term electromigration mass transport and Kirkendall voiding at the bond interface.',
        },
      ]}
    >
      <WireBondingCalculator />
    </ToolPageShell>
  );
}
