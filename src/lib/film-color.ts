/**
 * Thin Film Optical Reflectance and Visual Interference Color Calculator.
 *
 * Physics & Optics:
 * When white light illuminates a transparent thin dielectric film (e.g. SiO2, Si3N4, TiO2)
 * on a high-index silicon substrate, specular reflections from the top interface (air-film)
 * and bottom interface (film-silicon) undergo optical interference.
 *
 * For normal incidence (air n0 = 1, dielectric film n1, silicon substrate n2(lambda)):
 *   Amplitude reflection coefficients (Fresnel normal incidence):
 *     r01 = (n0 - n1) / (n0 + n1) = (1 - n1) / (1 + n1)
 *     r12(lambda) = (n1 - n2(lambda)) / (n1 + n2(lambda))
 *
 *   Optical phase thickness for film thickness d:
 *     delta(lambda) = (4 * pi * n1 * d) / lambda
 *
 *   Airy power reflectance R(lambda):
 *     R(lambda) = (r01^2 + r12^2 + 2*r01*r12*cos(delta)) / (1 + r01^2 * r12^2 + 2*r01*r12*cos(delta))
 *
 * Substrate Refractive Index:
 *   Silicon dispersion in visible spectrum (lambda in nm):
 *     n_si(lambda) = 3.5 + 2.0e5 / (lambda^2)
 *
 * Colorimetric Conversion:
 *   CIE 1931 2-degree Standard Colorimetric Observer color matching functions x_bar, y_bar, z_bar.
 *   Standard CIE D65 Illuminant relative spectral power distribution S(lambda).
 *   XYZ Tristimulus:
 *     X = (1/k) * sum_{lambda} S(lambda) * R(lambda) * x_bar(lambda)
 *     Y = (1/k) * sum_{lambda} S(lambda) * R(lambda) * y_bar(lambda)
 *     Z = (1/k) * sum_{lambda} S(lambda) * R(lambda) * z_bar(lambda)
 *     where k = sum_{lambda} S(lambda) * y_bar(lambda)
 *
 *   sRGB Conversion (ITU-R BT.709 linear matrix + sRGB companding):
 *     R_lin =  3.2406 * X - 1.5372 * Y - 0.4986 * Z
 *     G_lin = -0.9689 * X + 1.8758 * Y + 0.0415 * Z
 *     B_lin =  0.0557 * X - 0.2040 * Y + 1.0570 * Z
 */

export interface MaterialPreset {
  id: string;
  name: string;
  formula: string;
  refractiveIndex: number;
  description: string;
}

export const FILM_MATERIALS: MaterialPreset[] = [
  {
    id: 'sio2',
    name: 'Silicon Dioxide',
    formula: 'SiO₂',
    refractiveIndex: 1.46,
    description: 'Thermal oxide / PECVD oxide, standard passivation and gate dielectric (n ~ 1.46)',
  },
  {
    id: 'si3n4',
    name: 'Silicon Nitride',
    formula: 'Si₃N₄',
    refractiveIndex: 2.00,
    description: 'LPCVD/PECVD nitride, diffusion barrier and antireflective coating (n ~ 2.00)',
  },
  {
    id: 'tio2',
    name: 'Titanium Dioxide',
    formula: 'TiO₂',
    refractiveIndex: 2.50,
    description: 'High-index dielectric coating, optical filters and solar ARC (n ~ 2.50)',
  },
  {
    id: 'custom',
    name: 'Custom Dielectric',
    formula: 'Custom',
    refractiveIndex: 1.65,
    description: 'User-specified refractive index film',
  },
];

export interface SpectrumPoint {
  wavelengthNm: number;
  reflectance: number;
}

export interface FilmColorResult {
  ok: true;
  thicknessNm: number;
  refractiveIndex: number;
  opticalThicknessNm: number; // n * d
  hexColor: string; // e.g. "#5F5A74"
  rgb: { r: number; g: number; b: number };
  classicColorName: string;
  orderNumber: number;
  spectrum: SpectrumPoint[];
  constructivePeaks: number[];
  destructiveTroughs: number[];
  photopicReflectancePercent: number; // Y * 100
}

export interface FilmColorError {
  ok: false;
  error: string;
}

export type FilmColorCalculation = FilmColorResult | FilmColorError;

