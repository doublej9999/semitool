import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import PlasmaSheathCalculator from '@/tools/plasma-sheath-calculator/Calculator';
import { tool } from '@/tools/plasma-sheath-calculator';
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

export default function PlasmaSheathCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p className="formula-expression">
            Electron Debye Length: λ_D = √( (ε₀ · k_B · T_e) / (e² · n_e) )
          </p>
          <p className="formula-expression">
            Bohm Velocity (Ion Sound Speed): u_B = √( (k_B · T_e) / M_i )
          </p>
          <p className="formula-expression">
            Child-Langmuir Collisionless Sheath: s = (√2 / 3) · λ_D · ( (2 · e · V₀) / (k_B · T_e) )^(3/4)
          </p>
          <p className="formula-expression">
            Electron Plasma Frequency: f_pe = (1 / 2π) · √( (e² · n_e) / (ε₀ · m_e) )
          </p>
          <p className="formula-expression">
            Sheath Areal Capacitance: C_s / A = ε₀ / s
          </p>
          <p className="formula-expression">
            Ion Mean Free Path: λ_i = (k_B · T_g) / (√2 · p · σ_coll)
          </p>
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
