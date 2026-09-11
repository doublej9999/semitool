import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import ProcessCapabilityCalculator from '@/tools/process-capability-calculator/Calculator';
import { tool } from '@/tools/process-capability-calculator';
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

export default function ProcessCapabilityCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p className="formula-expression">Cp = (USL - LSL) / (6 x sigma)</p>
          <p className="formula-expression">CPU = (USL - mean) / (3 x sigma)</p>
          <p className="formula-expression">CPL = (mean - LSL) / (3 x sigma)</p>
          <p className="formula-expression">Cpk = min(CPU, CPL)</p>
          <p className="formula-expression">Out of spec = P(X &lt; LSL) + P(X &gt; USL)</p>
          <ul className="info-list">
            <li>
              <strong>Cp</strong> — how wide the specification window is compared with 6 sigma. Needs both limits, so it
              ignores how far off-centre the process runs.
            </li>
            <li>
              <strong>Cpk</strong> — the same idea but measured to the nearer limit, so it also captures off-centring.
              With a single limit Cpk is that side&apos;s index.
            </li>
            <li>
              <strong>Out of spec</strong> — the tail areas of the normal distribution beyond each limit, reported in ppm.
            </li>
            <li>
              <strong>Sigma level</strong> — 3 x Cpk, a widely used shorthand; no 1.5 sigma shift is applied here.
            </li>
          </ul>
        </>
      }
      notes={[
        'The sigma you enter decides whether these are Cp/Cpk or Pp/Ppk. Cp and Cpk use a short-term (within-subgroup) sigma; the same formulas on a long-term (overall) sigma are Pp and Ppk. This calculator does not guess which one you have.',
        'The out-of-spec fraction assumes the characteristic is normally distributed. A skewed or multi-modal process can have very different tail probabilities even at the same mean and sigma.',
        'No 1.5 sigma shift is applied. The shift is a convention some organisations use when reporting sigma levels, not a property of your process, so it is left out.',
        'This is a generic calculation and may not match a specific customer, automotive, medical or fab specification. Always follow the specification that applies to your product.',
      ]}
      faq={[
        {
          question: 'What is a good Cpk value?',
          answer:
            'There is no universal answer. Many industries cite Cpk >= 1.33 as a common minimum, and higher values for safety-critical parts, but that is a convention used in supplier requirements rather than a standard that applies everywhere. Always use the target your customer or internal quality system specifies.',
        },
        {
          question: 'Should I use Cp/Cpk or Pp/Ppk?',
          answer:
            'They are the same formulas on different sigmas. Cp/Cpk use a short-term sigma that reflects only the variation within subgroups, so they describe the process potential. Pp/Ppk use the long-term sigma, which includes drift between subgroups, so they describe actual performance. Enter the sigma that matches the question you are asking.',
        },
        {
          question: 'How do I handle a one-sided specification?',
          answer:
            'Leave the limit you do not have blank. The calculator then reports only that side: Cpk equals CPU for an upper limit only, or CPL for a lower limit only, and Cp comes back as a dash because it needs both limits.',
        },
        {
          question: 'Why is my Cpk negative?',
          answer:
            'Cpk goes negative when the process mean sits outside a specification limit, so more than half of the distribution is out of spec. That is a real result, not an error, and it signals the process is off-target rather than merely too variable.',
        },
      ]}
    >
      <ProcessCapabilityCalculator />
    </ToolPageShell>
  );
}
