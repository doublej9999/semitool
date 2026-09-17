import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import CmpPrestonCalculator from '@/tools/cmp-preston-calculator/Calculator';
import { tool } from '@/tools/cmp-preston-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/cmp-preston-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function CmpPrestonCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Preston Removal Rate Equation'), math: '\\text{RR} = K_p \\cdot P \\cdot V' },
        { kind: 'math', label: msg('Relative Velocity at Wafer Center'), math: 'V = 2\\pi \\cdot R_{\\text{offset}} \\left( \\frac{\\Omega_{\\text{platen}}}{60} \\right)' },
        { kind: 'math', label: msg('Rotational Mismatch Index'), math: '\\Delta \\Omega = |\\Omega_{\\text{platen}} - \\Omega_{\\text{carrier}}|' },
        { kind: 'math', label: msg('WIWNU Kinematic Non-uniformity Estimate'), math: '\\text{WIWNU}_{\\text{kinematic}} \\approx \\frac{\\Delta \\Omega \\cdot R_{\\text{wafer}}}{V} \\times 100\\%' },
        { kind: 'list', items: [msg('**Preston Coefficient (Kp)** — Empirical constant (Pa⁻¹ or m²/N) governing chemical activity, slurry abrasive mechanics, and pad-wafer interface interactions.'), msg('**Downforce Pressure (P)** — Applied normal pressure per unit area across the wafer surface, usually expressed in psi (pounds per square inch) or kPa.'), msg('**Relative Linear Velocity (V)** — Average platen velocity swept across the center of the wafer carrier head, determined by the radial offset and rotational platen speed.'), msg('**WIWNU (Within-Wafer Non-Uniformity)** — Relative velocity dispersion across the wafer diameter from inner to outer track radii, which is mitigated in production CMP tools through synchronous rotation (Ω_carrier ≈ Ω_platen) and multi-zone carrier bladder pressure profiles.')] },
      ]}
      notes={[
        msg('Preston’s equation is a linear mechanical wear baseline. Real CMP processes may exhibit non-Prestonian behavior at very low downforce pressures (slurry chemical threshold or hydroplaning) or high velocity/pressure regimes (pad heating and slurry starvation).'),
        msg('Conversion factors: 1 psi = 6,894.757 Pa; 1 nm/min = 10 Å/min. Linear velocity V is in m/s.'),
        msg('The kinematic WIWNU calculation models the relative velocity variation across the wafer due to differential platen track radii. In production polishers, multi-zone pneumatic retaining rings and membrane back-pressure zones compensate for this geometric shear delta.'),
        msg('Preset Preston coefficients reflect nominal industrial baselines for standard silica, alumina, and colloidal ceria slurry platforms on planar blanket test wafers.'),
      ]}
      faq={[
        {
          question: msg('What is the Preston equation in Chemical Mechanical Polishing (CMP)?'),
          answer:
            msg('Formulated by F.W. Preston in 1927 for optical glass polishing, Preston’s equation (RR = Kp · P · V) states that material removal rate is directly proportional to applied downforce pressure (P) and relative surface velocity (V). The proportionality factor Kp encapsulates the chemical slurry chemistry, pad hardness, and abrasive wear mechanisms.'),
        },
        {
          question: msg('Why do platen and carrier speeds need to be close to each other?'),
          answer:
            msg('When platen rotation and wafer carrier head rotation are synchronous (Ω_platen ≈ Ω_carrier), every point on the wafer traces identical cycloidal trajectories across the pad over a complete rotation cycle, substantially improving within-wafer non-uniformity (WIWNU).'),
        },
        {
          question: msg('How do psi and kPa downforce pressures translate to removal rate?'),
          answer:
            msg('A typical downforce of 3.0 psi equals approximately 20.7 kPa (20,685 Pa). In modern copper or dielectric planarisation, downforce is typically controlled between 1.5 psi (for low-k dielectric stacks prone to delamination) and 4.0 psi (for bulk copper clearing). Removal rate scales proportionally with this pressure under Prestonian regimes.'),
        },
        {
          question: msg('What causes non-Prestonian CMP behavior?'),
          answer:
            msg('Non-Prestonian behavior occurs when the removal rate deviates from linear scaling with P·V. Examples include chemical dissolution thresholds where removal requires a minimum mechanical downforce to break the passivating oxide layer, or shear heating at high P·V products where elevated temperatures accelerate chemical etch rates.'),
        },
      ]}
    >
      <CmpPrestonCalculator />
    </ToolPageShell>
  );
}
