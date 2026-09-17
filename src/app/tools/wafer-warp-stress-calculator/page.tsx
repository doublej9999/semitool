import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import WaferWarpStressCalculator from '@/tools/wafer-warp-stress-calculator/Calculator';
import { tool } from '@/tools/wafer-warp-stress-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/wafer-warp-stress-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function WaferWarpStressCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Stoney Equation for Thin-Film Residual Stress'), math: '\\sigma = \\frac{E_s t_s^2}{6 (1 - \\nu_s) t_f} \\left(\\frac{1}{R_{\\text{post}}} - \\frac{1}{R_{\\text{pre}}}\\right) = \\frac{M_s t_s^2}{6 t_f} \\Delta \\kappa' },
        { kind: 'math', label: msg('Wafer Bow & Radius of Curvature Conversion'), math: '\\text{Bow} = \\frac{D^2}{8 R} \\iff R = \\frac{D^2}{8 \\cdot \\text{Bow}}, \\quad \\Delta \\text{Bow} = \\text{Bow}_{\\text{post}} - \\text{Bow}_{\\text{pre}}' },
        { kind: 'math', label: msg('Thermal Expansion Mismatch Stress'), math: '\\sigma_{\\text{th}} = \\frac{E_f}{1 - \\nu_f} (\\alpha_s - \\alpha_f) (T_{\\text{room}} - T_{\\text{dep}}) = M_f (\\alpha_s - \\alpha_f) \\Delta T' },
        { kind: 'math', label: msg('Intrinsic Deposition Stress Separation'), math: '\\sigma_{\\text{intrinsic}} = \\sigma_{\\text{total}} - \\sigma_{\\text{th}}' },
        { kind: 'math', label: msg('Critical Film Cracking / Delamination Thickness'), math: 'h_c = \\frac{\\Gamma E_f}{Z \\sigma^2} \\quad (Z \\approx 1.12)' },
        { kind: 'list', items: [msg('**Biaxial Modulus (Ms)** — Substrate stiffness parameter Es / (1 − νs) that accounts for two-dimensional in-plane equibiaxial stress constraint. For Si(100), Ms ≈ 180.5 GPa; for Si(111), Ms ≈ 229.0 GPa.'), msg('**Wafer Bow vs. Curvature Radius** — Bow is the sagitta (height difference between wafer center and the edge chord) measured across diameter D. Curvature κ = 1/R directly maps to ΔBow via chord geometry.'), msg('**Thermal Stress Component (σth)** — Arises during wafer cooldown from deposition/anneal temperature Tdep to metrology room temperature Troom due to the mismatch in linear coefficients of thermal expansion (αs − αf).'), msg('**Critical Cracking Thickness (hc)** — Energy release rate threshold (Hutchinson-Suo Griffith model). When film thickness tf exceeds hc, stored elastic strain energy exceeds film/interface fracture toughness Γ, precipitating channel cracks or peeling.')] },
      ]}
      notes={[
        msg('The classical Stoney equation assumes thin-film behavior: tf << ts (thickness ratio tf / ts <= 1.0%), isotropic linear elasticity, uniform film thickness, and small spherical deflections without edge curl.'),
        msg('Sign convention: positive stress (σ > 0) indicates tensile stress where the film contracts and bows the wafer concave upward ("smiling"). Negative stress (σ < 0) indicates compressive stress where the film expands and bows the wafer convex upward ("frowning").'),
        msg('Thermal stress accounts for the extrinsic cooling contribution. Subtracting thermal stress from the total measured Stoney stress isolates intrinsic deposition stress (originating from grain coalescence, atomic peening, or crystal densification).'),
        msg('Standard 300 mm lithography vacuum and electrostatic chucks can typically compensate up to 100–150 µm of wafer bow. Bows exceeding this threshold risk clamping alarms, wafer slip, or focal depth defocus during DUV/EUV exposure.'),
        msg('Warp is estimated as the peak-to-valley median surface deflection across the wafer diameter (|Bow_post|). In full-wafer capacitive metrology, warp also accounts for non-uniform thickness roll-off.'),
      ]}
      faq={[
        {
          question: msg('What is the physical difference between wafer bow and wafer warp?'),
          answer:
            msg('According to SEMI standards (e.g. SEMI M1 and M35), wafer Bow is the displacement of the median surface center point relative to a reference plane constructed from three points on the wafer circumference. Wafer Warp is the difference between the absolute maximum and minimum distances of the median surface from a best-fit least-squares reference plane across the entire wafer surface. For an ideal spherical deflection, warp is approximately equal to the peak-to-valley sagitta magnitude |Bow|.'),
        },
        {
          question: msg('Why does the Stoney equation require the substrate biaxial modulus rather than the Young modulus?'),
          answer:
            msg('Because thin films are rigidly bonded to a thick substrate across both lateral dimensions (x and y). When the film strains, the substrate prevents lateral Poisson contraction in both orthogonal in-plane directions simultaneously. This two-dimensional equibiaxial stress state stiffens the substrate elastic response by a factor of 1 / (1 - nu), resulting in the substrate biaxial modulus Ms = Es / (1 - nus). Using Young modulus alone underestimates thin-film stress by approximately 30–40%.'),
        },
        {
          question: msg('When does the Stoney equation lose accuracy?'),
          answer:
            msg('The Stoney formula assumes that the film contributes negligible bending stiffness compared to the substrate (tf << ts). When the film thickness exceeds 1% of the substrate thickness (e.g. > 7.75 µm on a 775 µm wafer), the film bending moment becomes significant, and the Stoney equation underestimates true residual stress. For thick films, bilayer or multilayer beam mechanics (such as the Timoshenko or Freund-Suresh equations) should be used.'),
        },
        {
          question: msg('How do tensile and compressive film stresses affect wafer processing?'),
          answer:
            msg('Tensile films pull wafer edges upward into a bowl shape ("smiling"). Under excessive tension (tf > hc), tensile films relieve stress by forming channel microcracks that cleave through dielectric or interconnect lines. Compressive films push wafer edges downward into a dome shape ("frowning"). Under excessive compression, compressive films relieve stress by blistering, buckling, and interfacial delamination (telephone-cord peeling).'),
        },
        {
          question: msg('What causes intrinsic stress versus thermal mismatch stress?'),
          answer:
            msg('Thermal mismatch stress is purely extrinsic, caused by differential thermal contraction during cooldown from deposition temperature (Tdep) to ambient room temperature (Troom) when alpha_s != alpha_f. Intrinsic stress develops during film nucleation and growth at process temperature: it arises from grain boundary coalescence (tensile), atomic peening from energetic ion bombardment in sputtering (compressive), interstitial gas incorporation (compressive), or phase changes and lattice mismatches during epitaxial growth.'),
        },
      ]}
    >
      <WaferWarpStressCalculator />
    </ToolPageShell>
  );
}
