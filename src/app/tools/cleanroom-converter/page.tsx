import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import CleanroomCalculator from '@/tools/cleanroom-converter/Calculator';
import { tool } from '@/tools/cleanroom-converter';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
  keywords: tool.keywords,
  alternates: { canonical: tool.path },
  openGraph: {
    title: `${tool.name} — SemiTools`,
    description: tool.description,
    url: absoluteUrl(tool.path),
    type: 'website',
  },
};

export default function CleanroomConverterPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="ISO 14644-1 Airborne Particle Limit"
            math="C_n = 10^N \left( \frac{0.1\,\mu\text{m}}{D} \right)^{2.08}"
          />
          <MathFormula
            block
            label="Required Airflow Rate (ACH)"
            math="Q = V_{\text{room}} \times \text{ACH} \quad [\text{m}^3/\text{h}]"
          />
<ul className="info-list">
            <li>
              <strong>C_n</strong> — Maximum permitted airborne particle concentration (particles/m³) for particles equal to or larger than diameter D.
            </li>
            <li>
              <strong>N</strong> — ISO 14644-1 classification number (ISO Class 1 through Class 9).
            </li>
            <li>
              <strong>D</strong> — Threshold particle size in micrometres (µm).
            </li>
            <li>
              <strong>ACH</strong> — Air changes per hour required to maintain the desired particulate cleanliness class.
            </li>
            <li>
              <strong>Q</strong> — Total supply airflow required (m³/h or CFM).
            </li>
          </ul>
        </>
      }
      notes={[
        'ISO 14644-1 specifies particle count limits per cubic metre. The historical US Federal Standard 209E defined classes based on particles ≥ 0.5 µm per cubic foot (e.g. Class 100 corresponds to 100 particles/ft³, equivalent to ISO Class 5).',
        'Recommended Air Changes per Hour (ACH) and ceiling FFU coverage ranges are engineering guidelines based on IEST-RP-CC012. Cleanrooms with heavy personnel traffic or high-particle machinery may require higher airflow.',
        'Unidirectional (laminar) airflow is typically required for ISO Class 1 to Class 5 to sweep particles straight down into raised perforated floors. ISO 6 to 8 typically use mixed non-unidirectional turbulent airflow.',
      ]}
      faq={[
        {
          question: 'What is the relationship between ISO classes and US FED-STD-209E?',
          answer:
            'FED-STD-209E was officially cancelled in 2001 in favor of ISO 14644-1, but terms like Class 1, Class 10, Class 100, and Class 10,000 remain widely used in semiconductor foundries. ISO 3 corresponds to Class 1, ISO 4 to Class 10, ISO 5 to Class 100, ISO 6 to Class 1,000, ISO 7 to Class 10,000, and ISO 8 to Class 100,000.',
        },
        {
          question: 'How many Fan Filter Units (FFUs) are needed for a semiconductor bay?',
          answer:
            'The number of FFUs depends on room volume, target ACH, and individual FFU capacity (typically 650-750 CFM for a standard 2×4 ft unit). For ISO 5 / Class 100 photolithography areas, 60% to 70% ceiling coverage is standard; for ISO 3 / Class 1 sub-fab zones, 100% ULPA ceiling coverage is utilized.',
        },
      ]}
    >
      <CleanroomCalculator />
    </ToolPageShell>
  );
}