/**
 * Standard Pliskin / IBM Thermal Oxide visual color chart lookup table.
 * Bands mapped for standard SiO2 on Silicon under white diffuse lighting.
 */
export interface PliskinBand {
  minNm: number;
  maxNm: number;
  name: string;
  order: number;
  hexPreview: string;
}

export const PLISKIN_OXIDE_BANDS: PliskinBand[] = [
  { minNm: 0, maxNm: 10, name: 'Silicon Gray / Bare Silicon', order: 0, hexPreview: '#A3A5AB' },
  { minNm: 10, maxNm: 27, name: 'Tan', order: 1, hexPreview: '#B09F85' },
  { minNm: 27, maxNm: 53, name: 'Brown', order: 1, hexPreview: '#8E8982' },
  { minNm: 53, maxNm: 73, name: 'Dark Brown to Violet-Brown', order: 1, hexPreview: '#6E615D' },
  { minNm: 73, maxNm: 97, name: 'Royal Blue / Indigo', order: 1, hexPreview: '#4D587B' },
  { minNm: 97, maxNm: 110, name: 'Cobalt Blue', order: 1, hexPreview: '#575C7E' },
  { minNm: 110, maxNm: 150, name: 'Light Blue / Sky Blue', order: 1, hexPreview: '#6D8DA9' },
  { minNm: 150, maxNm: 180, name: 'Metallic Gray / Silver', order: 1, hexPreview: '#8F999D' },
  { minNm: 180, maxNm: 210, name: 'Light Gold / Pale Yellow', order: 1, hexPreview: '#A2A387' },
  { minNm: 210, maxNm: 240, name: 'Yellow-Orange', order: 1, hexPreview: '#A5926B' },
  { minNm: 240, maxNm: 270, name: 'Orange-Red', order: 1, hexPreview: '#997379' },
  { minNm: 270, maxNm: 300, name: 'Carnation Pink / Rose', order: 1, hexPreview: '#7C5B9F' },
  { minNm: 300, maxNm: 340, name: 'Violet-Purple / Violet', order: 1, hexPreview: '#51659E' },
  { minNm: 340, maxNm: 370, name: 'Blue-Green / Cyan', order: 1, hexPreview: '#608E9D' },
  { minNm: 370, maxNm: 410, name: 'Green-Yellow / Pale Green', order: 1, hexPreview: '#92A46C' },
  { minNm: 410, maxNm: 440, name: 'Yellow', order: 1, hexPreview: '#A79871' },
  { minNm: 440, maxNm: 470, name: 'Orange / Crimson', order: 1, hexPreview: '#976C77' },
  { minNm: 470, maxNm: 500, name: 'Carnation Pink (II Order)', order: 2, hexPreview: '#6E628D' },
  { minNm: 500, maxNm: 540, name: 'Violet-Blue (II Order)', order: 2, hexPreview: '#4D8597' },
  { minNm: 540, maxNm: 600, name: 'Blue-Green (II Order)', order: 2, hexPreview: '#5E9785' },
  { minNm: 600, maxNm: 680, name: 'Yellow-Green (II Order)', order: 2, hexPreview: '#8E9970' },
  { minNm: 680, maxNm: 720, name: 'Orange-Yellow (II Order)', order: 2, hexPreview: '#998471' },
  { minNm: 720, maxNm: 770, name: 'Violet-Red (III Order)', order: 3, hexPreview: '#7A627F' },
  { minNm: 770, maxNm: 820, name: 'Blue-Green (III Order)', order: 3, hexPreview: '#628988' },
  { minNm: 820, maxNm: 870, name: 'Green (III Order)', order: 3, hexPreview: '#759074' },
  { minNm: 870, maxNm: 1050, name: 'Complex / Muted Multi-Order', order: 3, hexPreview: '#868579' },
];

/**
 * Silicon refractive index dispersion in the visible spectrum:
 * n_si(lambda) = 3.5 + 2.0e5 / (lambda_nm^2)
 */
export function siliconRefractiveIndex(lambdaNm: number): number {
  return 3.5 + 2.0e5 / (lambdaNm * lambdaNm);
}

/**
 * Airy power reflectance R(lambda) for normal incidence on a transparent film:
 *   air (n0 = 1.0) / film (n1) / silicon substrate (n2)
 */
