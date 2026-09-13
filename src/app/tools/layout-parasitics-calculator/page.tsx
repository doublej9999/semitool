import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import LayoutParasiticsCalculator from '@/tools/layout-parasitics-calculator/Calculator';
import { tool } from '@/tools/layout-parasitics-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function LayoutParasiticsCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Line resistance with linear TCR (temperature-corrected effective resistivity)"
            math="R = \frac{\rho_{eff}(T)\, L}{W \cdot t}, \quad \rho_{eff}(T) = \rho_{20} \left(1 + \frac{c_{size}}{W}\right)\left(1 + \alpha (T - 20\,°C)\right), \quad R_s = \frac{\rho_{eff}}{t}, \quad R = R_s \cdot \frac{L}{W}"
          />
          <MathFormula
            block
            label="Parallel-plate + fringe capacitance of an isolated line over one reference plane"
            math="C = k \, \varepsilon_0 \left( \frac{W \cdot L}{t} \; + \; 2\,(W + L)\, \ln\!\left(1 + \frac{2t}{s}\right) \right)"
          />
          <MathFormula
            block
            label="IR drop and single-pole RC delays"
            math="V_{drop} = I \cdot R, \quad t_{p,50\%} = 0.69\,R C \;(\ln 2), \quad t_{r,10\text{-}90\%} = 0.35\,R C \;(\ln 9)"
          />
        </>
      }
      notes={[
        'Resistance accuracy: ±10–20 % vs silicon. The effective resistivity (bulk + size/barrier penalty) is empirical — Cu is calibrated to ≈1.8 µΩ·cm for ≥1 µm lines and ≈2.2–2.7 µΩ·cm near 0.18 µm; bamboo grain structure, CMP dishing and barrier step coverage shift the real value fab-to-fab.',
        'Capacitance accuracy: the parallel-plate + logarithmic fringe model for an isolated line over one plane is typically within ±20–30 % of a 2-D/3-D field solver. It ignores the second side neighbour, top-metal crossovers, shielding and fill — run a field solver (StarRC / Raphael / Q3D) for extraction sign-off.',
        'Layer catalog values are literature-typical, not fab-specific: Cu 1.72 µΩ·cm bulk (TCR +0.0039/K), Al–0.5%Cu 2.65 µΩ·cm (TCR +0.0043/K), doped poly 10–20 Ω/□, salicided poly 2–8 Ω/□, SiO₂ k 3.9, SiCOH low-k 2.7, air gap 1.9. Substitute inline measured Rs and k when available.',
        'Poly entries are specified directly by sheet resistance; thickness is only used for the derived resistivity readout, not for R.',
        'The linear TCR model is valid from −55 °C to +175 °C; inputs outside this window are clamped and flagged with a warning.',
        'Worst-case design should also consider the +20 % IR-drop budget rule of thumb (supply droop + line drop) and temperature: copper at 125 °C carries ≈1.41× its 20 °C resistance.',
      ]}
      faq={[
        {
          question: 'Why is my calculated copper line resistance about twice the bulk-resistivity prediction?',
          answer:
            'Below roughly 0.5 µm width, two effects inflate the effective resistivity: electron scattering at grain boundaries and sidewalls (Fuchs–Sondheimer / Mayadas–Shatzkes size effects), and the Ta/TiN barrier liner that consumes part of the cross-section. The size-effect term ρ_eff = ρ_bulk·(1 + c/W) captures this: Cu bulk 1.72 µΩ·cm rises to ≈2.2–2.7 µΩ·cm near 0.18 µm. CMP dishing thins wide lines and adds further resistance not captured here.',
        },
        {
          question: 'What do the 0.69·R·C and 0.35·R·C factors mean?',
          answer:
            'For a single-pole RC network driven by a voltage step, the output crosses 50 % of its final value at t = ln(2)·R·C ≈ 0.69·R·C — the classic 50 % propagation delay. It reaches 90 % of the swing after ln(9)·R·C ≈ 2.2·R·C, so the 10–90 % rise time is 2.2·R·C − 0.105·R·C ≈ 0.35·R·C (Meares–Hymowitz convention). Both are reported so you can quote either delay convention.',
        },
        {
          question: 'How accurate is the fringe capacitance formula, and when do I need a field solver?',
          answer:
            'The ln(1 + 2t/s) perimeter term is the standard first-order fringe correction; for an isolated line over one plane it lands within ±20–30 % of a field solver. It fails for dense arrays (neighbour coupling on both sides, Miller effects), crossovers from upper layers, slotting/cheating rules and air-gap structures — any tapeout-critical extraction should use a 2.5-D/3-D solver with the actual process cross-section.',
        },
        {
          question: 'How much do low-k dielectrics and air gaps actually help?',
          answer:
            'Capacitance scales linearly with k in this model, so switching from SiO₂ (k 3.9) to SiCOH low-k (k 2.7) cuts line C — and with it the 0.69·R·C delay and coupling noise — by ≈31 %. Air gaps (k ≈ 1.9) buy a further ≈30 %, which is why they appear first on the tightest-pitch intermediate layers. Resistance is unaffected: the gain is purely capacitive.',
        },
      ]}
    >
      <LayoutParasiticsCalculator />
    </ToolPageShell>
  );
}
