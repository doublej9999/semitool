import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import CvdKineticsCalculator from '@/tools/cvd-kinetics-calculator/Calculator';
import { tool } from '@/tools/cvd-kinetics-calculator';
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

export default function CvdKineticsPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Boundary Layer Thickness"
            math="\delta(x) = \frac{2}{3} \sqrt{\frac{D_g \cdot x}{U}}"
          />
          <MathFormula
            block
            label="Gas Mass-Transfer Coefficient"
            math="h_g = \frac{D_g}{\delta(x)}"
          />
          <MathFormula
            block
            label="Surface Reaction Velocity (Arrhenius)"
            math="k_s(T) = k_{s0} \exp\left( -\frac{E_a}{k_B T} \right)"
          />
          <MathFormula
            block
            label="Effective Deposition Rate Constant"
            math="k_{\text{eff}} = \frac{h_g \cdot k_s}{h_g + k_s}"
          />
          <MathFormula
            block
            label="Grove CVD Deposition Growth Rate"
            math="v = \frac{C_g}{N_1} \left( \frac{h_g \cdot k_s}{h_g + k_s} \right)"
          />
          <MathFormula
            block
            label="Regime Transition Temperature"
            math="T_{\text{trans}} = \frac{E_a}{k_B \ln\left( \frac{k_{s0}}{h_g} \right)}"
          />
          <MathFormula
            block
            label="Susceptor Reactant Depletion Profile"
            math="C_g(x) = C_g(0) \exp\left( -\frac{k_{\text{eff}} \cdot x}{U \cdot b} \right)"
          />
<ul className="info-list">
            <li>
              <strong>Surface Reaction Controlled (T &lt; T_trans)</strong> — Low process temperatures make surface chemical reaction rates (k_s) much slower than gas-phase mass transfer (h_g). Growth rate increases exponentially with temperature following the Arrhenius law. Film thickness uniformity across wafers is predominantly determined by precise furnace temperature control.
            </li>
            <li>
              <strong>Mass-Transport (Diffusion) Controlled (T &gt; T_trans)</strong> — High process temperatures accelerate surface consumption, making gas boundary-layer diffusion (h_g) the rate-limiting step. Growth rate is nearly independent of temperature, but highly dependent on gas velocity, reactor geometry, boundary layer thinning, and precursor concentration.
            </li>
            <li>
              <strong>Susceptor Depletion & Tilt Optimization</strong> — Reactants are continuously consumed as the gas stream flows across the heated susceptor, causing downstream thickness taper. Commercial horizontal CVD reactors counteract this depletion effect by tilting the susceptor (typically 1.5°–3°) to progressively narrow channel height b(x) and increase gas velocity downstream.
            </li>
          </ul>
        </>
      }
      notes={[
        'The gas-phase diffusion coefficient Dg is scaled from standard STP reference conditions using the Chapman-Enskog kinetic theory relationship Dg(T, P) = Dg0 · (T / 273.15)^1.75 · (760 / P).',
        'In the Grove CVD model, N1 represents the atomic/molecular density of the deposited solid film (e.g. 5.0e22 atoms/cm³ for Silicon, 2.27e22 molecules/cm³ for SiO2, and 3.4e22 molecules/cm³ for LPCVD Si3N4).',
        'Transition temperature T_trans marks the crossover where surface reaction velocity ks equals mass-transfer coefficient hg (ks/hg = 1). Fab engineers typically operate LPCVD in the surface-reaction regime for uniform batch processing, and high-rate APCVD/Epitaxy in the mass-transport regime.',
      ]}
      faq={[
        {
          question: 'What is the physical meaning of the boundary layer thickness δ(x) in CVD?',
          answer:
            'As reactant gases flow over a stationary heated susceptor, viscous drag establishes a hydrodynamic boundary layer where gas velocity drops to zero at the surface. Reactant molecules must diffuse across this stagnant boundary layer to reach the growing film surface. The Grove boundary layer approximation δ(x) ≈ (2/3)·√(Dg·x / U) models this diffusion distance as a function of position x along the reactor.',
        },
        {
          question: 'Why is LPCVD preferred for batch wafer polysilicon and nitride deposition?',
          answer:
            'LPCVD operates at reduced total pressures (0.1–2.0 Torr), which increases gas diffusivity Dg by a factor of 500–1000 compared to atmospheric pressure (Dg ∝ 1/P). This dramatically elevates the mass transfer coefficient hg, pushing the process deeply into the surface reaction-limited regime. In this regime, tightly spaced vertical wafers in a quartz boat receive uniform reactant flux regardless of boundary layer constraints.',
        },
        {
          question: 'How does susceptor tilt prevent downstream reactant depletion in horizontal CVD reactors?',
          answer:
            'As reactants are depleted along the susceptor length, Cg(x) drops exponentially. By tilting the susceptor upward at an angle θ (typically 1.5° to 3°), the channel height b(x) decreases downstream, forcing the carrier gas velocity U(x) to increase. The higher velocity compresses the boundary layer δ(x), increasing hg downstream and compensating for the drop in gas concentration to maintain uniform film growth.',
        },
      ]}
    >
      <CvdKineticsCalculator />
    </ToolPageShell>
  );
}
