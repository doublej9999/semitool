import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import ChipThermalCalculator from '@/tools/thermal-resistance-calculator/Calculator';
import { tool } from '@/tools/thermal-resistance-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function ThermalResistanceCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Total Thermal Resistance Junction-to-Ambient"
            math="\theta_{JA} = \theta_{JC} + \theta_{CS} + \theta_{SA}"
          />
          <MathFormula
            block
            label="Semiconductor Junction Temperature"
            math="T_J = T_A + P_{\text{dissipated}} \times \theta_{JA}"
          />
          <MathFormula
            block
            label="Case Surface Temperature"
            math="T_C = T_J - P_{\text{dissipated}} \times \theta_{JC}"
          />
          <MathFormula
            block
            label="Heatsink Thermal Dissipation Limit"
            math="\theta_{SA,\max} = \frac{T_{J,\max} - T_{A,\max}}{P_{\text{dissipated}}} - (\theta_{JC} + \theta_{CS})"
          />
          <MathFormula
            block
            label="Maximum Allowable Power Dissipation"
            math="P_{\max} = \frac{T_{J,\max} - T_A}{\theta_{JA}}"
          />
<ul className="info-list">
            <li>
              <strong>Tj</strong> — Junction temperature at the active silicon hot spot (&deg;C).
            </li>
            <li>
              <strong>Ta</strong> — Ambient cooling air or fluid reference temperature (&deg;C).
            </li>
            <li>
              <strong>P</strong> — Total electrical heat dissipation dissipated by the integrated circuit (Watts).
            </li>
            <li>
              <strong>&theta;JC (theta_JC)</strong> — Junction-to-case thermal resistance through silicon substrate and packaging lid/mold (&deg;C/W).
            </li>
            <li>
              <strong>&theta;TIM (theta_TIM)</strong> — Thermal Interface Material resistance, determined by Bond Line Thickness (BLT), thermal conductivity (k), and die surface area (&deg;C/W).
            </li>
            <li>
              <strong>&theta;SA (theta_SA)</strong> — Heat sink-to-ambient resistance determined by heatsink geometry, fin design, and airflow velocity (&deg;C/W).
            </li>
            <li>
              <strong>P_max &amp; Margin</strong> — Maximum sustainable power dissipation before exceeding Tj,max, and temperature difference headroom (Tj,max - Tj).
            </li>
          </ul>
        </>
      }
      notes={[
        'This calculator solves a 1D linear lumped-parameter thermal resistance network under steady-state conditions. In real silicon devices, localized power hot spots, transient thermal capacitance (Cth), and 3D heat spreading in the heat spreader add non-uniform temperature profiles.',
        'TIM bond line thickness (BLT) depends heavily on mounting clamp pressure, package warpage, and surface flatness/roughness. Typical thermal grease ranges from 30 µm to 75 µm under 30–50 psi clamping pressure.',
        'Thermal interface material contact resistance (Kapitza resistance) at the microscopic grease-metal boundary is incorporated into effective bulk TIM thermal conductivity values in typical engineering estimates.',
        'When evaluating bare packages on printed circuit boards (such as exposed pad QFNs without an external heatsink), theta_SA represents the PCB board-to-ambient convection and radiation path (theta_BA or theta_JA).',
        'Always ensure silicon junction temperatures remain below Tj,max derating thresholds (typically 85°C to 105°C for commercial/datacenter ICs, or 125°C for automotive AEC-Q100 Grade 1) to avoid electromigration and gate oxide degradation.',
      ]}
      faq={[
        {
          question: 'What is the physical meaning of θJA, θJC, and θSA?',
          answer:
            'θ (theta) represents thermal resistance in degrees Celsius per Watt (°C/W), directly analogous to electrical resistance R in Ohm\'s law (ΔT = P × θ vs ΔV = I × R). θJC is the internal package resistance between the hot silicon junction and the package case or integrated heat spreader (IHS). θTIM is the resistance of the thermal paste or phase change pad bridging the package and heatsink. θSA is the heatsink resistance dissipating heat into ambient air via convection and radiation. θJA is the total series resistance from junction to ambient air.',
        },
        {
          question: 'How do die size and TIM thickness affect cooling performance?',
          answer:
            'The thermal resistance of the TIM layer is directly proportional to its thickness (BLT) and inversely proportional to die contact area and thermal conductivity (θTIM = BLT / [k × Area]). A larger die spreads heat over a wider surface, sharply reducing the TIM bottleneck. Conversely, a thick bond line or low-conductivity thermal grease creates a steep temperature drop between the chip lid and the heatsink base.',
        },
        {
          question: 'What is the difference between flip-chip FCBGA and wire-bonded packages?',
          answer:
            'In flip-chip BGA (FCBGA), the active circuit surface is bonded directly to the substrate via solder bumps, and the backside of the silicon die is in direct contact with an integrated copper heat spreader (IHS) via a high-conductivity lid TIM (TIM1). This yields exceptionally low θJC (typically 0.2 to 0.5 °C/W). In standard wire-bonded plastic overmolded packages, heat must conduct through epoxy mold compound, leadframes, or wire bonds, resulting in much higher θJC (1 to 20 °C/W).',
        },
        {
          question: 'How do I handle zero TIM or direct PCB thermal pads (like QFNs)?',
          answer:
            'For packages like exposed-pad QFNs soldered directly onto PCB thermal vias, set BLT to 0 µm (or select the Direct Contact / Zero TIM preset). In this configuration, θTIM drops to 0, and θSA represents the combined thermal resistance of the PCB thermal vias and board-to-ambient convection.',
        },
        {
          question: 'What happens when Tj exceeds Tj_max?',
          answer:
            'When Tj exceeds the safe maximum junction temperature (Tj_max), device reliability deteriorates exponentially according to the Arrhenius relation. Failure mechanisms including electromigration, gate dielectric breakdown (TDDB), and hot carrier injection accelerate rapidly. Modern microprocessors and power ICs will throttle clock frequency, drop supply voltage, or execute thermal shutdown (PROCHOT) to prevent permanent destruction.',
        },
      ]}
    >
      <ChipThermalCalculator />
    </ToolPageShell>
  );
}
