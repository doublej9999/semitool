import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import FilmColorCalculator from '@/tools/film-color-calculator/Calculator';
import { tool } from '@/tools/film-color-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function FilmColorCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <MathFormula
            block
            label="Constructive Thin-Film Interference Condition"
            math="2 n d \cos(\theta_t) = \left(m + \frac{1}{2}\right) \lambda"
          />
          <MathFormula
            block
            label="Refraction Angle (Snell's Law)"
            math="\sin(\theta_t) = \frac{\sin(\theta_i)}{n}"
          />
          <MathFormula
            block
            label="Optical Phase Shift per Pass"
            math="\delta = \frac{2\pi}{\lambda} n d \cos(\theta_t)"
          />
          <MathFormula
            block
            label="Normal Incidence Reflectance"
            math="R = \left| \frac{r_1 + r_2 e^{-2j\delta}}{1 + r_1 r_2 e^{-2j\delta}} \right|^2"
          />
<ul className="info-list">
            <li>
              <strong>R(λ)</strong> — Airy specular power reflectance for a single transparent dielectric film
              on a semi-infinite silicon substrate at normal incidence.
            </li>
            <li>
              <strong>δ (Phase Thickness)</strong> — round-trip optical phase delay across the dielectric film of
              thickness <em>d</em> with refractive index <em>n₁</em> at wavelength <em>λ</em>.
            </li>
            <li>
              <strong>r₀₁, r₁₂</strong> — Fresnel normal-incidence amplitude reflection coefficients at the
              air/film and film/silicon interfaces.
            </li>
            <li>
              <strong>CIE 1931 & D65</strong> — The apparent eye color is obtained by integrating the reflected
              power spectrum against CIE D65 standard daylight and CIE 1931 2° color matching functions
              (x̄, ȳ, z̄), then converting to calibrated sRGB color space with standard IEC gamma companding.
            </li>
          </ul>
        </>
      }
      notes={[
        'The simulation assumes normal incidence (θ = 0°) under white diffuse daylight (CIE Standard Illuminant D65). When viewing a real wafer tilted at an angle, the optical path length increases as d / cos(θ_film), shifting the constructive peaks towards shorter wavelengths (blue-shift).',
        'Refractive indices used: thermal SiO₂ (n ≈ 1.46), Si₃N₄ (n ≈ 2.00), TiO₂ (n ≈ 2.50). Silicon substrate dispersion follows the empirical Cauchy visible model n_Si(λ) = 3.5 + 2e5 / λ² (nm).',
        'Absorption in thin SiO₂ and stoichiometric Si₃N₄ across the visible spectrum (380–750 nm) is negligible (extinction coefficient k ≈ 0). For highly absorbing or metallic films, complex Fresnel equations with extinction k must be used.',
        'Visual color perception varies with display calibration, ambient room lighting, wafer surface roughness, and viewing angle. Cleanroom amber/yellow lighting will filter out blue wavelengths, shifting perceived color toward orange/red.',
        'Pliskin color names correspond to the classic IBM thermal oxide thickness chart compiled by W. A. Pliskin and E. E. Conrad (1964). Higher thickness orders exhibit cycling colors with decreasing saturation.',
      ]}
      faq={[
        {
          question: 'Why do thermal oxide films on silicon show vivid colors?',
          answer:
            'When ambient white light strikes a transparent silicon dioxide film on silicon, light reflects from both the top surface (air-oxide) and the bottom surface (oxide-silicon). Because the film thickness is comparable to the wavelengths of visible light (400–700 nm), the two reflected waves interfere. Wavelengths whose round-trip phase difference matches constructive interference are strongly reflected, while wavelengths that interfere destructively are extinguished. The surviving spectral mixture produces the characteristic interference hue.',
        },
        {
          question: 'How do I distinguish first-order from higher-order colors?',
          answer:
            'Thin film interference colors cycle through repeated "orders" as thickness increases by half-wave optical thickness increments (λ / 2n, roughly 200–250 nm for SiO₂). First-order colors (under ~450 nm) have very distinct, saturated hues (such as vivid cobalt blue at 100 nm or bright carnation pink at 280 nm). Higher-order films (above 700 nm) simultaneously support multiple constructive peaks in different regions of the visible spectrum, making the reflected color appear paler, more pastel, or grayish-green.',
        },
        {
          question: 'Why does the color change when I tilt the wafer?',
          answer:
            'Tilting the wafer increases the angle of incidence. Inside the dielectric film, Snell’s law bends the light, shortening the relative phase difference between successive reflections by a factor of cos(θ_film). This shifts the interference fringes toward shorter wavelengths, so a red or pink film will shift toward yellow, and yellow will shift toward green or blue as the wafer is tilted away from the normal.',
        },
        {
          question: 'Can I use this calculator for silicon nitride (Si₃N₄)?',
          answer:
            'Yes. Selecting Silicon Nitride (n ≈ 2.00) automatically scales the optical phase thickness. Because Si₃N₄ has a higher refractive index than SiO₂ (2.00 vs 1.46), the same optical path length and interference color is reached at a thinner physical thickness (d_Si3N4 ≈ d_SiO2 × 1.46 / 2.00).',
        },
        {
          question: 'How accurate is visual inspection compared to ellipsometry or reflectometry?',
          answer:
            'An experienced wafer fab operator can estimate thermal oxide thickness within ±5 to 10 nm by eye using a calibrated Pliskin color chart under standardized cleanroom lighting. However, visual color inspection has ambiguities between different interference orders (e.g. 280 nm vs 490 nm pinks) and cannot measure refractive index or absorption. Spectroscopic ellipsometry or optical reflectometry is always required for precision metrology.',
        },
      ]}
    >
      <FilmColorCalculator />
    </ToolPageShell>
  );
}
