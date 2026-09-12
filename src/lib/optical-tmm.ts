/**
 * Multilayer Thin Film Optical Transfer Matrix Method (TMM) Solver
 *
 * Implements the 1D Maxwell electromagnetic wave boundary condition equations
 * (Abelès transfer matrix formalism / Born & Wolf "Principles of Optics") for
 * arbitrary N-layer planar film stacks with complex refractive indices:
 *   ñ(λ) = n(λ) + i * k(λ)
 *
 * Supports:
 * - Arbitrary angle of incidence θ₀ (0° to 89°)
 * - TE (s-polarization) and TM (p-polarization) and unpolarized average
 * - Full spectral Reflectance R(λ), Transmittance T(λ), Absorptance A(λ)
 * - Complex numbers arithmetic without external dependencies
 * - Optical dispersion catalog for common semiconductor fab materials
 * - CIE 1931 D65 colorimetry for visual interference color prediction
 */

// ---------------------------------------------------------------------------
// Complex Number Support
// ---------------------------------------------------------------------------

export interface Complex {
  r: number; // Real part
  i: number; // Imaginary part
}

export const cReal = (r: number): Complex => ({ r, i: 0 });
export const cMake = (r: number, i: number): Complex => ({ r, i });

export const cAdd = (a: Complex, b: Complex): Complex => ({
  r: a.r + b.r,
  i: a.i + b.i,
});

export const cSub = (a: Complex, b: Complex): Complex => ({
  r: a.r - b.r,
  i: a.i - b.i,
});

export const cMul = (a: Complex, b: Complex): Complex => ({
  r: a.r * b.r - a.i * b.i,
  i: a.r * b.i + a.i * b.r,
});

export const cDiv = (a: Complex, b: Complex): Complex => {
  const denom = b.r * b.r + b.i * b.i;
  if (denom === 0) {
    return { r: 0, i: 0 };
  }
  return {
    r: (a.r * b.r + a.i * b.i) / denom,
    i: (a.i * b.r - a.r * b.i) / denom,
  };
};

export const cMulScalar = (a: Complex, s: number): Complex => ({
  r: a.r * s,
  i: a.i * s,
});

export const cAbsSq = (a: Complex): number => a.r * a.r + a.i * a.i;
export const cAbs = (a: Complex): number => Math.sqrt(cAbsSq(a));

/**
 * Complex square root choosing the principal branch with Re >= 0
 * (or Im >= 0 if Re = 0) to ensure physical decaying wave dissipation.
 */
export const cSqrt = (z: Complex): Complex => {
  const mod = Math.sqrt(z.r * z.r + z.i * z.i);
  const r = Math.sqrt(Math.max(0, (mod + z.r) / 2));
  let i = Math.sqrt(Math.max(0, (mod - z.r) / 2));
  if (z.i < 0) {
    i = -i;
  }
  return { r, i };
};

/**
 * Complex exponential: exp(a + i*b) = exp(a) * (cos(b) + i*sin(b))
 */
export const cExp = (z: Complex): Complex => {
  const expR = Math.exp(z.r);
  return {
    r: expR * Math.cos(z.i),
    i: expR * Math.sin(z.i),
  };
};

/**
 * Complex cosine: cos(z) = (exp(i*z) + exp(-i*z)) / 2
 */
export const cCos = (z: Complex): Complex => {
  // cos(x + i*y) = cos(x)*cosh(y) - i*sin(x)*sinh(y)
  const cosh = Math.cosh(z.i);
  const sinh = Math.sinh(z.i);
  return {
    r: Math.cos(z.r) * cosh,
    i: -Math.sin(z.r) * sinh,
  };
};

/**
 * Complex sine: sin(z) = sin(x)*cosh(y) + i*cos(x)*sinh(y)
 */
export const cSin = (z: Complex): Complex => {
  const cosh = Math.cosh(z.i);
  const sinh = Math.sinh(z.i);
  return {
    r: Math.sin(z.r) * cosh,
    i: Math.cos(z.r) * sinh,
  };
};

// ---------------------------------------------------------------------------
// Matrix 2x2 Operations with Complex Elements
// ---------------------------------------------------------------------------

export type Matrix2x2 = [
  [Complex, Complex],
  [Complex, Complex]
];

