/**
 * Chemical Mechanical Polishing (CMP) Preston Removal Rate Calculator.
 *
 * Preston's Equation:
 *   RR = Kp * P * V
 *
 * Where:
 *   RR = Removal rate (nm/min or Å/min)
 *   Kp = Preston coefficient (Pa^-1 or m^2/N)
 *   P  = Downforce pressure (Pa, converted from psi or kPa)
 *   V  = Average linear velocity at wafer center (m/s)
 *
 * Linear velocity at wafer center:
 *   V_center = 2 * pi * (R_carrier_offset_mm / 1000) * (Omega_platen_rpm / 60)
 *
 * Removal rate in nm/min:
 *   RR_nm_min = Kp * P_Pa * V_center * 60 * 1e9
 *
 * Total thickness removed:
 *   totalRemovedNm = RR_nm_min * (polishTimeSec / 60)
 *
 * Within-Wafer Non-Uniformity (WIWNU %):
 *   Estimated based on relative kinematic velocity span:
 *   WIWNU % = (|Omega_platen - Omega_carrier| * R_wafer / V_center) * 100
 */

export const PSI_TO_PA = 6894.757;
export const KPA_TO_PA = 1000;

export type CmpPressureUnit = 'psi' | 'kPa';

export interface CmpPreset {
  id: string;
  name: string;
  description: string;
  kpPaInv: number; // Pa^-1
}

export const CMP_PRESETS: CmpPreset[] = [
  {
    id: 'oxide',
    name: 'Oxide / TEOS (Silica slurry)',
    description: 'Silicon dioxide / TEOS polishing with colloidal silica slurry (~175 nm/min at 3 psi, 90 rpm).',
    kpPaInv: 7.5e-14,
  },
  {
    id: 'copper',
    name: 'Copper (Cu with acidic slurry)',
    description: 'Copper bulk and barrier planarisation with acid/chelator slurry (~375 nm/min at 3 psi, 90 rpm).',
    kpPaInv: 1.6e-13,
  },
  {
    id: 'tungsten',
    name: 'Tungsten (W plug CMP)',
    description: 'Contact and via plug planarisation with silica/alumina slurry and oxidiser (~117 nm/min at 3 psi, 90 rpm).',
    kpPaInv: 5.0e-14,
  },
  {
    id: 'polysilicon',
    name: 'Polysilicon',
    description: 'Poly-Si gate and trench polishing with high-selectivity slurry (~210 nm/min at 3 psi, 90 rpm).',
    kpPaInv: 9.0e-14,
  },
  {
    id: 'custom',
    name: 'Custom Kp',
    description: 'User-defined Preston coefficient in Pa⁻¹.',
    kpPaInv: 7.5e-14,
  },
];

export function getCmpPreset(id: string): CmpPreset | undefined {
  return CMP_PRESETS.find((preset) => preset.id === id);
}

export function convertDownforceToPa(downforce: number, unit: CmpPressureUnit): number {
  return unit === 'psi' ? downforce * PSI_TO_PA : downforce * KPA_TO_PA;
}

export interface CmpPrestonInput {
  materialId: string;
  customKpPaInv?: number;
  downforcePressure: number;
  pressureUnit: CmpPressureUnit;
  platenSpeedRpm: number;
  carrierSpeedRpm: number;
  carrierOffsetMm: number;
  waferDiameterMm: number;
  polishTimeSec: number;
}

export interface CmpPrestonSuccess {
  ok: true;
  pressurePa: number;
  kpPaInv: number;
  vCenter: number; // m/s
  vInner: number; // m/s
  vOuter: number; // m/s
  deltaV: number; // m/s (vOuter - vInner)
  velocityVariationPercent: number; // (deltaV / vCenter) * 100 (%)
  wiwnuPercent: number; // Within-Wafer Non-Uniformity kinematic estimate (%)
  rrNmPerMin: number; // nm/min
  rrAngstromPerMin: number; // Å/min
  totalRemovedNm: number; // nm
  totalRemovedAngstrom: number; // Å
  polishTimeSec: number;
}

export type CmpPrestonResult = { ok: false; errors: string[] } | CmpPrestonSuccess;

