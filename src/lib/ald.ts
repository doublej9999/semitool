/**
 * Atomic Layer Deposition (ALD) Cycle & Precursor Exposure Physics
 *
 * Implements fundamental ALD surface reaction and process modeling:
 * - Precursor exposure in Langmuirs (1 L = 1e-6 Torr·s)
 * - Langmuir chemisorption surface saturation model: θ = 1 - exp(-L / L0)
 * - Self-limiting Growth Per Cycle (GPC = GPC_max * θ_effective)
 * - Film thickness, cycle time, total deposition time, and throughput
 * - Precursor material & film presets (Al2O3, TiO2, HfO2, ZnO, ZrO2, TiN)
 * - Precursor consumption mass estimation
 */

export const LANGMUIR_TORR_SEC = 1e-6; // 1 Langmuir = 1e-6 Torr·s
export const IDEAL_GAS_R_TORR_L = 62.3637; // Torr·L / (mol·K)
export const DEFAULT_PUMPING_SPEED_L_PER_SEC = 15; // Typical ALD chamber pumping conductance (L/s)

export interface AldPreset {
  id: string;
  name: string;
  film: string;
  precursorA: string;
  precursorB: string;
  reactionEquation: string;
  typicalGpcAngstrom: number;
  gpcRangeAngstrom: [number, number];
  temperatureRangeC: [number, number];
  defaultSaturationDose1L: number;
  defaultSaturationDose2L: number;
  precursorMolarMassA: number; // g/mol
  precursorMolarMassB: number; // g/mol
  filmDensityGPerCm3: number; // g/cm³
  description: string;
}