export const matIdentity = (): Matrix2x2 => [
  [cReal(1), cReal(0)],
  [cReal(0), cReal(1)],
];

export const matMul = (a: Matrix2x2, b: Matrix2x2): Matrix2x2 => [
  [
    cAdd(cMul(a[0][0], b[0][0]), cMul(a[0][1], b[1][0])),
    cAdd(cMul(a[0][0], b[0][1]), cMul(a[0][1], b[1][1])),
  ],
  [
    cAdd(cMul(a[1][0], b[0][0]), cMul(a[1][1], b[1][0])),
    cAdd(cMul(a[1][0], b[0][1]), cMul(a[1][1], b[1][1])),
  ],
];

// ---------------------------------------------------------------------------
// Optical Dispersion Models
// ---------------------------------------------------------------------------

export interface OpticalMaterialRef {
  id: string;
  name: string;
  formula: string;
  getRefractiveIndex: (wavelengthNm: number) => Complex;
}

/**
 * Material dispersion equations calibrated across 350 nm - 900 nm:
 */
export const OPTICAL_MATERIALS: Record<string, OpticalMaterialRef> = {
  air: {
    id: 'air',
    name: 'Air / Vacuum',
    formula: 'Air',
    getRefractiveIndex: () => cMake(1.0, 0),
  },
  si: {
    id: 'si',
    name: 'Silicon (Crystalline Si)',
    formula: 'c-Si',
    getRefractiveIndex: (wl) => {
      // Green / Schinke approximation across visible spectrum (380-800 nm)
      const wlMicrons = wl / 1000;
      // Sellmeier-type fit for n:
      const n = Math.sqrt(
        1 + (10.6684293 * wlMicrons * wlMicrons) / (wlMicrons * wlMicrons - 0.301516485 * 0.301516485) +
        (0.0030434748 * wlMicrons * wlMicrons) / (wlMicrons * wlMicrons - 1.13475115 * 1.13475115) +
        (1.54133408 * wlMicrons * wlMicrons) / (wlMicrons * wlMicrons - 1104)
      );
      // Empirical extinction coefficient k(lambda) for Si: high in UV/blue, low in red/IR
      let k = 0;
      if (wl < 400) {
        k = 0.38 + 0.002 * (400 - wl);
      } else if (wl < 500) {
        k = 0.05 + 0.33 * Math.pow((500 - wl) / 100, 2);
      } else if (wl < 700) {
        k = 0.005 + 0.045 * Math.pow((700 - wl) / 200, 2);
      } else {
        k = 0.001;
      }
      return cMake(isNaN(n) || n < 3 ? 3.88 : n, k);
    },
  },
  sio2: {
    id: 'sio2',
    name: 'Silicon Dioxide (SiO₂)',
    formula: 'SiO₂',
    getRefractiveIndex: (wl) => {
      // Standard Malitson Sellmeier formula for fused silica / thermal SiO2
      const wlMicrons = wl / 1000;
      const lam2 = wlMicrons * wlMicrons;
      const n2 =
        1 +
        (0.6961663 * lam2) / (lam2 - 0.0684043 * 0.0684043) +
        (0.4079426 * lam2) / (lam2 - 0.1162414 * 0.1162414) +
        (0.8974794 * lam2) / (lam2 - 9.896161 * 9.896161);
      return cMake(Math.sqrt(Math.max(1.0, n2)), 0);
    },
  },
  si3n4: {
    id: 'si3n4',
    name: 'Silicon Nitride (Si₃N₄)',
    formula: 'Si₃N₄',
    getRefractiveIndex: (wl) => {
      // Philipp Sellmeier model for LPCVD Si3N4
      const wlMicrons = wl / 1000;
      const lam2 = wlMicrons * wlMicrons;
      const n2 = 1 + (2.8939 * lam2) / (lam2 - 0.13967 * 0.13967);
      return cMake(Math.sqrt(Math.max(1.0, n2)), 0.0001);
    },
  },
  poly_si: {
    id: 'poly_si',
    name: 'Polycrystalline Silicon',
    formula: 'Poly-Si',
    getRefractiveIndex: (wl) => {
      const baseSi = OPTICAL_MATERIALS.si.getRefractiveIndex(wl);
      // Poly-Si has slightly lower n and higher scattering/absorption in visible
      return cMake(baseSi.r * 0.96, baseSi.i * 1.3 + 0.02);
    },
  },
  tin: {
    id: 'tin',
    name: 'Titanium Nitride (TiN)',
    formula: 'TiN',
    getRefractiveIndex: (wl) => {
      // TiN metallic / plasmonic response: golden appearance, n ~ 1.8-2.2, k ~ 1.5-2.0
      const wlNorm = (wl - 400) / 400; // 0 at 400nm, 1 at 800nm
      const n = 1.6 + 0.7 * wlNorm;
      const k = 1.3 + 0.9 * wlNorm;
      return cMake(n, k);
    },
  },
  al: {
    id: 'al',
    name: 'Aluminum (Al)',
    formula: 'Al',
    getRefractiveIndex: (wl) => {
      // Drude-Lorentz behavior in visible: n ~ 0.5 - 1.4, k ~ 5 - 8
      const wlMicrons = wl / 1000;
      const n = 0.5 + 1.2 * wlMicrons;
      const k = 4.5 + 4.5 * wlMicrons;
      return cMake(n, k);
    },
  },
  cu: {
    id: 'cu',
    name: 'Copper (Cu)',
    formula: 'Cu',
    getRefractiveIndex: (wl) => {
      // High absorption below 580 nm, high reflectance in yellow/red
      if (wl < 560) {
        return cMake(1.2, 2.4);
      }
      const wlNorm = (wl - 560) / 240;
      return cMake(0.25 + 0.15 * wlNorm, 3.2 + 2.0 * wlNorm);
    },
  },
  hfo2: {
    id: 'hfo2',
    name: 'Hafnium Oxide (HfO₂)',
    formula: 'HfO₂',
    getRefractiveIndex: (wl) => {
      // High-k gate dielectric, n ~ 2.08 at 633nm
      const wlMicrons = wl / 1000;
      const n = Math.sqrt(1 + (3.15 * wlMicrons * wlMicrons) / (wlMicrons * wlMicrons - 0.17 * 0.17));
      return cMake(isNaN(n) ? 2.08 : n, 0);
    },
  },
  al2o3: {
    id: 'al2o3',
    name: 'Aluminum Oxide (Al₂O₃ / Sapphire)',
    formula: 'Al₂O₃',
    getRefractiveIndex: (wl) => {
      const wlMicrons = wl / 1000;
      const lam2 = wlMicrons * wlMicrons;
      const n2 =
        1 +
        (1.4313493 * lam2) / (lam2 - 0.0726631 * 0.0726631) +
        (0.65054713 * lam2) / (lam2 - 0.1193242 * 0.1193242) +
        (5.3414021 * lam2) / (lam2 - 18.028251 * 18.028251);
      return cMake(Math.sqrt(Math.max(1.0, n2)), 0);
    },
  },
  photoresist: {
    id: 'photoresist',
    name: 'i-Line / DUV Photoresist',
    formula: 'PR',
    getRefractiveIndex: (wl) => {
      // Cauchy model: n(lambda) = 1.62 + 0.012 / lambda_um^2
      const wlMicrons = wl / 1000;
      const n = 1.62 + 0.012 / (wlMicrons * wlMicrons);
      const k = wl < 400 ? 0.04 : 0.002;
      return cMake(n, k);
    },
  },
  water: {
    id: 'water',
    name: 'Water (H₂O, Immersion Medium)',
    formula: 'H₂O',
    getRefractiveIndex: (wl) => {
      const wlMicrons = wl / 1000;
      const n = 1.314 + 0.006 / (wlMicrons * wlMicrons);
      return cMake(n, 0);
    },
  },
  mgf2: {
    id: 'mgf2',
    name: 'Magnesium Fluoride (MgF₂)',
    formula: 'MgF₂',
    getRefractiveIndex: (wl) => {
      const wlMicrons = wl / 1000;
      const lam2 = wlMicrons * wlMicrons;
      const n2 = 1 + (0.48755108 * lam2) / (lam2 - 0.04338408 * 0.04338408) +
        (0.39875031 * lam2) / (lam2 - 0.09461442 * 0.09461442) +
        (2.3120353 * lam2) / (lam2 - 23.793604 * 23.793604);
      return cMake(Math.sqrt(Math.max(1.0, n2)), 0);
    },
  },
  tio2: {
    id: 'tio2',
    name: 'Titanium Dioxide (TiO₂)',
    formula: 'TiO₂',
    getRefractiveIndex: (wl) => {
      const wlMicrons = wl / 1000;
      const lam2 = wlMicrons * wlMicrons;
      const n2 = 5.913 + 0.2441 / (lam2 - 0.0803);
      const k = wl < 400 ? 0.08 : 0.001;
      return cMake(Math.sqrt(Math.max(1.0, n2)), k);
    },
  },
  gaas: {
    id: 'gaas',
    name: 'Gallium Arsenide (GaAs)',
    formula: 'GaAs',
    getRefractiveIndex: (wl) => {
      const wlMicrons = wl / 1000;
      const lam2 = wlMicrons * wlMicrons;
      const n2 = 1 + (10.9 * lam2) / (lam2 - 0.443 * 0.443);
      const k = wl < 650 ? 0.35 : 0.08;
      return cMake(Math.sqrt(Math.max(1.0, n2)), k);
    },
  },
  gan: {
    id: 'gan',
    name: 'Gallium Nitride (GaN)',
    formula: 'GaN',
    getRefractiveIndex: (wl) => {
      const wlMicrons = wl / 1000;
      const lam2 = wlMicrons * wlMicrons;
      const n2 = 2.27 + (3.01 * lam2) / (lam2 - 0.296 * 0.296);
      const k = wl < 370 ? 0.2 : 0.001;
      return cMake(Math.sqrt(Math.max(1.0, n2)), k);
    },
  },
  sic: {
    id: 'sic',
    name: 'Silicon Carbide (4H-SiC)',
    formula: '4H-SiC',
    getRefractiveIndex: (wl) => {
      const wlMicrons = wl / 1000;
      const lam2 = wlMicrons * wlMicrons;
      const n2 = 1 + (5.55 * lam2) / (lam2 - 0.165 * 0.165);
      return cMake(Math.sqrt(Math.max(1.0, n2)), 0.001);
    },
  },
};

