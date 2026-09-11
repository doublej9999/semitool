
/**
 * Gas flow units.
 *
 * sccm and slm are volumetric flows at a *stated* reference, so the reference
 * is an input here rather than a hidden constant: 1 sccm at 0 °C is not the
 * same amount of gas as 1 sccm at 25 °C, and a number without its standard
 * means nothing. Both references are 1 atm, which is the usual convention.
 *
 * Molar flow comes from the ideal gas law, Vm = R T / P. At 1 atm this is
 * accurate to a few parts in a thousand for the common process gases, which is
 * well inside the tolerance of a mass flow controller.
 *
 * Molar masses are built from IUPAC conventional atomic weights so the
 * arithmetic is visible rather than pasted in as a magic number.
 */
export const GAS_CONSTANT = 8.31446261815324; // J/(mol K), exact
export const STANDARD_PRESSURE_PA = 101325; // 1 atm

/** The two reference temperatures in common use for "standard" flow. */
export type ReferenceTemperature = 0 | 25;

export const REFERENCE_TEMPERATURES: ReferenceTemperature[] = [0, 25];

export const REFERENCE_LABELS: Record<ReferenceTemperature, string> = {
  0: '0 °C (273.15 K)',
  25: '25 °C (298.15 K)',
};

/** Molar volume in cm^3/mol at the given reference temperature and 1 atm. */
export function molarVolumeCm3(temperatureC: ReferenceTemperature): number {
  const kelvin = temperatureC + 273.15;
  return (GAS_CONSTANT * kelvin) / STANDARD_PRESSURE_PA * 1e6;
}

export type GasFlowUnit = 'sccm' | 'slm' | 'm3_per_h' | 'cfm' | 'mol_per_min' | 'mol_per_h' | 'g_per_min';

export const GAS_FLOW_UNITS: GasFlowUnit[] = ['sccm', 'slm', 'm3_per_h', 'cfm', 'mol_per_min', 'mol_per_h', 'g_per_min'];

export const GAS_FLOW_LABELS: Record<GasFlowUnit, string> = {
  sccm: 'sccm',
  slm: 'slm',
  m3_per_h: 'm³/h (std)',
  cfm: 'cfm (std)',
  mol_per_min: 'mol/min',
  mol_per_h: 'mol/h',
  g_per_min: 'g/min',
};

export interface Gas {
  id: string;
  name: string;
  /** Molar mass in g/mol from IUPAC conventional atomic weights. */
  molarMass: number;
}

const ATOMIC = {
  H: 1.008,
  C: 12.011,
  N: 14.0067,
  O: 15.9994,
  F: 18.998403163,
  Si: 28.0855,
  S: 32.06,
  Cl: 35.45,
  Ar: 39.948,
  He: 4.002602,
};

export const GASES: Gas[] = [
  { id: 'n2', name: 'Nitrogen (N₂)', molarMass: 2 * ATOMIC.N },
  { id: 'o2', name: 'Oxygen (O₂)', molarMass: 2 * ATOMIC.O },
  { id: 'ar', name: 'Argon (Ar)', molarMass: ATOMIC.Ar },
  { id: 'h2', name: 'Hydrogen (H₂)', molarMass: 2 * ATOMIC.H },
  { id: 'he', name: 'Helium (He)', molarMass: ATOMIC.He },
  { id: 'nh3', name: 'Ammonia (NH₃)', molarMass: ATOMIC.N + 3 * ATOMIC.H },
  { id: 'sih4', name: 'Silane (SiH₄)', molarMass: ATOMIC.Si + 4 * ATOMIC.H },
  { id: 'n2o', name: 'Nitrous oxide (N₂O)', molarMass: 2 * ATOMIC.N + ATOMIC.O },
  { id: 'cf4', name: 'Tetrafluoromethane (CF₄)', molarMass: ATOMIC.C + 4 * ATOMIC.F },
  { id: 'sf6', name: 'Sulfur hexafluoride (SF₆)', molarMass: ATOMIC.S + 6 * ATOMIC.F },
  { id: 'cl2', name: 'Chlorine (Cl₂)', molarMass: 2 * ATOMIC.Cl },
];

export interface GasFlowOptions {
  temperatureC: ReferenceTemperature;
  /** Molar mass in g/mol of the gas actually flowing. */
  molarMass: number;
}

/**
 * Multiplier that converts a flow expressed in the given unit into standard
 * cubic centimetres per minute at the chosen reference. The molar and mass
 * rows depend on the reference temperature and, for mass, on the gas.
 */
export function gasFlowToSccm(options: GasFlowOptions): Record<GasFlowUnit, number> {
  const molarVolume = molarVolumeCm3(options.temperatureC);
  return {
    sccm: 1,
    slm: 1000,
    // 1 m^3 = 1e6 cm^3, spread over 60 minutes
    m3_per_h: 1e6 / 60,
    // 1 ft^3 = 30.48^3 cm^3 exactly, per minute
    cfm: 30.48 ** 3,
    mol_per_min: molarVolume,
    mol_per_h: molarVolume / 60,
    g_per_min: molarVolume / options.molarMass,
  };
}

/** One flow expressed in every supported unit. */
export function convertGasFlow(
  value: number,
  from: GasFlowUnit,
  options: GasFlowOptions,
): Record<GasFlowUnit, number> {
  const factors = gasFlowToSccm(options);
  const sccm = value * factors[from];
  const converted = {} as Record<GasFlowUnit, number>;
  for (const unit of GAS_FLOW_UNITS) {
    converted[unit] = sccm / factors[unit];
  }
  return converted;
}
