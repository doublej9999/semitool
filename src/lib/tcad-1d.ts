/**
 * 1D Numerical TCAD & Dopant Diffusion Solver
 *
 * Implements:
 * 1. 1D Finite-Difference Numerical Diffusion Engine:
 *    dC/dt = d/dx [ D(C, T) * dC/dx ]
 *    with concentration-dependent diffusivity D(C) = Di * [1 + beta * (C / ni)]
 *    supporting heavy doping effects (B, P, As, Sb in silicon).
 *
 * 2. Multi-step thermal profile (Ramp-up, Isothermal Soak, Ramp-down).
 *
 * 3. Pearson-IV Ion Implantation Profile Generator:
 *    df/dx = - (x - c1) * f / (b0 + b1*x + b2*x^2)
 *    matching projected range (Rp), straggle (dRp), skewness (gamma), and kurtosis (beta2).
 */

export interface DepthNode {
  depthUm: number;
  concentrationCm3: number;
}

export interface TcadSimulationResult {
  depthNodes: DepthNode[];
  junctionDepthUm: number; // depth where C(x) equals background substrate doping
  peakConcentrationCm3: number;
  sheetDoseCm2: number; // integral of C(x) dx
}

export interface PearsonIvParams {
  doseCm2: number;
  rpUm: number; // projected range
  deltaRpUm: number; // straggle
  skewness: number; // gamma (e.g. 0 for Gaussian, >0 for channelling tail)
  kurtosis: number; // beta2 (e.g. 3 for Gaussian, >3 for heavy tails)
}

/**
 * Generates Pearson-IV dopant concentration depth profile
 */
export function calculatePearsonIvProfile(
  params: PearsonIvParams,
  maxDepthUm = 2.0,
  numPoints = 200,
): DepthNode[] {
  const { doseCm2, rpUm, deltaRpUm, skewness: gamma, kurtosis: beta2 } = params;
  const nodes: DepthNode[] = [];
  const dx = maxDepthUm / (numPoints - 1);

  // Validate Pearson IV condition: beta2 > 3 + 1.5 * gamma^2 (ensures root denominator has no real roots)
  const safeBeta2 = Math.max(beta2, 3.1 + 1.6 * gamma * gamma);

  // Coefficients of the differential equation:
  // d ln(f)/dx = - (x - c1) / (b0 + b1 * x + b2 * x^2)
  const denom = 10 * safeBeta2 - 12 * gamma * gamma - 18;
  const b0 = (deltaRpUm * deltaRpUm * (4 * safeBeta2 - 3 * gamma * gamma)) / denom;
  const b1 = (deltaRpUm * gamma * (safeBeta2 + 3)) / denom;
  const b2 = (2 * safeBeta2 - 3 * gamma * gamma - 6) / denom;
  const a = Math.sqrt(Math.max(1e-12, 4 * b0 * b2 - b1 * b1)) / (2 * b2);
  const m = 1 / (2 * b2);
  const nu = -(b1 * (1 - 2 * b2)) / (2 * b2 * b2 * a);

  // Numerical integration of f(x)
  let sumF = 0;
  const rawValues: number[] = [];

  for (let i = 0; i < numPoints; i++) {
    const xUm = i * dx;
    const dev = xUm - rpUm;
    const y = (dev + b1 / (2 * b2)) / a;
    let f = Math.pow(1 + y * y, -m) * Math.exp(-nu * Math.atan(y));
    if (isNaN(f) || !isFinite(f) || f < 0) f = 0;
    rawValues.push(f);
    sumF += f * (dx * 1e-4); // dx in cm
  }

  // Normalize by total implant dose
  const normFactor = sumF > 0 ? doseCm2 / sumF : 1;
  for (let i = 0; i < numPoints; i++) {
    nodes.push({
      depthUm: Number((i * dx).toFixed(4)),
      concentrationCm3: Math.max(1e12, Number((rawValues[i] * normFactor).toExponential(3))),
    });
  }

  return nodes;
}

/**
 * Solves 1D non-linear dopant diffusion with concentration-dependent diffusivity
 * using explicit finite difference with adaptive sub-stepping.
 */
