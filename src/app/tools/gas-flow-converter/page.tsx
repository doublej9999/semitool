import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import GasFlowConverter from '@/tools/gas-flow-converter/Calculator';
import { tool } from '@/tools/gas-flow-converter';
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

export default function GasFlowConverterPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p className="formula-expression">V_m = R x T / P, with R = 8.314 462 618 153 24 J/(mol·K) and P = 1 atm</p>
          <p className="formula-expression">1 mol/min = V_m cm³/min (standard)</p>
          <p className="formula-expression">mass flow [g/min] = molar flow [mol/min] x molar mass [g/mol]</p>
          <p className="formula-expression">actual flow = standard flow x (1 atm / P) x (T / T_reference)</p>
          <ul className="info-list">
            <li>
              <strong>sccm / slm</strong> — standard cubic centimetre (or litre) per minute, a volumetric flow at a
              stated reference temperature and one atmosphere.
            </li>
            <li>
              <strong>Reference temperature</strong> — 0 °C (273.15 K) or 25 °C (298.15 K). The same sccm reading is a
              different amount of gas at each, so it is an input rather than a hidden constant.
            </li>
            <li>
              <strong>Molar volume</strong> — the volume one mole of ideal gas occupies at the reference, shown as a
              number so you can check it against a datasheet.
            </li>
          </ul>
        </>
      }
      notes={[
        'Every volumetric row is referenced to the selected standard. To get the flow actually inside a chamber at process pressure and temperature, scale the standard flow by (1 atm / P) x (T / T_reference) — the row does not do that for you, because guessing chamber conditions would be the wrong kind of convenience.',
        'Molar volume comes from the ideal gas law. At one atmosphere the error is a few parts in a thousand for common process gases, which is well inside the tolerance of a mass flow controller.',
        'The g/min row depends on which gas is flowing, so pick the gas rather than leaving a default: hydrogen is about fourteen times lighter than nitrogen, so the same sccm carries fourteen times less mass.',
        'Molar masses are assembled in code from IUPAC conventional atomic weights, so the arithmetic is visible rather than pasted in as a rounded constant.',
      ]}
      faq={[
        {
          question: 'What does sccm mean, and why does the standard matter?',
          answer: 'sccm stands for standard cubic centimetre per minute: a flow of one cubic centimetre per minute measured at a stated reference temperature and pressure. The number is meaningless without the standard, because gas expands with temperature, so 1 sccm at 0 °C is about 9 % more gas per minute than 1 sccm at 25 °C.',
        },
        {
          question: 'Why is 1 slm exactly 1000 sccm?',
          answer: 'Because slm is the standard litre per minute and a litre is exactly 1000 cubic centimetres. That part of the conversion has no reference dependence, so the two units scale by exactly 1000 whatever standard you choose; only the molar and mass rows move with the reference.',
        },
        {
          question: 'How much gas is one sccm in moles?',
          answer: 'At 0 °C and one atmosphere, one mole occupies 22 413.97 cm³, so 1 sccm is 4.46e-5 mol/min, or about 44.6 µmol/min. At the warmer 25 °C standard the molar volume rises to 24 465.40 cm³, and one sccm is 40.9 µmol/min. That difference is the reason the reference temperature is an explicit input.',
        },
        {
          question: 'How do I convert a standard flow to the flow in my chamber?',
          answer: 'Multiply by (1 atm / P_chamber) x (T_chamber / T_reference). Lower pressure and higher temperature both inflate the actual volumetric flow for the same amount of gas, which is why a mass flow controller is calibrated in standard units: the mass delivered is what the process cares about, and it does not change with chamber conditions.',
        },
      ]}
    >
      <GasFlowConverter />
    </ToolPageShell>
  );
}
