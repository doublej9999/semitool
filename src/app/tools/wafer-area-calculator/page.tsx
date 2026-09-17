import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import WaferAreaCalculator from '@/tools/wafer-area-calculator/Calculator';
import { tool } from '@/tools/wafer-area-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/wafer-area-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function WaferAreaCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Nominal Wafer Surface Area'), math: 'A_{\\text{wafer}} = \\pi \\left( \\frac{D}{2} \\right)^2' },
        { kind: 'math', label: msg('Usable Substrate Area (Edge Exclusion)'), math: 'A_{\\text{usable}} = \\pi \\left( \\frac{D}{2} - E \\right)^2' },
        { kind: 'math', label: msg('Gross Die Footprint Area'), math: 'A_{\\text{die}} = W_{\\text{die}} \\times H_{\\text{die}}' },
        { kind: 'math', label: msg('Area-Only Ideal Die Count'), math: 'N_{\\text{ideal}} = \\left\\lfloor \\frac{A_{\\text{usable}}}{A_{\\text{die}}} \\right\\rfloor' },
        { kind: 'math', label: msg('Edge Exclusion Loss Ratio'), math: '\\text{Loss}_{\\text{edge}} = 1 - \\frac{A_{\\text{usable}}}{A_{\\text{wafer}}} = 1 - \\left( 1 - \\frac{2E}{D} \\right)^2' },
        { kind: 'list', items: [msg('**Edge exclusion** — the ring at the wafer rim that is not used for product, removed from the radius on every side.'), msg('**Area-only die count** — the largest whole number of dice whose combined area fits in the usable area. It assumes perfectly packed rectangles and is therefore an upper bound.'), msg('**Utilisation** — with a measured die count, the share of the usable area that the dice actually cover, and how close that count is to the area-only bound.')] },
      ]}
      notes={[
        msg('All lengths are converted to a single base unit before the areas are computed, so you can mix units freely. Each field shows the unit it is using.'),
        msg('The area-only die count divides one area by another. It is an upper bound: rectangles cannot tile a circle without waste, so a real layout always yields fewer dice.'),
        msg('For a grid-based count that lays dice on rows and columns and drops the ones over the edge, use the die-per-wafer calculator. Enter a measured count here to see how your real wafer compares with the bound.'),
        msg('The wafer area assumes a perfect circle. A wafer with a flat or a notch has slightly less area, which matters only at the third or fourth significant figure.'),
      ]}
      faq={[
        {
          question: msg('Why is the area-only die count called an upper bound?'),
          answer:
            msg('Because it divides the usable area by the die area and keeps the whole part. That treats the circle as if it could be perfectly filled with rectangles, which it cannot: a round wafer always leaves waste at the rim. A real row-and-column layout therefore fits fewer dice, and the difference between the two is exactly what the utilisation figure measures when you supply a measured count.'),
        },
        {
          question: msg('How is the usable area calculated from the edge exclusion?'),
          answer:
            msg('The edge exclusion is a ring that is removed all around the wafer, so it reduces the radius by the exclusion on every side. The usable diameter is the wafer diameter minus twice the exclusion, and the usable area is the circle of that reduced diameter. For a 300 mm wafer with 3 mm exclusion the usable diameter is 294 mm.'),
        },
        {
          question: msg('Should I use this or the die-per-wafer calculator?'),
          answer:
            msg('Use this tool when you want the areas, the area lost to the edge exclusion, or a fast sanity check on how many dice could possibly fit. Use the die-per-wafer calculator when you want a count that respects the round boundary, and enter a measured count here whenever you have one, since only a measured count reflects the real layout.'),
        },
        {
          question: msg('Does the die area include the scribe lane?'),
          answer:
            msg('No. The die area here is the die itself. The scribe lane is the street between dice that is cut away, and it belongs to the field layout, not to the die. If you are working out how many dice fit in a lithography field, the reticle field calculator adds the scribe lane to the pitch for you.'),
        },
      ]}
    >
      <WaferAreaCalculator />
    </ToolPageShell>
  );
}