export const ALD_PRESETS: AldPreset[] = [
  {
    id: 'al2o3-tma-h2o',
    name: 'Al2O3 (TMA + H2O)',
    film: 'Al2O3',
    precursorA: 'TMA (Trimethylaluminum, Al(CH3)3)',
    precursorB: 'H2O (Water vapor)',
    reactionEquation: '2 Al(CH3)3 + 3 H2O -> Al2O3 + 6 CH4',
    typicalGpcAngstrom: 1.1,
    gpcRangeAngstrom: [1.0, 1.1],
    temperatureRangeC: [150, 300],
    defaultSaturationDose1L: 10000,
    defaultSaturationDose2L: 10000,
    precursorMolarMassA: 72.09,
    precursorMolarMassB: 18.015,
    filmDensityGPerCm3: 3.0,
    description: 'Archetypal thermal ALD dielectric process with ideal self-limiting surface saturation and wide ALD temperature window.',
  },
  {
    id: 'tio2-ticl4-h2o',
    name: 'TiO2 (TiCl4 + H2O)',
    film: 'TiO2',
    precursorA: 'TiCl4 (Titanium tetrachloride)',
    precursorB: 'H2O (Water vapor)',
    reactionEquation: 'TiCl4 + 2 H2O -> TiO2 + 4 HCl',
    typicalGpcAngstrom: 0.55,
    gpcRangeAngstrom: [0.5, 0.6],
    temperatureRangeC: [150, 350],
    defaultSaturationDose1L: 10000,
    defaultSaturationDose2L: 10000,
    precursorMolarMassA: 189.68,
    precursorMolarMassB: 18.015,
    filmDensityGPerCm3: 4.23,
    description: 'High-permittivity optical coating and photoanode oxide; forms anatase or rutile crystal structures based on temperature.',
  },
  {
    id: 'hfo2-temah-h2o',
    name: 'HfO2 (TEMAH + H2O)',
    film: 'HfO2',
    precursorA: 'TEMAH (Tetrakis(ethylmethylamido)hafnium)',
    precursorB: 'H2O (Water vapor)',
    reactionEquation: 'Hf[N(CH3)(C2H5)]4 + 2 H2O -> HfO2 + 4 HN(CH3)(C2H5)',
    typicalGpcAngstrom: 0.95,
    gpcRangeAngstrom: [0.9, 1.0],
    temperatureRangeC: [200, 300],
    defaultSaturationDose1L: 10000,
    defaultSaturationDose2L: 10000,
    precursorMolarMassA: 410.85,
    precursorMolarMassB: 18.015,
    filmDensityGPerCm3: 9.68,
    description: 'High-k gate dielectric in advanced logic transistors (FinFET and GAA nanosheets) and ferroelectric FeFET memory.',
  },
  {
    id: 'hfo2-hfcl4-h2o',
    name: 'HfO2 (HfCl4 + H2O)',
    film: 'HfO2',
    precursorA: 'HfCl4 (Hafnium tetrachloride)',
    precursorB: 'H2O (Water vapor)',
    reactionEquation: 'HfCl4 + 2 H2O -> HfO2 + 4 HCl',
    typicalGpcAngstrom: 0.95,
    gpcRangeAngstrom: [0.9, 1.0],
    temperatureRangeC: [200, 350],
    defaultSaturationDose1L: 10000,
    defaultSaturationDose2L: 10000,
    precursorMolarMassA: 320.3,
    precursorMolarMassB: 18.015,
    filmDensityGPerCm3: 9.68,
    description: 'Halide-based HfO2 process offering robust thermal stability and high-purity conformal film growth.',
  },
  {
    id: 'zno-dez-h2o',
    name: 'ZnO (DEZ + H2O)',
    film: 'ZnO',
    precursorA: 'DEZ (Diethylzinc, Zn(C2H5)2)',
    precursorB: 'H2O (Water vapor)',
    reactionEquation: 'Zn(C2H5)2 + H2O -> ZnO + 2 C2H6',
    typicalGpcAngstrom: 1.65,
    gpcRangeAngstrom: [1.5, 1.8],
    temperatureRangeC: [100, 200],
    defaultSaturationDose1L: 10000,
    defaultSaturationDose2L: 10000,
    precursorMolarMassA: 123.51,
    precursorMolarMassB: 18.015,
    filmDensityGPerCm3: 5.61,
    description: 'Rapid growth rate transparent conductive oxide deposited at low thermal budget; ideal for displays and photovoltaics.',
  },
  {
    id: 'zro2-tdma-zr-h2o',
    name: 'ZrO2 (TDMA-Zr + H2O)',
    film: 'ZrO2',
    precursorA: 'TDMA-Zr (Tetrakis(dimethylamido)zirconium)',
    precursorB: 'H2O (Water vapor)',
    reactionEquation: 'Zr[N(CH3)2]4 + 2 H2O -> ZrO2 + 4 HN(CH3)2',
    typicalGpcAngstrom: 0.95,
    gpcRangeAngstrom: [0.9, 1.0],
    temperatureRangeC: [200, 250],
    defaultSaturationDose1L: 10000,
    defaultSaturationDose2L: 10000,
    precursorMolarMassA: 267.53,
    precursorMolarMassB: 18.015,
    filmDensityGPerCm3: 5.68,
    description: 'High-k dielectric for DRAM storage capacitors and high aspect ratio trench isolation structures.',
  },
  {
    id: 'tin-ticl4-nh3',
    name: 'TiN (TiCl4 + NH3)',
    film: 'TiN',
    precursorA: 'TiCl4 (Titanium tetrachloride)',
    precursorB: 'NH3 (Ammonia)',
    reactionEquation: '6 TiCl4 + 8 NH3 -> 6 TiN + N2 + 24 HCl',
    typicalGpcAngstrom: 0.25,
    gpcRangeAngstrom: [0.2, 0.3],
    temperatureRangeC: [350, 450],
    defaultSaturationDose1L: 10000,
    defaultSaturationDose2L: 10000,
    precursorMolarMassA: 189.68,
    precursorMolarMassB: 17.03,
    filmDensityGPerCm3: 5.22,
    description: 'Conductive diffusion barrier and metal gate electrode with exceptional conformality and copper electromigration resistance.',
  },
];

/**
 * Find a preset by ID, name, film, or precursor keyword.
 */
