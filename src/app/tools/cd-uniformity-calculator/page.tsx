
import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import CdUniformityCalculator from '@/tools/cd-uniformity-calculator/Calculator';
import { tool } from '@/tools/cd-uniformity-calculator';
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

export default function CdUniformityCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Mean Critical Dimension"
            math="\bar{x} = \frac{1}{N} \sum_{i=1}^{N} x_i"
          />
          <MathFormula
            block
            label="Sample Standard Deviation"
            math="s = \sqrt{\frac{1}{N - 1} \sum_{i=1}^{N} (x_i - \bar{x})^2}"
          />
          <MathFormula
            block
            label="Total Range Ratio"
            math="\frac{\text{Range}}{\text{Mean}} = \frac{x_{\max} - x_{\min}}{\bar{x}} \times 100\%"
          />
          <MathFormula
            block
            label="Half-Range Uniformity (3-Sigma)"
            math="U = \frac{x_{\max} - x_{\min}}{2\bar{x}} \times 100\%"
          />
<ul className="info-list">
            <li>
              <strong>Range</strong> — the distance from the smallest to the largest reading, the most direct measure of
              spread.
            </li>
            <li>
              <strong>Sigma</strong> — the spread expressed so that it can be combined with other statistics and used in
              capability work.
            </li>
            <li>
              <strong>Three sigma</strong> — three standard deviations, the common way a uniformity specification is
              written.
            </li>
          </ul>
        </>
      }
      notes={[
        'Three different numbers are called uniformity in the industry, and they are not equal: range over mean, half range over mean, and the coefficient of variation sigma over mean. All three are reported here, so you can match whichever convention your specification, supplier or customer uses instead of guessing from a single word.',
        'The standard deviation uses the n-1 divisor, the sample standard deviation. With a finite set of sites that is the honest choice; a denominator of n understates the spread that a fresh set of sites would show.',
        'With a single site the spread is not defined, so sigma, three sigma and the coefficient of variation are reported as blank rather than zero. A zero there would read as perfect uniformity when nothing was measured.',
        'Range-based uniformity is very sensitive to one bad site: a single out-of-family reading sets the max or the min and therefore the whole percentage. Check the min and max rows before quoting a range-based figure.',
        'All sites are weighted equally. If your measurement plan samples the centre more densely than the edge, the mean and sigma describe that plan rather than the wafer, so keep the sampling pattern fixed when you compare runs.',
      ]}
      faq={[
        {
          question: 'Why are there three different uniformity numbers?',
          answer:
            'Because the word uniformity is used for at least three different things. Range over mean is the spread between the extreme sites, half range over mean is the same spread written as a plus or minus figure, and the coefficient of variation is the standard deviation over the mean. They answer slightly different questions and give different percentages for the same data, so a specification that says uniformity without saying which one is ambiguous. This tool shows all three so the number you need is present.',
        },
        {
          question: 'Should I quote three sigma or the range?',
          answer:
            'Use three sigma when you are combining the spread with other statistics or feeding a capability calculation, because standard deviations add in quadrature and ranges do not. Use the range when you care about the worst site, since that is exactly what the range captures. Many specifications quote three sigma because it is stable with site count, while the range grows as you add sites and so depends on the measurement plan.',
        },
        {
          question: 'How many sites do I need for a meaningful uniformity number?',
          answer:
            'Enough that the plan samples the regions you care about, which for a wafer usually means centre, mid-radius and edge in several directions. The statistics themselves are defined from two sites up, but a spread from two or three sites is dominated by wherever those sites happened to land. Fix the site count and the pattern, then compare runs against each other.',
        },
        {
          question: 'What counts as one measurement?',
          answer:
            'One critical dimension reading at one site, in nanometres. Do not average several reads of the same site and enter them as separate sites, and do not mix sites from different wafers or layers in one list unless that mixed population is what you intend to describe. The tool has no way to tell where a number came from, so the list you paste defines the population.',
        },
      ]}
    >
      <CdUniformityCalculator />
    </ToolPageShell>
  );
}
