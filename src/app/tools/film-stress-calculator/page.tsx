
import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import FilmStressCalculator from '@/tools/film-stress-calculator/Calculator';
import { tool } from '@/tools/film-stress-calculator';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
  keywords: tool.keywords,
  alternates: { canonical: tool.path },
  openGraph: {
    title: tool.name + ' — SemiTools',
    description: tool.description,
    url: absoluteUrl(tool.path),
    type: 'website',
  },
};

export default function FilmStressCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p className="formula-expression">Stress = M_s x t_s squared / (6 x t_f x R)</p>
          <p className="formula-expression">M_s = E_s / (1 - nu_s)</p>
          <p className="formula-expression">R = (L squared / 4 + d squared) / (2 d)</p>
          <ul className="info-list">
            <li>
              <strong>Biaxial modulus</strong> — the substrate stiffness that enters Stoney, the Young modulus divided
              by one minus the Poisson ratio. It is not the Young modulus on its own.
            </li>
            <li>
              <strong>Curvature radius</strong> — how tightly the wafer bends. It can be entered directly or computed
              from a bow measured over a scan.
            </li>
            <li>
              <strong>Bow</strong> — the height difference between the centre and the chord across a scan of length L,
              also called the sagitta. It sets the radius through the chord-and-sagitta geometry.
            </li>
          </ul>
        </>
      }
      notes={[
        'The Stoney relation assumes the film is much thinner than the substrate and that the bending stays small. The tool prints the film-to-substrate thickness ratio it used and warns above one percent, where Stoney underestimates the stress of a stiff film.',
        'The curvature radius is computed from a bow with the exact chord-and-sagitta relation rather than the small-deflection form L squared over 8 d, so a strongly bowed wafer is not turned into a falsely high curvature.',
        'The type of stress is a selection, not something derived from a signed curvature. Curvature sign conventions differ between metrology tools, so guessing would be worse than asking. The magnitude comes from Stoney and the direction comes from which way the wafer curved.',
        'The biaxial modulus presets are handbook elastic constants for the bulk material. The biaxial modulus of a single crystal depends on orientation, so set the Young modulus and Poisson ratio from your own data when the number matters.',
        'The tool reports one curvature for one measurement point. Stress in a real film varies across the wafer, so a single radius describes the spot it was measured at, not the whole film.',
      ]}
      faq={[
        {
          question: 'Why does Stoney use the biaxial modulus and not the Young modulus?',
          answer:
            'Because a film on a substrate is held in plane by the substrate and cannot contract freely in either in-plane direction once it is bonded. That biaxial constraint is what stiffens the response, and it enters as the Young modulus divided by one minus the Poisson ratio. Using the Young modulus alone overestimates the stress by that factor, which is about 1.39 for silicon.',
        },
        {
          question: 'How do I get the radius of curvature from a bow measurement?',
          answer:
            'A bow is the height difference between the centre of the wafer and a chord drawn across a scan of a known length, and the chord and sagitta geometry converts it to a radius with R equals the square of the scan length over four plus the bow squared, all over twice the bow. That is exact for a circular arc; the familiar scan length squared over eight times the bow is the small-deflection approximation, and this tool uses the exact form.',
        },
        {
          question: 'When is Stoney no longer good enough?',
          answer:
            'When the film is not thin compared with the substrate. The film contributes its own stiffness once it is a noticeable fraction of the substrate, and Stoney, which treats it as a stress with no stiffness, then underestimates the stress. A common rule of thumb is to stay below one percent of the substrate thickness; above that the tool warns and points you at a two-layer model.',
        },
        {
          question: 'Does the tool tell me whether the film is in tension or compression?',
          answer:
            'It reports the type from the curvature direction you select and the magnitude from Stoney, and it keeps the two separate on purpose. The formula itself gives a magnitude; whether the film is in tension or compression depends on which way the wafer curved, and different metrology tools report the sign of curvature with different conventions. Selecting the direction makes the assumption visible instead of hiding it in a sign.',
        },
      ]}
    >
      <FilmStressCalculator />
    </ToolPageShell>
  );
}
