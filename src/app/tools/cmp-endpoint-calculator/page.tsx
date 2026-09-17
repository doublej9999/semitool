import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import CmpEndpointCalculator from '@/tools/cmp-endpoint-calculator/Calculator';
import { tool } from '@/tools/cmp-endpoint-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/cmp-endpoint-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function CmpEndpointCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Motor Current & Friction Endpoint Timing'), math: 't_{\\text{endpoint}} = \\frac{d_0}{\\text{RR}} \\times 60\\,\\text{s}, \\quad t_{\\text{total}} = t_{\\text{endpoint}} + t_{\\text{delay}} + t_{\\text{endpoint}} \\left(\\frac{\\text{OP}\\%}{100}\\right)' },
        { kind: 'math', label: msg('Optical Reflectometry Fringe Thickness & Period'), math: '\\Delta d = \\frac{\\lambda}{2n}, \\quad T = \\frac{\\lambda}{2n \\cdot \\text{RR}} \\times 60\\,\\text{s}, \\quad f = \\frac{1}{T}' },
        { kind: 'math', label: msg('Diamond Conditioning Pad Wear Rate per Wafer'), math: 'w_{\\text{wafer}} = \\text{CutRate} \\times \\left(\\frac{t_{\\text{cond}}}{3600}\\right) \\,[\\mu\\text{m/wafer}]' },
        { kind: 'math', label: msg('Pad Groove Depth Decay & Lifetime Constraint'), math: 'd_{\\text{groove}}(N) = d_{\\text{initial}} - N \\cdot w_{\\text{wafer}} \\ge d_{\\text{min}}' },
        { kind: 'list', items: [msg('**Interfacial Friction Shift** — As the top film (e.g. copper, tungsten, or TEOS) clears to expose an underlying barrier/stop layer (e.g. TaN, TiN, or SiN), the friction coefficient μ between the wafer and polyurethane pad shifts abruptly, creating a distinct step in motor drive current or platen torque.'), msg('**Fabry-Pérot Optical Interference** — Normal-incidence monochromatic laser light reflects from both the top film surface and the underlying substrate. Thinning of the film changes the optical path difference Δ = 2nd, producing constructive and destructive interference sinusoidal fringes with period T = λ / (2n · RR).'), msg('**Pad Glazing & Groove Transport** — Diamond conditioning abrades the pad to reopen collapsed micropores and prevent glazing. However, this cut rate continuously erodes groove depth; once grooves reach d_min (typically 0.25–0.35 mm), slurry transport fails, causing hydroplaning, temperature spikes, and severe within-wafer non-uniformity (WIWNU).')] },
      ]}
      notes={[
        msg('Optical endpoint period assumes normal beam incidence. For oblique angle lasers (e.g. angle of refraction θ_t), the fringe period scales with cos(θ_t): Δd = λ / (2n cos θ_t).'),
        msg('Motor current endpoint detection utilizes low-pass filtering and first/second derivative algorithms to prevent false triggering from friction spikes during platen oscillation.'),
        msg('Conditioning cut rate is typically measured via pad depth dial gauges or eddy current sensors across concentric zones to monitor pad profile flatness (crowning vs. dishing).'),
        msg('Effective pad life is the lower bound between mechanical groove depth exhaustion and the qualified wafer count warranty limit.'),
      ]}
      faq={[
        {
          question: msg('How does motor current endpoint detection work during CMP?'),
          answer:
            msg('During CMP, the platen and carrier motors maintain precise rotational velocity under constant downforce. The mechanical torque required is directly proportional to the coefficient of friction (COF) between the pad, slurry, and wafer surface. When a film clears and exposes a different material (e.g. Cu clearing to Ta/TaN barrier), the friction shifts abruptly, causing a measurable step change in motor current.'),
        },
        {
          question: msg('Why does optical reflectometry produce sinusoidal fringes during polishing?'),
          answer:
            msg('Optical endpoint systems shine a laser beam (commonly 633 nm He-Ne or 670 nm laser diode) through an optical window in the platen. Reflections from the top film surface and the substrate interfere constructively when optical path difference 2nd is an integer multiple of λ, and destructively at half-integers. As the film thins at constant removal rate, the reflected intensity oscillates sinusoidally with each cycle representing a thickness removal of Δd = λ / (2n).'),
        },
        {
          question: msg('What is the role of pad conditioning and diamond disc wear?'),
          answer:
            msg('During polishing, abrasive nanoparticles and removed byproducts compact and smooth the polyurethane pad asperities—a failure mechanism known as pad glazing that drops removal rates. An in situ or ex situ diamond conditioner disc continually cuts away glazed polyurethane to dress and regenerate fresh micro-texture and slurry pockets.'),
        },
        {
          question: msg('What happens when pad groove depth falls below the minimum specification?'),
          answer:
            msg('Pad grooves (concentric, XY, or radial channels) act as high-capacity conduits that deliver fresh slurry uniformly across the wafer and purge polishing debris. When conditioning wears the groove depth below ~0.3 mm, slurry starvation occurs beneath the wafer center, causing catastrophic removal rate decay, wafer scratching, thermal runaway, and hydroplaning.'),
        },
      ]}
    >
      <CmpEndpointCalculator />
    </ToolPageShell>
  );
}
