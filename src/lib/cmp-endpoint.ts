/**
 * Chemical Mechanical Polishing (CMP) Endpoint Detection and Pad Life Models.
 *
 * Covers:
 * 1. Motor Current / Friction Endpoint Detection:
 *    - Interface clearing detection time
 *    - Transition delay filtering
 *    - Controlled overpolish duration and total recipe time
 *
 * 2. Optical Reflection / Spectroscopic Interference Endpoint:
 *    - Constructive/destructive interference oscillation period:
 *      T = lambda / (2 * n * RR)
 *    - Thickness removed per interference cycle / fringe
 *
 * 3. Diamond Pad Conditioner & Groove Wear Pad Life Model:
 *    - Pad wear rate from conditioning cut rate
 *    - Pad life consumption and remaining wafer capacity
 *    - Pad groove depth decay down to minimum transport limit
 */

export interface CmpEndpointOptions {
  /** Film thickness to polish/remove (nm). Must be > 0. */
  filmThickness: number;
  /** Removal rate of the film (nm/min). Must be > 0. */
  removalRate: number;
  /**
   * Underlayer friction transition delay / stabilization filter time after interface hit (seconds).
   * Must be >= 0.
   */
  underlayerDelaySec: number;
  /** Overpolish percentage beyond interface endpoint clear (>= 0, e.g. 10 for 10%). */
  overpolishPercent: number;
}

export interface CmpEndpointResult {
  /** Polish time required to reach the underlayer interface (seconds) */
  timeToInterfaceSec: number;
  /** Polish time required to reach the underlayer interface (minutes) */
  timeToInterfaceMin: number;
  /** Underlayer interface confirmation / filter delay (seconds) */
  underlayerDelaySec: number;
  /** Endpoint triggered timestamp (time to interface + underlayer delay) (seconds) */
  detectedEndpointTimeSec: number;
  /** Overpolish duration (seconds) */
  overpolishDurationSec: number;
  /** Total polish recipe time (timeToInterface + underlayerDelay + overpolish) (seconds) */
  totalTimeSec: number;
  /** Total polish recipe time (minutes) */
  totalTimeMin: number;
  /** Nominal film thickness (nm) */
  filmThicknessNm: number;
  /** Overpolish target film removal (nm) */
  overpolishThicknessRemovedNm: number;
  /** Total film equivalent removed during entire cycle including overpolish (nm) */
  totalThicknessRemovedNm: number;
}

/**
 * Calculates CMP motor current endpoint detection timings.
 *
 * When the abrasive pad polishes through the target film into a barrier/stop layer,
 * the interfacial friction changes abruptly, creating a step change in carrier/platen
 * motor current.
 *
 * Formula:
 *   timeToInterface = (filmThickness / removalRate) * 60 [seconds]
 *   overpolishDuration = timeToInterface * (overpolishPercent / 100) [seconds]
 *   totalTime = timeToInterface + underlayerDelaySec + overpolishDuration [seconds]
 */
export function calculateCmpEndpoint(options: CmpEndpointOptions): CmpEndpointResult {
  const { filmThickness, removalRate, underlayerDelaySec, overpolishPercent } = options;

  if (!Number.isFinite(filmThickness) || filmThickness <= 0) {
    throw new RangeError('Film thickness must be a positive finite number.');
  }
  if (!Number.isFinite(removalRate) || removalRate <= 0) {
    throw new RangeError('Removal rate must be a positive finite number.');
  }
  if (!Number.isFinite(underlayerDelaySec) || underlayerDelaySec < 0) {
    throw new RangeError('Underlayer delay must be a non-negative finite number.');
  }
  if (!Number.isFinite(overpolishPercent) || overpolishPercent < 0) {
    throw new RangeError('Overpolish percent must be a non-negative finite number.');
  }

  // timeToInterface in seconds = (thickness / rate_per_min) * 60 s/min
  const timeToInterfaceSec = (filmThickness / removalRate) * 60;
  const timeToInterfaceMin = timeToInterfaceSec / 60;
  const detectedEndpointTimeSec = timeToInterfaceSec + underlayerDelaySec;
  const overpolishDurationSec = timeToInterfaceSec * (overpolishPercent / 100);
  const totalTimeSec = timeToInterfaceSec + underlayerDelaySec + overpolishDurationSec;
  const totalTimeMin = totalTimeSec / 60;

  const ratePerSec = removalRate / 60;
  const overpolishThicknessRemovedNm = ratePerSec * overpolishDurationSec;
  const totalThicknessRemovedNm = filmThickness + ratePerSec * (underlayerDelaySec + overpolishDurationSec);

  return {
    timeToInterfaceSec,
    timeToInterfaceMin,
    underlayerDelaySec,
    detectedEndpointTimeSec,
    overpolishDurationSec,
    totalTimeSec,
    totalTimeMin,
    filmThicknessNm: filmThickness,
    overpolishThicknessRemovedNm,
    totalThicknessRemovedNm,
  };
}

