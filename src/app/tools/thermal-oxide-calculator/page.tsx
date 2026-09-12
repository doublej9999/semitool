
import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import ThermalOxideCalculator from '@/tools/thermal-oxide-calculator/Calculator';
import { tool } from '@/tools/thermal-oxide-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function ThermalOxideCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Deal-Grove Thermal Oxidation Model"
            math="x_0^2 + A x_0 = B (t + \tau)"
          />
          <MathFormula
            block
            label="Initial Oxide Offset Time"
            math="\tau = \frac{x_i^2 + A x_i}{B}"
          />
          <MathFormula
            block
            label="Oxide Thickness vs Oxidation Time"
            math="x_0(t) = \frac{A}{2} \left( \sqrt{1 + \frac{4 B (t + \tau)}{A^2}} - 1 \right)"
          />
<ul className="info-list">
            <li>
              <strong>A</strong> — the linear rate constant over the surface reaction, in micrometres.
              It sets how fast the reaction can proceed when the oxidant arrives easily.
            </li>
            <li>
              <strong>B</strong> — the parabolic rate constant for oxidant diffusion through the
              growing oxide, in square micrometres per hour.
            </li>
            <li>
              <strong>tau</strong> — the time offset that accounts for the oxide already present
              before the step, so a second oxidation starts from the right place.
            </li>
            <li>
              <strong>A / 2</strong> — the crossover thickness. Below it the growth is nearly linear
              in time, above it it goes as the square root of time.
            </li>
          </ul>
        </>
      }
      notes={[
        'A and B depend strongly on temperature, on the ambient and on the crystal orientation, so they are inputs rather than constants in the tool. The two presets are the classic Deal-Grove values for a (100) wafer at 1000 C, one for dry oxygen and one for steam, and are meant as a starting point rather than a process number.',
        'The presets are consistent with their own linear rate constants: the dry preset gives B over A of about 0.071 micrometres per hour and the wet preset about 1.27, which are the values usually quoted for these conditions.',
        'The model is linear-parabolic, and it is known to fail for very thin oxides, below roughly 30 nanometres, where real growth is faster than the model predicts. Do not trust the first tens of nanometres of a curve from this model.',
        'The model assumes a single oxidising species, no significant mechanical stress in the oxide, a negligible effect from the dopant in the silicon, and an oxide that stays the same density as it grows. All four are approximations.',
        'The silicon consumed is computed from the densities of silicon and silicon dioxide, not from a rounded rule of thumb, and comes out at about 0.456 micrometres of silicon for every micrometre of oxide.',
      ]}
      faq={[
        {
          question: 'Why does the oxide grow more and more slowly?',
          answer:
            'Because the oxidant has to reach the silicon through the oxide that is already there. Right at the start the surface reaction is what limits the rate and the growth is nearly linear in time, but as the oxide thickens the diffusion of the oxidant through it becomes the bottleneck, and a diffusion limited growth is parabolic, which means the thickness goes as the square root of time. The crossover thickness where the two regimes meet is A over two.',
        },
        {
          question: 'What are A and B and why do I have to supply them?',
          answer:
            'A and B are the linear and parabolic rate constants, and together they encode the physics of the surface reaction and of oxidant diffusion at a given temperature, ambient and crystal orientation. They change a lot with temperature and between dry oxygen and steam, so a single pair baked into the tool would be wrong almost everywhere. The presets give the classic values for a (100) wafer at 1000 C so there is somewhere to start, and any real process should use its own constants.',
        },
        {
          question: 'Why does my thin oxide disagree with the model?',
          answer:
            'Because the model is known to under-predict growth in the first tens of nanometres, a regime that gets its own correction in practice. If your target is a thin gate oxide, treat the Deal-Grove result as a lower bound and expect the real process to be faster. A short oxidation also mixes in the ramp up and down of the furnace, which the model does not represent.',
        },
        {
          question: 'How much silicon is consumed by the oxidation?',
          answer:
            'About 0.456 of the oxide thickness, so a hundred nanometres of oxide eats roughly 46 nanometres of silicon. That number comes from the molar volumes of silicon and silicon dioxide, so it is a property of the materials rather than of the process. It matters whenever the oxidised layer has to stay within a shallow junction or a thin film.',
        },
      ]}
    >
      <ThermalOxideCalculator />
    </ToolPageShell>
  );
}