export function filmReflectance(lambdaNm: number, thicknessNm: number, n1: number): number {
  if (thicknessNm < 0 || lambdaNm <= 0 || n1 <= 0) return 0;

  const n0 = 1.0;
  const n2 = siliconRefractiveIndex(lambdaNm);

  const r01 = (n0 - n1) / (n0 + n1);
  const r12 = (n1 - n2) / (n1 + n2);

  const delta = (4.0 * Math.PI * n1 * thicknessNm) / lambdaNm;
  const cosDelta = Math.cos(delta);

  const num = r01 * r01 + r12 * r12 + 2.0 * r01 * r12 * cosDelta;
  const den = 1.0 + r01 * r01 * r12 * r12 + 2.0 * r01 * r12 * cosDelta;

  const r = num / den;
  return Math.max(0, Math.min(1, r));
}

/**
 * Analytical Gaussian-sum fit for CIE 1931 2° Standard Colorimetric Observer matching functions.
 * (Chris Wyman, Peter-Pike Sloan, Peter Shirley 2013).
 */
function gaussian(lambda: number, alpha: number, mu: number, sigma1: number, sigma2: number): number {
  const sigma = lambda < mu ? sigma1 : sigma2;
  const t = (lambda - mu) / sigma;
  return alpha * Math.exp(-0.5 * t * t);
}

export function cieXBar(lambdaNm: number): number {
  const val =
    gaussian(lambdaNm, 1.056, 599.8, 37.9, 31.0) +
    gaussian(lambdaNm, 0.362, 442.0, 16.0, 26.7) -
    gaussian(lambdaNm, 0.065, 501.1, 20.4, 18.9);
  return Math.max(0, val);
}

export function cieYBar(lambdaNm: number): number {
  const val =
    gaussian(lambdaNm, 0.821, 568.8, 46.9, 40.5) +
    gaussian(lambdaNm, 0.286, 530.9, 16.3, 31.1);
  return Math.max(0, val);
}

export function cieZBar(lambdaNm: number): number {
  const val =
    gaussian(lambdaNm, 1.217, 437.0, 11.8, 36.0) +
    gaussian(lambdaNm, 0.681, 459.0, 26.0, 13.8);
  return Math.max(0, val);
}

/**
 * Standard CIE Illuminant D65 relative spectral power distribution table (380 nm to 750 nm, step 5 nm).
 * 75 entries normalized to S(560 nm) = 100.0.
 */
export const D65_SPECTRUM_5NM: readonly number[] = [
  49.97, 52.31, 54.65, 68.70, 82.75, 87.12, 91.49, 92.46, 93.43, 90.06, 86.68, 95.77, 104.86, 110.94, 117.01, 117.41,
  117.81, 116.34, 114.86, 115.39, 115.92, 112.37, 108.81, 109.08, 109.35, 108.58, 107.80, 106.30, 104.79, 106.24, 107.69, 106.05,
  104.41, 104.23, 104.05, 102.02, 100.00, 98.17, 96.33, 96.06, 95.79, 92.24, 88.69, 89.35, 90.01, 89.81, 89.60, 88.65,
  87.70, 85.49, 83.29, 83.49, 83.70, 81.86, 80.03, 80.12, 80.21, 81.25, 82.28, 80.28, 78.28, 74.00, 69.72, 70.67,
  71.61, 72.98, 74.35, 67.98, 61.60, 65.74, 69.89, 72.49, 75.09, 69.34, 63.59,
];

/**
 * Standard IEC 61966-2-1 sRGB companding transfer function (gamma curve).
 */
export function linearToSrgb(c: number): number {
  const clamped = Math.max(0, Math.min(1, c));
  if (clamped <= 0.0031308) {
    return 12.92 * clamped;
  }
  return 1.055 * Math.pow(clamped, 1.0 / 2.4) - 0.055;
}

/**
 * Convert CIE XYZ tristimulus to sRGB color space with Hex string `#RRGGBB`.
 */