export interface OpticalOscillationOptions {
  /** Laser / illumination wavelength lambda (nm). Must be > 0. */
  wavelengthNm?: number;
  /** Alias for wavelengthNm */
  wavelength?: number;
  /** Alias for wavelengthNm */
  lambda?: number;

  /** Film refractive index n. Must be >= 1. */
  refractiveIndex?: number;
  /** Alias for refractiveIndex */
  n?: number;

  /** Film removal rate (nm/min). Must be > 0. */
  removalRate?: number;
  /** Alias for removalRate */
  removalRateNmPerMin?: number;
  /** Alias for removalRate */
  rr?: number;

  /** Optional film thickness to determine expected fringe count (nm). Must be > 0 if specified. */
  filmThickness?: number;
}

export interface OpticalOscillationResult {
  /** Illumination wavelength lambda (nm) */
  wavelengthNm: number;
  /** Film refractive index n */
  refractiveIndex: number;
  /** Film removal rate (nm/min) */
  removalRateNmPerMin: number;
  /** Thickness removed per full interference cycle / fringe: lambda / (2 * n) (nm) */
  thicknessPerCycleNm: number;
  /** Interference oscillation period T in seconds */
  oscillationPeriodSec: number;
  /** Interference oscillation period T in minutes */
  oscillationPeriodMin: number;
  /** Oscillation frequency in Hertz (Hz = 1 / periodSec) */
  oscillationFrequencyHz: number;
  /** Expected number of interference fringes for provided film thickness */
  expectedFringes?: number;
}

/**
 * Calculates the optical reflection endpoint interference oscillation period.
 *
 * In situ optical reflectometry detects sinusoidal reflectance oscillations
 * caused by Fabry-Perot interference between the top film surface and the substrate.
 *
 * Formula:
 *   Thickness per fringe: delta_d = lambda / (2 * n)
 *   Period:               T = lambda / (2 * n * RR)
 */
export function calculateOpticalOscillationPeriod(
  options: OpticalOscillationOptions
): OpticalOscillationResult {
  const wavelengthVal = options.wavelengthNm ?? options.wavelength ?? options.lambda;
  const nVal = options.refractiveIndex ?? options.n;
  const rrVal = options.removalRateNmPerMin ?? options.removalRate ?? options.rr;
  const thicknessVal = options.filmThickness;

  if (wavelengthVal === undefined || !Number.isFinite(wavelengthVal) || wavelengthVal <= 0) {
    throw new RangeError('Wavelength must be a positive finite number in nanometres.');
  }
  if (nVal === undefined || !Number.isFinite(nVal) || nVal < 1) {
    throw new RangeError('Refractive index (n) must be a finite number greater than or equal to 1.');
  }
  if (rrVal === undefined || !Number.isFinite(rrVal) || rrVal <= 0) {
    throw new RangeError('Removal rate (RR) must be a positive finite number.');
  }
  if (thicknessVal !== undefined && (!Number.isFinite(thicknessVal) || thicknessVal <= 0)) {
    throw new RangeError('Film thickness must be a positive finite number.');
  }

  // Thickness removed during one full 2*pi phase shift
  const thicknessPerCycleNm = wavelengthVal / (2 * nVal);

  // Period T in minutes = delta_d / RR
  const oscillationPeriodMin = thicknessPerCycleNm / rrVal;
  // Period T in seconds = oscillationPeriodMin * 60
  const oscillationPeriodSec = oscillationPeriodMin * 60;
  const oscillationFrequencyHz = 1 / oscillationPeriodSec;

  const result: OpticalOscillationResult = {
    wavelengthNm: wavelengthVal,
    refractiveIndex: nVal,
    removalRateNmPerMin: rrVal,
    thicknessPerCycleNm,
    oscillationPeriodSec,
    oscillationPeriodMin,
    oscillationFrequencyHz,
  };

  if (thicknessVal !== undefined) {
    result.expectedFringes = thicknessVal / thicknessPerCycleNm;
  }

  return result;
}

