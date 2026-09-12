import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import FourPointProbeCalculator from '@/tools/four-point-probe-calculator/Calculator';
import { tool } from '@/tools/four-point-probe-calculator';
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

export default function FourPointProbeCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Four-Point Sheet Resistance"
            math="R_s = \frac{\pi}{\ln 2} \left( \frac{V}{I} \right) F(t/s) \cdot F_2(D/s)"
          />
          <MathFormula
            block
            label="Bulk Electrical Resistivity"
            math="\rho = R_s \cdot t = \frac{1}{q \cdot N \cdot \mu(N)}"
          />
<ul className="info-list">
            <li>
              <strong>π / ln 2 ≈ 4.53236</strong> — the theoretical geometric factor for a collinear equidistant probe array on an infinitely extended thin conductive sheet.
            </li>
            <li>
              <strong>F(t / s)</strong> — ASTM F84 / SEMI MF84 thickness correction factor accounting for 3D current divergence when wafer thickness is comparable to probe pitch.
            </li>
            <li>
              <strong>NIST / ASTM F723 Inversion</strong> — numerical inversion of Thurber / Masetti carrier mobility equations to estimate donor/acceptor active dopant concentration N (cm⁻³).
            </li>
          </ul>
        </>
      }
      notes={[
        'ASTM F84 and SEMI MF84 provide standard test methods for measuring resistivity of silicon wafers with an in-line four-point probe.',
        'When wafer thickness t is less than 0.5 × probe spacing s (e.g. t < 500 μm for a 1 mm probe), the thin-film approximation holds with less than 3% geometric error.',
        'For high accuracy, keep current low enough (typically 0.1 to 5 mA) to avoid Joule heating at tungsten probe contact points.',
      ]}
      faq={[
        {
          question: 'What probe spacing is standard in semiconductor fab metrology?',
          answer: 'The most common standard spacing is s = 1.000 mm (metric) or s = 1.5875 mm (62.5 mil, ASTM imperial standard). Micro-probe heads often feature 0.635 mm (25 mil) pitch for small test pad structures.',
        },
        {
          question: 'Why does the inverted dopant density differ between p-type and n-type?',
          answer: 'Electrons in silicon possess higher mobility (~1400 cm²/Vs at low doping) than holes (~450 cm²/Vs). Therefore, an n-type wafer requires less dopant density than a p-type wafer to produce the identical resistivity.',
        },
      ]}
    >
      <FourPointProbeCalculator />
    </ToolPageShell>
  );
}