export function calculateCmpPreston(input: CmpPrestonInput): CmpPrestonResult {
  const errors: string[] = [];
  const {
    materialId,
    customKpPaInv,
    downforcePressure,
    pressureUnit,
    platenSpeedRpm,
    carrierSpeedRpm,
    carrierOffsetMm,
    waferDiameterMm,
    polishTimeSec,
  } = input;

  // Validation
  if (!Number.isFinite(downforcePressure) || downforcePressure <= 0) {
    errors.push('Downforce pressure must be greater than zero.');
  }

  if (!Number.isFinite(platenSpeedRpm) || platenSpeedRpm <= 0) {
    errors.push('Platen rotation speed must be greater than zero.');
  }

  if (!Number.isFinite(carrierSpeedRpm) || carrierSpeedRpm <= 0) {
    errors.push('Carrier rotation speed must be greater than zero.');
  }

  if (!Number.isFinite(carrierOffsetMm) || carrierOffsetMm <= 0) {
    errors.push('Carrier offset from platen center must be greater than zero.');
  }

  if (!Number.isFinite(waferDiameterMm) || waferDiameterMm <= 0) {
    errors.push('Wafer diameter must be greater than zero.');
  }

  if (!Number.isFinite(polishTimeSec) || polishTimeSec <= 0) {
    errors.push('Polish time must be greater than zero.');
  }

  let kpPaInv: number;
  if (materialId === 'custom') {
    if (!Number.isFinite(customKpPaInv) || customKpPaInv === undefined || customKpPaInv <= 0) {
      errors.push('Custom Preston coefficient (Kp) must be greater than zero.');
      kpPaInv = 0;
    } else {
      kpPaInv = customKpPaInv;
    }
  } else {
    const preset = getCmpPreset(materialId);
    if (!preset) {
      errors.push(`Unknown material preset: "${materialId}".`);
      kpPaInv = 0;
    } else {
      kpPaInv = preset.kpPaInv;
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // Pressure in Pascals
  const pressurePa = convertDownforceToPa(downforcePressure, pressureUnit);

  // Geometric radii in metres
  const rOffsetM = carrierOffsetMm / 1000;
  const rWaferM = (waferDiameterMm / 2) / 1000;

  // Angular velocities in rad/s
  const omegaPlaten = (2 * Math.PI * platenSpeedRpm) / 60;
  const omegaCarrier = (2 * Math.PI * carrierSpeedRpm) / 60;

  // Linear velocities across platen radius
  const vCenter = 2 * Math.PI * rOffsetM * (platenSpeedRpm / 60);
  const rInnerM = Math.max(0, rOffsetM - rWaferM);
  const rOuterM = rOffsetM + rWaferM;
  const vInner = 2 * Math.PI * rInnerM * (platenSpeedRpm / 60);
  const vOuter = 2 * Math.PI * rOuterM * (platenSpeedRpm / 60);

  const deltaV = vOuter - vInner;
  const velocityVariationPercent = (deltaV / vCenter) * 100;

  // Preston removal rate: RR = Kp * P * V
  // Units: Kp (Pa^-1) * P (Pa) * V (m/s) = m/s
  // To convert m/s to nm/min: multiply by 60 s/min * 1e9 nm/m
  const rrNmPerMin = kpPaInv * pressurePa * vCenter * 60 * 1e9;
  const rrAngstromPerMin = rrNmPerMin * 10;

  // Total thickness removed
  const totalRemovedNm = rrNmPerMin * (polishTimeSec / 60);
  const totalRemovedAngstrom = totalRemovedNm * 10;

  // Within-Wafer Non-Uniformity estimate (WIWNU %):
  // Based on the kinematic relative velocity span between platen and rotating carrier:
  // WIWNU % = (|Omega_platen - Omega_carrier| * R_wafer / V_center) * 100
  const deltaOmega = Math.abs(omegaPlaten - omegaCarrier);
  const wiwnuPercent = (deltaOmega * rWaferM / vCenter) * 100;

  return {
    ok: true,
    pressurePa,
    kpPaInv,
    vCenter,
    vInner,
    vOuter,
    deltaV,
    velocityVariationPercent,
    wiwnuPercent,
    rrNmPerMin,
    rrAngstromPerMin,
    totalRemovedNm,
    totalRemovedAngstrom,
    polishTimeSec,
  };
}