/** Alias for calculateOpticalOscillationPeriod. */
export const calculateOpticalEndpoint = calculateOpticalOscillationPeriod;

export interface PadLifeOptions {
  /** Number of wafers polished on the pad so far (>= 0). */
  currentWafers: number;
  /** Maximum qualified pad life in wafers (e.g. 1000 - 1500). Must be > 0. */
  maxPadLifeWafers: number;
  /** Diamond disc pad conditioning cut rate (wear rate) in um/hour. Must be >= 0. */
  conditioningCutRateUmPerHour: number;
  /** Initial pad groove depth in mm (e.g. 1.2 mm). Must be > 0. */
  initialPadGrooveDepthMm: number;
  /** Minimum allowable groove depth before slurry transport failure in mm (e.g. 0.3 mm). Must be >= 0. */
  minAllowedGrooveDepthMm: number;
  /** Optional conditioning time per wafer in seconds (default: 60 s). Must be > 0. */
  conditioningSecPerWafer?: number;
}

export interface PadLifeResult {
  /** Current wafers processed */
  currentWafers: number;
  /** Max pad life target based on wafer count */
  maxPadLifeWafers: number;
  /** Pad wear rate per wafer in micrometres (um/wafer) */
  padWearRateUmPerWafer: number;
  /** Pad wear rate in mm per 1000 wafers */
  padWearRateMmPer1000Wafers: number;
  /** Total cumulative pad groove wear so far in micrometres (um) */
  totalPadWearUm: number;
  /** Total cumulative pad groove wear so far in millimetres (mm) */
  totalPadWearMm: number;
  /** Remaining groove depth from bottom of groove to current pad surface (mm) */
  currentGrooveDepthMm: number;
  /** Usable groove depth remaining above minimum threshold (mm) */
  grooveDepthRemainingMm: number;
  /** Theoretical maximum wafers allowed purely by groove depth limit */
  maxWafersByGroove: number;
  /** Remaining wafers before groove reaches minAllowedGrooveDepthMm */
  remainingWafersByGroove: number;
  /** Remaining wafers before maxPadLifeWafers is reached */
  remainingWafersByCount: number;
  /** Effective remaining wafers (min of remaining by count and remaining by groove, >= 0) */
  remainingWafers: number;
  /** Percentage of pad life used (0 - 100%) */
  percentLifeUsed: number;
  /** Percentage of pad life remaining (>= 0%) */
  percentLifeRemaining: number;
  /** Whether the pad is expired (by wafer count or groove depth) */
  isExpired: boolean;
  /** Which limit is reached first or limiting current life */
  limitingFactor: 'wafer_count' | 'groove_wear';
}

/**
 * Calculates CMP pad conditioning wear, remaining wafers, and remaining groove depth.
 *
 * During CMP, a diamond disc continuously conditions the polyurethane pad to prevent
 * glazing and open up micro-pores. This abrasion cuts away pad material and slowly
 * depletes the pad grooves needed for slurry transport.
 */