// ---------------------------------------------------------------------------
// Transfer Matrix Method Core Solver
// ---------------------------------------------------------------------------

export type PolarizationMode = 'unpolarized' | 'TE' | 'TM';

export interface OpticalLayerConfig {
  materialId?: string;
  name?: string;
  thicknessNm: number;
  /** Custom constant refractive index n if materialId not supplied */
  refractiveIndex?: number;
  /** Custom extinction coefficient k if materialId not supplied */
  extinctionCoefficient?: number;
}

export interface TmmSolverOptions {
  /** Incident medium (defaults to 'air') */
  incidentMediumId?: string;
  /** Substrate medium (defaults to 'si') */
  substrateMediumId?: string;
  /** Stack of thin film layers from top (adjacent to incident) to bottom (adjacent to substrate) */
  layers: OpticalLayerConfig[];
  /** Angle of incidence in degrees, 0 = normal incidence */
  angleDeg?: number;
  /** Polarization: 'unpolarized' (default), 'TE' (s-pol), or 'TM' (p-pol) */
  polarization?: PolarizationMode;
}

export interface WavelengthOpticalResponse {
  wavelengthNm: number;
  reflectance: number;     // R in [0, 1]
  transmittance: number;   // T in [0, 1]
  absorptance: number;     // A = 1 - R - T in [0, 1]
  reflectanceTE?: number;
  reflectanceTM?: number;
}

