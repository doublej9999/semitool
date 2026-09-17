import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import IonImplantationCalculator from '@/tools/ion-implantation-calculator/Calculator';
import { tool } from '@/tools/ion-implantation-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/ion-implantation-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function IonImplantationCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Gaussian Dopant Implantation Profile'), math: 'N(x) = \\frac{\\Phi}{\\sqrt{2\\pi} \\Delta R_p} \\exp\\left( -\\frac{(x - R_p)^2}{2 \\Delta R_p^2} \\right)' },
        { kind: 'math', label: msg('Peak Dopant Concentration (at x = Rp)'), math: 'N_{\\text{peak}} = \\frac{\\Phi}{\\sqrt{2\\pi} \\Delta R_p}' },
        { kind: 'math', label: msg('pn Junction Depth Solution'), math: 'x_j = R_p \\pm \\Delta R_p \\sqrt{2 \\ln\\left( \\frac{N_{\\text{peak}}}{N_{\\text{sub}}} \\right)}' },
        { kind: 'math', label: msg('Sheet Resistance Post-Anneal'), math: 'R_s \\approx \\frac{1}{q \\cdot \\Phi \\cdot \\mu_{\\text{eff}} \\cdot \\eta_{\\text{act}}}' },
        { kind: 'list', items: [msg('**Φ (Dose)** — total implanted ion fluence per unit area (ions/cm²).'), msg('**Rp (Projected Range)** — mean penetration depth along the incident beam normal into silicon (nm or µm).'), msg('**ΔRp (Projected Straggle)** — standard deviation of the Gaussian spatial distribution (nm or µm).'), msg('**Np (Peak Concentration)** — maximum volumetric dopant concentration occurring at depth x = Rp (atoms/cm³).'), msg('**Nb (Background Concentration)** — starting wafer substrate or opposite-type well doping (atoms/cm³).'), msg('**xj (Metallurgical Junction Depth)** — depth into silicon where the implanted dopant concentration equals the background substrate doping Nb (nm or µm).'), msg('**N(0) (Surface Concentration)** — dopant concentration remaining at the immediate silicon wafer surface (x = 0).')] },
      ]}
      notes={[
        msg('Projected range Rp and straggle ΔRp are calculated from standard Gibbons, Johnson, and Mylroie (LSS theory) stopping-power tabulations in amorphous silicon for Boron (¹¹B), Phosphorus (³¹P), Arsenic (⁷⁵As), and Boron Difluoride (⁴⁹BF₂).'),
        msg('In crystalline silicon, ion channeling along low-index crystallographic axes (such as <100> or <110>) can produce an exponential tail extending significantly deeper than the standard symmetrical Gaussian. Modern fabs use electrostatic wafer tilts (e.g. 7° tilt, 22° twist) or pre-amorphization implants (PAI with Ge or Si) to suppress channeling.'),
        msg('BF2 molecules dissociate upon striking the wafer surface. Boron inherits a kinetic energy proportional to its mass ratio: E_B ≈ (11 / 49) × E_BF2 ≈ 0.224 × E_BF2, enabling ultra-shallow p+/n junctions without requiring low beam currents from sub-keV Boron extractors.'),
        msg('Implant damage generates vacancies, interstitials, and amorphous pockets. A high-temperature thermal anneal (RTA or spike anneal, e.g. 1000 °C to 1050 °C) is required to heal lattice damage and activate dopants onto substitutional silicon lattice sites. Transient Enhanced Diffusion (TED) can broaden the profile during this step.'),
        msg('Peak concentrations exceeding the solid solubility limit (~3×10²⁰ cm⁻³ for B, ~1.8×10²¹ cm⁻³ for As) will precipitate into inactive clusters and dislocation loops during annealing.'),
      ]}
      faq={[
        {
          question: msg('What is the physical meaning of Projected Range (Rp) and Straggle (ΔRp)?'),
          answer:
            msg('Projected Range Rp is the average stopping depth of an energetic ion measured perpendicular to the target silicon surface. Projected Straggle ΔRp is the statistical spread (standard deviation) caused by random nuclear and electronic collisions with silicon lattice atoms. In a first-order symmetrical model, ~68% of all implanted ions settle within Rp ± ΔRp.'),
        },
        {
          question: msg('How is the metallurgical junction depth xj determined?'),
          answer:
            msg('The metallurgical junction forms at the depth xj where the local implanted dopant concentration N(xj) exactly equals the background substrate or opposite-type well concentration Nb. Setting N(xj) = Nb in the Gaussian profile and taking natural logarithms yields xj = Rp + ΔRp × √(2 × ln(Np / Nb)). If peak concentration Np is lower than or equal to Nb, no electrical junction forms.'),
        },
        {
          question: msg('Why does the Gaussian model predict a non-zero surface concentration N(0)?'),
          answer:
            msg('Because the Gaussian distribution extends across all depths x, its tail reaches the wafer surface x = 0 with value N(0) = Np × exp(- Rp² / (2 ΔRp²)). For shallow implants or light ions with large straggle (such as low-energy Boron), N(0) can be a significant fraction of Np.'),
        },
        {
          question: msg('Why implant BF2 instead of atomic Boron?'),
          answer:
            msg('Boron has a very light atomic mass (11 amu), requiring very low acceleration voltages (< 5 keV) for sub-100 nm junction depths. Operating ion implanters at low extraction voltages leads to high space-charge beam blowup and low wafer throughput. BF2 (49 amu) allows running the implanter beamline at ~4.5 times higher kinetic energy while Boron carries only 22.4% of the energy, yielding high beam currents and crisp shallow junctions.'),
        },
        {
          question: msg('What is ion channeling and why might my real SIMS profile be deeper?'),
          answer:
            msg('Single-crystal silicon has open channels between atomic columns along <100>, <110>, and <111> directions. Ions entering within a critical angle experience gentle glancing collisions with electron clouds without hard nuclear collisions, steering them deep into the wafer. This produces a secondary exponential tail seen in Secondary Ion Mass Spectrometry (SIMS) profiles that pure Gaussian LSS models do not account for.'),
        },
      ]}
    >
      <IonImplantationCalculator />
    </ToolPageShell>
  );
}
