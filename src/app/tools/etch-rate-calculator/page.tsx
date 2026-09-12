
import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import EtchRateCalculator from '@/tools/etch-rate-calculator/Calculator';
import { tool } from '@/tools/etch-rate-calculator';
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

export default function EtchRateCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Film Etch Rate"
            math="\text{ER} = \frac{d_{\text{pre}} - d_{\text{post}}}{t}"
          />
          <MathFormula
            block
            label="Etch Selectivity Ratio"
            math="S = \frac{\text{ER}_{\text{target}}}{\text{ER}_{\text{mask}}}"
          />
          <MathFormula
            block
            label="Overetch Percentage"
            math="\text{OE}\% = \frac{t_{\text{actual}} - t_{\text{nominal}}}{t_{\text{nominal}}} \times 100\%"
          />
<ul className="info-list">
            <li>
              <strong>Etch rate</strong> — the average removal speed over the etch, quoted in nanometres per minute. It is
              a single number for a process that usually slows or speeds across the wafer.
            </li>
            <li>
              <strong>Selectivity</strong> — how many times faster the film etches than the layer protecting it. A
              larger number means the mask survives longer.
            </li>
            <li>
              <strong>Overetch</strong> — how much time beyond the nominal stop point the wafer received, as a
              percentage. It is the margin that covers non-uniformity, not a process target on its own.
            </li>
          </ul>
        </>
      }
      notes={[
        'The rate is computed from the thickness removed and the time, so it is an average over the whole step. If the etch dwells or slows, a single number from the start and end thickness hides that.',
        'Selectivity is a ratio measured under one set of conditions. It moves with pressure, power, temperature, loading and the mask material, so a figure taken from another recipe is a starting point, not a result.',
        'A mask loss of zero would give an infinite selectivity. The tool treats a blank or zero mask loss as not measured, so the row is omitted instead of printing an infinity.',
        'The before and after thickness must come from the same point on the same wafer and the same metrology tool. Mixing a pre-etch measurement from one site with a post-etch measurement from another folds the non-uniformity into the rate.',
        'Overetch is shown only when a nominal time is given. It is the fraction of extra time the wafer saw, which is what sets how much of the mask and the underlayer the overrun consumes.',
      ]}
      faq={[
        {
          question: 'What is a normal etch rate?',
          answer:
            'There is no single normal value. Rates run from a few nanometres per minute for a slow atomic-layer step to several microns per minute for a deep silicon etch, and they depend on the material, the chemistry and the tool. That is why the tool takes thickness and time and reports the rate for your measurement rather than offering a table of typical numbers that would not match your process.',
        },
        {
          question: 'How is selectivity defined and why does it matter?',
          answer:
            'Selectivity is the film removed divided by the masking layer removed over the same time, so it says how many times faster the film etches than the layer protecting it. It matters because it sets how thin the mask can be for a given film thickness. A selectivity of ten means the mask needs to be only a tenth of the film thickness for the same removal, before any margin.',
        },
        {
          question: 'Why does the tool ignore a mask loss of zero?',
          answer:
            'Dividing by zero gives an infinite selectivity, which is not a number anyone can use. A zero or blank mask loss almost always means the layer was not measured rather than that nothing was removed, so the tool treats it as no measurement and omits the selectivity and mask rate rows instead of printing a value that looks precise but is not.',
        },
        {
          question: 'What is overetch and how much should I use?',
          answer:
            'Overetch is the extra time beyond the nominal stop point, expressed as a percentage of that nominal time. It exists to make sure the slowest point on the wafer still clears the film, so it is driven by how non-uniform the etch is. The tool reports the overetch for the time you entered; the amount to design in comes from your uniformity data, not from a fixed rule.',
        },
      ]}
    >
      <EtchRateCalculator />
    </ToolPageShell>
  );
}