export function getAldPreset(precursorOrId: string): AldPreset | undefined {
  if (!precursorOrId) return undefined;
  const key = precursorOrId.trim().toLowerCase();

  // 1. Direct ID match
  const directMatch = ALD_PRESETS.find((p) => p.id.toLowerCase() === key);
  if (directMatch) return directMatch;

  // 2. Exact film formula match
  const filmMatch = ALD_PRESETS.find((p) => p.film.toLowerCase() === key);
  if (filmMatch) return filmMatch;

  // 3. Name match
  const nameMatch = ALD_PRESETS.find((p) => p.name.toLowerCase().includes(key));
  if (nameMatch) return nameMatch;

  // 4. Precursor keyword match
  if (key.includes('tma')) return ALD_PRESETS.find((p) => p.id === 'al2o3-tma-h2o');
  if (key.includes('nh3') || key === 'tin') return ALD_PRESETS.find((p) => p.id === 'tin-ticl4-nh3');
  if (key.includes('ticl4')) return ALD_PRESETS.find((p) => p.id === 'tio2-ticl4-h2o');
  if (key.includes('temah')) return ALD_PRESETS.find((p) => p.id === 'hfo2-temah-h2o');
  if (key.includes('hfcl4')) return ALD_PRESETS.find((p) => p.id === 'hfo2-hfcl4-h2o');
  if (key.includes('dez')) return ALD_PRESETS.find((p) => p.id === 'zno-dez-h2o');
  if (key.includes('zno')) return ALD_PRESETS.find((p) => p.id === 'zno-dez-h2o');
  if (key.includes('tdma') || key.includes('zro2')) return ALD_PRESETS.find((p) => p.id === 'zro2-tdma-zr-h2o');
  if (key.includes('hfo2')) return ALD_PRESETS.find((p) => p.id === 'hfo2-temah-h2o');
  if (key.includes('tio2')) return ALD_PRESETS.find((p) => p.id === 'tio2-ticl4-h2o');
  if (key.includes('al2o3')) return ALD_PRESETS.find((p) => p.id === 'al2o3-tma-h2o');

  return undefined;
}

/**
 * Calculate precursor exposure in Langmuirs.
 * 1 Langmuir (L) = 1e-6 Torr·s.
 * Exposure (L) = (P [Torr] * t [s]) / 1e-6.
 */
export function calculateExposure(pressureTorr: number, pulseTimeSec: number): number {
  if (!Number.isFinite(pressureTorr) || !Number.isFinite(pulseTimeSec)) return 0;
  if (pressureTorr <= 0 || pulseTimeSec <= 0) return 0;
  return (pressureTorr * pulseTimeSec) / LANGMUIR_TORR_SEC;
}

/**
 * Calculate fractional surface coverage θ using the Langmuir chemisorption model.
 * θ(L) = 1 - exp(-L / L0)
 * Returns fraction clamped between 0 and 1.
 */
export function calculateCoverage(exposureL: number, saturationDoseL: number): number {
  if (!Number.isFinite(exposureL) || exposureL <= 0) return 0;
  if (!Number.isFinite(saturationDoseL) || saturationDoseL <= 0) return 1;

  const theta = 1 - Math.exp(-exposureL / saturationDoseL);
  return Math.min(1, Math.max(0, theta));
}

/**
 * Calculate Growth Per Cycle (GPC).
 * GPC = GPC_max * θ
 * Returns both Å/cycle and nm/cycle.
 */
export function calculateGpc(gpcMaxAngstrom: number, coverage: number): { gpcAngstrom: number; gpcNm: number } {
  const safeGpcMax = Number.isFinite(gpcMaxAngstrom) && gpcMaxAngstrom > 0 ? gpcMaxAngstrom : 0;
  const safeCoverage = Number.isFinite(coverage) ? Math.min(1, Math.max(0, coverage)) : 0;

  const gpcAngstrom = safeGpcMax * safeCoverage;
  const gpcNm = gpcAngstrom * 0.1; // 1 Å = 0.1 nm

  return { gpcAngstrom, gpcNm };
}

