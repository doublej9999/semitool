import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import AldCycleCalculator from '@/tools/ald-cycle-calculator/Calculator';
import { tool } from '@/tools/ald-cycle-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function AldCycleCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Growth per Cycle (GPC)"
            math="\text{GPC} = \frac{T_{\text{target}}}{N_{\text{cycles}}}"
          />
          <MathFormula
            block
            label="Required Cycle Count"
            math="N_{\text{cycles}} = \left\lceil \frac{T_{\text{target}}}{\text{GPC}} \right\rceil"
          />
          <MathFormula
            block
            label="Cycle Time"
            math="t_{\text{cycle}} = t_{\text{doseA}} + t_{\text{purgeA}} + t_{\text{doseB}} + t_{\text{purgeB}}"
          />
          <MathFormula
            block
            label="Total Recipe Time"
            math="t_{\text{total}} = N_{\text{cycles}} \times t_{\text{cycle}} + t_{\text{overhead}}"
          />
          <MathFormula
            block
            label="Precursor Consumption"
            math="m_{\text{consumed}} = N_{\text{cycles}} \times \dot{m}_{\text{pulse}} \times t_{\text{dose}}"
          />
          <MathFormula
            block
            label="Precursor Remaining Capacity"
            math="N_{\text{remaining}} = \left\lfloor \frac{M_{\text{cylinder}}}{m_{\text{consumed, cycle}}} \right\rfloor"
          />
<ul className="info-list">
            <li>
              <strong>Self-Limiting Surface Reaction</strong> — ALD relies on sequential, self-terminating gas-solid chemical reactions. Once all active surface hydroxyl or ligand sites are fully chemisorbed, further precursor exposure yields zero additional deposition, ensuring Angstrom-level thickness control and near-100% conformality on 3D FinFET, GAA nanosheet, and high-aspect-ratio 3D NAND structures.
            </li>
            <li>
              <strong>Purge Duration & Soft-CVD Prevention</strong> — Inadequate purge times allow precursor A and co-reactant B to mix in the vapor phase, causing parasitic uncontrolled chemical vapor deposition (CVD) reactions, particulate generation, and severe film thickness non-uniformity across the wafer.
            </li>
            <li>
              <strong>ALD Temperature Window</strong> — Below the ALD temperature window, precursors condense or reaction activation energy is insufficient; above the window, precursors decompose thermally (pyrolysis) or desorb rapidly, destroying the self-limiting mechanism.
            </li>
          </ul>
        </>
      }
      notes={[
        'Characteristic saturation dose L0 is typically between 1,000 and 10,000 Langmuirs for planar substrates, but can increase to >100,000 L for high aspect ratio (>50:1) trenches and memory capacitor holes due to Knudsen diffusion limitations.',
        'The Growth Per Cycle (GPC) for trimethylaluminum (TMA) + H2O at 200 °C is approximately 1.1 Å/cycle (0.11 nm/cycle), which corresponds to roughly 1/3 of a full Al2O3 monolayer per cycle due to steric hindrance from bulky methyl (-CH3) ligands.',
        'Single-wafer ALD tools typically process wafers with cycle periods of 5–15 seconds; batch ALD furnaces handle 50–150 wafers simultaneously with longer cycle times (20–60 s) to maximize throughput.',
      ]}
      faq={[
        {
          question: 'What is a Langmuir (L) and how is it related to precursor exposure?',
          answer:
            'A Langmuir is a unit of surface gas exposure defined as 10⁻⁶ Torr·s. At 1 Langmuir of exposure with a sticking coefficient of 1, roughly one monolayer of gas molecules impinges upon the solid surface. In practical ALD tools operating at 0.1–1 Torr with pulse times of 50–200 ms, exposure ranges from 5,000 to 100,000 Langmuirs to guarantee complete saturation.',
        },
        {
          question: 'Why does ALD not deposit a full atomic monolayer in each cycle?',
          answer:
            'Due to steric hindrance, the chemisorbed precursor molecules possess bulky organic ligands (such as methyl groups in TMA or chlorine atoms in TiCl4) that physically shield adjacent active reactive sites on the substrate surface. Consequently, typical ALD growth rates range between 0.3 and 1.5 Å/cycle, representing 20%–40% of a true monolayer.',
        },
        {
          question: 'How do you optimize purge times between precursor pulses?',
          answer:
            'Purge time must be long enough to evacuate residual unreacted precursor vapor and volatile reaction byproducts (e.g., CH4 or HCl) down to negligible partial pressures. Insufficient purge causes gas-phase reactions (parasitic CVD), whereas excessively long purges lengthen the total thermal cycle and reduce manufacturing throughput.',
        },
      ]}
    >
      <AldCycleCalculator />
    </ToolPageShell>
  );
}
