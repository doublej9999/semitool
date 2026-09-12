import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import ArdeEtchCalculator from '@/tools/arde-etch-calculator/Calculator';
import { tool } from '@/tools/arde-etch-calculator';
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

export default function ArdeEtchCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Coburn-Winter Knudsen Diffusion ARDE Model"
            math="R(\text{AR}) = \frac{R_0}{1 + k \cdot \text{AR}} \quad \text{where} \quad \text{AR} = \frac{\text{Depth}}{\text{CD}}"
          />
          <MathFormula
            block
            label="Exponential Attenuation ARDE Model"
            math="R(\text{AR}) = R_0 \exp(-\alpha \cdot \text{AR})"
          />
          <MathFormula
            block
            label="Mogab Reactant Depletion Microloading Formula"
            math="\frac{R_{\text{dense}}}{R_{\text{iso}}} = \frac{1}{1 + \eta \cdot \rho}"
          />
          <MathFormula
            block
            label="Mask Selectivity & Profile Taper Angle"
            math="S = \frac{R_{\text{target}}}{R_{\text{mask}}}, \quad \tan\theta_{\text{profile}} = S \cdot \tan\theta_{\text{mask}}, \quad \theta_{\text{taper}} = 90^\circ - \theta_{\text{profile}}"
          />
          <MathFormula
            block
            label="Overetch Duration & Mask Consumption"
            math="t_{\text{total}} = \frac{D}{R_{\text{eff}}} \left(1 + \frac{\text{OE}}{100}\right), \quad M_{\text{loss}} = D \left(\frac{1 + \text{OE}/100}{S}\right)"
          />
          <ul className="info-list">
            <li>
              <strong>Knudsen Transport Resistance</strong> — In high-aspect-ratio (HAR) trenches, the feature depth exceeds the neutral mean free path (Knudsen regime), causing diffuse wall collisions to drastically throttle reactant flux to the trench bottom.
            </li>
            <li>
              <strong>Ion Shadowing & Differential Charging</strong> — Angled ion trajectories strike the upper sidewalls, causing positive charge build-up at the mask neck and electrostatic deflection of subsequent ions, reducing vertical bottom etching.
            </li>
            <li>
              <strong>Microloading vs. Macroloading</strong> — Macroloading affects the entire wafer via reactant gas depletion, while microloading (local loading) depletes neutral radicals across dense arrays compared to isolated open test structures.
            </li>
          </ul>
        </>
      }
      notes={[
        'The Coburn-Winter model assumes neutral transport limited by Knudsen diffusion with wall reflection coefficient k (typically 0.05–0.15 in standard ICP/RIE dielectric or silicon etching).',
        'Profile taper angle calculations assume facet propagation where lateral mask erosion projects into the substrate according to the tangent law tan(θ) = S · tan(θ_mask).',
        'In deep reactive-ion etching (DRIE / Bosch process), ARDE can be exacerbated during passivation cycles due to non-uniform polymer deposition along deep sidewalls.',
        'Overetch duration calculation is referenced to the effective etch rate at the feature bottom to ensure full feature clearing without residual foot defects.',
      ]}
      faq={[
        {
          question: 'What is Aspect-Ratio-Dependent Etching (ARDE) or RIE Lag?',
          answer:
            'ARDE (also called RIE lag) is the phenomenon where small-diameter, deep features etch significantly slower than wide, shallow features exposed to the same plasma chemistry. As aspect ratio increases (Depth / CD > 3:1), neutral reactant transport becomes Knudsen diffusion-limited, ion shadowing blocks off-axis ions, and byproduct evacuation slows down.',
        },
        {
          question: 'How does microloading differ from ARDE?',
          answer:
            'ARDE depends purely on individual feature geometry (depth and critical dimension), whereas microloading depends on pattern density in the local neighborhood. A high pattern density consumes neutral etchant species faster than gas-phase diffusion can replenish them, suppressing etch rates in dense areas compared to isolated structures.',
        },
        {
          question: 'Why does low mask selectivity cause sloped or tapered sidewalls?',
          answer:
            'During plasma etching, the masking layer (photoresist, SiO2, or hardmask) erodes vertically and bevels at its upper corners due to ion sputtering. If mask selectivity (S = R_target / R_mask) is low, lateral facet erosion transfers into the underlying substrate, creating a tapered angle θ < 90° rather than an ideal anisotropic vertical profile.',
        },
        {
          question: 'What process knobs reduce ARDE in production fabs?',
          answer:
            'Engineers mitigate ARDE by lowering chamber pressure (< 10 mTorr) to extend the molecular mean free path and collimate ion trajectories, increasing RF bias power to enhance directional physical sputtering, pulsing RF source and bias power to eliminate surface charging, and tuning chemistry to reduce neutral radical stickiness.',
        },
      ]}
    >
      <ArdeEtchCalculator />
    </ToolPageShell>
  );
}
