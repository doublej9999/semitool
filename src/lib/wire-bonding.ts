/**
 * Wire Bonding Parasitics & Fusing Current Calculations.
 *
 * Models high-frequency impedance, skin effect, parasitic self-inductance,
 * DC/AC resistance, Preece fusing current, and continuous JEDEC current limits
 * for microelectronic wire bonding interconnects (Au, Cu, Al, Ag).
 *
 * References:
 * - E. B. Rosa, "The Self and Mutual Inductances of Linear Conductors", NBS Bulletin (1908).
 * - W. H. Preece, "On the Heating Effects of Electric Currents", Proc. Royal Society (1884).
 * - JEDEC Standard JESD58 / MIL-STD-883 Wire Bonding Current Carrying Capacity.
 */

export interface WireMaterial {
  id: string;
  name: string;
  symbol: string;
  resistivityOhmM: number; // Ω·m at 25°C
  tempCoeffPerC: number; // 1/°C
  preeceConstantK: number; // Preece constant for fusing current (I_fuse = k * d_in^1.5)
  maxDcCurrentDensityAcm2: number; // JEDEC safe continuous limit (A/cm²)
  description: string;
}

export const WIRE_MATERIALS: WireMaterial[] = [
  {
    id: 'gold',
    name: 'Gold (Au)',
    symbol: 'Au',
    resistivityOhmM: 2.44e-8,
    tempCoeffPerC: 0.0034,
    preeceConstantK: 10240,
    maxDcCurrentDensityAcm2: 1.0e5,
    description: 'Industry standard for thermosonic ball bonding. Excellent corrosion resistance and bondability.',
  },
  {
    id: 'copper',
    name: 'Copper (Cu)',
    symbol: 'Cu',
    resistivityOhmM: 1.68e-8,
    tempCoeffPerC: 0.00393,
    preeceConstantK: 11980,
    maxDcCurrentDensityAcm2: 1.5e5,
    description: 'Higher electrical and thermal conductivity with superior stiffness; widely used in high-power ICs.',
  },
  {
    id: 'aluminium',
    name: 'Aluminium (Al-1%Si)',
    symbol: 'Al-1%Si',
    resistivityOhmM: 2.82e-8,
    tempCoeffPerC: 0.00429,
    preeceConstantK: 7585,
    maxDcCurrentDensityAcm2: 0.5e5,
    description: 'Standard for ultrasonic wedge bonding in hermetic packages, automotive modules, and power discretes.',
  },
  {
    id: 'silver',
    name: 'Silver (Ag)',
    symbol: 'Ag',
    resistivityOhmM: 1.59e-8,
    tempCoeffPerC: 0.0038,
    preeceConstantK: 11100,
    maxDcCurrentDensityAcm2: 1.2e5,
    description: 'High conductivity and ductility; cost-effective alternative to gold for LED and QFN packaging.',
  },
];

export interface WireBondingInput {
  materialId?: string;
  customResistivityOhmM?: number;
  customPreeceK?: number;
  customMaxCurrentDensityAcm2?: number;
  wireLengthMm: number; // mm
  wireDiameterUm: number; // µm
  frequencyHz: number; // Hz (e.g. 1e9 for 1 GHz)
  operatingCurrentA: number; // A (e.g. 0.2 A)
  ambientTempC?: number; // °C, default 25°C
}

export interface WireBondingSuccess {
  ok: true;
  material: WireMaterial;
  wireLengthMm: number;
  wireDiameterUm: number;
  wireDiameterMils: number;
  frequencyHz: number;
  operatingCurrentA: number;
  ambientTempC: number;
  effectiveResistivityOhmM: number;
  radiusM: number;
  areaM2: number;
  areaCm2: number;
  dcResistanceOhm: number;
  dcResistanceMOhm: number;
  inductanceH: number;
  inductanceNh: number;
  deltaSkinM: number;
  deltaSkinUm: number;
  effectiveAreaM2: number;
  acResistanceOhm: number;
  acResistanceMOhm: number;
  skinEffectRatio: number;
  inductiveReactanceOhm: number;
  impedanceOhm: number;
  fusingCurrentA: number;
  safeCurrentA: number;
  currentMarginA: number;
  utilizationPct: number;
  isCurrentSafe: boolean;
  isBelowFusing: boolean;
}

