import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import ThicknessConverter from '@/tools/thickness-converter/Calculator';
import { tool } from '@/tools/thickness-converter';
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

export default function ThicknessConverterPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p className="formula-expression">value in target unit = value x factor(from) / factor(to)</p>
          <p className="formula-expression">1 in = 25.4 mm exactly</p>
          <p className="formula-expression">1 mil = 0.001 in exactly</p>
          <p className="formula-expression">1 Å = 0.1 nm = 1e-10 m exactly</p>
          <ul className="info-list">
            <li>
              <strong>Factor</strong> — how many millimetres one of that unit holds, kept in one table shared by every
              metrology, layout and conversion tool, so a factor is written down exactly once.
            </li>
            <li>
              <strong>Å (ångström)</strong> — the unit thermal oxides are quoted in, and 10 Å is exactly 1 nm.
            </li>
            <li>
              <strong>mil</strong> — a thousandth of an inch, used for wafer thickness and wire diameters, and not the
              same as a millimetre.
            </li>
          </ul>
        </>
      }
      notes={[
        'The inch, mil and ångström conversions are exact by definition, so those rows carry no rounding at all; the micrometre and nanometre rows are decimal powers of a metre.',
        'A negative length is rejected rather than converted, because a thickness or a length below zero is a sign that something upstream went wrong.',
        'The value is carried through millimetres internally, so a conversion between two non-metric units — mil to ångström, say — is exact to floating-point precision rather than doubling the error of two rounded constants.',
        'Thickness and length convert with the same factors. This tool does not convert a growth or removal rate, which is a length per unit time and needs the time dimension as well.',
      ]}
      faq={[
        {
          question: 'How many nanometres is 10 ångström?',
          answer: 'Exactly 1 nm. One ångström is defined as 0.1 nm, so the conversion is a decimal shift, not a rounded approximation. A gate oxide quoted as 10 Å and one quoted as 1 nm are the same thickness, and a 10 kÅ oxide is 1000 nm.',
        },
        {
          question: 'Is a micron the same as a micrometre?',
          answer: 'Yes. Micron is a colloquial name for the micrometre, so 1 micron equals 1 µm, which is 1000 nm or 10 000 Å. The name micron is discouraged in formal writing but is still common on the fab floor.',
        },
        {
          question: 'What is a mil, and is it a millimetre?',
          answer: 'A mil is a thousandth of an inch, so it is 25.4 µm — about 25 times smaller than a millimetre. Wafer thickness and bond wire diameters are often quoted in mils, and confusing a mil with a millimetre is a factor-of-25 error, which is why every field here carries its unit.',
        },
        {
          question: 'Which unit should I quote a film thickness in?',
          answer: 'Follow the convention of the process: thermal oxides in ångström, deposited and grown films in nanometres, wafer thickness in micrometres or mils, and long dimensions in millimetres. The number is only half the measurement, so keep the unit with it, which is also why this page shows every unit at once rather than making you convert twice.',
        },
      ]}
    >
      <ThicknessConverter />
    </ToolPageShell>
  );
}
