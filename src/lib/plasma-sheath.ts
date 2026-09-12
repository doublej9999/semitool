/**
 * Plasma Sheath, Debye Length & Bohm Criterion Physics
 *
 * Implements fundamental low-temperature plasma parameters:
 * - Electron Debye length (λ_De)
 * - Bohm presheath velocity (u_B) and Bohm ion current density (J_B)
 * - Floating potential (V_f)
 * - Child-Langmuir collisionless RF bias sheath thickness (s)
 * - Sheath capacitance per unit area (C_sheath)
 * - Electron plasma frequency (f_pe)
 * - Ion mean free path and collisionality index
 */

// Fundamental Physical Constants (SI Units)
export const EPSILON_0 = 8.8541878128e-12; // F/m (Permittivity of vacuum)
export const ELEMENTARY_CHARGE = 1.602176634e-19; // C
export const ELECTRON_MASS_KG = 9.1093837e-31; // kg
export const ATOMIC_MASS_UNIT_KG = 1.6605390666e-27; // kg (1 amu)
export const BOLTZMANN_CONSTANT = 1.380649e-23; // J/K

export interface PlasmaGasPreset {
  id: string;
  name: string;
  gasFormula: string;
  ionFormula: string;
  ionMassAmu: number;
  typicalProcess: string;
}

export const PLASMA_GAS_PRESETS: PlasmaGasPreset[] = [
  {
    id: 'argon',
    name: 'Argon (Ar⁺)',
    gasFormula: 'Ar',
    ionFormula: 'Ar⁺',
    ionMassAmu: 39.948,
    typicalProcess: 'Sputter etch, ICP Ar dilution, ion beam etching',
  },
  {
    id: 'chlorine',
    name: 'Chlorine (Cl⁺ / Cl₂⁺)',
    gasFormula: 'Cl2',
    ionFormula: 'Cl⁺',
    ionMassAmu: 35.45,
    typicalProcess: 'Silicon poly gate etch, metal (Al, TiN) RIE',
  },
  {
    id: 'cf3',
    name: 'Fluorocarbon (CF₃⁺ / CF₄)',
    gasFormula: 'CF4',
    ionFormula: 'CF3⁺',
    ionMassAmu: 69.0,
    typicalProcess: 'SiO₂ dielectric contact hole & via etch',
  },
  {
    id: 'sf5',
    name: 'Sulfur Hexafluoride (SF₅⁺ / SF₆)',
    gasFormula: 'SF6',
    ionFormula: 'SF5⁺',
    ionMassAmu: 127.06,
    typicalProcess: 'Deep Reactive Ion Etch (DRIE Bosch process), silicon trench etch',
  },
  {
    id: 'oxygen',
    name: 'Oxygen (O₂⁺ / O⁺)',
    gasFormula: 'O2',
    ionFormula: 'O2⁺',
    ionMassAmu: 31.998,
    typicalProcess: 'Photoresist strip / plasma ashing, surface oxidation',
  },
  {
    id: 'nitrogen',
    name: 'Nitrogen (N₂⁺)',
    gasFormula: 'N2',
    ionFormula: 'N2⁺',
    ionMassAmu: 28.014,
    typicalProcess: 'PECVD SiNx passivation, nitridation, chamber cleaning',
  },
  {
    id: 'hydrogen',
    name: 'Hydrogen (H⁺ / H₂⁺)',
    gasFormula: 'H2',
    ionFormula: 'H⁺',
    ionMassAmu: 1.008,
    typicalProcess: 'Hydrogen plasma reduction, extreme EUV pellicle clean',
  },
];

export interface PlasmaSheathInputs {
  electronDensityCm3: number; // e.g. 1e10 to 1e12 cm^-3
  electronTempEv: number; // e.g. 2 to 5 eV
  ionMassAmu: number; // e.g. 39.95 for Argon
  sheathVoltageV: number; // applied RF bias voltage or self-bias (V)
  chamberPressureMtorr?: number; // mTorr (optional, for mean free path)
}

export interface PlasmaSheathResult {
  debyeLengthUm: number; // µm
  debyeLengthMm: number; // mm
  bohmVelocityMPerSec: number; // m/s
  ionFluxDensityAmpsPerM2: number; // A/m²
  ionCurrentDensityMaPerCm2: number; // mA/cm²
  electronPlasmaFreqGhz: number; // GHz
  electronThermalVelocityMPerSec: number; // m/s
  floatingPotentialVolts: number; // V (negative wrt plasma)
  childLangmuirSheathUm: number; // µm
  childLangmuirSheathMm: number; // mm
  sheathCapacitancePfPerCm2: number; // pF/cm²
  ionMeanFreePathMm?: number; // mm
  collisionalityRatio?: number; // sheath / lambda_i
  regimeDescription: string;
}

