/**
 * MOSFET Threshold Voltage and Gate Dielectric Physics.
 *
 * Implements classical MOS electrostatics for both NMOS (p-type substrate)
 * and PMOS (n-type substrate) including:
 * - Equivalent Oxide Thickness (EOT) & Gate Capacitance (Cox)
 * - Work function difference (phi_ms) & Flatband voltage (Vfb)
 * - Bulk potential (phi_B) & Depletion charge at inversion (Qdep)
 * - Zero-bias threshold voltage (Vth0)
 * - Substrate body effect (gamma and delta Vth under body bias Vsb)
 * - Subthreshold swing (S) in mV/decade
 */

export const ELEMENTARY_CHARGE = 1.602176634e-19; // C
export const BOLTZMANN_CONSTANT = 1.380649e-23; // J/K
export const EPSILON_0 = 8.8541878e-14; // F/cm
export const SILICON_EPSILON_R = 11.7;
export const SILICON_EPSILON = SILICON_EPSILON_R * EPSILON_0; // F/cm
export const SILICON_ELECTRON_AFFINITY_EV = 4.05; // chi_si in eV
export const SILICON_EG_EV = 1.12; // bandgap at 300K in eV

/** 1 F/cm² = 1e7 fF/µm² */
export const FF_UM2_PER_F_CM2 = 1e7;

export type MosfetChannelType = 'nmos' | 'pmos';

export interface DielectricPreset {
  id: string;
  name: string;
  epsR: number;
  description: string;
}

export const DIELECTRIC_PRESETS: DielectricPreset[] = [
  { id: 'sio2', name: 'SiO₂ (Silicon Dioxide)', epsR: 3.9, description: 'Classic gate dielectric' },
  { id: 'si3n4', name: 'Si₃N₄ (Silicon Nitride)', epsR: 7.5, description: 'Intermediate permittivity dielectric' },
  { id: 'al2o3', name: 'Al₂O₃ (Aluminium Oxide)', epsR: 9.0, description: 'High-k capping & memory dielectric' },
  { id: 'hfo2', name: 'HfO₂ (Hafnium Dioxide)', epsR: 25.0, description: 'Advanced HKMG logic standard' },
  { id: 'custom', name: 'Custom Dielectric', epsR: 3.9, description: 'User-specified relative permittivity' },
];

export interface GateElectrodePreset {
  id: string;
  name: string;
  workFunctionEv: number;
  description: string;
}

export const GATE_PRESETS: GateElectrodePreset[] = [
  { id: 'n_poly', name: 'n⁺ Poly-Silicon', workFunctionEv: 4.05, description: 'Degenerately doped n-type poly (χ = 4.05 eV)' },
  { id: 'p_poly', name: 'p⁺ Poly-Silicon', workFunctionEv: 5.17, description: 'Degenerately doped p-type poly (χ + Eg = 5.17 eV)' },
  { id: 'midgap', name: 'Midgap Metal', workFunctionEv: 4.60, description: 'Near silicon midgap work function (TiN / W)' },
  { id: 'custom', name: 'Custom Electrode', workFunctionEv: 4.50, description: 'User-specified work function in eV' },
];

export interface MosfetThresholdInput {
  channelType: MosfetChannelType;
  /** Substrate doping concentration N_sub in cm^-3 (Na for NMOS, Nd for PMOS). */
  substrateDopingCm3: number;
  /** Physical gate dielectric thickness tox in nm. */
  toxNm: number;
  /** Gate dielectric relative permittivity eps_r (default 3.9 for SiO2). */
  dielectricEpsR: number;
  /** Gate electrode work function phi_gate in eV. */
  gateWorkFunctionEv: number;
  /** Substrate body bias Vsb in Volts (source-to-body reverse bias, default 0 V). */
  bodyBiasV?: number;
  /** Fixed oxide charge density Qox/q in cm^-2 (default 1e10 cm^-2). */
  qoxPerQ?: number;
  /** Temperature T in Kelvin (default 300 K). */
  temperatureK?: number;
}

