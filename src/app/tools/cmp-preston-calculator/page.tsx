import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import CmpPrestonCalculator from '@/tools/cmp-preston-calculator/Calculator';
import { tool } from '@/tools/cmp-preston-calculator';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
  keywords: tool.keywords,
  alternates: { canonical: tool.path },
  openGraph: {
    title: tool.name + ' — SemiTools',
    description: tool.description,
    url: absoluteUrl(tool.path),
    type: 'website',
  },
};

export default function CmpPrestonCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p className="formula-expression">Removal Rate (RR) = Kp · P · V</p>
          <p className="formula-expression">
            V_center = 2π · R_offset · (Ω_platen / 60)
          </p>
          <p className="formula-expression">
            Total Removed = RR · (Polish Time / 60)
          </p>
          <p className="formula-expression">
            Kinematic WIWNU (%) = (|Ω_platen - Ω_carrier| · R_wafer / V_center) × 100%
          </p>
          <ul className="info-list">
            <li>
              <strong>Preston Coefficient (Kp)</strong> — Empirical constant (Pa⁻¹ or m²/N)
              governing chemical activity, slurry abrasive mechanics, and pad-wafer interface interactions.
            </li>
            <li>
              <strong>Downforce Pressure (P)</strong> — Applied normal pressure per unit area across the
              wafer surface, usually expressed in psi (pounds per square inch) or kPa.
            </li>
            <li>
              <strong>Relative Linear Velocity (V)</strong> — Average platen velocity swept across the center of
              the wafer carrier head, determined by the radial offset and rotational platen speed.
            </li>
            <li>
              <strong>WIWNU (Within-Wafer Non-Uniformity)</strong> — Relative velocity dispersion across the wafer
              diameter from inner to outer track radii, which is mitigated in production CMP tools through synchronous
              rotation (Ω_carrier ≈ Ω_platen) and multi-zone carrier bladder pressure profiles.
            </li>
          </ul>
        </>
      }
      notes={[
        'Preston’s equation is a linear mechanical wear baseline. Real CMP processes may exhibit non-Prestonian behavior at very low downforce pressures (slurry chemical threshold or hydroplaning) or high velocity/pressure regimes (pad heating and slurry starvation).',
        'Conversion factors: 1 psi = 6,894.757 Pa; 1 nm/min = 10 Å/min. Linear velocity V is in m/s.',
        'The kinematic WIWNU calculation models the relative velocity variation across the wafer due to differential platen track radii. In production polishers, multi-zone pneumatic retaining rings and membrane back-pressure zones compensate for this geometric shear delta.',
        'Preset Preston coefficients reflect nominal industrial baselines for standard silica, alumina, and colloidal ceria slurry platforms on planar blanket test wafers.',
      ]}
      faq={[
        {
          question: 'What is the Preston equation in Chemical Mechanical Polishing (CMP)?',
          answer:
            'Formulated by F.W. Preston in 1927 for optical glass polishing, Preston’s equation (RR = Kp · P · V) states that material removal rate is directly proportional to applied downforce pressure (P) and relative surface velocity (V). The proportionality factor Kp encapsulates the chemical slurry chemistry, pad hardness, and abrasive wear mechanisms.',
        },
        {
          question: 'Why do platen and carrier speeds need to be close to each other?',
          answer:
            'When platen rotation and wafer carrier head rotation are synchronous (Ω_platen ≈ Ω_carrier), every point on the wafer traces identical cycloidal trajectories across the pad over a complete rotation cycle, substantially improving within-wafer non-uniformity (WIWNU).',
        },
        {
          question: 'How do psi and kPa downforce pressures translate to removal rate?',
          answer:
            'A typical downforce of 3.0 psi equals approximately 20.7 kPa (20,685 Pa). In modern copper or dielectric planarisation, downforce is typically controlled between 1.5 psi (for low-k dielectric stacks prone to delamination) and 4.0 psi (for bulk copper clearing). Removal rate scales proportionally with this pressure under Prestonian regimes.',
        },
        {
          question: 'What causes non-Prestonian CMP behavior?',
          answer:
            'Non-Prestonian behavior occurs when the removal rate deviates from linear scaling with P·V. Examples include chemical dissolution thresholds where removal requires a minimum mechanical downforce to break the passivating oxide layer, or shear heating at high P·V products where elevated temperatures accelerate chemical etch rates.',
        },
      ]}
    >
      <CmpPrestonCalculator />
    </ToolPageShell>
  );
}
