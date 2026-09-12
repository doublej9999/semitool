import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import SemiconductorDepletionCalculator from '@/tools/semiconductor-depletion-calculator/Calculator';
import { tool } from '@/tools/semiconductor-depletion-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function SemiconductorDepletionCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="pn Junction Built-in Potential"
            math="V_{\text{bi}} = \frac{k_B T}{q} \ln\left( \frac{N_a N_d}{n_i^2} \right)"
          />
          <MathFormula
            block
            label="Depletion Layer Width (One-Sided Step Junction)"
            math="W = \sqrt{ \frac{2 \varepsilon_s}{q} \left( \frac{N_a + N_d}{N_a N_d} \right) (V_{\text{bi}} - V_a) }"
          />
          <MathFormula
            block
            label="Peak Junction Electric Field"
            math="E_{\max} = \frac{2 (V_{\text{bi}} - V_a)}{W}"
          />
          <MathFormula
            block
            label="Junction Depletion Capacitance"
            math="C_j = \frac{\varepsilon_s A}{W} = A \sqrt{ \frac{q \varepsilon_s N_a N_d}{2(N_a + N_d)(V_{\text{bi}} - V_a)} }"
          />
          <MathFormula
            block
            label="Avalanche Breakdown Voltage Estimate"
            math="V_{\text{br}} \approx \frac{\varepsilon_s E_{\text{crit}}^2}{2 q N_{\text{light}}}"
          />
<ul className="info-list">
            <li>
              <strong>V_bi</strong> — Built-in potential arising from majority carrier diffusion across the metallurgical junction.
            </li>
            <li>
              <strong>W</strong> — Total space charge (depletion) layer width in equilibrium or reverse bias.
            </li>
            <li>
              <strong>x_p, x_n</strong> — Depletion penetration depths into the p-type and n-type semiconductor regions.
            </li>
            <li>
              <strong>E_max</strong> — Peak electric field occurring exactly at the metallurgical junction (x = 0).
            </li>
            <li>
              <strong>C_j</strong> — Differential depletion capacitance per unit area, modeling the voltage-dependent junction capacitor.
            </li>
          </ul>
        </>
      }
      notes={[
        'The abrupt junction model assumes a step doping transition from p to n. Linearly graded junctions or hyper-abrupt junctions found in RF varactors have different field and capacitance scaling laws (e.g. C ~ V^(-1/3)).',
        'Calculations assume complete dopant ionization at the specified temperature. In cryogenic conditions, carrier freeze-out alters effective carrier concentrations.',
        'Silicon dielectric permittivity is taken as eps_s = 11.7 * eps_0. Intrinsic carrier concentration at 300 K is taken as ~1.0e10 cm^-3.',
        'The breakdown voltage estimate uses the empirical ionization integral approximation for an abrupt one-sided junction where the lighter doped side sustains the depletion field.',
      ]}
      faq={[
        {
          question: 'Why does depletion width expand primarily into the lightly doped side?',
          answer:
            'Total exposed space charge must remain balanced: q * Na * xp = q * Nd * xn. Therefore, the ratio of depletion depths is inversely proportional to the doping levels: xp / xn = Nd / Na. In an asymmetric junction (like an n+/p well or p+/n substrate), the depletion region extends almost entirely into the lightly doped side.',
        },
        {
          question: 'How does reverse bias alter junction capacitance?',
          answer:
            'Applying reverse bias Vr adds to the built-in potential, driving mobile carriers away and widening the depletion width W ~ sqrt(Vbi + Vr). Because capacitance Cj = eps / W, junction capacitance decreases proportionally to 1 / sqrt(Vbi + Vr). This principle is utilized in varactor diodes and voltage-controlled tuning circuits.',
        },
      ]}
    >
      <SemiconductorDepletionCalculator />
    </ToolPageShell>
  );
}