export interface MosfetThresholdSuccess {
  ok: true;
  channelType: MosfetChannelType;
  substrateDopingCm3: number;
  toxNm: number;
  dielectricEpsR: number;
  gateWorkFunctionEv: number;
  bodyBiasV: number;
  qoxPerQ: number;
  temperatureK: number;

  /** Thermal voltage Vt = k*T/q in Volts. */
  vtV: number;
  /** Silicon intrinsic carrier concentration ni in cm^-3. */
  niCm3: number;
  /** Dielectric permittivity eps_ox in F/cm. */
  epsOxFPerCm: number;
  /** Equivalent Oxide Thickness EOT = tox * (3.9 / eps_r) in nm. */
  eotNm: number;
  /** Gate oxide capacitance per unit area Cox in F/cm^2. */
  coxFPerCm2: number;
  /** Gate oxide capacitance per unit area in fF/µm^2. */
  coxFFPerUm2: number;
  /** Silicon bulk Fermi potential phi_B = Vt * ln(N_sub / ni) in Volts. */
  phiBV: number;
  /** Silicon substrate work function phi_s in eV. */
  phiSEv: number;
  /** Gate-to-substrate work function difference phi_ms = phi_gate - phi_s in Volts. */
  phiMsV: number;
  /** Flatband voltage Vfb = phi_ms - (q * Qox_q) / Cox in Volts. */
  vfbV: number;
  /** Depletion charge per unit area at onset of strong inversion Qdep in C/cm^2. */
  qdepCPerCm2: number;
  /** Maximum depletion layer width under gate at threshold in nm. */
  wdepMaxNm: number;
  /** Depletion capacitance per unit area Cdep = eps_si / Wdep_max in F/cm^2. */
  cdepFPerCm2: number;
  /** Body effect coefficient gamma in V^0.5. */
  gammaV05: number;
  /** Zero-bias threshold voltage Vth0 in Volts. */
  vth0V: number;
  /** Threshold voltage with applied body bias Vth in Volts. */
  vthV: number;
  /** Threshold shift delta Vth = Vth - Vth0 in Volts. */
  deltaVthV: number;
  /** Subthreshold swing S = ln(10) * Vt * (1 + Cdep / Cox) in mV/decade. */
  subthresholdSwingMVPerDec: number;
}

export type MosfetThresholdResult =
  | { ok: false; errors: string[] }
  | MosfetThresholdSuccess;

/**
 * Calculates the thermal voltage Vt = k * T / q in Volts.
 */
export function calculateThermalVoltage(temperatureK: number): number {
  return (BOLTZMANN_CONSTANT * temperatureK) / ELEMENTARY_CHARGE;
}

/**
 * Calculates silicon intrinsic carrier concentration ni(T) in cm^-3.
 * At 300 K, this evaluates to approx 1.00e10 cm^-3.
 */
export function calculateIntrinsicCarrierConcentration(
  temperatureK: number,
  vtV: number,
): number {
  const prefactor = 2.509e19;
  return prefactor * Math.pow(temperatureK / 300, 1.5) * Math.exp(-SILICON_EG_EV / (2 * vtV));
}

/**
 * Parses scientific notation strings into numbers safely.
 */
export function parseScientificNumber(str: string): number {
  const trimmed = str.trim().replace(/×10\^?/i, 'e').replace(/\^/g, '');
  return Number(trimmed);
}

/**
 * Evaluates full MOSFET threshold voltage and gate electrostatics.
 */
