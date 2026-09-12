import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import ThermalFatigueCalculator from '@/tools/thermal-fatigue-calculator/Calculator';
import { tool } from '@/tools/thermal-fatigue-calculator';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
  keywords: tool.keywords,
  alternates: { canonical: tool.path },
  openGraph: {
    title: tool.name + ' — SemiTools',
    description: tool.description,
    url: absoluteUrl(tool.path),
    type: 'website',
  },
};

export default function ThermalFatigueCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p className="formula-expression">
            &Delta;&alpha; = |&alpha;_{'{substrate}'} - &alpha;_{'{die}'}| &nbsp; [ppm/&deg;C]
          </p>
          <p className="formula-expression">
            DNP = (1/2) &times; &radic;(W_{'{die}'}&sup2; + H_{'{die}'}&sup2;) &nbsp; [mm]
          </p>
          <p className="formula-expression">
            &Delta;&gamma; = (DNP &times; 10&sup3; &times; &Delta;&alpha; &times; 10⁻⁶ &times; &Delta;T) / h_{'{bump}'} = (DNP &times; &Delta;&alpha; &times; &Delta;T) / (10&sup3; &times; h_{'{bump}'})
          </p>
          <p className="formula-expression">
            N_f = 0.5 &times; (&Delta;&gamma; / (2 &times; &epsilon;_f))^(1 / c)
          </p>
          <p className="formula-expression">
            AF = (&Delta;T_{'{test}'} / &Delta;T_{'{field}'})^m, &nbsp; Field Life (Years) = (N_f &times; AF) / (CyclesPerDay &times; 365)
          </p>
          <ul className="info-list">
            <li>
              <strong>Δα (Delta CTE)</strong> — Absolute difference in coefficient of thermal expansion between package substrate and semiconductor die (ppm/°C).
            </li>
            <li>
              <strong>DNP (Distance to Neutral Point)</strong> — Distance from die geometric center to the outermost corner solder joint bump (mm).
            </li>
            <li>
              <strong>Δγ (Shear Strain Range)</strong> — Total cyclic thermal shear strain experienced by corner bumps across ΔT (dimensionless / %).
            </li>
            <li>
              <strong>h_bump</strong> — Standoff height of the micro-bump or solder ball (µm).
            </li>
            <li>
              <strong>Nf (Mean Cycles to Failure)</strong> — Coffin-Manson low-cycle fatigue life predicting 50% failure point under test conditions.
            </li>
            <li>
              <strong>εf &amp; c</strong> — Solder alloy fatigue ductility coefficient and negative fatigue exponent (e.g. εf=0.325, c=-0.47 for SAC305; εf=0.30, c=-0.50 for Sn63Pb37).
            </li>
            <li>
              <strong>AF (Acceleration Factor)</strong> — Thermal cycle acceleration ratio mapping qualification test cycles into field operating lifetime (typical creep-fatigue exponent m = 1.9).
            </li>
          </ul>
        </>
      }
      notes={[
        'The Engelmaier-Solomon formulation implemented here represents shear strain at the critical corner joint (maximum DNP) assuming rigid package expansion and unconstrained solder shear deformation.',
        'In flip-chip packages with underfill, the effective shear strain on bumps is drastically reduced by 5× to 10× because underfill mechanically couples the die to the substrate and redistributes shear stress across the entire die footprint.',
        'Thermal cycling dwell time and ramp rate induce time-dependent viscoplastic creep in solder alloys. For frequency-dependent analysis, the modified Engelmaier equation adjusts the fatigue exponent c as a function of mean cyclic temperature and dwell duration.',
        'Lead-free SAC305 exhibits higher yield strength and greater creep resistance than Sn63Pb37, resulting in extended fatigue life at small strain ranges, but may exhibit more brittle intermetallic compound (IMC) failure under severe strain or shock.',
      ]}
      faq={[
        {
          question: 'What causes thermal fatigue in microelectronic solder joints?',
          answer:
            'Thermal fatigue occurs due to the Coefficient of Thermal Expansion (CTE) mismatch between the silicon die (~2.6 ppm/°C) and the organic package substrate or PCB (13–17 ppm/°C). When temperatures oscillate during power cycling or ambient changes, the disparate thermal expansion rates exert cyclic shear strain on interconnecting micro-bumps or solder balls, initiating microcracks that propagate across the joint until electrical open-circuit occurs.',
        },
        {
          question: 'Why is the corner bump (DNP) the most critical solder joint?',
          answer:
            'Thermal expansion expands radially outwards from the center of the chip (the Neutral Point). The relative thermal displacement between die and substrate scales linearly with Distance to Neutral Point (DNP). Consequently, the outermost corner bumps endure the highest cyclic shear strain (Δγ) and fail first under thermal cycling tests.',
        },
        {
          question: 'What is the Coffin-Manson relationship?',
          answer:
            'The Coffin-Manson equation is an empirical power-law relationship that models low-cycle metal fatigue where plastic strain dominates elastic strain: Nf = 0.5 × (Δγ / 2εf)^(1/c). It relates the plastic strain amplitude per cycle (Δγ/2) to the mean cycles to failure (Nf) using the material ductility coefficient εf and fatigue exponent c.',
        },
        {
          question: 'How is the Acceleration Factor (AF) applied in reliability qualification?',
          answer:
            'Accelerated thermal cycling (such as JEDEC JESD22-A104 Condition B from -40°C to +125°C) compresses years of field operation into several weeks in an environmental test chamber. The acceleration factor AF = (ΔT_test / ΔT_field)^m calculates how many mild field temperature cycles (e.g. ΔT = 45°C) are equivalent to one harsh laboratory test cycle.',
        },
        {
          question: 'How do SAC305 and Sn63Pb37 compare in thermal cycling performance?',
          answer:
            'Eutectic tin-lead (Sn63Pb37) is softer and more ductile (c = -0.50), providing compliant stress relaxation. Lead-free SAC305 has a slightly higher ductility coefficient (εf = 0.325, c = -0.47) and superior creep strength, which yields longer thermal cycle life under moderate temperature swings (ΔT < 100°C), though its higher stiffness can transfer greater stress to low-k dielectric layers under the bumps.',
        },
      ]}
    >
      <ThermalFatigueCalculator />
    </ToolPageShell>
  );
}
