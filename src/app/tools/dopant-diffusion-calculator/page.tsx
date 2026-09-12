import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import DopantDiffusionCalculator from '@/tools/dopant-diffusion-calculator/Calculator';
import { tool } from '@/tools/dopant-diffusion-calculator';
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

export default function DopantDiffusionCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Constant Surface Source (erfc Profile)"
            math="C(x, t) = C_s \operatorname{erfc}\left( \frac{x}{2\sqrt{D t}} \right)"
          />
          <MathFormula
            block
            label="Limited Total Dose Drive-in (Gaussian Profile)"
            math="C(x, t) = \frac{Q}{\sqrt{\pi D t}} \exp\left( -\frac{x^2}{4 D t} \right)"
          />
          <MathFormula
            block
            label="Dopant Diffusivity (Arrhenius)"
            math="D(T) = D_0 \exp\left( -\frac{E_a}{k_B T} \right)"
          />
          <MathFormula
            block
            label="Thermal Budget Integral"
            math="(D t)_{\text{eff}} = \sum_{i} D(T_i) \cdot t_i"
          />
          <MathFormula
            block
            label="pn Junction Depth (erfc)"
            math="x_j = 2\sqrt{D t} \operatorname{inverfc}\left( \frac{C_{\text{sub}}}{C_s} \right)"
          />
          <MathFormula
            block
            label="pn Junction Depth (Gaussian)"
            math="x_j = \sqrt{4 D t \ln\left( \frac{Q}{C_{\text{sub}} \sqrt{\pi D t}} \right)}"
          />
<ul className="info-list">
            <li>
              <strong>Complementary Error Function (erfc)</strong> — Describes infinite/constant source diffusion from gaseous ambients (POCl₃ for phosphorus or BBr₃ for boron). The surface concentration C_s remains fixed at the solid solubility limit throughout the diffusion cycle.
            </li>
            <li>
              <strong>Gaussian Distribution</strong> — Models drive-in annealing after ion implantation or shallow predeposition. With no external dopant source (infinite or oxide-capped boundary), the fixed dose Q diffuses deeper while the peak surface concentration C_s drops inversely with √(Dt).
            </li>
            <li>
              <strong>SiO₂ Masking Thickness Rule</strong> — Silicon dioxide acts as an effective diffusion barrier because dopant diffusivity in SiO₂ is several orders of magnitude lower than in silicon. The minimum oxide mask thickness is typically chosen as x_ox ≥ 3√(D_ox · t) (99.7% masking efficiency) or 4√(D_ox · t) (safe production rule).
            </li>
          </ul>
        </>
      }
      notes={[
        'The intrinsic diffusion coefficients used here (D0 and Ea) are based on the standard Sze/Plummer values. In heavily doped regions (C > ni(T)), extrinsic concentration-dependent diffusion effects (charged vacancy-assisted diffusion V⁻, V²⁻, V⁺) increase the effective diffusivity.',
        'Solid solubility limits (C_solid) represent the maximum equilibrium concentration of electrically active dopants in the silicon crystal lattice at the specified temperature.',
        'Thermal budget calculations satisfy the additive rule of diffusion: (Dt)_total = D1·t1 + D2·t2 for multiple consecutive thermal processing steps.',
      ]}
      faq={[
        {
          question: 'What is the metallurgical junction depth (xj)?',
          answer:
            'The metallurgical junction depth xj is the physical depth from the wafer surface where the introduced dopant concentration equals the background substrate doping level (C(xj) = CB). At this boundary, the net carrier concentration transitions between p-type and n-type, establishing a p-n junction.',
        },
        {
          question: 'Why is two-step diffusion (predeposition followed by drive-in) standard in planar processing?',
          answer:
            'A single-step constant-source diffusion cannot independently control junction depth and surface concentration. Performing a low-temperature, short predeposition to meter a precise dopant dose Q followed by a high-temperature drive-in allows engineers to achieve deep junctions with moderate, tailored surface concentrations.',
        },
        {
          question: 'How do you calculate the minimum oxide thickness needed to mask dopant diffusion?',
          answer:
            'Because dopants diffuse much slower in silicon dioxide than in silicon, a thermal oxide layer acts as a selective diffusion mask. The required thickness is calculated as x_mask = 3 to 4 times the diffusion length in SiO2, i.e., 3√(D_SiO2 · t) to 4√(D_SiO2 · t), ensuring less than 0.1% of dopants penetrate through to the silicon underneath.',
        },
      ]}
    >
      <DopantDiffusionCalculator />
    </ToolPageShell>
  );
}
