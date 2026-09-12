import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import PressureConverter from '@/tools/pressure-converter/Calculator';
import { tool } from '@/tools/pressure-converter';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function PressureConverterPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Unit Factor Scaling"
            math="P_{\text{target}} = P_{\text{source}} \times \frac{\text{Factor}_{\text{source}}}{\text{Factor}_{\text{target}}}"
          />
          <MathFormula
            block
            label="Standard Atmosphere (Exact)"
            math="1\,\text{atm} = 101\,325\,\text{Pa}"
          />
          <MathFormula
            block
            label="Torr Definition (Exact)"
            math="1\,\text{Torr} = \frac{1}{760}\,\text{atm} \approx 133.322\,\text{Pa}"
          />
          <MathFormula
            block
            label="Bar Definition (Exact)"
            math="1\,\text{bar} = 100\,000\,\text{Pa} = 10^5\,\text{Pa}"
          />
          <MathFormula
            block
            label="Pound per Square Inch"
            math="1\,\text{psi} = 1\,\frac{\text{lbf}}{\text{in}^2} \approx 6894.757\,\text{Pa}"
          />
<ul className="info-list">
            <li>
              <strong>Torr</strong> — defined as 1/760 of an atmosphere, so 760 Torr is exactly one atmosphere by
              construction.
            </li>
            <li>
              <strong>mbar</strong> — exactly 100 Pa, the unit European vacuum practice is usually written in.
            </li>
            <li>
              <strong>psi</strong> — pounds-force per square inch, used for gas lines and hydraulics, and derived here
              from the exact pound-force rather than a rounded constant.
            </li>
          </ul>
        </>
      }
      notes={[
        'Every factor except psi is exact by definition. psi follows from exact definitions of the pound-force (4.448 221 615 260 5 N) and the square inch (645.16 mm²), so it is exact too, just less obviously so.',
        'The Torr and the millimetre of mercury are nearly identical but not the same: mmHg is a physical column-height definition and differs from the Torr in the seventh significant figure. This tool uses the Torr, the 1/760 atm definition.',
        'A pressure below zero is rejected. Absolute vacuum is zero, and a negative gauge reading means you entered a gauge pressure relative to atmosphere rather than an absolute pressure.',
        'This tool converts pressure only. A leak rate is a different quantity — pressure times volume per time, such as Torr·L/s or mbar·L/s — and does not convert with these factors.',
      ]}
      faq={[
        {
          question: 'How many Torr are in one atmosphere?',
          answer: 'Exactly 760. The Torr is defined as 1/760 of a standard atmosphere of 101 325 Pa, so 760 Torr is exactly one atmosphere and one Torr is 133.322 368 421 052 63 Pa. There is no rounding in that relationship.',
        },
        {
          question: 'Is a Torr the same as a millimetre of mercury?',
          answer: 'Not exactly, though the two agree to about seven significant figures. The millimetre of mercury is defined as the pressure of a 1 mm column of mercury under standard gravity, while the Torr is defined as 1/760 atm. For vacuum work the difference is far below instrument accuracy, but they are distinct definitions.',
        },
        {
          question: 'Which unit should I use for vacuum?',
          answer: 'Torr and mbar are both common: process vacuum is often written in Torr, European equipment often in mbar, and the SI unit is the pascal. Because 1 mbar is exactly 100 Pa and 1 Torr is 133.32 Pa, they are about three-quarters of a Torr apart, and mixing them up over a range of orders of magnitude is worth avoiding.',
        },
        {
          question: 'Why is psi not a round number of pascal?',
          answer: 'Because it is built from imperial definitions: one pound-force is exactly 4.448 221 615 260 5 N and one square inch is exactly 645.16 mm², so a psi works out to about 6894.76 Pa. The number is long, but it is exact rather than a rounded conversion constant.',
        },
      ]}
    >
      <PressureConverter />
    </ToolPageShell>
  );
}