export interface OpticalTmmSpectrumResult {
  spectrum: WavelengthOpticalResponse[];
  avgReflectance: number;
  avgTransmittance: number;
  avgAbsorptance: number;
  colorHex: string;
  tristimulus: { X: number; Y: number; Z: number };
}

/**
 * Get complex refractive index for a given layer or medium at wavelength lambda (nm).
 */
export function getMaterialIndexAt(
  layer: OpticalLayerConfig,
  wavelengthNm: number
): Complex {
  if (layer.materialId && OPTICAL_MATERIALS[layer.materialId]) {
    return OPTICAL_MATERIALS[layer.materialId].getRefractiveIndex(wavelengthNm);
  }
  return cMake(
    layer.refractiveIndex ?? 1.5,
    layer.extinctionCoefficient ?? 0
  );
}

/**
 * Compute the complex propagation angle cos(theta_j) using Snell's law:
 *   ñ_0 * sin(theta_0) = ñ_j * sin(theta_j)
 *   cos(theta_j) = sqrt(1 - (ñ_0 * sin(theta_0) / ñ_j)^2)
 */
export function computeCosTheta(
  nIncident: Complex,
  theta0Rad: number,
  nLayer: Complex
): Complex {
  if (theta0Rad === 0) {
    return cReal(1.0);
  }
  const sin0 = Math.sin(theta0Rad);
  const n0Sin0 = cMulScalar(nIncident, sin0);
  const ratio = cDiv(n0Sin0, nLayer);
  const ratioSq = cMul(ratio, ratio);
  const oneMinus = cSub(cReal(1), ratioSq);
  return cSqrt(oneMinus);
}

