import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import CarrierMobilityCalculator from '@/tools/carrier-mobility-calculator/Calculator';
import { tool } from '@/tools/carrier-mobility-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function CarrierMobilityCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Caughey-Thomas Empirical Mobility Model"
            math="\mu(N) = \mu_{\min} + \frac{\mu_0 - \mu_{\min}}{1 + \left(\frac{N}{N_{\text{ref}}}\right)^\alpha}"
          />
          <MathFormula
            block
            label="Drift Resistivity"
            math="\rho = \frac{1}{q (n \mu_n + p \mu_p)} \approx \frac{1}{q N \mu(N)}"
          />
          <MathFormula
            block
            label="Temperature Scaling"
            math="\mu(T) = \mu(300\,\text{K}) \left( \frac{T}{300\,\text{K}} \right)^{-\gamma}"
          />
<ul className="info-list">
            <li>
              <strong>µ(N)</strong> — carrier drift mobility in cm²/(V·s) determined by ionized impurity scattering and acoustic phonon scattering.
            </li>
            <li>
              <strong>σ (Conductivity)</strong> — electrical conductivity in Siemens per centimetre (S/cm).
            </li>
            <li>
              <strong>ρ (Resistivity)</strong> — bulk wafer resistivity in Ohm-centimetres (Ω·cm).
            </li>
            <li>
              <strong>D (Diffusion Coefficient)</strong> — Einstein relation connecting drift mobility to minority/majority carrier diffusion.
            </li>
          </ul>
        </>
      }
      notes={[
        'Uses the standard Caughey-Thomas empirical formulation (closely matching ASTM F723 for Phosphorus/Arsenic n-type and Boron p-type silicon at 300 K).',
        'At low doping (< 10¹⁵ cm⁻³), carrier mobility is limited by lattice phonon vibrations (approaching ~1417 cm²/V·s for electrons and ~470 cm²/V·s for holes).',
        'At heavy doping (> 10¹⁸ cm⁻³), Coulomb deflection from ionized impurities dominates, degrading mobility towards asymptotic minimums (65 cm²/V·s for electrons, 48 cm²/V·s for holes).',
      ]}
      faq={[
        {
          question: 'Why is electron mobility roughly three times higher than hole mobility in silicon?',
          answer:
            'Electrons travel in the conduction band minima characterized by a lighter effective conduction mass (m* ~ 0.26 m0), whereas holes reside in degenerate heavy/light valence bands with a significantly heavier effective mass (m* ~ 0.38 m0) and stronger acoustic inter-band scattering rates.',
        },
        {
          question: 'Can this tool reverse-solve doping from measured four-point probe resistivity?',
          answer:
            'Yes. In "Resistivity → Doping" mode, a numerical root-finding bisection solver back-calculates the exact active dopant concentration corresponding to the entered bulk resistivity in Ω·cm.',
        },
      ]}
    >
      <CarrierMobilityCalculator />
    </ToolPageShell>
  );
}
