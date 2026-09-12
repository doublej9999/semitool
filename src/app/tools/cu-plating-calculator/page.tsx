import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import CuPlatingCalculator from '@/tools/cu-plating-calculator/Calculator';
import { tool } from '@/tools/cu-plating-calculator';
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

export default function CuPlatingCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Faraday's Law of Electrochemical Deposition"
            math="R_{dep} = \frac{J \cdot M_{Cu} \cdot \eta}{z \cdot F \cdot \rho_{Cu}}"
          />
          <MathFormula
            block
            label="Total Electrodeposited Copper Mass"
            math="m = \frac{Q \cdot M_{Cu} \cdot \eta}{z \cdot F} = \frac{\int I(t) dt \cdot M_{Cu} \cdot \eta}{z \cdot F}"
          />
          <MathFormula
            block
            label="Curvature Enhanced Accelerator Coverage (CEAC) Superfilling"
            math="\frac{d\theta_{acc}}{dt} = k_{ads} C_{acc} (1 - \theta_{acc}) + \theta_{acc} \cdot v \cdot \kappa"
          />
        </>
      }
      notes={[
        'Faraday constant F = 96,485.3 C/mol, copper atomic weight M_Cu = 63.546 g/mol, Cu2+ valence z = 2, and copper density ρ = 8.96 g/cm³.',
        'The wafer seed layer terminal effect causes a non-uniform radial current density distribution (higher at wafer bevel/edge, lower at center) when seed sheet resistance exceeds 1 Ω/□ on 300 mm wafers.',
        'Bottom-up superfilling (void-free fill) requires balanced organic additives: SPS (accelerator) segregates at the shrinking concave trench bottom while PEG (suppressor) blocks the flat field.',
      ]}
      faq={[
        {
          question: 'What is the seed layer terminal effect in 300 mm copper electroplating?',
          answer:
            'When electrical contact is made at the wafer perimeter edge, the thin copper seed layer acts as a series resistance. The resulting voltage drop causes lower cathodic overpotential at the wafer center compared to the wafer edge, causing edge-thick radial non-uniformity without multi-zone dynamic anodes.',
        },
        {
          question: 'How do organic additives prevent keyhole voids in Dual Damascene trenches?',
          answer:
            'Three additives work in synergy: Suppressors (PEG) rapidly adsorb on planar field regions with Cl- co-ions to block deposition; Accelerators (SPS/MPS) displace suppressors and concentrate at concave trench corners as surface area shrinks; Levelers (JGB/diazine dyes) selectively diffuse to high-convection protruding corners to stop premature pinch-off.',
        },
        {
          question: 'What is the acceptable current density window for semiconductor copper interconnects?',
          answer:
            'Industry fab recipes typically apply a low current density step (5 - 10 mA/cm²) for feature bottom-up nucleation followed by a higher current density step (20 - 35 mA/cm²) for bulk overburden deposition. Currents above 50 mA/cm² risk copper dendritic burning and hydrogen gas pinholes.',
        },
      ]}
    >
      <CuPlatingCalculator />
    </ToolPageShell>
  );
}
