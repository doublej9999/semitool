/**
 * Curve fitting and parameter extraction engine for semiconductor experimental data.
 * Supports linear regression, Arrhenius activation energy extraction, and Deal-Grove parameter estimation.
 */

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  standardError: number;
  n: number;
}

export interface DataPoint {
  x: number;
  y: number;
}

/**
 * Performs ordinary least squares linear regression y = slope * x + intercept.
 */
export function linearRegression(points: DataPoint[]): LinearRegressionResult | null {
  const valid = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  const n = valid.length;
  if (n < 2) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (const { x, y } of valid) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (Math.abs(denom) < 1e-15) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R² (coefficient of determination)
  const yMean = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (const { x, y } of valid) {
    const yPred = slope * x + intercept;
    ssTot += (y - yMean) ** 2;
    ssRes += (y - yPred) ** 2;
  }

  const rSquared = ssTot > 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 1;
  const standardError = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;

  return {
    slope,
    intercept,
    rSquared,
    standardError,
    n,
  };
}

export interface ArrheniusFitPoint {
  temperatureCelsius: number;
  rate: number;
}

export interface ArrheniusFitResult {
  activationEnergyEv: number;
  preExponentialA: number;
  rSquared: number;
  points: {
    tempC: number;
    tempK: number;
    invTK: number; // 1000 / T (K^-1)
    rate: number;
    lnRate: number;
    predictedRate: number;
  }[];
}

const BOLTZMANN_EV_K = 8.617333262e-5; // eV / K

/**
 * Fits temperature vs rate data to the Arrhenius relation:
 * rate = A * exp(-Ea / (k * T))
 * ln(rate) = ln(A) - (Ea / k) * (1 / T)
 */
export function fitArrhenius(points: ArrheniusFitPoint[]): ArrheniusFitResult | null {
  const transformed: DataPoint[] = [];
  const validData: { tempC: number; tempK: number; rate: number }[] = [];

  for (const pt of points) {
    const tempK = pt.temperatureCelsius + 273.15;
    if (tempK <= 0 || pt.rate <= 0) continue;
    transformed.push({
      x: 1 / tempK,
      y: Math.log(pt.rate),
    });
    validData.push({
      tempC: pt.temperatureCelsius,
      tempK,
      rate: pt.rate,
    });
  }

  if (transformed.length < 2) return null;

  const reg = linearRegression(transformed);
  if (!reg) return null;

  // slope = -Ea / k => Ea = -slope * k
  const activationEnergyEv = -reg.slope * BOLTZMANN_EV_K;
  // intercept = ln(A) => A = exp(intercept)
  const preExponentialA = Math.exp(reg.intercept);

  const fittedPoints = validData.map((d) => {
    const invTK = 1000 / d.tempK;
    const lnRate = Math.log(d.rate);
    const predictedRate = preExponentialA * Math.exp(-activationEnergyEv / (BOLTZMANN_EV_K * d.tempK));
    return {
      tempC: d.tempC,
      tempK: d.tempK,
      invTK,
      rate: d.rate,
      lnRate,
      predictedRate,
    };
  });

  return {
    activationEnergyEv,
    preExponentialA,
    rSquared: reg.rSquared,
    points: fittedPoints,
  };
}
export interface DealGrovePoint {
  timeHours: number;
  thicknessUm: number;
}

export interface DealGroveFitResult {
  linearRateConstantBoverA: number;
  parabolicRateConstantB: number;
  parameterA: number;
  rSquared: number;
  points: {
    timeHours: number;
    thicknessUm: number;
    predictedTimeHours: number;
  }[];
}

export function fitDealGrove(points: DealGrovePoint[]): DealGroveFitResult | null {
  const transformed: DataPoint[] = [];
  const validData: DealGrovePoint[] = [];
  for (const pt of points) {
    if (pt.timeHours <= 0 || pt.thicknessUm <= 0) continue;
    transformed.push({
      x: pt.thicknessUm,
      y: pt.timeHours / pt.thicknessUm,
    });
    validData.push(pt);
  }
  if (transformed.length < 2) return null;
  const reg = linearRegression(transformed);
  if (!reg || reg.slope <= 0 || reg.intercept <= 0) return null;
  const parabolicRateConstantB = 1 / reg.slope;
  const linearRateConstantBoverA = 1 / reg.intercept;
  const parameterA = parabolicRateConstantB / linearRateConstantBoverA;
  const fittedPoints = validData.map((d) => {
    const predictedTimeHours = (d.thicknessUm ** 2 + parameterA * d.thicknessUm) / parabolicRateConstantB;
    return {
      timeHours: d.timeHours,
      thicknessUm: d.thicknessUm,
      predictedTimeHours,
    };
  });
  return {
    linearRateConstantBoverA,
    parabolicRateConstantB,
    parameterA,
    rSquared: reg.rSquared,
    points: fittedPoints,
  };
}
/**
 * Parse CSV or whitespace delimited 2-column text into data points.
 */
export function parseTwoColumnData(text: string): { x: number; y: number }[] {
  const lines = text.trim().split(/\r?\n/);
  const points: { x: number; y: number }[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;
    // Split by comma, tab, or spaces
    const parts = line.split(/[,\t\s]+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const x = Number.parseFloat(parts[0]);
      const y = Number.parseFloat(parts[1]);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        points.push({ x, y });
      }
    }
  }

  return points;
}
