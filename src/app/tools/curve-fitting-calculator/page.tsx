import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import CurveFittingCalculator from '@/tools/curve-fitting-calculator/Calculator';
import { tool } from '@/tools/curve-fitting-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/curve-fitting-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function CurveFittingCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Arrhenius Reaction Rate Model'), math: '\\text{Rate} = A \\exp\\left(-\\frac{E_a}{k_B T}\\right)' },
        { kind: 'math', label: msg('Linearized Arrhenius Form'), math: '\\ln(\\text{Rate}) = \\ln(A) - \\left(\\frac{E_a}{k_B}\\right) \\frac{1}{T}' },
        { kind: 'math', label: msg('Deal-Grove Linearized Model'), math: '\\frac{t}{x_{\\text{ox}}} = \\frac{1}{B} x_{\\text{ox}} + \\frac{A}{B}' },
        { kind: 'list', items: [msg('**Activation Energy Ea (eV)** — extracted from the linear slope of ln(Rate) versus inverse absolute temperature 1/T (K⁻¹), using Boltzmann constant k_B = 8.61733 × 10⁻⁵ eV/K.'), msg('**Deal-Grove Parabolic Rate B (μm²/hr)** — diffusion-controlled oxidation parameter inversely proportional to the slope of t/x_ox vs x_ox.'), msg('**Deal-Grove Linear Rate B/A (μm/hr)** — surface reaction rate constant inversely proportional to the intercept of t/x_ox vs x_ox.')] },
      ]}
      notes={[
        msg('Always verify that temperature values are converted properly to Kelvin (T_K = T_C + 273.15) before performing Arrhenius regressions.'),
        msg('In Deal-Grove regressions, early oxide data (x_ox < 25 nm in dry O2) exhibits anomalously rapid initial growth not captured by the classical model.'),
      ]}
      faq={[
        {
          question: msg('What is the purpose of semiconductor Arrhenius parameter extraction?'),
          answer: msg('Chemical vapor deposition (LPCVD/PECVD), plasma etching, thermal diffusion, and oxidation kinetics are thermally activated processes. Extracting Ea reveals the rate-limiting reaction mechanism (e.g. mass transport control with low Ea vs surface reaction control with high Ea > 1.5 eV).'),
        },
        {
          question: msg('What data format can I paste into the calculator?'),
          answer: msg('You can paste two columns separated by commas, tabs, or spaces. Lines beginning with # or // are treated as comments and ignored.'),
        },
      ]}
    >
      <CurveFittingCalculator />
    </ToolPageShell>
  );
}