/**
 * Calculate admittance / optical impedance parameter p_j for layer j:
 *   For TE (s): p_j = ñ_j * cos(theta_j)
 *   For TM (p): p_j = ñ_j / cos(theta_j)
 */
export function computeAdmittance(
  nLayer: Complex,
  cosTheta: Complex,
  polarization: 'TE' | 'TM'
): Complex {
  if (polarization === 'TE') {
    return cMul(nLayer, cosTheta);
  } else {
    return cDiv(nLayer, cosTheta);
  }
}

/**
 * Calculate 2x2 Transfer Matrix for single layer j:
 *   M_j = [ [ cos(delta),   -(i / p_j) * sin(delta) ],
 *           [ -i * p_j * sin(delta),   cos(delta) ] ]
 * where delta = (2 * pi / lambda) * ñ_j * d_j * cos(theta_j)
 */
export function computeLayerMatrix(
  nLayer: Complex,
  thicknessNm: number,
  wavelengthNm: number,
  cosTheta: Complex,
  pLayer: Complex
): Matrix2x2 {
  if (thicknessNm <= 0) {
    return matIdentity();
  }

  // Phase thickness delta:
  // delta = (2 * pi / lambda) * d * nLayer * cosTheta
  const factor = (2 * Math.PI * thicknessNm) / wavelengthNm;
  const nCos = cMul(nLayer, cosTheta);
  const delta = cMulScalar(nCos, factor);

  const cosDelta = cCos(delta);
  const sinDelta = cSin(delta);

  // m01 = -i * (1 / p) * sinDelta
  const invP = cDiv(cReal(1), pLayer);
  const m01_inner = cMul(invP, sinDelta);
  const m01 = cMake(m01_inner.i, -m01_inner.r); // multiply by -i: (r + i*im) * (-i) = im - i*r

  // m10 = -i * p * sinDelta
  const m10_inner = cMul(pLayer, sinDelta);
  const m10 = cMake(m10_inner.i, -m10_inner.r);

  return [
    [cosDelta, m01],
    [m10, cosDelta],
  ];
}

/**
 * Solve optical reflectance and transmittance at single wavelength lambda (nm)
 * for a specific polarization ('TE' or 'TM').
 */
export function solveTmmAtWavelengthPolarized(
  wavelengthNm: number,
  n0: Complex,
  nSub: Complex,
  layers: OpticalLayerConfig[],
  theta0Rad: number,
  pol: 'TE' | 'TM'
): { R: number; T: number; A: number } {
  const cos0 = computeCosTheta(n0, theta0Rad, n0);
  const p0 = computeAdmittance(n0, cos0, pol);

  const cosSub = computeCosTheta(n0, theta0Rad, nSub);
  const pSub = computeAdmittance(nSub, cosSub, pol);

  // Multiply transfer matrices through the stack from layer 1 to layer N:
  let totalM = matIdentity();

  for (const layer of layers) {
    if (layer.thicknessNm <= 0) continue;
    const nL = getMaterialIndexAt(layer, wavelengthNm);
    const cosL = computeCosTheta(n0, theta0Rad, nL);
    const pL = computeAdmittance(nL, cosL, pol);
    const ML = computeLayerMatrix(nL, layer.thicknessNm, wavelengthNm, cosL, pL);
    totalM = matMul(totalM, ML);
  }

  // Amplitude reflection and transmission coefficients:
  // r = [ (m00 + m01 * ps) * p0 - (m10 + m11 * ps) ] / [ (m00 + m01 * ps) * p0 + (m10 + m11 * ps) ]
  const m01Ps = cMul(totalM[0][1], pSub);
  const term1 = cAdd(totalM[0][0], m01Ps); // m00 + m01 * ps
  const term1P0 = cMul(term1, p0);        // (m00 + m01 * ps) * p0

  const m11Ps = cMul(totalM[1][1], pSub);
  const term2 = cAdd(totalM[1][0], m11Ps); // m10 + m11 * ps

  const numR = cSub(term1P0, term2);
  const denR = cAdd(term1P0, term2);
  const r = cDiv(numR, denR);

  // Reflectance R = |r|^2
  const R = Math.max(0, Math.min(1, cAbsSq(r)));

  // Transmittance T = (Re(pSub) / Re(p0)) * |t|^2
  // t = 2 * p0 / denR
  const twoP0 = cMulScalar(p0, 2);
  const t = cDiv(twoP0, denR);
  const tSq = cAbsSq(t);

  let T = 0;
  if (p0.r > 1e-12 && pSub.r > 0) {
    const factor = pSub.r / p0.r;
    T = Math.max(0, Math.min(1 - R, factor * tSq));
  }

  const A = Math.max(0, 1 - R - T);

  return { R, T, A };
}

