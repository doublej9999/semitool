/**
 * Semiconductor PN Junction and Depletion Layer Physics.
 *
 * Models an abrupt PN junction under thermal equilibrium and reverse bias.
 * Calculates built-in potential, space charge layer depletion widths,
 * maximum metallurgical electric field, junction capacitance, and
 * estimated avalanche breakdown voltage.
 */

/** Elementary charge q in Coulombs (C). */
export const ELEMENTARY_CHARGE = 1.602176634e-19;
/** Boltzmann constant k in Joules per Kelvin (J/K). */
export const BOLTZMANN_CONSTANT = 1.380649e-23;
/** Vacuum permittivity eps0 in Farads per centimetre (F/cm). (8.8541878128e-12 F/m) */
export const EPSILON_0 = 8.8541878128e-14;
/** Silicon relative permittivity eps_r. */
export const SILICON_EPSILON_R = 11.7;
/** Silicon bandgap Eg in eV at 300 K. */
export const SILICON_EG_EV = 1.12;

/** Centimetres in one micrometre (um). */
export const CM_PER_UM = 1e-4;
/** Centimetres in one nanometre (nm). */
export const CM_PER_NM = 1e-7;

/**
 * Unit conversion factor from F/cm^2 to fF/um^2.
 * 1 F = 1e15 fF, 1 cm^2 = 1e8 um^2 => 1 F/cm^2 = 1e7 fF/um^2.
 */
export const FF_UM2_PER_F_CM2 = 1e7;

/**
 * Unit conversion factor from F/cm^2 to pF/mm^2.
 * 1 F = 1e12 pF, 1 cm^2 = 100 mm^2 => 1 F/cm^2 = 1e10 pF/mm^2.
 */
export const PF_MM2_PER_F_CM2 = 1e10;

export interface SemiconductorDepletionInput {
  /** Temperature T in Kelvin (T > 0, default 300). */
  temperatureK: number;
  /** Acceptor concentration Na in cm^-3 (Na > 0). */
  naCm3: number;
  /** Donor concentration Nd in cm^-3 (Nd > 0). */
  ndCm3: number;
  /** Applied reverse bias Vr in Volts (Vr >= 0, default 0). */
  reverseBiasV: number;
  /** Relative permittivity of the semiconductor material (eps_r > 0, default 11.7 for Si). */
  epsilonR?: number;
  /** Bandgap of the semiconductor material in eV (Eg > 0, default 1.12 for Si). */
  bandgapEv?: number;
}

export interface SemiconductorDepletionSuccess {
  ok: true;
  temperatureK: number;
  naCm3: number;
  ndCm3: number;
  reverseBiasV: number;
  epsilonR: number;
  bandgapEv: number;
  /** Semiconductor permittivity eps_s in F/cm. */
  epsilonS: number;
  /** Thermal voltage Vt = k*T/q in Volts. */
  vtV: number;
  /** Intrinsic carrier concentration ni in cm^-3. */
  niCm3: number;
  /** Built-in potential Vbi in Volts. */
  vbiV: number;
  /** Total potential across junction Vtotal = Vbi + Vr in Volts. */
  vtotalV: number;
  /** Total depletion width W in cm. */
  widthCm: number;
  /** Depletion width W in micrometres (um). */
  widthUm: number;
  /** Depletion width W in nanometres (nm). */
  widthNm: number;
  /** Depletion width extending into p-region xp in cm. */
  xpCm: number;
  /** Depletion width extending into p-region xp in um. */
  xpUm: number;
  /** Depletion width extending into p-region xp in nm. */
  xpNm: number;
  /** Depletion width extending into n-region xn in cm. */
  xnCm: number;
  /** Depletion width extending into n-region xn in um. */
  xnUm: number;
  /** Depletion width extending into n-region xn in nm. */
  xnNm: number;
  /** Maximum electric field magnitude at junction metallurgical interface in V/cm. */
  maxElectricFieldVPerCm: number;
  /** Maximum electric field in kV/cm. */
  maxElectricFieldKVPerCm: number;
  /** Depletion capacitance per unit area Cj in F/cm^2. */
  capacitanceFPerCm2: number;
  /** Depletion capacitance per unit area in fF/um^2. */
  capacitanceFFPerUm2: number;
  /** Depletion capacitance per unit area in pF/mm^2. */
  capacitancePFPerMm2: number;
  /** Estimated avalanche breakdown voltage Vbd in Volts. */
  breakdownVoltageV: number;
}

export type SemiconductorDepletionResult =
  | { ok: false; errors: string[] }
  | SemiconductorDepletionSuccess;

/**
 * Calculates the thermal voltage Vt = k * T / q [V].
 */
export function calculateThermalVoltage(temperatureK: number): number {
  return (BOLTZMANN_CONSTANT * temperatureK) / ELEMENTARY_CHARGE;
}

/**
 * Calculates intrinsic carrier concentration ni(T) [cm^-3] for Silicon.
 * Using standard accepted value: ni(300 K) approx 1.0e10 cm^-3 (or 9.65e9 cm^-3).
 * Effective density of states at 300K: Nc = 2.8e19, Nv = 1.04e19 cm^-3.
 * sqrt(Nc*Nv) = 1.706e19 cm^-3.
 * ni(T) = sqrt(Nc * Nv) * (T / 300)^1.5 * exp(- Eg / (2 * Vt))
 */
