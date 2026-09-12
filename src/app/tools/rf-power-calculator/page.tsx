
import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import RfPowerCalculator from '@/tools/rf-power-calculator/Calculator';
import { tool } from '@/tools/rf-power-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function RfPowerCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Ohmic RF Power & RMS Voltage"
            math="P = \frac{V_{\text{rms}}^2}{R} \iff V_{\text{rms}} = \sqrt{P \cdot R}"
          />
          <MathFormula
            block
            label="Sinusoidal Peak and Peak-to-Peak Voltages"
            math="V_{\text{peak}} = \sqrt{2} \cdot V_{\text{rms}}, \quad V_{\text{pp}} = 2\sqrt{2} \cdot V_{\text{rms}}"
          />
          <MathFormula
            block
            label="Decibel-Milliwatt Conversion"
            math="P\,[\text{dBm}] = 10 \log_{10}\left( \frac{P}{1\,\text{mW}} \right)"
          />
<ul className="info-list">
            <li>
              <strong>Impedance matters</strong> — a voltage only becomes a power once the load is known, so the system
              impedance is an input rather than a hard-coded 50 Ω.
            </li>
            <li>
              <strong>RMS, peak and peak-to-peak</strong> — a sine wave has V_pp = 2√2 × V_rms, so 1 W into 50 Ω is
              7.071 V RMS, 10 V peak or 20 V peak-to-peak.
            </li>
            <li>
              <strong>dBm and dBW</strong> — the level referred to 1 mW and 1 W, 30 dB apart.
            </li>
          </ul>
        </>
      }
      notes={[
        'Power is turned into a voltage through the load, not by a fixed constant: V_rms = √(P R). Changing the system impedance changes the voltage for the same power, which is why 50 Ω, 75 Ω and a custom value are all selectable.',
        'The wave is assumed to be a sine. For a modulated or non-sinusoidal signal the peak-to-peak reading on a meter depends on the crest factor, so the peak and peak-to-peak rows describe a CW sine of that power, not the envelope of a complex waveform.',
        'RMS is the heating-equivalent value, so V_rms is the number a power meter and a thermal argument use; peak is what a device breakdown or a peak-voltage rating cares about, and peak-to-peak is what an oscilloscope shows.',
        'The load is treated as real. A reactive load reflects power instead of absorbing it, which is a mismatch problem rather than a conversion one; the return loss and VSWR calculator covers that case.',
        '0 dBm into 50 Ω is 223.6 mV RMS, the reference point almost every RF chain is described against.',
      ]}
      faq={[
        {
          question: 'How many volts is 0 dBm into 50 ohms?',
          answer: '223.6 mV RMS. 0 dBm is 1 mW, and V_rms = √(0.001 × 50) = 0.2236 V. Peak is 316.2 mV and peak-to-peak is 632.5 mV for the same sine. The 223.6 mV RMS figure is the standard reference an RF chain is measured against.',
        },
        {
          question: 'Why do I need to enter the impedance?',
          answer: 'Because power and voltage are linked through the load. The same 1 V RMS is 20 mW into 50 Ω but 13.3 mW into 75 Ω and 1.67 mW into 600 Ω. Only in a 50 Ω system can you assume the usual 223.6 mV per 0 dBm; anywhere else the impedance has to be stated.',
        },
        {
          question: 'What is the difference between V RMS and V peak-to-peak?',
          answer: 'For a sine, V_pp = 2√2 × V_rms, about 2.828 times the RMS value. V RMS is the heating-equivalent value, V peak is the crest, and V peak-to-peak spans both extremes. A 1 W signal into 50 Ω is 7.071 V RMS, 10 V peak and 20 V peak-to-peak.',
        },
        {
          question: 'Can I use this for a signal generator setting?',
          answer: 'Yes for a sine into a matched real load, which is what a generator is normally specified against. If the load is not matched, some of the incident power is reflected and the delivered power is lower than the setting; use the return loss calculator to work out the delivered fraction, and treat this tool as the ideal matched case.',
        },
      ]}
    >
      <RfPowerCalculator />
    </ToolPageShell>
  );
}