/**
 * Solve optical reflectance at single wavelength lambda (nm).
 */
export function solveTmmAtWavelength(
  wavelengthNm: number,
  options: TmmSolverOptions
): WavelengthOpticalResponse {
  const theta0Rad = ((options.angleDeg ?? 0) * Math.PI) / 180;
  const n0 = options.incidentMediumId && OPTICAL_MATERIALS[options.incidentMediumId]
    ? OPTICAL_MATERIALS[options.incidentMediumId].getRefractiveIndex(wavelengthNm)
    : cReal(1.0);

  const nSub = options.substrateMediumId && OPTICAL_MATERIALS[options.substrateMediumId]
    ? OPTICAL_MATERIALS[options.substrateMediumId].getRefractiveIndex(wavelengthNm)
    : OPTICAL_MATERIALS.si.getRefractiveIndex(wavelengthNm);

  const pol = options.polarization ?? 'unpolarized';

  if (pol === 'TE') {
    const res = solveTmmAtWavelengthPolarized(wavelengthNm, n0, nSub, options.layers, theta0Rad, 'TE');
    return {
      wavelengthNm,
      reflectance: res.R,
      transmittance: res.T,
      absorptance: res.A,
      reflectanceTE: res.R,
    };
  } else if (pol === 'TM') {
    const res = solveTmmAtWavelengthPolarized(wavelengthNm, n0, nSub, options.layers, theta0Rad, 'TM');
    return {
      wavelengthNm,
      reflectance: res.R,
      transmittance: res.T,
      absorptance: res.A,
      reflectanceTM: res.R,
    };
  } else {
    // Unpolarized: 50% TE + 50% TM
    const te = solveTmmAtWavelengthPolarized(wavelengthNm, n0, nSub, options.layers, theta0Rad, 'TE');
    const tm = solveTmmAtWavelengthPolarized(wavelengthNm, n0, nSub, options.layers, theta0Rad, 'TM');
    const R = 0.5 * (te.R + tm.R);
    const T = 0.5 * (te.T + tm.T);
    const A = Math.max(0, 1 - R - T);
    return {
      wavelengthNm,
      reflectance: R,
      transmittance: T,
      absorptance: A,
      reflectanceTE: te.R,
      reflectanceTM: tm.R,
    };
  }
}

// ---------------------------------------------------------------------------
// Spectral Simulation & CIE 1931 Colorimetry
// ---------------------------------------------------------------------------

/**
 * Standard CIE 1931 2-degree observer color matching functions and D65 illuminant
 * sampled at 10 nm intervals from 380 nm to 780 nm.
 */
interface CieSample {
  wl: number;
  xBar: number;
  yBar: number;
  zBar: number;
  d65: number;
}

