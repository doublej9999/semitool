import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import WaferDieCalculator from '@/tools/wafer-die-calculator/Calculator';
import { tool } from '@/tools/wafer-die-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/wafer-die-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function WaferDieCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'text', text: msg('A rectangular die grid is placed on the circular wafer. A die is counted when its **centre** falls inside the effective radius:') },
        { kind: 'math', label: msg('Die Center Yield Inclusion Condition'), math: 'x^2 + y^2 \\le \\left( \\frac{D}{2} - E \\right)^2' },
        { kind: 'list', items: [msg('**x, y** — die centre coordinates relative to the wafer centre, on a grid whose step is the placement pitch.'), msg('**D** — wafer diameter (mm). **E** — edge exclusion (mm).'), msg('**Pitch X = die width + street width**, **Pitch Y = die height + street width**.'), msg('Rectangular grid reference = floor(D / Pitch X) × floor(D / Pitch Y) — the count you would get from a naive full-wafer grid, shown only for comparison.')] },
      ]}
      notes={[
        msg('Result is an Estimated Gross Die count for a regular grid. It is not a fab cutting result and does not model die yield, reticles, alignment marks or test structures.'),
        msg('Street width is added to the die size to form the placement pitch. Set it to 0 for a pure die-to-die step.'),
        msg('All lengths are millimetres. Edge exclusion is a radial ring (typical production wafers use roughly 1.5–3 mm), but the usable value is process and fab specific.'),
        msg('This is a generic calculation and may not match a specific fab, customer, equipment or MES specification.'),
      ]}
      faq={[
        {
          question: msg('Why not simply divide the wafer area by the die area?'),
          answer:
            msg('That approach assumes the wafer is a square packable region and counts partial die around the circumference as full die. It overestimates the count. Placing a rectangular grid and testing each die centre against the effective radius accounts for the circular boundary and the scribe street step.'),
        },
        {
          question: msg('What does edge exclusion mean?'),
          answer:
            msg('Edge exclusion is the outer ring of the wafer that is not used, caused by the bevel, handling area, resist edge bead and process non-uniformity. It reduces the radius used for die placement. Measure yours on real hardware: a common starting range is 1.5 mm to 3 mm on 200 mm and 300 mm wafers.'),
        },
        {
          question: msg('Is street width part of the die size?'),
          answer:
            msg('No. The die size is the functional area; the street (scribe lane) is the gap between two neighbouring die. The placement step is therefore die size plus street width. If you already know the pitch, you can reconstruct the street width as pitch minus die size.'),
        },
        {
          question: msg('How accurate is the estimate for a specific product?'),
          answer:
            msg('It is a geometric estimate for a fully populated rectangular grid. Real products may use different die-to-die steps per direction, offsets from the wafer centre, or a stitched/reticle-limited layout. Treat the number as an upper bound to sanity-check a layout, not as a booked production quantity.'),
        },
      ]}
    >
      <WaferDieCalculator />
    </ToolPageShell>
  );
}