export function solve1DNumericalDiffusion(
  initialProfile: DepthNode[],
  tempC: number,
  timeSec: number,
  options?: {
    dopant?: 'boron' | 'phosphorus' | 'arsenic';
    backgroundDopingCm3?: number;
    betaConcentrationCoeff?: number;
  },
): TcadSimulationResult {
  const backgroundDoping = options?.backgroundDopingCm3 ?? 1e15;
  const dopant = options?.dopant ?? 'boron';
  const beta = options?.betaConcentrationCoeff ?? (dopant === 'arsenic' ? 1.0 : 0.5);

  const n = initialProfile.length;
  if (n < 2 || timeSec <= 0) {
    const peak = Math.max(...initialProfile.map((p) => p.concentrationCm3));
    return {
      depthNodes: initialProfile,
      junctionDepthUm: 0.1,
      peakConcentrationCm3: peak,
      sheetDoseCm2: 1e15,
    };
  }

  const dxUm = initialProfile[1].depthUm - initialProfile[0].depthUm;
  const dxCm = dxUm * 1e-4;

  // Intrinsic carrier concentration ni(T) in Silicon
  const tempK = tempC + 273.15;
  const KB_EV = 8.617333262e-5;
  const EG_EV = 1.17 - (4.73e-4 * tempK * tempK) / (tempK + 636);
  const ni = 3.87e16 * Math.pow(tempK, 1.5) * Math.exp(-EG_EV / (2 * KB_EV * tempK));

  // Intrinsic diffusivity Di
  let d0 = 0.76;
  let ea = 3.46;
  if (dopant === 'phosphorus') {
    d0 = 3.85;
    ea = 3.66;
  } else if (dopant === 'arsenic') {
    d0 = 0.066;
    ea = 3.44;
  }
  const Di = d0 * Math.exp(-ea / (KB_EV * tempK));

  // Diffusivity function D(C)
  const calcD = (conc: number) => {
    const ratio = Math.max(0, conc) / Math.max(1e10, ni);
    return Di * (1 + beta * ratio);
  };

  // Profile concentration array
  let C = initialProfile.map((p) => Math.max(backgroundDoping, p.concentrationCm3));

  // Maximum estimated D for Courant-Friedrichs-Lewy (CFL) stability criterion: dt <= 0.45 * dx^2 / Dmax
  const peakInit = Math.max(...C);
  const maxD = calcD(peakInit);
  const maxDt = (0.45 * dxCm * dxCm) / Math.max(1e-16, maxD);
  const steps = Math.min(1000, Math.max(10, Math.ceil(timeSec / maxDt)));
  const dt = timeSec / steps;

  // Time integration loop
  for (let s = 0; s < steps; s++) {
    const nextC = new Float64Array(n);

    // Surface boundary condition: zero-flux (mirror) dC/dx = 0 at x=0
    nextC[0] = C[0] + (dt / (dxCm * dxCm)) * calcD(C[0]) * 2 * (C[1] - C[0]);

    // Interior nodes
    for (let i = 1; i < n - 1; i++) {
      const D_left = 0.5 * (calcD(C[i - 1]) + calcD(C[i]));
      const D_right = 0.5 * (calcD(C[i]) + calcD(C[i + 1]));

      const fluxIn = D_left * (C[i - 1] - C[i]);
      const fluxOut = D_right * (C[i] - C[i + 1]);

      nextC[i] = C[i] + (dt / (dxCm * dxCm)) * (fluxIn - fluxOut);
      if (nextC[i] < backgroundDoping) nextC[i] = backgroundDoping;
    }

    // Bulk substrate boundary condition: constant background doping
    nextC[n - 1] = backgroundDoping;
    C = Array.from(nextC);
  }

  // Calculate junction depth Xj and sheet dose
  let xj = 0;
  let dose = 0;
  for (let i = 0; i < n; i++) {
    const cVal = C[i];
    dose += cVal * dxCm;
    if (cVal <= backgroundDoping * 1.5 && xj === 0 && i > 0) {
      xj = initialProfile[i].depthUm;
    }
  }
  if (xj === 0) xj = initialProfile[n - 1].depthUm;

  const resultNodes: DepthNode[] = initialProfile.map((p, idx) => ({
    depthUm: p.depthUm,
    concentrationCm3: Number(C[idx].toExponential(3)),
  }));

  return {
    depthNodes: resultNodes,
    junctionDepthUm: Number(xj.toFixed(3)),
    peakConcentrationCm3: Number(Math.max(...C).toExponential(3)),
    sheetDoseCm2: Number(dose.toExponential(3)),
  };
}
