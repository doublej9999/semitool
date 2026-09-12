import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import WetBenchCalculator from '@/tools/wet-bench-calculator/Calculator';
import { tool } from '@/tools/wet-bench-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function WetBenchCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Wet Bench Chemical Spike Dosing Equation"
            math="V_{\text{spike}} = V_{\text{bath}} \cdot \frac{C_{\text{target}} - C_{\text{current}}}{C_{\text{source}} - C_{\text{target}}}"
          />
          <MathFormula
            block
            label="Dissolved Mass Loading Etch Rate Decay Equation"
            math="\text{ER} = \text{ER}_0 \cdot \max\left(0,\, 1 - \left[\frac{L_{\text{dissolved}}}{L_{\text{max}}}\right]^{1.5}\right)"
          />
          <MathFormula
            block
            label="Water Vapor Pressure & Evaporation Rate (Antoine Law)"
            math="\log_{10} P_{\text{sat}}[\text{mmHg}] = 8.07131 - \frac{1730.63}{T[^\circ\text{C}] + 233.426}, \quad \dot{m}_{\text{evap}} = k_{\text{c}} \cdot (P_{\text{sat}} - P_{\text{amb}})"
          />
          <MathFormula
            block
            label="RCA SC-1 Particle Removal Efficiency & Surface Roughness"
            math="\text{PRE} = 1 - \frac{N_{\text{post}}}{N_{\text{pre}}}, \quad \Delta R_a \propto \left(\frac{[\text{NH}_4\text{OH}]}{[\text{H}_2\text{O}_2]}\right) \cdot \exp\left(\frac{T - 65}{25}\right) \sqrt{\frac{5}{R_{\text{DI}}}}"
          />
          <ul className="info-list">
            <li>
              <strong>Chemical Spike Replenishment</strong> — Rather than prematurely draining tens of liters of expensive ultra-pure chemicals, automated spike dosing injects precise concentrated chemical aliquots (V_spike) to compensate for volatile evaporation (such as NH₃ and HCl) and catalytic peroxide breakdown (H₂O₂).
            </li>
            <li>
              <strong>Mass Loading Suppression</strong> — As oxide and silicon wafers are etched, dissolved silicate [SiO₂(OH)₂]²⁻ or fluorosilicate [SiF₆]²⁻ reaction products accumulate. At high saturation (&gt; 85%), chemical equilibrium throttles forward etch kinetics via a 1.5-power decay exponent and triggers particle re-precipitation.
            </li>
            <li>
              <strong>Antoine Vapor Loss</strong> — Elevated bath temperatures dramatically increase water vaporization. Without concurrent DI water makeup, volatile components concentrate or dry out, creating dangerous acid shifts and non-uniform boundary layer etching.
            </li>
          </ul>
        </>
      }
      notes={[
        'The spike dosing equation assumes ideal volumetric solution mixing. For highly exothermic mixtures (such as SPM sulfuric acid spiking), metered slow injection under continuous cooling recirculation is required to prevent thermal runaway.',
        'Dissolved mass loading limits vary with bath chemistry: standard BOE can carry up to 20–25 g/L of dissolved oxide due to ammonium fluoride buffering, whereas unbuffered dilute HF degrades rapidly above 4–6 g/L.',
        'Production wet benches utilize automated near-infrared (NIR) spectroscopy, sonic velocity sensors, or conductivity meters to trigger automated closed-loop spike replenishment.',
        'A chemical bath must be fully retired whenever either the maximum run hours limit or the loading saturation capacity threshold is exceeded, regardless of spike status.',
      ]}
      faq={[
        {
          question: 'What is chemical spiking in a semiconductor wet bench, and why is it used?',
          answer:
            'Chemical spiking is the controlled replenishment of active chemical reagents (such as NH4OH, H2O2, HF, or HCl) into a recirculating wet bench tank without performing a complete bath dump. Because active components decompose or evaporate faster than water over hours of operation, spiking restores process etch rates and pH to specification, reducing fab chemical consumption, hazardous waste treatment volumes, and tool downtime.',
        },
        {
          question: 'How does dissolved silicon/oxide loading degrade etch performance?',
          answer:
            'When silicon wafers or dielectric films are processed, dissolved silicon products accumulate in the solution (e.g. hexafluorosilicate ions [SiF6]2- in HF/BOE solutions). As the dissolved mass loading approaches the solubility saturation limit (Lmax), the chemical driving force drops, reducing the effective etch rate according to ER = ER0 · (1 - [L / Lmax]^1.5). Near saturation (>85%), micro-particulates precipitate back onto wafer surfaces, causing defect yield loss.',
        },
        {
          question: 'Why does SC-1 (Standard Clean 1) clean require megasonics and tight temperature control?',
          answer:
            'SC-1 (NH4OH:H2O2:H2O) removes sub-micron particles through a dual mechanism: H2O2 oxidizes the silicon surface while NH4OH simultaneously dissolves the oxide, creating a slight "under-etching" that lifts off particles. High pH (>10) imparts negative zeta potentials to both wafers and particles, causing electrostatic repulsion. Megasonic acoustic streaming (0.8–2.0 MHz) provides the physical force needed to dislodge sub-50nm particles without cavitation pit damage. However, temperatures above 70°C cause rapid ammonia off-gassing and peroxide decomposition, while excessive NH4OH aggressively increases surface micro-roughness (Ra).',
        },
        {
          question: 'What are the primary hazards associated with SPM Piranha spiking?',
          answer:
            'SPM (Sulfuric Peroxide Mixture / Piranha) operates at high temperatures (100°C to 135°C). Mixing 30% H2O2 with concentrated 96% H2SO4 generates Caro\'s acid (H2SO5) via a severely exothermic reaction (ΔH = -88 kJ/mol). Adding H2O2 spikes too rapidly or introducing wafers with excessive organic photoresist load can provoke instantaneous steam explosions, acid boiling, and violent thermal runaway.',
        },
        {
          question: 'How does BOE (Buffered Oxide Etch) differ from dilute HF (dHF)?',
          answer:
            'Dilute HF (e.g. 50:1 or 100:1) rapidly consumes HF molecules during SiO2 dissolution, leading to steep etch rate degradation over time and across large wafer batches. BOE combines ammonium fluoride (NH4F 40%) with HF (49%) in ratios such as 6:1 or 10:1. The NH4F acts as a pH and fluoride buffer that continuously dissociates to replenish active HF2- etching species, maintaining a stable, reproducible oxide etch rate across extended bath lifetimes.',
        },
      ]}
    >
      <WetBenchCalculator />
    </ToolPageShell>
  );
}
