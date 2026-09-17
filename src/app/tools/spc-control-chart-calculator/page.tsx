
import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import SpcControlChartCalculator from '@/tools/spc-control-chart-calculator/Calculator';
import { tool } from '@/tools/spc-control-chart-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/spc-control-chart-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function SpcControlChartCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('X-bar Control Limits'), math: '\\text{UCL}_{\\bar{X}} / \\text{LCL}_{\\bar{X}} = \\bar{\\bar{X}} \\pm A_2 \\bar{R}' },
        { kind: 'math', label: msg('Range Chart Control Limits'), math: '\\text{UCL}_R = D_4 \\bar{R}, \\quad \\text{LCL}_R = D_3 \\bar{R}' },
        { kind: 'math', label: msg('Within-Subgroup Standard Deviation'), math: '\\hat{\\sigma} = \\frac{\\bar{R}}{d_2}' },
        { kind: 'math', label: msg('Western Electric Run Rule'), math: '7 \\text{ consecutive points on one side of center line } \\bar{\\bar{X}}' },
        { kind: 'list', items: [msg('**X̿** — the grand mean, the average of the subgroup means.'), msg('**R̄** — the mean of the subgroup ranges, which measures the routine spread.'), msg('**A₂, D₃, D₄, d₂** — the standard Shewhart constants for the subgroup size, taken from the tabulated distribution of the range.')] },
      ]}
      notes={[
        msg('The limits come from the variation inside the subgroups, so a slow drift spreads the subgroup means but not the ranges. That is what makes the chart able to detect a shift: the limits describe how much the mean would wander if only chance were acting.'),
        msg('An in-control chart is a stability statement, not a capability statement. The limits are built from the process itself, so a process can sit comfortably inside its control limits while producing parts well outside the specification. Capability needs the specification and lives in the process capability calculator.'),
        msg('The constants in the table depend on the subgroup size, which is why every subgroup must hold the same number of readings. Mixing sizes would make the range mean meaningless, so the tool refuses it instead of averaging over different sizes.'),
        msg('The run rule is the second Western Electric rule: seven consecutive points on one side of the centre line. It catches a small sustained shift that no single point exceeds the limits, which is exactly the kind of drift that a fab sees before a yield loss shows up.'),
        msg('The table covers subgroup sizes 2 to 10. Below 2 there is no range, and above 10 the constants change slowly but the table is no longer the standard one; larger subgroups also lose the sensitivity to shifts that makes the chart useful.'),
      ]}
      faq={[
        {
          question: msg('What is the difference between control limits and specification limits?'),
          answer:
            msg('Control limits are computed from the process data and describe what the process naturally does. Specification limits come from the customer or the design and describe what is acceptable. Control limits are usually far tighter than specification limits, and a point outside the control limits means the process changed, not that a unit was rejected.'),
        },
        {
          question: msg('Why use a range chart as well as a mean chart?'),
          answer:
            msg('Because a shift in spread and a shift in the mean need different responses. The mean chart tracks where the process is centred, the range chart tracks how consistent it is. If the range chart shows out-of-control points first, the mean limits are themselves suspect, since the limits are built from the mean range.'),
        },
        {
          question: msg('Why does the R chart often have no lower limit?'),
          answer:
            msg('Because D₃ is zero for subgroup sizes below seven. The distribution of the range is skewed and the lower tail is bounded at zero, so the standard table sets the lower limit to zero for small subgroups: there is no point at which an unusually consistent range is a signal worth acting on.'),
        },
        {
          question: msg('What is the within-subgroup sigma for?'),
          answer:
            msg('It is the short-term standard deviation estimated from the mean range rather than from all the readings pooled, so it excludes drift between subgroups. That is the sigma a capability calculation wants, because pooling the data would include the drift and inflate sigma, which would understate the capability.'),
        },
      ]}
    >
      <SpcControlChartCalculator />
    </ToolPageShell>
  );
}
