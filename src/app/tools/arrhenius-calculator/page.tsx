
import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import ArrheniusCalculator from '@/tools/arrhenius-calculator/Calculator';
import { tool } from '@/tools/arrhenius-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/arrhenius-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function ArrheniusCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Arrhenius Rate Equation'), math: '\\text{Rate} = D_0 \\exp\\left(-\\frac{E_a}{k_B T}\\right)' },
        { kind: 'math', label: msg('Logarithmic Form'), math: '\\ln(\\text{Rate}) = \\ln(D_0) - \\frac{E_a}{k_B} \\left(\\frac{1}{T}\\right)' },
        { kind: 'math', label: msg('Activation Energy Extraction (Two Points)'), math: 'E_a = k_B \\frac{\\ln(r_1) - \\ln(r_2)}{\\frac{1}{T_2} - \\frac{1}{T_1}}' },
        { kind: 'list', items: [msg('**D0** — the prefactor, sometimes called the frequency factor. It carries the units of whatever rate it multiplies, so the tool keeps it as a bare number.'), msg('**Ea** — the activation energy in electronvolts. It sets the slope of the rate against inverse temperature, which is the whole point of the plot.'), msg('**k** — the Boltzmann constant, 8.617333262 times ten to the minus five electronvolts per kelvin, which is what lets electronvolts meet kelvin.')] },
      ]}
      notes={[
        msg('The tool works in kelvin. Celsius inputs are converted with the 273.15 offset, and a temperature at or below absolute zero is rejected rather than allowed to produce a nonsense rate.'),
        msg('The prefactor and the rate keep whatever unit you give them, because the activation energy, the ratio and the exponent are the only unit-independent outputs. If the two points are in litres per second, the extracted prefactor is in litres per second.'),
        msg('The activation energy from two points is only as good as the two points. Two noisy measurements at similar temperatures give a badly conditioned slope, so spread the temperatures and use more points where it matters.'),
        msg('A straight line on an Arrhenius plot is an assumption, not a law. Many real processes bend when the mechanism changes, such as a switch from reaction limited to diffusion limited, and a single Ea over a wide range then fits neither end.'),
        msg('The extracted Ea and D0 are a two parameter fit to two points, so the pair is exact through both by construction. That means the fit tells you nothing about the scatter around the line, which needs a third point or more.'),
      ]}
      faq={[
        {
          question: msg('Why does the rate change so much with temperature?'),
          answer:
            msg('Because the temperature sits in the exponent under the activation energy. A modest rise in kelvin changes kT by a few percent, and dividing the activation energy by it changes the exponent by a comparable amount, which is a large factor once it is exponentiated. That is why a hundred degrees can move a diffusion coefficient by more than an order of magnitude.'),
        },
        {
          question: msg('How many points do I need to extract the activation energy?'),
          answer:
            msg('Two distinct temperatures are the mathematical minimum, and the tool takes exactly two. Practically, more points across a wide temperature range give a slope that is much less sensitive to the error in any single measurement, so use two as a quick check and a full set when the number has to hold up.'),
        },
        {
          question: msg('Why do the two points need to be far apart in temperature?'),
          answer:
            msg('The slope is the activation energy divided by the Boltzmann constant, and it is read from the difference in inverse temperature. If the two points are close, that difference is small and any error in the rates is divided by a small number, which amplifies it. Two points a hundred kelvin apart pin the slope far better than two points ten kelvin apart.'),
        },
        {
          question: msg('What are the units of the prefactor?'),
          answer:
            msg('Whatever the rate is measured in, because the exponential is a pure number and the prefactor carries all the dimensional weight. For a diffusivity in square centimetres per second, the prefactor is in square centimetres per second. For an etch rate in nanometres per minute, it is in nanometres per minute. The tool never assumes a unit, so keep the two data points in the same unit as the answer you want.'),
        },
      ]}
    >
      <ArrheniusCalculator />
    </ToolPageShell>
  );
}
