import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import CuPlatingCalculator from '@/tools/cu-plating-calculator/Calculator';
import { tool } from '@/tools/cu-plating-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/cu-plating-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function CuPlatingCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg("Faraday's Law of Electrochemical Deposition"), math: 'R_{dep} = \\frac{J \\cdot M_{Cu} \\cdot \\eta}{z \\cdot F \\cdot \\rho_{Cu}}' },
        { kind: 'math', label: msg('Total Electrodeposited Copper Mass'), math: 'm = \\frac{Q \\cdot M_{Cu} \\cdot \\eta}{z \\cdot F} = \\frac{\\int I(t) dt \\cdot M_{Cu} \\cdot \\eta}{z \\cdot F}' },
        { kind: 'math', label: msg('Curvature Enhanced Accelerator Coverage (CEAC) Superfilling'), math: '\\frac{d\\theta_{acc}}{dt} = k_{ads} C_{acc} (1 - \\theta_{acc}) + \\theta_{acc} \\cdot v \\cdot \\kappa' },
      ]}
      notes={[
        msg('Faraday constant F = 96,485.3 C/mol, copper atomic weight M_Cu = 63.546 g/mol, Cu2+ valence z = 2, and copper density ρ = 8.96 g/cm³.'),
        msg('The wafer seed layer terminal effect causes a non-uniform radial current density distribution (higher at wafer bevel/edge, lower at center) when seed sheet resistance exceeds 1 Ω/□ on 300 mm wafers.'),
        msg('Bottom-up superfilling (void-free fill) requires balanced organic additives: SPS (accelerator) segregates at the shrinking concave trench bottom while PEG (suppressor) blocks the flat field.'),
      ]}
      faq={[
        {
          question: msg('What is the seed layer terminal effect in 300 mm copper electroplating?'),
          answer:
            msg('When electrical contact is made at the wafer perimeter edge, the thin copper seed layer acts as a series resistance. The resulting voltage drop causes lower cathodic overpotential at the wafer center compared to the wafer edge, causing edge-thick radial non-uniformity without multi-zone dynamic anodes.'),
        },
        {
          question: msg('How do organic additives prevent keyhole voids in Dual Damascene trenches?'),
          answer:
            msg('Three additives work in synergy: Suppressors (PEG) rapidly adsorb on planar field regions with Cl- co-ions to block deposition; Accelerators (SPS/MPS) displace suppressors and concentrate at concave trench corners as surface area shrinks; Levelers (JGB/diazine dyes) selectively diffuse to high-convection protruding corners to stop premature pinch-off.'),
        },
        {
          question: msg('What is the acceptable current density window for semiconductor copper interconnects?'),
          answer:
            msg('Industry fab recipes typically apply a low current density step (5 - 10 mA/cm²) for feature bottom-up nucleation followed by a higher current density step (20 - 35 mA/cm²) for bulk overburden deposition. Currents above 50 mA/cm² risk copper dendritic burning and hydrogen gas pinholes.'),
        },
      ]}
    >
      <CuPlatingCalculator />
    </ToolPageShell>
  );
}