export function calculatePadLife(options: PadLifeOptions): PadLifeResult {
  const {
    currentWafers,
    maxPadLifeWafers,
    conditioningCutRateUmPerHour,
    initialPadGrooveDepthMm,
    minAllowedGrooveDepthMm,
    conditioningSecPerWafer = 60,
  } = options;

  if (!Number.isFinite(currentWafers) || currentWafers < 0) {
    throw new RangeError('Current wafers must be a non-negative finite number.');
  }
  if (!Number.isFinite(maxPadLifeWafers) || maxPadLifeWafers <= 0) {
    throw new RangeError('Max pad life wafers must be a positive finite number.');
  }
  if (!Number.isFinite(conditioningCutRateUmPerHour) || conditioningCutRateUmPerHour < 0) {
    throw new RangeError('Conditioning cut rate must be a non-negative finite number.');
  }
  if (!Number.isFinite(initialPadGrooveDepthMm) || initialPadGrooveDepthMm <= 0) {
    throw new RangeError('Initial pad groove depth must be a positive finite number.');
  }
  if (!Number.isFinite(minAllowedGrooveDepthMm) || minAllowedGrooveDepthMm < 0) {
    throw new RangeError('Minimum allowed groove depth must be a non-negative finite number.');
  }
  if (initialPadGrooveDepthMm <= minAllowedGrooveDepthMm) {
    throw new RangeError('Initial pad groove depth must be greater than minimum allowed groove depth.');
  }
  if (!Number.isFinite(conditioningSecPerWafer) || conditioningSecPerWafer <= 0) {
    throw new RangeError('Conditioning time per wafer must be a positive finite number.');
  }

  // Pad wear per wafer: cut rate (um/hr) * (sec/wafer / 3600 sec/hr)
  const padWearRateUmPerWafer = conditioningCutRateUmPerHour * (conditioningSecPerWafer / 3600);
  const padWearRateMmPer1000Wafers = padWearRateUmPerWafer; // (um * 1000) / 1000 = um

  // Total wear to date
  const totalPadWearUm = currentWafers * padWearRateUmPerWafer;
  const totalPadWearMm = totalPadWearUm / 1000;

  // Current groove depth
  const currentGrooveDepthMm = Math.max(0, initialPadGrooveDepthMm - totalPadWearMm);
  const grooveDepthRemainingMm = Math.max(0, currentGrooveDepthMm - minAllowedGrooveDepthMm);

  // Usable groove depth in um (with float precision guard)
  const usableGrooveDepthUm = Math.round((initialPadGrooveDepthMm - minAllowedGrooveDepthMm) * 1000 * 1e6) / 1e6;
  const remainingGrooveDepthUm = Math.round(grooveDepthRemainingMm * 1000 * 1e6) / 1e6;

  let maxWafersByGroove: number;
  let remainingWafersByGroove: number;

  if (padWearRateUmPerWafer > 0) {
    maxWafersByGroove = Math.floor(usableGrooveDepthUm / padWearRateUmPerWafer + 1e-9);
    remainingWafersByGroove = Math.max(0, Math.floor(remainingGrooveDepthUm / padWearRateUmPerWafer + 1e-9));
  } else {
    maxWafersByGroove = Infinity;
    remainingWafersByGroove = Infinity;
  }

  const remainingWafersByCount = Math.max(0, maxPadLifeWafers - currentWafers);
  const effectiveMaxWafers = Math.min(maxPadLifeWafers, maxWafersByGroove);
  const remainingWafers = Math.min(remainingWafersByCount, remainingWafersByGroove);

  const limitingFactor: 'wafer_count' | 'groove_wear' =
    maxWafersByGroove < maxPadLifeWafers ? 'groove_wear' : 'wafer_count';

  const percentLifeUsed = effectiveMaxWafers > 0 ? Math.min(100, (currentWafers / effectiveMaxWafers) * 100) : 100;
  const percentLifeRemaining = Math.max(0, 100 - percentLifeUsed);

  const isExpired =
    currentWafers >= effectiveMaxWafers || currentGrooveDepthMm <= minAllowedGrooveDepthMm;

  return {
    currentWafers,
    maxPadLifeWafers,
    padWearRateUmPerWafer,
    padWearRateMmPer1000Wafers,
    totalPadWearUm,
    totalPadWearMm,
    currentGrooveDepthMm,
    grooveDepthRemainingMm,
    maxWafersByGroove,
    remainingWafersByGroove,
    remainingWafersByCount,
    remainingWafers,
    percentLifeUsed,
    percentLifeRemaining,
    isExpired,
    limitingFactor,
  };
}
