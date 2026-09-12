
import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import FilmUniformityCalculator from '@/tools/film-uniformity-calculator/Calculator';
import { tool } from '@/tools/film-uniformity-calculator';
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

export default function FilmUniformityCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Sample Mean Thickness"
            math="\bar{x} = \frac{1}{n} \sum_{i=1}^{n} x_i"
          />
          <MathFormula
            block
            label="Total Thickness Range"
            math="\Delta x = x_{\max} - x_{\min}"
          />
          <MathFormula
            block
            label="Sample Standard Deviation"
            math="s = \sqrt{ \frac{1}{n - 1} \sum_{i=1}^{n} (x_i - \bar{x})^2 }"
          />
          <MathFormula
            block
            label="Half-Range Uniformity (Percent)"
            math="U = \frac{x_{\max} - x_{\min}}{2\bar{x}} \times 100\%"
          />
<ul className="info-list">
            <li>
              <strong>Mean</strong> — the average of the readings, and the reference the uniformity is quoted against.
            </li>
            <li>
              <strong>Range</strong> — the spread from the thinnest to the thickest site, which a single outlier widens.
            </li>
            <li>
              <strong>Sample sigma</strong> — the standard deviation using n minus one in the denominator, which
              describes the spread of the population the readings came from rather than of the readings themselves.
            </li>
          </ul>
        </>
      }
      notes={[
        'Three uniformity conventions are shown side by side because they disagree: range over mean, half range over mean and the coefficient of variation. A deposition spec that says plus or minus two percent is usually quoting half range over mean; a process-control chart is usually quoting three sigma. The tool never picks one for you.',
        'The sample sigma uses n minus one in the denominator, matching the usual process-control convention of estimating the population spread from a sample. With a single reading there is no spread to report, so the tool shows a dash rather than zero.',
        'The sigma here is a distribution width over the sites measured. It is not a map analysis: a film can have the same distribution width whether the thickness varies smoothly across the wafer or jumps about, and only a contour map or a site-by-site comparison tells those two apart.',
        'How many sites and where they sit drive what the number means. A nine-site across-wafer pattern and a hundred-and-twenty-one-site map can disagree on the same film, so the site count is always reported next to the uniformity.',
      ]}
      faq={[
        {
          question: 'Which uniformity number should I quote?',
          answer:
            'Whichever one your specification names, stated explicitly. The three conventions here differ in what they measure. Range over mean is the full spread, half range over mean is the plus or minus figure common in deposition specs, and the coefficient of variation is the sample sigma over the mean. Two engineers can compute all three from the same readings and get three different percentages, so a uniformity number without its convention is not a number.',
        },
        {
          question: 'Should I use three sigma or the range?',
          answer:
            'Three sigma for a statistically stable process and a sense of the distribution width; the range for a quick read of the worst case. The range is set by the two most extreme sites and moves a lot with a single outlier, while three sigma uses every reading. A spec written as a maximum spread is usually about the range; a control chart is usually about sigma.',
        },
        {
          question: 'How many sites do I need?',
          answer:
            'Enough to see the pattern you care about. A handful of sites gives a usable spread but will miss a localised thin spot; a full map resolves the pattern but takes far longer. The honest answer is that the number of sites is part of the measurement plan, and the tool reports the count so the number is never quoted without it.',
        },
        {
          question: 'Why does a single reading show a dash for sigma and not zero?',
          answer:
            'Because one reading carries no information about spread. Reporting zero would suggest a perfectly uniform film, which is not what a single sample shows. A dash says, correctly, that the spread is not known from one reading.',
        },
      ]}
    >
      <FilmUniformityCalculator />
    </ToolPageShell>
  );
}