/**
 * Calculate tool throughput in wafers per hour.
 * Throughput (wafers/hour) = (3600 * batchSize) / (t_total + t_overhead)
 */
export function calculateThroughput(totalDepositionTimeSec: number, overheadTimeSec = 0, batchSize = 1): number {
  const safeDepTime = Number.isFinite(totalDepositionTimeSec) && totalDepositionTimeSec > 0 ? totalDepositionTimeSec : 0;
  const safeOverhead = Number.isFinite(overheadTimeSec) && overheadTimeSec > 0 ? overheadTimeSec : 0;
  const safeBatch = Number.isFinite(batchSize) && batchSize >= 1 ? batchSize : 1;

  const totalCycleSec = safeDepTime + safeOverhead;
  if (totalCycleSec <= 0) return 0;

  return (3600 * safeBatch) / totalCycleSec;
}

/**
 * Format duration in seconds into human-readable hours/mins/secs.
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  const totalSec = Math.round(seconds);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export interface AldCycleInput {
  precursor: string;
  pulseTime1: number;
  purgeTime1: number;
  pulseTime2: number;
  purgeTime2: number;
  pressure1Torr: number;
  pressure2Torr: number;
  saturationDose1L?: number;
  saturationDose2L?: number;
  targetThicknessNm?: number;
  totalCycles?: number;
  gpcMaxAngstrom?: number;
  overheadTimeSec?: number;
  batchSize?: number;
  temperatureC?: number;
  carrierFlowSccm?: number;
  waferDiameterMm?: number;
}

export interface AldGpcDualUnit {
  angstrom: number;
  nm: number;
  valueOf(): number;
  toString(): string;
}

export interface AldCycleResult {
  exposure1_L: number;
  exposure2_L: number;
  exposure1L: number;
  exposure2L: number;
  coverage1: number;
  coverage2: number;
  effectiveCoverage: number;
  effectiveGpcAngstrom: number;
  effectiveGpcNm: number;
  effectiveGPC: AldGpcDualUnit;
  requiredCycles: number;
  resultingThicknessNm: number;
  resultingThicknessAngstrom: number;
  cycleTimeSec: number;
  totalDepositionTimeSec: number;
  formattedTime: string;
  precursorConsumptionGrams: number;
  precursorConsumptionDetails: {
    precursor1Grams: number;
    precursor2Grams: number;
    totalGrams: number;
  };
  throughputWph: number;
  preset?: AldPreset;
}

/**
 * Structured ALD cycle physics solver.
 *
 * Calculates:
 * - Exposure in Langmuirs for precursor 1 and 2
 * - Fractional chemisorption surface coverage θ1 and θ2
 * - Combined effective coverage (θ_eff = θ1 * θ2)
 * - Saturated and effective Growth Per Cycle (GPC)
 * - Required cycles or resulting film thickness
 * - Deposition cycle time, total duration, and throughput
 * - Precursor consumption mass estimation
 */