export function calculateIntrinsicCarrierConcentration(
  temperatureK: number,
  vtV: number,
  bandgapEv: number = SILICON_EG_EV,
): number {
  // sqrt(Nc * Nv) at 300K in Si is ~ 2.509e19 cm^-3 when Eg=1.12eV to give ni ~ 1.0e10 cm^-3
  // Specifically: 1.0e10 / exp(-1.12 / (2 * 0.025852)) = 1.0e10 / 3.985e-10 = 2.509e19
  const prefactor = 2.509e19;
  return prefactor * Math.pow(temperatureK / 300, 1.5) * Math.exp(-bandgapEv / (2 * vtV));
}

/**
 * Main calculation function for PN junction depletion physics.
 */
export function calculateDepletion(
  input: SemiconductorDepletionInput,
): SemiconductorDepletionResult {
  const errors: string[] = [];
  const {
    temperatureK,
    naCm3,
    ndCm3,
    reverseBiasV,
    epsilonR = SILICON_EPSILON_R,
    bandgapEv = SILICON_EG_EV,
  } = input;

  if (!Number.isFinite(temperatureK) || temperatureK <= 0) {
    errors.push('Temperature must be a positive number in Kelvin (T > 0).');
  }
  if (!Number.isFinite(naCm3) || naCm3 <= 0) {
    errors.push('Acceptor concentration (Na) must be a positive number (Na > 0 cm^-3).');
  }
  if (!Number.isFinite(ndCm3) || ndCm3 <= 0) {
    errors.push('Donor concentration (Nd) must be a positive number (Nd > 0 cm^-3).');
  }
  if (!Number.isFinite(reverseBiasV) || reverseBiasV < 0) {
    errors.push('Reverse bias (Vr) must be a non-negative number (Vr >= 0 V).');
  }
  if (!Number.isFinite(epsilonR) || epsilonR <= 0) {
    errors.push('Relative permittivity must be positive.');
  }
  if (!Number.isFinite(bandgapEv) || bandgapEv <= 0) {
    errors.push('Bandgap must be a positive number in eV.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const vtV = calculateThermalVoltage(temperatureK);
  const niCm3 = calculateIntrinsicCarrierConcentration(temperatureK, vtV, bandgapEv);

  if (niCm3 <= 0 || !Number.isFinite(niCm3)) {
    return { ok: false, errors: ['Calculation produced invalid intrinsic carrier concentration.'] };
  }

  // Built-in potential Vbi = Vt * ln((Na * Nd) / ni^2)
  const vbiV = vtV * Math.log((naCm3 * ndCm3) / (niCm3 * niCm3));
  if (!Number.isFinite(vbiV) || vbiV <= 0) {
    return {
      ok: false,
      errors: ['Calculated built-in potential is non-positive or invalid. Check doping levels.'],
    };
  }

  const vtotalV = vbiV + reverseBiasV;
  const epsilonS = epsilonR * EPSILON_0;

  // W = sqrt( (2 * eps_s * Vtotal / q) * ((Na + Nd) / (Na * Nd)) ) [cm]
  const widthCm = Math.sqrt(
    ((2 * epsilonS * vtotalV) / ELEMENTARY_CHARGE) * ((naCm3 + ndCm3) / (naCm3 * ndCm3)),
  );

  const xpCm = widthCm * (ndCm3 / (naCm3 + ndCm3));
  const xnCm = widthCm * (naCm3 / (naCm3 + ndCm3));

  // Max electric field at junction x=0: Emax = 2 * Vtotal / W [V/cm]
  const maxElectricFieldVPerCm = (2 * vtotalV) / widthCm;
  const maxElectricFieldKVPerCm = maxElectricFieldVPerCm / 1000;

  // Junction depletion capacitance per unit area: Cj = eps_s / W [F/cm^2]
  const capacitanceFPerCm2 = epsilonS / widthCm;
  const capacitanceFFPerUm2 = capacitanceFPerCm2 * FF_UM2_PER_F_CM2;
  const capacitancePFPerMm2 = capacitanceFPerCm2 * PF_MM2_PER_F_CM2;

  // Breakdown voltage estimate (empirical 1-sided junction approximation):
  // V_bd approx 60 * (Eg / 1.1)^1.5 * (N_light / 1e16)^(-0.75)
  const nLight = Math.min(naCm3, ndCm3);
  const breakdownVoltageV = 60 * Math.pow(bandgapEv / 1.1, 1.5) * Math.pow(nLight / 1e16, -0.75);

  return {
    ok: true,
    temperatureK,
    naCm3,
    ndCm3,
    reverseBiasV,
    epsilonR,
    bandgapEv,
    epsilonS,
    vtV,
    niCm3,
    vbiV,
    vtotalV,
    widthCm,
    widthUm: widthCm / CM_PER_UM,
    widthNm: widthCm / CM_PER_NM,
    xpCm,
    xpUm: xpCm / CM_PER_UM,
    xpNm: xpCm / CM_PER_NM,
    xnCm,
    xnUm: xnCm / CM_PER_UM,
    xnNm: xnCm / CM_PER_NM,
    maxElectricFieldVPerCm,
    maxElectricFieldKVPerCm,
    capacitanceFPerCm2,
    capacitanceFFPerUm2,
    capacitancePFPerMm2,
    breakdownVoltageV,
  };
}
