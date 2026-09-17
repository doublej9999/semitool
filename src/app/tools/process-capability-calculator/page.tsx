import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import ProcessCapabilityCalculator from '@/tools/process-capability-calculator/Calculator';
import { tool } from '@/tools/process-capability-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/process-capability-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function ProcessCapabilityCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Potential Process Capability'), math: 'C_p = \\frac{\\text{USL} - \\text{LSL}}{6\\sigma}' },
        { kind: 'math', label: msg('Upper Process Capability Index'), math: 'C_{\\text{pu}} = \\frac{\\text{USL} - \\mu}{3\\sigma}' },
        { kind: 'math', label: msg('Lower Process Capability Index'), math: 'C_{\\text{pl}} = \\frac{\\mu - \\text{LSL}}{3\\sigma}' },
        { kind: 'math', label: msg('Demonstrated Performance Index'), math: 'C_{pk} = \\min(C_{\\text{pu}}, C_{\\text{pl}})' },
        { kind: 'math', label: msg('Out of Specification Probability'), math: 'P(\\text{OOS}) = \\Phi\\left( \\frac{\\text{LSL} - \\mu}{\\sigma} \\right) + \\left[ 1 - \\Phi\\left( \\frac{\\text{USL} - \\mu}{\\sigma} \\right) \\right]' },
        { kind: 'list', items: [msg('**Cp** — how wide the specification window is compared with 6 sigma. Needs both limits, so it ignores how far off-centre the process runs.'), msg('**Cpk** — the same idea but measured to the nearer limit, so it also captures off-centring. With a single limit Cpk is that side\'s index.'), msg('**Out of spec** — the tail areas of the normal distribution beyond each limit, reported in ppm.'), msg('**Sigma level** — 3 x Cpk, a widely used shorthand; no 1.5 sigma shift is applied here.')] },
      ]}
      notes={[
        msg('The sigma you enter decides whether these are Cp/Cpk or Pp/Ppk. Cp and Cpk use a short-term (within-subgroup) sigma; the same formulas on a long-term (overall) sigma are Pp and Ppk. This calculator does not guess which one you have.'),
        msg('The out-of-spec fraction assumes the characteristic is normally distributed. A skewed or multi-modal process can have very different tail probabilities even at the same mean and sigma.'),
        msg('No 1.5 sigma shift is applied. The shift is a convention some organisations use when reporting sigma levels, not a property of your process, so it is left out.'),
        msg('This is a generic calculation and may not match a specific customer, automotive, medical or fab specification. Always follow the specification that applies to your product.'),
      ]}
      faq={[
        {
          question: msg('What is a good Cpk value?'),
          answer:
            msg('There is no universal answer. Many industries cite Cpk >= 1.33 as a common minimum, and higher values for safety-critical parts, but that is a convention used in supplier requirements rather than a standard that applies everywhere. Always use the target your customer or internal quality system specifies.'),
        },
        {
          question: msg('Should I use Cp/Cpk or Pp/Ppk?'),
          answer:
            msg('They are the same formulas on different sigmas. Cp/Cpk use a short-term sigma that reflects only the variation within subgroups, so they describe the process potential. Pp/Ppk use the long-term sigma, which includes drift between subgroups, so they describe actual performance. Enter the sigma that matches the question you are asking.'),
        },
        {
          question: msg('How do I handle a one-sided specification?'),
          answer:
            msg('Leave the limit you do not have blank. The calculator then reports only that side: Cpk equals CPU for an upper limit only, or CPL for a lower limit only, and Cp comes back as a dash because it needs both limits.'),
        },
        {
          question: msg('Why is my Cpk negative?'),
          answer:
            msg('Cpk goes negative when the process mean sits outside a specification limit, so more than half of the distribution is out of spec. That is a real result, not an error, and it signals the process is off-target rather than merely too variable.'),
        },
      ]}
    >
      <ProcessCapabilityCalculator />
    </ToolPageShell>
  );
}
