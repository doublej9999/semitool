
import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import LithographyResolutionCalculator from '@/tools/lithography-resolution-calculator/Calculator';
import { tool } from '@/tools/lithography-resolution-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/lithography-resolution-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function LithographyResolutionCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'math', label: msg('Rayleigh Resolution Limit'), math: 'R = k_1 \\frac{\\lambda}{\\text{NA}}' },
        { kind: 'math', label: msg('Rayleigh Depth of Focus (DOF)'), math: '\\text{DOF} = k_2 \\frac{\\lambda}{\\text{NA}^2}' },
        { kind: 'list', items: [msg('**NA** — the numerical aperture of the lens, the sine of the largest half-angle it can collect, multiplied by the refractive index of the medium in the gap. Immersion replaces air with water and so raises NA past 1.'), msg('**k1** — how well the process uses the optics. 0.25 is the diffraction limit for a single exposure; production single-exposure processes sit near 0.28 to 0.35.'), msg('**k2** — the focus factor, near 0.5 in planning, times lambda over NA squared for the depth of focus.')] },
      ]}
      notes={[
        msg('Resolution here is the half pitch of a dense line and space pattern, the standard way the Rayleigh relation is quoted. It is not the smallest isolated feature and not the finished critical dimension, which also carries resist and etch bias.'),
        msg('The depth of focus expression is the paraxial estimate. It ignores resist thickness, substrate topography, aberrations and focus-control error, so the usable process window is smaller than the number printed here.'),
        msg('A k1 below the two-beam diffraction limit of 0.25 is flagged because a single exposure with plain illumination cannot reach it. Reaching it takes off-axis illumination, phase-shift masks, optical proximity correction or splitting the layer across two exposures.'),
        msg('Wavelength presets are the common exposure sources, from the mercury lines through the KrF and ArF excimers to EUV at 13.5 nm. Any wavelength can be typed in instead.'),
        msg('The numerical aperture is checked against the practical 193 nm immersion ceiling. Values above it are rejected rather than silently accepted, because no lens reaches them.'),
      ]}
      faq={[
        {
          question: msg('What is k1 and why is 0.25 called the diffraction limit?'),
          answer:
            msg('k1 collects everything about the process other than the optics themselves: the illumination shape, the mask type, the resist. For a two-beam imaging system the smallest half pitch that can be formed is 0.25 times lambda over NA, so no amount of process tuning below that limit produces a resolved image in a single exposure. Real single-exposure processes run near 0.28 to 0.35, and going lower means adding resolution enhancement or splitting the layer.'),
        },
        {
          question: msg('Why does the depth of focus fall so quickly as the numerical aperture rises?'),
          answer:
            msg('The depth of focus goes as lambda over NA squared, so doubling the numerical aperture cuts it to a quarter. That is the trade behind high-NA lithography: resolution improves in direct proportion to NA, but the focus budget shrinks with the square of it, which puts more demand on the scanner focus control, the resist thickness and the wafer flatness.'),
        },
        {
          question: msg('How does immersion lithography beat the 193 nm wavelength?'),
          answer:
            msg('Immersion puts a liquid with a refractive index above 1 in the gap between the last lens and the wafer. The numerical aperture is the sine of the collection half-angle times that refractive index, so water at 1.44 lifts NA past 1 without changing the wavelength. Because resolution is lambda over NA, raising NA shrinks the printable half pitch the same way a shorter wavelength would.'),
        },
        {
          question: msg('Is the resolution this tool prints the final feature size?'),
          answer:
            msg('No. It is the optical half pitch a given wavelength and numerical aperture can form at the chosen k1. The finished critical dimension differs from the printed image because of resist development, etch bias and the mask proximity effects, so use this number to compare optical configurations, then take the real dimension from measurement.'),
        },
      ]}
    >
      <LithographyResolutionCalculator />
    </ToolPageShell>
  );
}