export function calculateAldCycle(input: AldCycleInput): AldCycleResult {
  const preset = getAldPreset(input.precursor);

  const pulseTime1 = Math.max(0, input.pulseTime1 || 0);
  const purgeTime1 = Math.max(0, input.purgeTime1 || 0);
  const pulseTime2 = Math.max(0, input.pulseTime2 || 0);
  const purgeTime2 = Math.max(0, input.purgeTime2 || 0);

  const pressure1Torr = Math.max(0, input.pressure1Torr || 0);
  const pressure2Torr = Math.max(0, input.pressure2Torr || 0);

  const satDose1 = input.saturationDose1L ?? preset?.defaultSaturationDose1L ?? 10000;
  const satDose2 = input.saturationDose2L ?? input.saturationDose1L ?? preset?.defaultSaturationDose2L ?? 10000;

  // 1. Calculate exposures in Langmuirs
  const exposure1_L = calculateExposure(pressure1Torr, pulseTime1);
  const exposure2_L = calculateExposure(pressure2Torr, pulseTime2);

  // 2. Calculate fractional surface coverage
  const coverage1 = calculateCoverage(exposure1_L, satDose1);
  const coverage2 = calculateCoverage(exposure2_L, satDose2);
  const effectiveCoverage = coverage1 * coverage2;

  // 3. Determine max GPC and effective GPC
  const gpcMaxAngstrom = input.gpcMaxAngstrom ?? preset?.typicalGpcAngstrom ?? 1.0;
  const { gpcAngstrom: effectiveGpcAngstrom, gpcNm: effectiveGpcNm } = calculateGpc(gpcMaxAngstrom, effectiveCoverage);

  const effectiveGPC: AldGpcDualUnit = {
    angstrom: effectiveGpcAngstrom,
    nm: effectiveGpcNm,
    valueOf() {
      return effectiveGpcAngstrom;
    },
    toString() {
      return `${effectiveGpcAngstrom} Å/cycle`;
    },
  };

  // 4. Required cycles or resulting thickness
  let requiredCycles = 0;
  let resultingThicknessNm = 0;

  if (input.targetThicknessNm !== undefined && input.targetThicknessNm > 0) {
    if (effectiveGpcNm > 0) {
      requiredCycles = Math.ceil(input.targetThicknessNm / effectiveGpcNm);
      resultingThicknessNm = requiredCycles * effectiveGpcNm;
    } else {
      requiredCycles = 0;
      resultingThicknessNm = 0;
    }
  } else if (input.totalCycles !== undefined) {
    requiredCycles = Math.max(0, Math.round(input.totalCycles));
    resultingThicknessNm = requiredCycles * effectiveGpcNm;
  } else {
    // Default fallback: 100 cycles
    requiredCycles = 100;
    resultingThicknessNm = requiredCycles * effectiveGpcNm;
  }

  const resultingThicknessAngstrom = resultingThicknessNm * 10;

  // 5. Deposition timing
  const cycleTimeSec = pulseTime1 + purgeTime1 + pulseTime2 + purgeTime2;
  const totalDepositionTimeSec = requiredCycles * cycleTimeSec;
  const formattedTime = formatDuration(totalDepositionTimeSec);

  // 6. Precursor consumption estimation
  const molarMass1 = preset?.precursorMolarMassA ?? 100;
  const molarMass2 = preset?.precursorMolarMassB ?? 18;
  const tempC = input.temperatureC ?? preset?.temperatureRangeC[0] ?? 200;
  const tempK = tempC + 273.15;

  // Molar dose per pulse through vacuum chamber: n = (P * t * S) / (R * T)
  const moles1PerCycle = (pressure1Torr * pulseTime1 * DEFAULT_PUMPING_SPEED_L_PER_SEC) / (IDEAL_GAS_R_TORR_L * tempK);
  const moles2PerCycle = (pressure2Torr * pulseTime2 * DEFAULT_PUMPING_SPEED_L_PER_SEC) / (IDEAL_GAS_R_TORR_L * tempK);

  const precursor1Grams = moles1PerCycle * molarMass1 * requiredCycles;
  const precursor2Grams = moles2PerCycle * molarMass2 * requiredCycles;
  const precursorConsumptionGrams = precursor1Grams + precursor2Grams;

  // 7. Throughput
  const throughputWph = calculateThroughput(totalDepositionTimeSec, input.overheadTimeSec ?? 0, input.batchSize ?? 1);

  return {
    exposure1_L,
    exposure2_L,
    exposure1L: exposure1_L,
    exposure2L: exposure2_L,
    coverage1,
    coverage2,
    effectiveCoverage,
    effectiveGpcAngstrom,
    effectiveGpcNm,
    effectiveGPC,
    requiredCycles,
    resultingThicknessNm,
    resultingThicknessAngstrom,
    cycleTimeSec,
    totalDepositionTimeSec,
    formattedTime,
    precursorConsumptionGrams,
    precursorConsumptionDetails: {
      precursor1Grams,
      precursor2Grams,
      totalGrams: precursorConsumptionGrams,
    },
    throughputWph,
    preset,
  };
}