export function calculatePlasmaSheath(inputs: PlasmaSheathInputs): PlasmaSheathResult {
  const n0_cm3 = Math.max(1e7, inputs.electronDensityCm3);
  const n0_m3 = n0_cm3 * 1e6; // convert cm^-3 to m^-3
  const Te_eV = Math.max(0.1, inputs.electronTempEv);
  const Te_J = Te_eV * ELEMENTARY_CHARGE;
  const ionMassKg = Math.max(1, inputs.ionMassAmu) * ATOMIC_MASS_UNIT_KG;
  const V0 = Math.max(0.1, inputs.sheathVoltageV);

  // 1. Electron Debye length λ_De = sqrt(eps0 * k_B * Te / (e^2 * n_e))
  // = sqrt(eps0 * Te_eV / (e * n0_m3))
  const debyeLengthM = Math.sqrt((EPSILON_0 * Te_eV) / (ELEMENTARY_CHARGE * n0_m3));
  const debyeLengthUm = debyeLengthM * 1e6;
  const debyeLengthMm = debyeLengthM * 1e3;

  // 2. Bohm Velocity u_B = sqrt(k_B * Te / M_i) = sqrt(e * Te_eV / M_i)
  const bohmVelocityMPerSec = Math.sqrt(Te_J / ionMassKg);

  // 3. Bohm current density J_B = e * n_s * u_B, where n_s ≈ exp(-0.5) * n0 ≈ 0.60653 n0
  const n_sheath_edge = n0_m3 * Math.exp(-0.5);
  const ionFluxDensityAmpsPerM2 = ELEMENTARY_CHARGE * n_sheath_edge * bohmVelocityMPerSec;
  // 1 A/m² = 0.1 mA/cm²
  const ionCurrentDensityMaPerCm2 = ionFluxDensityAmpsPerM2 * 0.1;

  // 4. Electron plasma frequency omega_pe = sqrt(n_e * e^2 / (eps0 * m_e))
  const omegaPe = Math.sqrt((n0_m3 * ELEMENTARY_CHARGE ** 2) / (EPSILON_0 * ELECTRON_MASS_KG));
  const fPeHz = omegaPe / (2 * Math.PI);
  const electronPlasmaFreqGhz = fPeHz / 1e9;

  // 5. Electron thermal velocity v_the = sqrt(8 * k_B * Te / (pi * m_e))
  const electronThermalVelocityMPerSec = Math.sqrt((8 * Te_J) / (Math.PI * ELECTRON_MASS_KG));

  // 6. Floating potential V_f = - (Te_eV / 2) * ln(M_i / (2 * pi * m_e))
  const massRatio = ionMassKg / (2 * Math.PI * ELECTRON_MASS_KG);
  const floatingPotentialVolts = -(Te_eV / 2) * Math.log(massRatio);

  // 7. Child-Langmuir Sheath thickness s
  // Equating J_CL = (4/9) * eps0 * sqrt(2*e/M_i) * (V0^(3/2)) / s^2 to Bohm current J_B:
  // s = sqrt( (4/9) * eps0 * sqrt(2*e/M_i) * V0^(1.5) / J_B )
  const clPre = (4 / 9) * EPSILON_0 * Math.sqrt((2 * ELEMENTARY_CHARGE) / ionMassKg);
  const sheathM = Math.sqrt((clPre * Math.pow(V0, 1.5)) / ionFluxDensityAmpsPerM2);
  const childLangmuirSheathUm = sheathM * 1e6;
  const childLangmuirSheathMm = sheathM * 1e3;

  // 8. Sheath capacitance per unit area: C = eps0 / s (F/m²)
  // In pF/cm²: (F/m²) * 1e12 / 1e4 = (F/m²) * 1e8
  const cSheathFPerM2 = EPSILON_0 / sheathM;
  const sheathCapacitancePfPerCm2 = cSheathFPerM2 * 1e8;

  // 9. Mean free path & collisionality (if pressure is provided)
  let ionMeanFreePathMm: number | undefined;
  let collisionalityRatio: number | undefined;
  let regimeDescription = 'Collisionless sheath regime: ions strike wafer at full directional kinetic energy eV_bias with narrow angular distribution.';

  if (inputs.chamberPressureMtorr !== undefined && inputs.chamberPressureMtorr > 0) {
    // Semi-empirical hard-sphere / resonant charge-exchange mean free path in mTorr:
    // lambda_i ≈ 50 mm / P [mTorr] for Ar at room temperature (~300-400 K)
    ionMeanFreePathMm = 50 / inputs.chamberPressureMtorr;
    collisionalityRatio = childLangmuirSheathMm / ionMeanFreePathMm;

    if (collisionalityRatio < 0.2) {
      regimeDescription = 'Collisionless sheath (s ≪ λ_i): ions experience negligible scattering, preserving anisotropic vertical etch profiles.';
    } else if (collisionalityRatio <= 2.0) {
      regimeDescription = 'Moderately collisional sheath (s ≈ λ_i): some ion-neutral charge exchange occurs, creating a low-energy tail and slight profile bowing.';
    } else {
      regimeDescription = 'Collisional sheath (s > λ_i): frequent ion-neutral collisions diminish perpendicular kinetic energy and broaden ion incident angle distribution.';
    }
  }

  return {
    debyeLengthUm,
    debyeLengthMm,
    bohmVelocityMPerSec,
    ionFluxDensityAmpsPerM2,
    ionCurrentDensityMaPerCm2,
    electronPlasmaFreqGhz,
    electronThermalVelocityMPerSec,
    floatingPotentialVolts,
    childLangmuirSheathUm,
    childLangmuirSheathMm,
    sheathCapacitancePfPerCm2,
    ionMeanFreePathMm,
    collisionalityRatio,
    regimeDescription,
  };
}