const CIE_D65_TABLE: CieSample[] = [
  { wl: 380, xBar: 0.0014, yBar: 0.0000, zBar: 0.0065, d65: 50.0 },
  { wl: 390, xBar: 0.0042, yBar: 0.0001, zBar: 0.0201, d65: 54.6 },
  { wl: 400, xBar: 0.0143, yBar: 0.0004, zBar: 0.0679, d65: 82.8 },
  { wl: 410, xBar: 0.0435, yBar: 0.0012, zBar: 0.2074, d65: 91.5 },
  { wl: 420, xBar: 0.1344, yBar: 0.0040, zBar: 0.6456, d65: 93.4 },
  { wl: 430, xBar: 0.2839, yBar: 0.0116, zBar: 1.3856, d65: 86.7 },
  { wl: 440, xBar: 0.3483, yBar: 0.0230, zBar: 1.7471, d65: 104.9 },
  { wl: 450, xBar: 0.3362, yBar: 0.0380, zBar: 1.7721, d65: 117.0 },
  { wl: 460, xBar: 0.2908, yBar: 0.0600, zBar: 1.6692, d65: 117.8 },
  { wl: 470, xBar: 0.1954, yBar: 0.0910, zBar: 1.2876, d65: 114.9 },
  { wl: 480, xBar: 0.0956, yBar: 0.1390, zBar: 0.8130, d65: 115.9 },
  { wl: 490, xBar: 0.0320, yBar: 0.2080, zBar: 0.4652, d65: 108.8 },
  { wl: 500, xBar: 0.0049, yBar: 0.3230, zBar: 0.2720, d65: 109.4 },
  { wl: 510, xBar: 0.0093, yBar: 0.5030, zBar: 0.1582, d65: 107.8 },
  { wl: 520, xBar: 0.0633, yBar: 0.7100, zBar: 0.0782, d65: 104.8 },
  { wl: 530, xBar: 0.1655, yBar: 0.8620, zBar: 0.0422, d65: 107.7 },
  { wl: 540, xBar: 0.2904, yBar: 0.9540, zBar: 0.0203, d65: 104.4 },
  { wl: 550, xBar: 0.4334, yBar: 0.9950, zBar: 0.0087, d65: 104.0 },
  { wl: 560, xBar: 0.5945, yBar: 0.9950, zBar: 0.0039, d65: 100.0 },
  { wl: 570, xBar: 0.7621, yBar: 0.9520, zBar: 0.0021, d65: 96.3 },
  { wl: 580, xBar: 0.9163, yBar: 0.8700, zBar: 0.0017, d65: 95.8 },
  { wl: 590, xBar: 1.0263, yBar: 0.7570, zBar: 0.0011, d65: 88.7 },
  { wl: 600, xBar: 1.0622, yBar: 0.6310, zBar: 0.0008, d65: 90.0 },
  { wl: 610, xBar: 1.0026, yBar: 0.5030, zBar: 0.0003, d65: 89.6 },
  { wl: 620, xBar: 0.8544, yBar: 0.3810, zBar: 0.0002, d65: 87.7 },
  { wl: 630, xBar: 0.6424, yBar: 0.2650, zBar: 0.0000, d65: 83.3 },
  { wl: 640, xBar: 0.4479, yBar: 0.1750, zBar: 0.0000, d65: 83.7 },
  { wl: 650, xBar: 0.2835, yBar: 0.1070, zBar: 0.0000, d65: 80.0 },
  { wl: 660, xBar: 0.1649, yBar: 0.0610, zBar: 0.0000, d65: 80.2 },
  { wl: 670, xBar: 0.0874, yBar: 0.0320, zBar: 0.0000, d65: 82.3 },
  { wl: 680, xBar: 0.0468, yBar: 0.0170, zBar: 0.0000, d65: 78.3 },
  { wl: 690, xBar: 0.0227, yBar: 0.0082, zBar: 0.0000, d65: 69.7 },
  { wl: 700, xBar: 0.0114, yBar: 0.0041, zBar: 0.0000, d65: 71.6 },
  { wl: 710, xBar: 0.0058, yBar: 0.0021, zBar: 0.0000, d65: 74.3 },
  { wl: 720, xBar: 0.0029, yBar: 0.0010, zBar: 0.0000, d65: 61.6 },
  { wl: 730, xBar: 0.0014, yBar: 0.0005, zBar: 0.0000, d65: 69.9 },
  { wl: 740, xBar: 0.0007, yBar: 0.0002, zBar: 0.0000, d65: 75.1 },
  { wl: 750, xBar: 0.0003, yBar: 0.0001, zBar: 0.0000, d65: 63.6 },
  { wl: 760, xBar: 0.0002, yBar: 0.0001, zBar: 0.0000, d65: 46.4 },
  { wl: 770, xBar: 0.0001, yBar: 0.0000, zBar: 0.0000, d65: 66.8 },
  { wl: 780, xBar: 0.0000, yBar: 0.0000, zBar: 0.0000, d65: 63.4 },
];