export function calculateMosfetThreshold(
  input: MosfetThresholdInput,
): MosfetThresholdResult {
  const errors: string[] = [];
  const {
    channelType,
    substrateDopingCm3,
    toxNm,
    dielectricEpsR,
    gateWorkFunctionEv,
    bodyBiasV = 0,
    qoxPerQ = 1e10,
    temperatureK = 300,
  } = input;

  if (channelType !== 'nmos' && channelType !== 'pmos') {
    errors.push("Channel type must be either 'nmos' or 'pmos'.");
  }
  if (!Number.isFinite(substrateDopingCm3) || substrateDopingCm3 <= 0) {
    errors.push('Substrate doping concentration must be a positive number in cm⁻³.');
  }
  if (!Number.isFinite(toxNm) || toxNm <= 0) {
    errors.push('Physical oxide thickness (tox) must be a positive number in nm.');
  }
  if (!Number.isFinite(dielectricEpsR) || dielectricEpsR <= 0) {
    errors.push('Dielectric relative permittivity (εr) must be greater than zero.');
  }
  if (!Number.isFinite(gateWorkFunctionEv) || gateWorkFunctionEv <= 0) {
    errors.push('Gate electrode work function must be a positive number in eV.');
  }
  if (!Number.isFinite(bodyBiasV)) {
    errors.push('Body bias (Vsb) must be a valid number.');
  }
  if (!Number.isFinite(qoxPerQ) || qoxPerQ < 0) {
    errors.push('Fixed oxide charge density (Qox/q) must be non-negative.');
  }
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) {
    errors.push('Temperature must be a positive number in Kelvin.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const vtV = calculateThermalVoltage(temperatureK);
  const niCm3 = calculateIntrinsicCarrierConcentration(temperatureK, vtV);

  if (substrateDopingCm3 <= niCm3) {
    return {
      ok: false,
      errors: [
        `Substrate doping (${substrateDopingCm3.toExponential(2)} cm⁻³) must exceed intrinsic carrier concentration ni (${niCm3.toExponential(2)} cm⁻³).`,
      ],
    };
  }

  // Dielectric permittivity eps_ox = eps_r * 8.8541878e-14 F/cm
  const epsOxFPerCm = dielectricEpsR * EPSILON_0;

  // Equivalent Oxide Thickness EOT = tox * (3.9 / eps_r) [nm]
  const eotNm = toxNm * (3.9 / dielectricEpsR);

  // Gate capacitance Cox = eps_ox / (tox * 1e-7) [F/cm^2]
  const toxCm = toxNm * 1e-7;
  const coxFPerCm2 = epsOxFPerCm / toxCm;
  const coxFFPerUm2 = coxFPerCm2 * FF_UM2_PER_F_CM2;

  // Bulk potential phi_B = Vt * ln(N_sub / ni) [V]
  const phiBV = vtV * Math.log(substrateDopingCm3 / niCm3);

  // Silicon substrate Fermi level / work function phi_s:
  // For p-substrate NMOS: phi_s = 4.05 + 0.56 + phi_B
  // For n-substrate PMOS: phi_s = 4.05 + 0.56 - phi_B
  const phiSEv =
    channelType === 'nmos'
      ? SILICON_ELECTRON_AFFINITY_EV + SILICON_EG_EV / 2 + phiBV
      : SILICON_ELECTRON_AFFINITY_EV + SILICON_EG_EV / 2 - phiBV;

  // Work function difference: phi_ms = phi_gate - phi_s [V]
  const phiMsV = gateWorkFunctionEv - phiSEv;

  // Flatband voltage Vfb = phi_ms - (q * Qox_q) / Cox [V]
  const vfbV = phiMsV - (ELEMENTARY_CHARGE * qoxPerQ) / coxFPerCm2;

  // Depletion charge magnitude at threshold: Qdep = sqrt(4 * eps_si * q * N_sub * phi_B)
  const qdepCPerCm2 = Math.sqrt(
    4 * SILICON_EPSILON * ELEMENTARY_CHARGE * substrateDopingCm3 * phiBV,
  );

  // Depletion width Wdep_max = sqrt(4 * eps_si * phi_B / (q * N_sub)) [cm]
  const wdepMaxCm = Math.sqrt(
    (4 * SILICON_EPSILON * phiBV) / (ELEMENTARY_CHARGE * substrateDopingCm3),
  );
  const wdepMaxNm = wdepMaxCm * 1e7;

  // Depletion capacitance Cdep = eps_si / Wdep_max
  const cdepFPerCm2 = SILICON_EPSILON / wdepMaxCm;

  // Body effect coefficient gamma = sqrt(2 * eps_si * q * N_sub) / Cox [V^0.5]
  const gammaV05 =
    Math.sqrt(2 * SILICON_EPSILON * ELEMENTARY_CHARGE * substrateDopingCm3) / coxFPerCm2;

  // Zero-bias threshold voltage Vth0:
  // NMOS: Vth0 = Vfb + 2 * phi_B + Qdep / Cox
  // PMOS: Vth0 = Vfb - 2 * phi_B - Qdep / Cox
  const vth0V =
    channelType === 'nmos'
      ? vfbV + 2 * phiBV + qdepCPerCm2 / coxFPerCm2
      : vfbV - 2 * phiBV - qdepCPerCm2 / coxFPerCm2;

  // Body bias calculation:
  // For NMOS: reverse substrate bias Vsb >= 0 increases threshold:
  // Vth = Vth0 + gamma * (sqrt(2 * phi_B + Vsb) - sqrt(2 * phi_B))
  // For PMOS: reverse substrate bias |Vsb| increases threshold magnitude (more negative):
  // Vth = Vth0 - gamma * (sqrt(2 * phi_B + |Vsb|) - sqrt(2 * phi_B))
  const effectiveBias = Math.max(0, channelType === 'nmos' ? bodyBiasV : Math.abs(bodyBiasV));
  const biasTerm = Math.sqrt(2 * phiBV + effectiveBias) - Math.sqrt(2 * phiBV);

  const deltaVthV = channelType === 'nmos' ? gammaV05 * biasTerm : -gammaV05 * biasTerm;
  const vthV = vth0V + deltaVthV;

  // Subthreshold swing S = ln(10) * Vt * (1 + Cdep / Cox) * 1000 [mV/decade]
  const subthresholdSwingMVPerDec =
    Math.LN10 * vtV * (1 + cdepFPerCm2 / coxFPerCm2) * 1000;

  return {
    ok: true,
    channelType,
    substrateDopingCm3,
    toxNm,
    dielectricEpsR,
    gateWorkFunctionEv,
    bodyBiasV,
    qoxPerQ,
    temperatureK,
    vtV,
    niCm3,
    epsOxFPerCm,
    eotNm,
    coxFPerCm2,
    coxFFPerUm2,
    phiBV,
    phiSEv,
    phiMsV,
    vfbV,
    qdepCPerCm2,
    wdepMaxNm,
    cdepFPerCm2,
    gammaV05,
    vth0V,
    vthV,
    deltaVthV,
    subthresholdSwingMVPerDec,
  };
}

/**
 * Generates an array of points for plotting Vth and EOT vs dielectric thickness tox.
 */
export function generateVthVsToxCurve(
  input: MosfetThresholdInput,
  minToxNm = 0.8,
  maxToxNm = 6.0,
  steps = 40,
): Array<{ toxNm: number; eotNm: number; vthV: number; coxFFPerUm2: number }> {
  const points: Array<{ toxNm: number; eotNm: number; vthV: number; coxFFPerUm2: number }> = [];
  const stepSize = (maxToxNm - minToxNm) / (steps - 1);

  for (let i = 0; i < steps; i++) {
    const tox = minToxNm + i * stepSize;
    const res = calculateMosfetThreshold({ ...input, toxNm: tox });
    if (res.ok) {
      points.push({
        toxNm: tox,
        eotNm: res.eotNm,
        vthV: res.vthV,
        coxFFPerUm2: res.coxFFPerUm2,
      });
    }
  }

  return points;
}
