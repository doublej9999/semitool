import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import CarrierMobilityCalculator from '@/tools/carrier-mobility-calculator/Calculator';
import { tool } from '@/tools/carrier-mobility-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/carrier-mobility-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function CarrierMobilityCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Caughey-Thomas Empirical Mobility Model'), math: '\\mu(N) = \\mu_{\\min} + \\frac{\\mu_0 - \\mu_{\\min}}{1 + \\left(\\frac{N}{N_{\\text{ref}}}\\right)^\\alpha}' },
        { kind: 'math', label: msg('Drift Resistivity'), math: '\\rho = \\frac{1}{q (n \\mu_n + p \\mu_p)} \\approx \\frac{1}{q N \\mu(N)}' },
        { kind: 'math', label: msg('Temperature Scaling'), math: '\\mu(T) = \\mu(300\\,\\text{K}) \\left( \\frac{T}{300\\,\\text{K}} \\right)^{-\\gamma}' },
        { kind: 'list', items: [msg('**µ(N)** — carrier drift mobility in cm²/(V·s) determined by ionized impurity scattering and acoustic phonon scattering.'), msg('**σ (Conductivity)** — electrical conductivity in Siemens per centimetre (S/cm).'), msg('**ρ (Resistivity)** — bulk wafer resistivity in Ohm-centimetres (Ω·cm).'), msg('**D (Diffusion Coefficient)** — Einstein relation connecting drift mobility to minority/majority carrier diffusion.')] },
      ]}
      notes={[
        msg('Uses the standard Caughey-Thomas empirical formulation (closely matching ASTM F723 for Phosphorus/Arsenic n-type and Boron p-type silicon at 300 K).'),
        msg('At low doping (< 10¹⁵ cm⁻³), carrier mobility is limited by lattice phonon vibrations (approaching ~1417 cm²/V·s for electrons and ~470 cm²/V·s for holes).'),
        msg('At heavy doping (> 10¹⁸ cm⁻³), Coulomb deflection from ionized impurities dominates, degrading mobility towards asymptotic minimums (65 cm²/V·s for electrons, 48 cm²/V·s for holes).'),
      ]}
      faq={[
        {
          question: msg('Why is electron mobility roughly three times higher than hole mobility in silicon?'),
          answer:
            msg('Electrons travel in the conduction band minima characterized by a lighter effective conduction mass (m* ~ 0.26 m0), whereas holes reside in degenerate heavy/light valence bands with a significantly heavier effective mass (m* ~ 0.38 m0) and stronger acoustic inter-band scattering rates.'),
        },
        {
          question: msg('Can this tool reverse-solve doping from measured four-point probe resistivity?'),
          answer:
            msg('Yes. In "Resistivity → Doping" mode, a numerical root-finding bisection solver back-calculates the exact active dopant concentration corresponding to the entered bulk resistivity in Ω·cm.'),
        },
      ]}
    >
      <CarrierMobilityCalculator />
    </ToolPageShell>
  );
}