export interface WireBondingError {
  ok: false;
  errors: string[];
}

export type WireBondingResult = WireBondingSuccess | WireBondingError;

export const VACUUM_PERMEABILITY_H_PER_M = 4 * Math.PI * 1e-7;

/**
 * Calculates wire bonding parasitics, high frequency AC impedance,
 * Preece fusing limit, and continuous safe DC current.
 */
export function calculateWireBonding(input: WireBondingInput): WireBondingResult {
  const errors: string[] = [];

  const {
    materialId = 'gold',
    customResistivityOhmM,
    customPreeceK,
    customMaxCurrentDensityAcm2,
    wireLengthMm,
    wireDiameterUm,
    frequencyHz,
    operatingCurrentA,
    ambientTempC = 25,
  } = input;

  if (!Number.isFinite(wireLengthMm) || wireLengthMm <= 0) {
    errors.push('Wire length must be greater than 0 mm.');
  }

  if (!Number.isFinite(wireDiameterUm) || wireDiameterUm <= 0) {
    errors.push('Wire diameter must be greater than 0 µm.');
  }

  if (!Number.isFinite(frequencyHz) || frequencyHz < 0) {
    errors.push('Signal frequency must be 0 Hz or positive.');
  }

  if (!Number.isFinite(operatingCurrentA) || operatingCurrentA < 0) {
    errors.push('Operating current must be 0 A or positive.');
  }

  if (!Number.isFinite(ambientTempC) || ambientTempC < -273.15) {
    errors.push('Ambient temperature must be above absolute zero (-273.15 °C).');
  }

  let material: WireMaterial;
  if (materialId === 'custom') {
    if (!Number.isFinite(customResistivityOhmM) || (customResistivityOhmM ?? 0) <= 0) {
      errors.push('Custom resistivity must be greater than 0 Ω·m.');
    }
    if (!Number.isFinite(customPreeceK) || (customPreeceK ?? 0) <= 0) {
      errors.push('Custom Preece constant k must be greater than 0.');
    }
    if (!Number.isFinite(customMaxCurrentDensityAcm2) || (customMaxCurrentDensityAcm2 ?? 0) <= 0) {
      errors.push('Custom maximum current density must be greater than 0 A/cm².');
    }

    material = {
      id: 'custom',
      name: 'Custom Material',
      symbol: 'Custom',
      resistivityOhmM: customResistivityOhmM ?? 2.44e-8,
      tempCoeffPerC: 0.0039,
      preeceConstantK: customPreeceK ?? 10000,
      maxDcCurrentDensityAcm2: customMaxCurrentDensityAcm2 ?? 1.0e5,
      description: 'User-specified bonding wire properties.',
    };
  } else {
    const preset = WIRE_MATERIALS.find((m) => m.id === materialId);
    if (!preset) {
      errors.push(`Unknown wire material preset "${materialId}".`);
      material = WIRE_MATERIALS[0];
    } else {
      material = preset;
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // Unit conversions
  const lengthM = wireLengthMm * 1e-3;
  const diameterM = wireDiameterUm * 1e-6;
  const radiusM = diameterM / 2;
  const wireDiameterMils = wireDiameterUm / 25.4;
  const diameterInches = wireDiameterUm / 25400;

  // Temperature corrected resistivity: rho(T) = rho_25 * [1 + alpha * (Ta - 25)]
  const tempCorrectionFactor = Math.max(0.1, 1 + material.tempCoeffPerC * (ambientTempC - 25));
  const effectiveResistivityOhmM = material.resistivityOhmM * tempCorrectionFactor;

  // Geometric area
  const areaM2 = Math.PI * radiusM * radiusM;
  const areaCm2 = areaM2 * 1e4;

  // DC Resistance R_dc = rho * L / A
  const dcResistanceOhm = (effectiveResistivityOhmM * lengthM) / areaM2;
  const dcResistanceMOhm = dcResistanceOhm * 1e3;

  // Self Inductance (Rosa formula for straight wire of circular cross section)
  // L_wire = 2e-7 * L * [ ln(4 * L / d) - 1 + 0.25 ]
  // For physically meaningful wire bond, 4 * L / d is large
  const argRatio = Math.max(1.001, (4 * lengthM) / diameterM);
  const inductanceH = 2e-7 * lengthM * (Math.log(argRatio) - 1 + 0.25);
  const inductanceNh = inductanceH * 1e9;

  // Skin depth: delta = sqrt(rho / (pi * f * mu0))
  let deltaSkinM = Infinity;
  if (frequencyHz > 0) {
    deltaSkinM = Math.sqrt(
      effectiveResistivityOhmM / (Math.PI * frequencyHz * VACUUM_PERMEABILITY_H_PER_M)
    );
  }
  const deltaSkinUm = Number.isFinite(deltaSkinM) ? deltaSkinM * 1e6 : Infinity;

  // High-frequency AC resistance
  let effectiveAreaM2 = areaM2;
  let acResistanceOhm = dcResistanceOhm;
  if (frequencyHz > 0 && deltaSkinM < radiusM) {
    // Current flows through tubular skin shell of thickness delta
    effectiveAreaM2 = 2 * Math.PI * radiusM * deltaSkinM - Math.PI * deltaSkinM * deltaSkinM;
    acResistanceOhm = (effectiveResistivityOhmM * lengthM) / effectiveAreaM2;
  }
  const acResistanceMOhm = acResistanceOhm * 1e3;
  const skinEffectRatio = acResistanceOhm / dcResistanceOhm;

  // Inductive reactance XL = 2 * pi * f * L_wire
  const inductiveReactanceOhm = 2 * Math.PI * frequencyHz * inductanceH;

  // Total HF Impedance Z = sqrt(R_ac^2 + XL^2)
  const impedanceOhm = Math.sqrt(
    acResistanceOhm * acResistanceOhm + inductiveReactanceOhm * inductiveReactanceOhm
  );

  // Preece Fusing Current: I_fuse = k * (d_inches)^1.5
  const fusingCurrentA = material.preeceConstantK * Math.pow(diameterInches, 1.5);

  // Continuous JEDEC Safe DC Current: I_safe_dc = J_max * A_cm2
  const safeCurrentA = material.maxDcCurrentDensityAcm2 * areaCm2;

  // Utilization & margin
  const utilizationPct = safeCurrentA > 0 ? (operatingCurrentA / safeCurrentA) * 100 : 0;
  const currentMarginA = safeCurrentA - operatingCurrentA;
  const isCurrentSafe = operatingCurrentA <= safeCurrentA;
  const isBelowFusing = operatingCurrentA < fusingCurrentA;

  return {
    ok: true,
    material,
    wireLengthMm,
    wireDiameterUm,
    wireDiameterMils,
    frequencyHz,
    operatingCurrentA,
    ambientTempC,
    effectiveResistivityOhmM,
    radiusM,
    areaM2,
    areaCm2,
    dcResistanceOhm,
    dcResistanceMOhm,
    inductanceH,
    inductanceNh,
    deltaSkinM,
    deltaSkinUm,
    effectiveAreaM2,
    acResistanceOhm,
    acResistanceMOhm,
    skinEffectRatio,
    inductiveReactanceOhm,
    impedanceOhm,
    fusingCurrentA,
    safeCurrentA,
    currentMarginA,
    utilizationPct,
    isCurrentSafe,
    isBelowFusing,
  };
}