/**
 * sRGB gamma companding curve
 */
function srgbCompand(linear: number): number {
  const clamped = Math.max(0, Math.min(1, linear));
  if (clamped <= 0.0031308) {
    return 12.92 * clamped;
  }
  return 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
}

/**
 * Convert reflected spectrum to CIE XYZ tristimulus and sRGB hex string.
 */
export function calculateReflectedColor(
  spectrum: WavelengthOpticalResponse[]
): { hex: string; X: number; Y: number; Z: number } {
  // Map wavelength to reflectance
  const rMap = new Map<number, number>();
  for (const pt of spectrum) {
    rMap.set(Math.round(pt.wavelengthNm), pt.reflectance);
  }

  let X = 0;
  let Y = 0;
  let Z = 0;
  let normK = 0;

  for (const sample of CIE_D65_TABLE) {
    const r = rMap.get(sample.wl) ?? 0.3;
    const illum = sample.d65;
    normK += illum * sample.yBar;
    X += illum * r * sample.xBar;
    Y += illum * r * sample.yBar;
    Z += illum * r * sample.zBar;
  }

  if (normK > 0) {
    X /= normK;
    Y /= normK;
    Z /= normK;
  }

  // Convert XYZ to linear RGB using standard D65 matrix (ITU-R BT.709):
  const rLin = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  const gLin = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  const bLin = 0.0557 * X - 0.2040 * Y + 1.0570 * Z;

  // Compand to non-linear sRGB:
  const rByte = Math.round(srgbCompand(rLin) * 255);
  const gByte = Math.round(srgbCompand(gLin) * 255);
  const bByte = Math.round(srgbCompand(bLin) * 255);

  const hex = `#${rByte.toString(16).padStart(2, '0')}${gByte
    .toString(16)
    .padStart(2, '0')}${bByte.toString(16).padStart(2, '0')}`.toUpperCase();

  return { hex, X, Y, Z };
}

/**
 * Compute full optical spectrum (380 nm - 780 nm) using Transfer Matrix Method,
 * returning spectral curve, averages, and perceived visual color.
 */
export function calculateMultilayerOpticalSpectrum(
  options: TmmSolverOptions,
  startWlNm = 380,
  endWlNm = 780,
  stepNm = 5
): OpticalTmmSpectrumResult {
  const spectrum: WavelengthOpticalResponse[] = [];
  let sumR = 0;
  let sumT = 0;
  let sumA = 0;

  for (let wl = startWlNm; wl <= endWlNm; wl += stepNm) {
    const pt = solveTmmAtWavelength(wl, options);
    spectrum.push(pt);
    sumR += pt.reflectance;
    sumT += pt.transmittance;
    sumA += pt.absorptance;
  }

  const count = spectrum.length;
  const avgReflectance = count > 0 ? sumR / count : 0;
  const avgTransmittance = count > 0 ? sumT / count : 0;
  const avgAbsorptance = count > 0 ? sumA / count : 0;

  const color = calculateReflectedColor(spectrum);

  return {
    spectrum,
    avgReflectance,
    avgTransmittance,
    avgAbsorptance,
    colorHex: color.hex,
    tristimulus: { X: color.X, Y: color.Y, Z: color.Z },
  };
}

/**
 * Calculate Antireflective Coating (ARC) optimum single layer condition:
 *   Ideal refractive index: n_arc = sqrt(n_incident * n_substrate)
 *   Quarter-wave thickness: d_arc = lambda0 / (4 * n_arc)
 */
export function calculateOptimalSingleLayerArc(
  lambda0Nm: number,
  nIncident = 1.0,
  nSubstrate = 3.88
): { optimalIndex: number; quarterWaveThicknessNm: number } {
  const optimalIndex = Math.sqrt(nIncident * nSubstrate);
  const quarterWaveThicknessNm = lambda0Nm / (4 * optimalIndex);
  return {
    optimalIndex,
    quarterWaveThicknessNm,
  };
}
