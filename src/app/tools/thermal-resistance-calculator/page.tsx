import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import ChipThermalCalculator from '@/tools/thermal-resistance-calculator/Calculator';
import { tool } from '@/tools/thermal-resistance-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/thermal-resistance-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function ThermalResistanceCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Total Thermal Resistance Junction-to-Ambient'), math: '\\theta_{JA} = \\theta_{JC} + \\theta_{CS} + \\theta_{SA}' },
        { kind: 'math', label: msg('Semiconductor Junction Temperature'), math: 'T_J = T_A + P_{\\text{dissipated}} \\times \\theta_{JA}' },
        { kind: 'math', label: msg('Case Surface Temperature'), math: 'T_C = T_J - P_{\\text{dissipated}} \\times \\theta_{JC}' },
        { kind: 'math', label: msg('Heatsink Thermal Dissipation Limit'), math: '\\theta_{SA,\\max} = \\frac{T_{J,\\max} - T_{A,\\max}}{P_{\\text{dissipated}}} - (\\theta_{JC} + \\theta_{CS})' },
        { kind: 'math', label: msg('Maximum Allowable Power Dissipation'), math: 'P_{\\max} = \\frac{T_{J,\\max} - T_A}{\\theta_{JA}}' },
        { kind: 'list', items: [msg('**Tj** — Junction temperature at the active silicon hot spot (°C).'), msg('**Ta** — Ambient cooling air or fluid reference temperature (°C).'), msg('**P** — Total electrical heat dissipation dissipated by the integrated circuit (Watts).'), msg('**θJC (theta_JC)** — Junction-to-case thermal resistance through silicon substrate and packaging lid/mold (°C/W).'), msg('**θTIM (theta_TIM)** — Thermal Interface Material resistance, determined by Bond Line Thickness (BLT), thermal conductivity (k), and die surface area (°C/W).'), msg('**θSA (theta_SA)** — Heat sink-to-ambient resistance determined by heatsink geometry, fin design, and airflow velocity (°C/W).'), msg('**P_max & Margin** — Maximum sustainable power dissipation before exceeding Tj,max, and temperature difference headroom (Tj,max - Tj).')] },
      ]}
      notes={[
        msg('This calculator solves a 1D linear lumped-parameter thermal resistance network under steady-state conditions. In real silicon devices, localized power hot spots, transient thermal capacitance (Cth), and 3D heat spreading in the heat spreader add non-uniform temperature profiles.'),
        msg('TIM bond line thickness (BLT) depends heavily on mounting clamp pressure, package warpage, and surface flatness/roughness. Typical thermal grease ranges from 30 µm to 75 µm under 30–50 psi clamping pressure.'),
        msg('Thermal interface material contact resistance (Kapitza resistance) at the microscopic grease-metal boundary is incorporated into effective bulk TIM thermal conductivity values in typical engineering estimates.'),
        msg('When evaluating bare packages on printed circuit boards (such as exposed pad QFNs without an external heatsink), theta_SA represents the PCB board-to-ambient convection and radiation path (theta_BA or theta_JA).'),
        msg('Always ensure silicon junction temperatures remain below Tj,max derating thresholds (typically 85°C to 105°C for commercial/datacenter ICs, or 125°C for automotive AEC-Q100 Grade 1) to avoid electromigration and gate oxide degradation.'),
      ]}
      faq={[
        {
          question: msg('What is the physical meaning of θJA, θJC, and θSA?'),
          answer:
            msg('θ (theta) represents thermal resistance in degrees Celsius per Watt (°C/W), directly analogous to electrical resistance R in Ohm\'s law (ΔT = P × θ vs ΔV = I × R). θJC is the internal package resistance between the hot silicon junction and the package case or integrated heat spreader (IHS). θTIM is the resistance of the thermal paste or phase change pad bridging the package and heatsink. θSA is the heatsink resistance dissipating heat into ambient air via convection and radiation. θJA is the total series resistance from junction to ambient air.'),
        },
        {
          question: msg('How do die size and TIM thickness affect cooling performance?'),
          answer:
            msg('The thermal resistance of the TIM layer is directly proportional to its thickness (BLT) and inversely proportional to die contact area and thermal conductivity (θTIM = BLT / [k × Area]). A larger die spreads heat over a wider surface, sharply reducing the TIM bottleneck. Conversely, a thick bond line or low-conductivity thermal grease creates a steep temperature drop between the chip lid and the heatsink base.'),
        },
        {
          question: msg('What is the difference between flip-chip FCBGA and wire-bonded packages?'),
          answer:
            msg('In flip-chip BGA (FCBGA), the active circuit surface is bonded directly to the substrate via solder bumps, and the backside of the silicon die is in direct contact with an integrated copper heat spreader (IHS) via a high-conductivity lid TIM (TIM1). This yields exceptionally low θJC (typically 0.2 to 0.5 °C/W). In standard wire-bonded plastic overmolded packages, heat must conduct through epoxy mold compound, leadframes, or wire bonds, resulting in much higher θJC (1 to 20 °C/W).'),
        },
        {
          question: msg('How do I handle zero TIM or direct PCB thermal pads (like QFNs)?'),
          answer:
            msg('For packages like exposed-pad QFNs soldered directly onto PCB thermal vias, set BLT to 0 µm (or select the Direct Contact / Zero TIM preset). In this configuration, θTIM drops to 0, and θSA represents the combined thermal resistance of the PCB thermal vias and board-to-ambient convection.'),
        },
        {
          question: msg('What happens when Tj exceeds Tj_max?'),
          answer:
            msg('When Tj exceeds the safe maximum junction temperature (Tj_max), device reliability deteriorates exponentially according to the Arrhenius relation. Failure mechanisms including electromigration, gate dielectric breakdown (TDDB), and hot carrier injection accelerate rapidly. Modern microprocessors and power ICs will throttle clock frequency, drop supply voltage, or execute thermal shutdown (PROCHOT) to prevent permanent destruction.'),
        },
      ]}
    >
      <ChipThermalCalculator />
    </ToolPageShell>
  );
}
