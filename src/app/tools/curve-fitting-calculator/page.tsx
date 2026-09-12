import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import CurveFittingCalculator from '@/tools/curve-fitting-calculator/Calculator';
import { tool } from '@/tools/curve-fitting-calculator';
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

export default function CurveFittingCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p className="formula-expression">Arrhenius: Rate = A × exp(-Ea / (k_B × T))</p>
          <p className="formula-expression">ln(Rate) = ln(A) - (Ea / k_B) × (1 / T)</p>
          <p className="formula-expression">Deal-Grove Linearized: t / x_ox = (1 / B) × x_ox + (A / B)</p>
          <ul className="info-list">
            <li>
              <strong>Activation Energy Ea (eV)</strong> — extracted from the linear slope of ln(Rate) versus inverse absolute temperature 1/T (K⁻¹), using Boltzmann constant k_B = 8.61733 × 10⁻⁵ eV/K.
            </li>
            <li>
              <strong>Deal-Grove Parabolic Rate B (μm²/hr)</strong> — diffusion-controlled oxidation parameter inversely proportional to the slope of t/x_ox vs x_ox.
            </li>
            <li>
              <strong>Deal-Grove Linear Rate B/A (μm/hr)</strong> — surface reaction rate constant inversely proportional to the intercept of t/x_ox vs x_ox.
            </li>
          </ul>
        </>
      }
      notes={[
        'Always verify that temperature values are converted properly to Kelvin (T_K = T_C + 273.15) before performing Arrhenius regressions.',
        'In Deal-Grove regressions, early oxide data (x_ox < 25 nm in dry O2) exhibits anomalously rapid initial growth not captured by the classical model.',
      ]}
      faq={[
        {
          question: 'What is the purpose of semiconductor Arrhenius parameter extraction?',
          answer: 'Chemical vapor deposition (LPCVD/PECVD), plasma etching, thermal diffusion, and oxidation kinetics are thermally activated processes. Extracting Ea reveals the rate-limiting reaction mechanism (e.g. mass transport control with low Ea vs surface reaction control with high Ea > 1.5 eV).',
        },
        {
          question: 'What data format can I paste into the calculator?',
          answer: 'You can paste two columns separated by commas, tabs, or spaces. Lines beginning with # or // are treated as comments and ignored.',
        },
      ]}
    >
      <CurveFittingCalculator />
    </ToolPageShell>
  );
}
