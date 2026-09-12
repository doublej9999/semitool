import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import AldCycleCalculator from '@/tools/ald-cycle-calculator/Calculator';
import { tool } from '@/tools/ald-cycle-calculator';
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

export default function AldCycleCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p className="formula-expression">
            Precursor Exposure Dose: L = (P · t_pulse) / 10⁻⁶ &nbsp;(1 Langmuir = 10⁻⁶ Torr·s)
          </p>
          <p className="formula-expression">
            Langmuir Chemisorption Saturation: θ(L) = 1 - exp(-L / L₀)
          </p>
          <p className="formula-expression">
            Effective Growth Per Cycle: GPC_eff = GPC_max · (θ₁ · θ₂)
          </p>
          <p className="formula-expression">
            Film Thickness: T = N_cycles · GPC_eff
          </p>
          <p className="formula-expression">
            Cycle Period: t_cycle = t_pulse1 + t_purge1 + t_pulse2 + t_purge2
          </p>
          <p className="formula-expression">
            Total Deposition Time: t_total = N_cycles · t_cycle
          </p>
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
