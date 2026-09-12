import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import ChemicalDilutionCalculator from '@/tools/chemical-dilution-calculator/Calculator';
import { tool } from '@/tools/chemical-dilution-calculator';
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

export default function ChemicalDilutionCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p className="formula-expression">
            Dilution Conservation: C₁ · V₁ = C₂ · V₂
          </p>
          <p className="formula-expression">
            Component Volume: Vᵢ = V_total · (Partsᵢ / Σ Parts)
          </p>
          <p className="formula-expression">
            Component Mass: Mᵢ = Vᵢ · ρᵢ
          </p>
          <p className="formula-expression">
            Active Chemical Concentration (wt%): C_eff = (Mᵢ · Assay%) / M_total
          </p>
          <ul className="info-list">
            <li>
              <strong>RCA SC-1 (Standard Clean 1)</strong> — NH₄OH : H₂O₂ : H₂O (typically 1 : 1 : 5 or 1 : 2 : 50) at 65–70 °C.
              Simultaneously oxidizes silicon and etches the formed oxide to dislodge sub-micron particulate contamination.
            </li>
            <li>
              <strong>RCA SC-2 (Standard Clean 2)</strong> — HCl : H₂O₂ : H₂O (1 : 1 : 6 or 1 : 1 : 50) at 70–75 °C.
              Forms soluble chloride complexes to remove alkali ions (Na⁺, K⁺) and heavy transition metals (Fe, Cu, Ni, Au).
            </li>
            <li>
              <strong>Piranha / SPM (Sulfuric Peroxide Mix)</strong> — H₂SO₄ : H₂O₂ (3:1 to 4:1) self-heating exothermic bath (&gt;100 °C).
              Generates aggressive peroxymonosulfuric acid (Caro’s acid, H₂SO₅) to vaporize organics and cross-linked photoresist.
            </li>
            <li>
              <strong>DHF / BOE (Buffered Oxide Etch)</strong> — Dilute HF (50:1 to 100:1) or NH₄F-buffered HF (6:1 BOE) for native oxide
              stripping (~30 Å/min for 50:1 DHF, ~850 Å/min for 6:1 BOE) leaving a hydrophobic Si–H terminated surface.
            </li>
          </ul>
        </>
      }
      notes={[
        'Always respect the fundamental lab rule: add acid to water (AAA: Always Add Acid), never add water to concentrated acid to prevent violent localized boiling and splashing.',
        'Piranha SPM solutions react explosively upon contact with flammable solvents (acetone, isopropyl alcohol, ethanol). Segregate wet bench drain channels completely.',
        'Hydrofluoric acid (HF) penetrates skin rapidly without immediate burn sensation and binds with systemic calcium and magnesium ions. Always verify calcium gluconate antidote gel is stocked before opening HF containers.',
        'Etch rates for thermal oxide vary based on bath temperature, agitation, and dissolved silicate loading. Doped oxides (BPSG, PSG, TEOS) etch up to 5× to 10× faster than thermal gate oxides.',
      ]}
      faq={[
        {
          question: 'What is the purpose of the classic RCA clean sequence?',
          answer:
            'Developed by Werner Kern at RCA Laboratories in 1965, the two-step RCA clean consists of SC-1 (alkaline peroxide for organic removal and particle detachment via zeta-potential repulsion) followed by SC-2 (acidic peroxide for transition metal ion dissolution). An intermediate dilute HF dip is often inserted to strip native oxide.',
        },
        {
          question: 'Why is ammonium fluoride added to HF in BOE (Buffered Oxide Etch)?',
          answer:
            'In pure dilute HF, fluoride ion concentration depletes quickly as SiO2 is etched, causing the etch rate to drop over time and causing severe photoresist edge-lifting. NH4F acts as a pH buffer, maintaining a constant supply of HF2- active etching species and steady etch rate throughout bath lifetime.',
        },
        {
          question: 'Why is dilute SC-1 (1:2:50) preferred over standard SC-1 (1:1:5) in advanced nodes?',
          answer:
            'Standard 1:1:5 SC-1 has a relatively high NH4OH concentration which etches bare silicon anisotropically, creating nanoscale surface microroughness and degrading gate oxide integrity (GOI). Dilute 1:2:50 delivers comparable particle removal efficiency (PRE) with near-zero surface roughening.',
        },
      ]}
    >
      <ChemicalDilutionCalculator />
    </ToolPageShell>
  );
}
