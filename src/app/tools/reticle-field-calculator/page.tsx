import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import ReticleFieldCalculator from '@/tools/reticle-field-calculator/Calculator';
import { tool } from '@/tools/reticle-field-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/reticle-field-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function ReticleFieldCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Stepping Die Pitch'), math: 'P_x = W_{\\text{die}} + S_x, \\quad P_y = H_{\\text{die}} + S_y' },
        { kind: 'math', label: msg('Array Die Capacity per Field'), math: 'N_x = \\left\\lfloor \\frac{F_x}{P_x} \\right\\rfloor, \\quad N_y = \\left\\lfloor \\frac{F_y}{P_y} \\right\\rfloor' },
        { kind: 'math', label: msg('Total Die Count per Reticle Field'), math: 'N_{\\text{field}} = N_x \\times N_y' },
        { kind: 'math', label: msg('Field Optical Area Utilisation'), math: '\\eta_{\\text{field}} = \\frac{N_{\\text{field}} \\times (W_{\\text{die}} \\cdot H_{\\text{die}})}{F_x \\cdot F_y} \\times 100\\%' },
        { kind: 'math', label: msg('Theoretical Upper Bound Die Count'), math: 'N_{\\text{wafer, upper}} = N_{\\text{shots}} \\times N_{\\text{field}}' },
        { kind: 'list', items: [msg('**Field** — the area the exposure tool prints in one shot, set by the reticle and the reduction ratio. A common full field is about 26 mm by 33 mm.'), msg('**Scribe lane** — the kerf between neighbouring dice, added to each die to give the step pitch. It is counted once between neighbours, not once per die.'), msg('**Shot** — one exposure of one field. The tool steps whole fields across the wafer and keeps the ones whose centre lands inside the usable circle.')] },
      ]}
      notes={[
        msg('The die pitch is the die plus the scribe lane, and the dice per field is the floor of the field size divided by that pitch on each axis, so the layout follows a regular grid.'),
        msg('Shots per wafer is counted by stepping whole fields across the wafer and keeping those whose centre lands inside the usable circle after edge exclusion. Fields at the rim do not print a full complement of dice, so dice per wafer is an upper bound.'),
        msg('A real exposure job may use a different stepping plan, mix field sizes with a stitched field, or print partial fields at the edge. Treat the shot count as a planning estimate and confirm it with your own layout data.'),
        msg('The field size is an input rather than a fixed constant: reticle size, reduction ratio and the tool generation all change it, so the tool never assumes a particular stepper or scanner.'),
      ]}
      faq={[
        {
          question: msg('What is a reticle field and why is it limited?'),
          answer:
            msg('A field is the largest area the exposure tool can image in one shot. It is set by the physical reticle size and the reduction ratio of the optics, so a standard 6 inch reticle at 4x reduction gives a field of about 26 mm by 33 mm. Dice larger than the field can still be made, but they need field stitching, where two or more exposures are joined.'),
        },
        {
          question: msg('How does the scribe lane change the number of dice per field?'),
          answer:
            msg('The scribe lane is the street between dice that is cut away by the saw. Because it sits between neighbours, it is added to the die size to give the step pitch. A larger lane means a larger pitch, so fewer dice fit across the same field. Setting the lane to zero gives a useful upper bound on what a perfect layout could hold.'),
        },
        {
          question: msg('Is the dice-per-wafer figure exact?'),
          answer:
            msg('No. It multiplies the number of shots by the dice per field, which assumes every shot prints a full field. Fields at the rim of the wafer do not, so the figure is an upper bound. Use it to size a job and compare tool plans, then take the real count from your layout or from measured data.'),
        },
        {
          question: msg('Which wafer size should I use?'),
          answer:
            msg('Enter the wafer diameter for the product you are planning — 200 mm and 300 mm are the common sizes, and everything here is unit-aware so you can also work in centimetres or inches. The edge exclusion is applied as a ring on every side, matching how the wafer area and die-per-wafer tools treat it, so the numbers line up with each other.'),
        },
      ]}
    >
      <ReticleFieldCalculator />
    </ToolPageShell>
  );
}
