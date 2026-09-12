import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import PlasmaSheathCalculator from '@/tools/plasma-sheath-calculator/Calculator';
import { tool } from '@/tools/plasma-sheath-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function PlasmaSheathCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Debye Electron Shielding Length"
            math="\lambda_D = \sqrt{\frac{\varepsilon_0 k_B T_e}{n_e q^2}}"
          />
          <MathFormula
            block
            label="Bohm Sound Velocity (Ion Sheath Entry)"
            math="u_B = \sqrt{\frac{k_B T_e}{M_i}}"
          />
          <MathFormula
            block
            label="Child-Langmuir Collisionless Sheath"
            math="s_{\text{CL}} = \frac{\sqrt{2}}{3} \lambda_D \left( \frac{2 q V_{\text{bias}}}{k_B T_e} \right)^{3/4}"
          />
          <MathFormula
            block
            label="Collisional Sheath Thickness"
            math="s_{\text{col}} \approx \left( \frac{9 \varepsilon_0 \mu_i V_{\text{bias}}^2}{8 J_i} \right)^{1/3}"
          />
          <MathFormula
            block
            label="Ion Current Density to Substrate"
            math="J_i = 0.61 q n_0 u_B = 0.61 q n_0 \sqrt{\frac{k_B T_e}{M_i}}"
          />
          <MathFormula
            block
            label="DC Self-Bias Voltage (RF Asymmetry)"
            math="V_{\text{dc}} = V_{\text{rf}} \left( \frac{A_{\text{ground}}^4 - A_{\text{powered}}^4}{A_{\text{ground}}^4 + A_{\text{powered}}^4} \right)"
          />
<ul className="info-list">
            <li>
              <strong>Bohm Sheath Criterion</strong> — In order for a stable positive space charge sheath to form at an electrode or chamber wall, ions must enter the sheath edge with a directed drift velocity equal to or greater than the Bohm velocity u_B (kinetic energy ≥ k_B T_e / 2).
            </li>
            <li>
              <strong>Child-Langmuir Space-Charge Law</strong> — When a high negative bias voltage V₀ ≫ k_B T_e / e is applied (e.g. by an RF generator in reactive ion etching), electrons are repelled, creating an ion-rich dark space of thickness s governed by space-charge current limitation.
            </li>
            <li>
              <strong>Collisionality Index (s / λ_i)</strong> — When s ≪ λ_i (&lt; 0.1), ions traverse the sheath without colliding with neutral gas atoms, preserving normal incidence and directional energy (ballistic regime). When s ≫ λ_i (&gt; 1), collisions broaden the ion angular distribution and degrade vertical etch profiles.
            </li>
          </ul>
        </>
      }
      notes={[
        'The Bohm velocity calculation assumes cold ions (T_i ≪ T_e), which holds true across standard low-temperature processing plasmas where electrons are heated by RF/microwave fields (1–5 eV) while neutral atoms and ions remain close to ambient wafer temperature (300–400 K).',
        'In high-density plasma reactors (ICP, CCP, ECR), ion density n_i equals electron density n_e in the quasineutral bulk plasma (quasi-neutrality assumption n_e ≈ n_i). For electronegative feedgases (SF₆, Cl₂, CF₄), negative ion formation (F⁻, Cl⁻) can modify the Bohm velocity and pre-sheath potential fall.',
        'At high bias frequencies (> 13.56 MHz, e.g. 27 MHz or 60 MHz), the sheath behaves more capacitively with lower impedance, enabling independent control of ion flux (via source power) and ion energy (via bias power) in dual-frequency systems.',
      ]}
      faq={[
        {
          question: 'Why does a plasma sheath form next to any surface in contact with plasma?',
          answer:
            'Because electrons are thousands of times lighter than ions (m_e ≪ M_i), their thermal velocity is vastly higher. Upon initial plasma ignition, electrons escape to conducting walls or wafer substrates much faster than ions, leaving the bulk plasma positively charged with respect to the boundaries. This electric field repels subsequent electrons and accelerates positive ions into the surface until net current reaches zero.',
        },
        {
          question: 'What is the significance of the Debye length in semiconductor etching?',
          answer:
            'The Debye length (λ_D) is the characteristic screening distance over which electric fields are shielded by mobile charges. In high-density plasma (n_e ~ 10¹¹–10¹² cm⁻³), λ_D shrinks to 10–30 μm, enabling thin, tightly confined sheaths that allow high bias voltages and directional ion acceleration without dielectric breakdown.',
        },
        {
          question: 'How does chamber pressure impact ion energy distribution function (IEDF)?',
          answer:
            'At low pressure (< 10 mTorr), the ion mean free path λ_i exceeds sheath thickness s, yielding a collisionless sheath where ions strike the wafer with full bias energy and normal incidence. At elevated pressures (> 50 mTorr), charge-exchange collisions (Ar⁺ + Ar → Ar + Ar⁺) create low-energy neutral and ion populations, broadening the IEDF and increasing sidewall bowing and micro-masking.',
        },
      ]}
    >
      <PlasmaSheathCalculator />
    </ToolPageShell>
  );
}
