
import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import PowerConverter from '@/tools/power-converter/Calculator';
import { tool } from '@/tools/power-converter';
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

export default function PowerConverterPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Metric Watt Power Multiples"
            math="1\,\text{W} = 10^3\,\text{mW} = 10^6\,\mu\text{W} = 10^{-3}\,\text{kW}"
          />
          <MathFormula
            block
            label="Mechanical Horsepower Conversion"
            math="1\,\text{hp} = 745.699872\,\text{W}"
          />
          <MathFormula
            block
            label="Logarithmic Decibel Reference Ratios"
            math="P\,[\text{dBm}] = 10 \log_{10}\left(\frac{P}{1\,\text{mW}}\right), \quad P\,[\text{dBW}] = 10 \log_{10}\left(\frac{P}{1\,\text{W}}\right)"
          />
<ul className="info-list">
            <li>
              <strong>Linear units</strong> — W, mW, µW, kW, hp, BTU/h, cal/s and ft·lbf/s are pure scale factors, so a
              reading converts by multiplication.
            </li>
            <li>
              <strong>Decibel units</strong> — dBm and dBW are logarithmic, referenced to 1 mW and 1 W. They are never
              used for the linear conversions, which is why they are kept in the same table only where the reference is
              known.
            </li>
            <li>
              <strong>zero watts</strong> — has no finite decibel value, so the dBm and dBW rows show a dash rather than a
              large negative number.
            </li>
          </ul>
        </>
      }
      notes={[
        'The mechanical and thermal units come from their exact definitions rather than from a rounded table: 1 hp = 550 ft·lbf/s = 745.6998715822702 W, 1 BTU(IT) = 1055.05585262 J so 1 BTU/h = 0.2930710701722222 W, and 1 cal(th) = 4.184 J.',
        'A decibel is a ratio, not an amount, so it only means something once the reference is stated: dBm is referred to 1 mW and dBW to 1 W. 0 dBm and -30 dBW are the same power.',
        'Because the decibel scale is logarithmic, a linear reading of zero has no decibel value at all. This tool shows a dash rather than printing -Infinity or a very negative number that would look like a real level.',
        'A negative watt is not physical and is rejected, while a negative decibel reading is perfectly ordinary: -10 dBm is 0.1 mW.',
        'Horsepower, BTU/h and cal/s are useful for comparing a tool specification with a facility or a thermal budget; they are not an electrical measurement, so the dBm column for them is arithmetic and not a claim about a signal.',
      ]}
      faq={[
        {
          question: 'How many dBm is 1 W?',
          answer: '30 dBm. A watt is 1000 mW and 10 log10(1000) is 30. The rule of thumb is 3 dB per doubling and 10 dB per factor of ten, so 1 W = 30 dBm, 2 W = 33 dBm and 0.1 W = 20 dBm.',
        },
        {
          question: 'Why is 0 dBm not zero watts?',
          answer: 'Because a decibel is a ratio. 0 dBm means the power equals the reference, which is 1 mW, not zero: the ratio to 1 mW is 1, and 10 log10(1) is 0. Zero watts would be -Infinity dBm, which is why the tool shows a dash instead.',
        },
        {
          question: 'What is the difference between dBm and dBW?',
          answer: 'Only the reference: dBm is referred to 1 mW and dBW to 1 W, a difference of exactly 30 dB. So 0 dBW = 30 dBm = 1 W, and you convert by adding or subtracting 30.',
        },
        {
          question: 'How many watts is one horsepower?',
          answer: '745.6998715822702 W, from the definition 550 ft·lbf/s with 1 ft = 0.3048 m, 1 lb = 0.45359237 kg and g = 9.80665 m/s². Metric horsepower (PS) is a different unit, 735.49875 W, and is not offered here to avoid mixing the two.',
        },
      ]}
    >
      <PowerConverter />
    </ToolPageShell>
  );
}