export interface SheathSpatialPoint {
  xUm: number;
  region: 'Presheath' | 'Sheath Edge' | 'Sheath';
  potentialVolts: number;
  ionDensityNormalized: number;
  electronDensityNormalized: number;
  ionVelocityMPerSec: number;
}

/**
 * Generates discrete spatial distributions across presheath and Child-Langmuir sheath:
 * - Electrostatic potential V(x) from plasma bulk (0 V) through presheath (-0.5 Te) to wafer (-V0)
 * - Electron Boltzmann density n_e(x)/n0
 * - Ion continuity & energy conservation density n_i(x)/n0
 * - Ion directed drift velocity v_i(x)
 */
export function generateSheathProfile(
  result: PlasmaSheathResult,
  inputs: PlasmaSheathInputs,
  numPoints: number = 80
): SheathSpatialPoint[] {
  const s = result.childLangmuirSheathUm;
  const Te = Math.max(0.1, inputs.electronTempEv);
  const V0 = Math.max(0.1, inputs.sheathVoltageV);
  const uB = result.bohmVelocityMPerSec;
  const deltaVpre = 0.5 * Te;
  const Lpre = Math.max(s * 0.5, 50);

  const points: SheathSpatialPoint[] = [];

  const prePoints = Math.max(15, Math.floor(numPoints * 0.35));
  const sheathPoints = Math.max(25, numPoints - prePoints);

  // 1. Presheath: x from -Lpre up to 0
  for (let i = 0; i < prePoints; i++) {
    const fraction = i / prePoints;
    const xUm = -Lpre * (1 - fraction);
    const xi = fraction;
    const potentialVolts = -deltaVpre * Math.pow(xi, 2);
    const electronDensityNormalized = Math.exp(potentialVolts / Te);
    const ionDensityNormalized = electronDensityNormalized;
    const ionVelocityMPerSec = uB * xi;

    points.push({
      xUm: Number(xUm.toFixed(2)),
      region: 'Presheath',
      potentialVolts: Number(potentialVolts.toFixed(3)),
      ionDensityNormalized: Number(ionDensityNormalized.toFixed(4)),
      electronDensityNormalized: Number(electronDensityNormalized.toFixed(4)),
      ionVelocityMPerSec: Math.round(ionVelocityMPerSec),
    });
  }

  // 2. Sheath Edge: x = 0
  const nEdge = Math.exp(-0.5);
  points.push({
    xUm: 0,
    region: 'Sheath Edge',
    potentialVolts: Number((-deltaVpre).toFixed(3)),
    ionDensityNormalized: Number(nEdge.toFixed(4)),
    electronDensityNormalized: Number(nEdge.toFixed(4)),
    ionVelocityMPerSec: Math.round(uB),
  });

  // 3. Child-Langmuir Sheath: x from >0 to s
  for (let i = 1; i <= sheathPoints; i++) {
    const fraction = i / sheathPoints;
    const xUm = s * fraction;
    const zeta = fraction;
    const deltaVSheath = (V0 - deltaVpre) * Math.pow(zeta, 4 / 3);
    const potentialVolts = -deltaVpre - deltaVSheath;

    const electronDensityNormalized = Math.max(0, Math.exp(potentialVolts / Te));
    const ionVelocityMPerSec = uB * Math.sqrt(1 + (2 * deltaVSheath) / Te);
    const ionDensityNormalized = Math.max(0, nEdge / Math.sqrt(1 + (2 * deltaVSheath) / Te));

    points.push({
      xUm: Number(xUm.toFixed(2)),
      region: 'Sheath',
      potentialVolts: Number(potentialVolts.toFixed(3)),
      ionDensityNormalized: Number(ionDensityNormalized.toFixed(4)),
      electronDensityNormalized: Number(electronDensityNormalized < 1e-6 ? 0 : Number(electronDensityNormalized.toFixed(5))),
      ionVelocityMPerSec: Math.round(ionVelocityMPerSec),
    });
  }

  return points;
}
