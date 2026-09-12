
import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import YieldDppmCalculator from '@/tools/yield-dppm-calculator/Calculator';
import { tool } from '@/tools/yield-dppm-calculator';
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

export default function YieldDppmCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Defective Parts per Million (DPPM)"
            math="\text{DPPM} = (1 - Y_{\text{fraction}}) \times 10^6"
          />
          <MathFormula
            block
            label="Defective Parts per Billion (DPB)"
            math="\text{DPB} = (1 - Y_{\text{fraction}}) \times 10^9"
          />
          <MathFormula
            block
            label="Standard Normal Equivalent Deviate (Z-Score)"
            math="Z = \Phi^{-1}(Y_{\text{fraction}})"
          />
          <MathFormula
            block
            label="Equivalent Process Capability Index"
            math="C_{pk} \approx \frac{Z}{3}"
          />
<ul className="info-list">
            <li>
              <strong>Yield and DPPM</strong> — the same statement in two units, so a 99% yield is 10,000 DPPM.
            </li>
            <li>
              <strong>DPB</strong> — parts per billion, for the very low defect rates where DPPM runs out of resolution.
            </li>
            <li>
              <strong>Sigma</strong> — the one-sided normal z that would give that defect fraction, so 3 sigma is 1350
              DPPM.
            </li>
            <li>
              <strong>Cpk equivalent</strong> — sigma / 3, the process capability index that would produce the same
              one-sided rate if the distribution were normal and centred at the target.
            </li>
          </ul>
        </>
      }
      notes={[
        'Yield to DPPM is exact arithmetic and needs no model. The sigma and Cpk columns do assume a normal distribution, so they are an equivalent figure rather than a measurement: a yield of 99.865% is 3 sigma only in that sense.',
        'The conversion treats each failing unit as a distinct defect event. When a single defect kills several die, yield-derived DPPM and defect-density-derived DPPM diverge, which is exactly the gap a yield model such as Poisson or Murphy exists to describe.',
        'The tool converts a figure you already have; the process capability calculator goes the other way, from a specification and a distribution to the out-of-spec rate. Use this one when the yield is given and you need the DPPM or the sigma, and the capability tool when the process parameters are given.',
        'A yield of exactly 100% has no finite sigma equivalent, because the z that gives zero defects is infinite. The tool reports the DPPM as 0 and leaves the sigma blank rather than printing a large finite number.',
        'The normal-equivalent sigma is not a defect-density sigma and not a six-sigma programme claim; it is a translation of one number into another scale, and the page says so to keep the two from being confused.',
      ]}
      faq={[
        {
          question: 'How many DPPM is a 99% yield?',
          answer: '10,000 DPPM. A 99% yield means 1% fail, and 1% of a million is 10,000. The pairs worth remembering are 99.9% for 1000 DPPM, 99.865% for 1350 DPPM and 99% for 10,000 DPPM.',
        },
        {
          question: 'What is 3 sigma in DPPM?',
          answer: '1350 DPPM, which is a yield of 99.865%. The tail beyond 3 sigma is 0.135% one-sided. A common trap is quoting 3.4 DPPM as six sigma, which is a one-sided shifted figure and not the same convention; this tool uses the unshifted one-sided normal.',
        },
        {
          question: 'What is the difference between DPPM and DPB?',
          answer: 'DPPM is parts per million and DPB is parts per billion, a factor of a thousand. DPB is convenient when the defect rate is very low, because 1 DPPM is 1000 DPB and a rate like 0.3 DPPM reads more cleanly as 300 DPB.',
        },
        {
          question: 'Why does a 100% yield have no sigma value?',
          answer: 'Because the z for zero defects is infinite. Any finite sigma leaves a finite tail, so a perfect yield cannot be expressed on that scale. The tool reports 0 DPPM and leaves the sigma and Cpk fields blank rather than inventing a number.',
        },
      ]}
    >
      <YieldDppmCalculator />
    </ToolPageShell>
  );
}