export function xyzToSrgb(X: number, Y: number, Z: number): { r: number; g: number; b: number; hex: string } {
  // ITU-R BT.709 / sRGB linear matrix conversion
  const rLin = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  const gLin = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  const bLin = 0.0557 * X - 0.2040 * Y + 1.057 * Z;

  const r = Math.round(linearToSrgb(rLin) * 255);
  const g = Math.round(linearToSrgb(gLin) * 255);
  const b = Math.round(linearToSrgb(bLin) * 255);

  const hex =
    '#' +
    [r, g, b]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

  return { r, g, b, hex };
}

/**
 * Identify the classic Pliskin oxide color band name and order number.
 */
export function getClassicColorClassification(
  thicknessNm: number,
  refractiveIndex: number,
): { name: string; order: number } {
  // Scale optical thickness to equivalent SiO2 thickness (refractive index 1.46)
  const eqSio2Nm = (refractiveIndex * thicknessNm) / 1.46;
  const band = PLISKIN_OXIDE_BANDS.find((b) => eqSio2Nm >= b.minNm && eqSio2Nm < b.maxNm);

  if (band) {
    if (Math.abs(refractiveIndex - 1.46) > 0.05) {
      return {
        name: `${band.name} (SiO₂ eq. ~${Math.round(eqSio2Nm)} nm)`,
        order: band.order,
      };
    }
    return { name: band.name, order: band.order };
  }

  if (eqSio2Nm >= 1050) {
    const order = Math.floor(eqSio2Nm / 250);
    return { name: `Multi-Order Interference (Order ${order})`, order };
  }

  return { name: 'Bare Silicon / Silicon Gray', order: 0 };
}

export interface CalculateFilmColorParams {
  thicknessNm: number;
  refractiveIndex: number;
}

/**
 * Main calculation: computes the full reflectance spectrum, constructive/destructive
 * peaks, XYZ tristimulus, sRGB color, and Pliskin color classification.
 */
export function calculateFilmColor({
  thicknessNm,
  refractiveIndex,
}: CalculateFilmColorParams): FilmColorCalculation {
  if (!Number.isFinite(thicknessNm) || thicknessNm < 0) {
    return { ok: false, error: 'Film thickness must be a non-negative number (≥ 0 nm).' };
  }
  if (!Number.isFinite(refractiveIndex) || refractiveIndex <= 1.0) {
    return { ok: false, error: 'Film refractive index must be greater than 1.0.' };
  }

  const spectrum: SpectrumPoint[] = [];
  let X = 0;
  let Y = 0;
  let Z = 0;
  let k = 0;

  for (let i = 0; i < D65_SPECTRUM_5NM.length; i++) {
    const lambda = 380 + i * 5;
    const s = D65_SPECTRUM_5NM[i];
    const r = filmReflectance(lambda, thicknessNm, refractiveIndex);
    spectrum.push({ wavelengthNm: lambda, reflectance: r });

    const xb = cieXBar(lambda);
    const yb = cieYBar(lambda);
    const zb = cieZBar(lambda);

    X += s * r * xb;
    Y += s * r * yb;
    Z += s * r * zb;
    k += s * yb;
  }

  if (k > 0) {
    X /= k;
    Y /= k;
    Z /= k;
  }

  const { r, g, b, hex } = xyzToSrgb(X, Y, Z);

  // Identify constructive interference peaks and destructive troughs within visible band
  const constructivePeaks: number[] = [];
  const destructiveTroughs: number[] = [];

  for (let i = 1; i < spectrum.length - 1; i++) {
    const prev = spectrum[i - 1].reflectance;
    const curr = spectrum[i].reflectance;
    const next = spectrum[i + 1].reflectance;

    // Peak: higher than both neighbours
    if (curr > prev && curr > next) {
      constructivePeaks.push(spectrum[i].wavelengthNm);
    }
    // Trough: lower than both neighbours
    else if (curr < prev && curr < next) {
      destructiveTroughs.push(spectrum[i].wavelengthNm);
    }
  }

  const classification = getClassicColorClassification(thicknessNm, refractiveIndex);

  return {
    ok: true,
    thicknessNm,
    refractiveIndex,
    opticalThicknessNm: thicknessNm * refractiveIndex,
    hexColor: hex,
    rgb: { r, g, b },
    classicColorName: classification.name,
    orderNumber: classification.order,
    spectrum,
    constructivePeaks,
    destructiveTroughs,
    photopicReflectancePercent: Y * 100,
  };
}
