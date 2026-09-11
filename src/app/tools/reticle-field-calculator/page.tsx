import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import ReticleFieldCalculator from '@/tools/reticle-field-calculator/Calculator';
import { tool } from '@/tools/reticle-field-calculator';
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

export default function ReticleFieldCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p className="formula-expression">Die pitch = die size + scribe lane</p>
          <p className="formula-expression">Dice per field per axis = floor(field size / die pitch)</p>
          <p className="formula-expression">Dice per field = dice along X x dice along Y</p>
          <p className="formula-expression">Field utilisation = dice x die area / field area</p>
          <p className="formula-expression">Dice per wafer (bound) = shots per wafer x dice per field</p>
          <ul className="info-list">
            <li>
              <strong>Field</strong> — the area the exposure tool prints in one shot, set by the reticle and the
              reduction ratio. A common full field is about 26 mm by 33 mm.
            </li>
            <li>
              <strong>Scribe lane</strong> — the kerf between neighbouring dice, added to each die to give the step
              pitch. It is counted once between neighbours, not once per die.
            </li>
            <li>
              <strong>Shot</strong> — one exposure of one field. The tool steps whole fields across the wafer and keeps
              the ones whose centre lands inside the usable circle.
            </li>
          </ul>
        </>
      }
      notes={[
        'The die pitch is the die plus the scribe lane, and the dice per field is the floor of the field size divided by that pitch on each axis, so the layout follows a regular grid.',
        'Shots per wafer is counted by stepping whole fields across the wafer and keeping those whose centre lands inside the usable circle after edge exclusion. Fields at the rim do not print a full complement of dice, so dice per wafer is an upper bound.',
        'A real exposure job may use a different stepping plan, mix field sizes with a stitched field, or print partial fields at the edge. Treat the shot count as a planning estimate and confirm it with your own layout data.',
        'The field size is an input rather than a fixed constant: reticle size, reduction ratio and the tool generation all change it, so the tool never assumes a particular stepper or scanner.',
      ]}
      faq={[
        {
          question: 'What is a reticle field and why is it limited?',
          answer:
            'A field is the largest area the exposure tool can image in one shot. It is set by the physical reticle size and the reduction ratio of the optics, so a standard 6 inch reticle at 4x reduction gives a field of about 26 mm by 33 mm. Dice larger than the field can still be made, but they need field stitching, where two or more exposures are joined.',
        },
        {
          question: 'How does the scribe lane change the number of dice per field?',
          answer:
            'The scribe lane is the street between dice that is cut away by the saw. Because it sits between neighbours, it is added to the die size to give the step pitch. A larger lane means a larger pitch, so fewer dice fit across the same field. Setting the lane to zero gives a useful upper bound on what a perfect layout could hold.',
        },
        {
          question: 'Is the dice-per-wafer figure exact?',
          answer:
            'No. It multiplies the number of shots by the dice per field, which assumes every shot prints a full field. Fields at the rim of the wafer do not, so the figure is an upper bound. Use it to size a job and compare tool plans, then take the real count from your layout or from measured data.',
        },
        {
          question: 'Which wafer size should I use?',
          answer:
            'Enter the wafer diameter for the product you are planning — 200 mm and 300 mm are the common sizes, and everything here is unit-aware so you can also work in centimetres or inches. The edge exclusion is applied as a ring on every side, matching how the wafer area and die-per-wafer tools treat it, so the numbers line up with each other.',
        },
      ]}
    >
      <ReticleFieldCalculator />
    </ToolPageShell>
  );
}
