import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import WaferWarpStressCalculator from '@/tools/wafer-warp-stress-calculator/Calculator';
import { tool } from '@/tools/wafer-warp-stress-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function WaferWarpStressCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Stoney Equation for Thin-Film Residual Stress"
            math="\sigma = \frac{E_s t_s^2}{6 (1 - \nu_s) t_f} \left(\frac{1}{R_{\text{post}}} - \frac{1}{R_{\text{pre}}}\right) = \frac{M_s t_s^2}{6 t_f} \Delta \kappa"
          />
          <MathFormula
            block
            label="Wafer Bow & Radius of Curvature Conversion"
            math="\text{Bow} = \frac{D^2}{8 R} \iff R = \frac{D^2}{8 \cdot \text{Bow}}, \quad \Delta \text{Bow} = \text{Bow}_{\text{post}} - \text{Bow}_{\text{pre}}"
          />
          <MathFormula
            block
            label="Thermal Expansion Mismatch Stress"
            math="\sigma_{\text{th}} = \frac{E_f}{1 - \nu_f} (\alpha_s - \alpha_f) (T_{\text{room}} - T_{\text{dep}}) = M_f (\alpha_s - \alpha_f) \Delta T"
          />
          <MathFormula
            block
            label="Intrinsic Deposition Stress Separation"
            math="\sigma_{\text{intrinsic}} = \sigma_{\text{total}} - \sigma_{\text{th}}"
          />
          <MathFormula
            block
            label="Critical Film Cracking / Delamination Thickness"
            math="h_c = \frac{\Gamma E_f}{Z \sigma^2} \quad (Z \approx 1.12)"
          />
          <ul className="info-list">
            <li>
              <strong>Biaxial Modulus (M<sub>s</sub>)</strong> — Substrate stiffness parameter E<sub>s</sub> / (1 − ν<sub>s</sub>) that accounts for two-dimensional in-plane equibiaxial stress constraint. For Si(100), M<sub>s</sub> ≈ 180.5 GPa; for Si(111), M<sub>s</sub> ≈ 229.0 GPa.
            </li>
            <li>
              <strong>Wafer Bow vs. Curvature Radius</strong> — Bow is the sagitta (height difference between wafer center and the edge chord) measured across diameter D. Curvature κ = 1/R directly maps to ΔBow via chord geometry.
            </li>
            <li>
              <strong>Thermal Stress Component (σ<sub>th</sub>)</strong> — Arises during wafer cooldown from deposition/anneal temperature T<sub>dep</sub> to metrology room temperature T<sub>room</sub> due to the mismatch in linear coefficients of thermal expansion (α<sub>s</sub> − α<sub>f</sub>).
            </li>
            <li>
              <strong>Critical Cracking Thickness (h<sub>c</sub>)</strong> — Energy release rate threshold (Hutchinson-Suo Griffith model). When film thickness t<sub>f</sub> exceeds h<sub>c</sub>, stored elastic strain energy exceeds film/interface fracture toughness Γ, precipitating channel cracks or peeling.
            </li>
          </ul>
        </>
      }
      notes={[
        'The classical Stoney equation assumes thin-film behavior: tf << ts (thickness ratio tf / ts <= 1.0%), isotropic linear elasticity, uniform film thickness, and small spherical deflections without edge curl.',
        'Sign convention: positive stress (σ > 0) indicates tensile stress where the film contracts and bows the wafer concave upward ("smiling"). Negative stress (σ < 0) indicates compressive stress where the film expands and bows the wafer convex upward ("frowning").',
        'Thermal stress accounts for the extrinsic cooling contribution. Subtracting thermal stress from the total measured Stoney stress isolates intrinsic deposition stress (originating from grain coalescence, atomic peening, or crystal densification).',
        'Standard 300 mm lithography vacuum and electrostatic chucks can typically compensate up to 100–150 µm of wafer bow. Bows exceeding this threshold risk clamping alarms, wafer slip, or focal depth defocus during DUV/EUV exposure.',
        'Warp is estimated as the peak-to-valley median surface deflection across the wafer diameter (|Bow_post|). In full-wafer capacitive metrology, warp also accounts for non-uniform thickness roll-off.',
      ]}
      faq={[
        {
          question: 'What is the physical difference between wafer bow and wafer warp?',
          answer:
            'According to SEMI standards (e.g. SEMI M1 and M35), wafer Bow is the displacement of the median surface center point relative to a reference plane constructed from three points on the wafer circumference. Wafer Warp is the difference between the absolute maximum and minimum distances of the median surface from a best-fit least-squares reference plane across the entire wafer surface. For an ideal spherical deflection, warp is approximately equal to the peak-to-valley sagitta magnitude |Bow|.',
        },
        {
          question: 'Why does the Stoney equation require the substrate biaxial modulus rather than the Young modulus?',
          answer:
            'Because thin films are rigidly bonded to a thick substrate across both lateral dimensions (x and y). When the film strains, the substrate prevents lateral Poisson contraction in both orthogonal in-plane directions simultaneously. This two-dimensional equibiaxial stress state stiffens the substrate elastic response by a factor of 1 / (1 - nu), resulting in the substrate biaxial modulus Ms = Es / (1 - nus). Using Young modulus alone underestimates thin-film stress by approximately 30–40%.',
        },
        {
          question: 'When does the Stoney equation lose accuracy?',
          answer:
            'The Stoney formula assumes that the film contributes negligible bending stiffness compared to the substrate (tf << ts). When the film thickness exceeds 1% of the substrate thickness (e.g. > 7.75 µm on a 775 µm wafer), the film bending moment becomes significant, and the Stoney equation underestimates true residual stress. For thick films, bilayer or multilayer beam mechanics (such as the Timoshenko or Freund-Suresh equations) should be used.',
        },
        {
          question: 'How do tensile and compressive film stresses affect wafer processing?',
          answer:
            'Tensile films pull wafer edges upward into a bowl shape ("smiling"). Under excessive tension (tf > hc), tensile films relieve stress by forming channel microcracks that cleave through dielectric or interconnect lines. Compressive films push wafer edges downward into a dome shape ("frowning"). Under excessive compression, compressive films relieve stress by blistering, buckling, and interfacial delamination (telephone-cord peeling).',
        },
        {
          question: 'What causes intrinsic stress versus thermal mismatch stress?',
          answer:
            'Thermal mismatch stress is purely extrinsic, caused by differential thermal contraction during cooldown from deposition temperature (Tdep) to ambient room temperature (Troom) when alpha_s != alpha_f. Intrinsic stress develops during film nucleation and growth at process temperature: it arises from grain boundary coalescence (tensile), atomic peening from energetic ion bombardment in sputtering (compressive), interstitial gas incorporation (compressive), or phase changes and lattice mismatches during epitaxial growth.',
        },
      ]}
    >
      <WaferWarpStressCalculator />
    </ToolPageShell>
  );
}
