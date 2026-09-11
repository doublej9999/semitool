import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import WaferAreaCalculator from '@/tools/wafer-area-calculator/Calculator';
import { tool } from '@/tools/wafer-area-calculator';
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

export default function WaferAreaCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p className="formula-expression">Wafer area = pi x (diameter / 2)^2</p>
          <p className="formula-expression">Usable area = pi x (diameter / 2 - edge exclusion)^2</p>
          <p className="formula-expression">Die area = die width x die height</p>
          <p className="formula-expression">Area-only die count = floor(usable area / die area)</p>
          <p className="formula-expression">Edge exclusion loss = 1 - (usable area / wafer area)</p>
          <ul className="info-list">
            <li>
              <strong>Edge exclusion</strong> — the ring at the wafer rim that is not used for product, removed from the
              radius on every side.
            </li>
            <li>
              <strong>Area-only die count</strong> — the largest whole number of dice whose combined area fits in the
              usable area. It assumes perfectly packed rectangles and is therefore an upper bound.
            </li>
            <li>
              <strong>Utilisation</strong> — with a measured die count, the share of the usable area that the dice
              actually cover, and how close that count is to the area-only bound.
            </li>
          </ul>
        </>
      }
      notes={[
        'All lengths are converted to a single base unit before the areas are computed, so you can mix units freely. Each field shows the unit it is using.',
        'The area-only die count divides one area by another. It is an upper bound: rectangles cannot tile a circle without waste, so a real layout always yields fewer dice.',
        'For a grid-based count that lays dice on rows and columns and drops the ones over the edge, use the die-per-wafer calculator. Enter a measured count here to see how your real wafer compares with the bound.',
        'The wafer area assumes a perfect circle. A wafer with a flat or a notch has slightly less area, which matters only at the third or fourth significant figure.',
      ]}
      faq={[
        {
          question: 'Why is the area-only die count called an upper bound?',
          answer:
            'Because it divides the usable area by the die area and keeps the whole part. That treats the circle as if it could be perfectly filled with rectangles, which it cannot: a round wafer always leaves waste at the rim. A real row-and-column layout therefore fits fewer dice, and the difference between the two is exactly what the utilisation figure measures when you supply a measured count.',
        },
        {
          question: 'How is the usable area calculated from the edge exclusion?',
          answer:
            'The edge exclusion is a ring that is removed all around the wafer, so it reduces the radius by the exclusion on every side. The usable diameter is the wafer diameter minus twice the exclusion, and the usable area is the circle of that reduced diameter. For a 300 mm wafer with 3 mm exclusion the usable diameter is 294 mm.',
        },
        {
          question: 'Should I use this or the die-per-wafer calculator?',
          answer:
            'Use this tool when you want the areas, the area lost to the edge exclusion, or a fast sanity check on how many dice could possibly fit. Use the die-per-wafer calculator when you want a count that respects the round boundary, and enter a measured count here whenever you have one, since only a measured count reflects the real layout.',
        },
        {
          question: 'Does the die area include the scribe lane?',
          answer:
            'No. The die area here is the die itself. The scribe lane is the street between dice that is cut away, and it belongs to the field layout, not to the die. If you are working out how many dice fit in a lithography field, the reticle field calculator adds the scribe lane to the pitch for you.',
        },
      ]}
    >
      <WaferAreaCalculator />
    </ToolPageShell>
  );
}
