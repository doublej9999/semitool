import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import ThroughputCalculator from '@/tools/throughput-calculator/Calculator';
import { tool } from '@/tools/throughput-calculator';
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

export default function ThroughputCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Theoretical Chamber WPH"
            math="\text{WPH}_{\text{theoretical}} = \frac{60}{t_{\text{process}}\,[\text{min}]} \times N_{\text{chambers}}"
          />
          <MathFormula
            block
            label="Effective Tool Throughput"
            math="\text{WPH}_{\text{effective}} = \text{WPH}_{\text{theoretical}} \times A \times P"
          />
          <MathFormula
            block
            label="Good Wafers per Hour"
            math="\text{WPH}_{\text{good}} = \text{WPH}_{\text{effective}} \times Q"
          />
          <MathFormula
            block
            label="Overall Equipment Effectiveness (OEE)"
            math="\text{OEE} = A \times P \times Q"
          />
          <MathFormula
            block
            label="Daily Net Production Capacity"
            math="\text{Wafers}_{\text{daily}} = \text{WPH}_{\text{good}} \times 24"
          />
<ul className="info-list">
            <li>
              <strong>Availability</strong> — share of calendar time the equipment is up and ready, not down for repair
              or maintenance.
            </li>
            <li>
              <strong>Performance</strong> — the actual rate relative to the ideal rate, covering small stops and slower
              running.
            </li>
            <li>
              <strong>Quality</strong> — the share of output that is good, for example the step yield.
            </li>
          </ul>
        </>
      }
      notes={[
        'This models one process step in isolation, at a steady rate. It ignores queue time, batching, recipe changes and any waiting between steps.',
        'A real flow is set by its bottleneck step, so the output of a line is the slowest step, not the sum or the average of the individual step rates.',
        'Availability, performance and quality are inputs you supply as percentages of the ideal, so the OEE shown is exactly their product. Measure them for your own tool rather than assuming defaults.',
        'Process time here is the ideal time per wafer in one chamber. If your equipment processes wafers in a batch, or has a transfer overhead that is not part of the ideal time, fold it in before entering the number.',
      ]}
      faq={[
        {
          question: 'What is OEE and how is it calculated?',
          answer:
            'Overall Equipment Effectiveness combines three losses into one number: availability (is the tool up?), performance (is it running at rate?) and quality (is the output good?). It is their product, so a tool that is 90% available, runs at 95% of ideal rate and yields 97% has an OEE of about 82.9%.',
        },
        {
          question: 'Why is effective throughput lower than theoretical throughput?',
          answer:
            'Theoretical wafers per hour assumes the tool never stops and always runs at its ideal rate. Effective throughput multiplies that by availability and performance, which account for downtime, maintenance, small stops and running below the ideal rate. Good throughput then also multiplies by quality to count only wafers that pass.',
        },
        {
          question: 'Can I use this for a whole process flow?',
          answer:
            'Not directly. This tool models a single step. To reason about a flow, compute the throughput of each step and take the bottleneck — the lowest rate — as the line capability, then allow for the queue time and variability between steps. Adding step rates together would overstate the output.',
        },
        {
          question: 'Does the chamber count multiply throughput?',
          answer:
            'Yes, for identical parallel chambers. Each chamber processes one wafer in the stated process time, so N chambers give N times the ideal rate. If the chambers share a robot or a load port that becomes the limit, this simple model will overstate the output.',
        },
      ]}
    >
      <ThroughputCalculator />
    </ToolPageShell>
  );
}
