
import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import DiffusionLengthCalculator from '@/tools/diffusion-length-calculator/Calculator';
import { tool } from '@/tools/diffusion-length-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/diffusion-length-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function DiffusionLengthCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Characteristic Thermal Diffusion Length'), math: 'L_{\\text{diff}} = \\sqrt{D \\cdot t}' },
        { kind: 'math', label: msg('Complementary Error Function Penetration Depth'), math: 'L_{\\text{erfc}} = 2\\sqrt{D \\cdot t}' },
        { kind: 'math', label: msg('Gaussian Profile Spatial Spread'), math: '\\sigma = \\sqrt{2 D \\cdot t}' },
        { kind: 'list', items: [msg('**D** — the diffusivity at the process temperature, in square centimetres per second. It is the number that carries all the temperature dependence.'), msg('**Thermal budget** — the product D times t. It has the units of a length squared, not a length, which is why two different time-temperature schedules can share one budget.'), msg('**Length scale** — which multiple of the root of D t appears depends on the boundary condition, so all three common ones are printed and labelled.')] },
      ]}
      notes={[
        msg('The square root of D t is a length in the profile, not the depth of a junction. Turning it into a junction depth needs the surface concentration, the background doping and the solid solubility, which are inputs this tool does not take.'),
        msg('The three lengths printed answer different boundary conditions. A constant surface concentration gives an erfc profile whose argument is x divided by two root D t, a thin source gives a Gaussian whose standard deviation is root of two D t, and the bare root D t is the generic characteristic scale. They differ by factors of root two, so quoting one as the other is a quiet factor-of-two error.'),
        msg('The budget is additive across steps but the lengths are not. Two steps with budgets D t one and D t two add to a budget of D t one plus D t two, and only the total budget has a length, which is the root of the sum.'),
        msg('The diffusivity is taken as an input rather than looked up. Diffusivity depends on the dopant, the material, the concentration and the ambient, and a single number from a table rarely matches a real process. Feed in D from your own data or from a model, not from a guess.'),
        msg('This is a one-dimensional treatment. Lateral diffusion and the effect of a moving boundary such as an oxidising surface are outside this model.'),
      ]}
      faq={[
        {
          question: msg('What is the difference between the diffusion length and the thermal budget?'),
          answer:
            msg('The budget is D times t and has units of a length squared, and the diffusion length is its square root and has units of a length. The budget is what accumulates across a sequence of process steps because it is additive, and the length is what the momentary profile looks like. Two schedules that are different in temperature and time can give the same budget, and they will give the same diffusion length because only the product matters for a fixed D.'),
        },
        {
          question: msg('Which length scale should I use?'),
          answer:
            msg('It comes from the boundary condition, not from preference. If the surface holds a fixed concentration, as with a gas source, the profile is an erfc and the length that appears in its argument is two root D t. If the source is a thin finite dose, as with a deposited layer, the profile is a Gaussian and the standard deviation is root of two D t. The bare root D t is the generic scale. The tool prints all three so the choice is visible.'),
        },
        {
          question: msg('Why does ten times the budget only give a little over three times the length?'),
          answer:
            msg('Because the length goes as the square root of the budget. Ten times the budget is root ten, about 3.16, times the length. This is why pushing a diffusion further costs disproportionately more time or temperature, and why the length is the natural way to think about the depth.'),
        },
        {
          question: msg('Does the budget let me trade temperature against time?'),
          answer:
            msg('Only through the diffusivity, which is the Arrhenius factor. For a fixed D the budget depends only on the product, so twice the time at the same temperature is exactly twice the budget. Warm it up and D rises exponentially, so the same budget arrives in far less time. This tool takes D as given, and the Arrhenius calculator is where the temperature enters.'),
        },
      ]}
    >
      <DiffusionLengthCalculator />
    </ToolPageShell>
  );
}
