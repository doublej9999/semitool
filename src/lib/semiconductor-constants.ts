/**
 * Semiconductor Physical Constants, Material Parameters & Standards Reference Handbook.
 *
 * Provides authoritative reference values used across wafer fab operations,
 * device physics simulations, and process engineering calculations.
 */

export interface PhysicalConstant {
  symbol: string;
  name: string;
  value: number;
  unit: string;
  uncertainty?: string;
  description: string;
}

export interface MaterialProperty {
  category: 'Silicon (Si)' | 'Silicon Dioxide (SiO2)' | 'Silicon Nitride (Si3N4)' | 'Gallium Arsenide (GaAs)' | 'Silicon Carbide (4H-SiC)';
  properties: {
    property: string;
    symbol: string;
    value: string;
    unit: string;
    temperatureK?: number;
    notes?: string;
  }[];
}

export interface HandbookTopic {
  id: string;
  category: string;
  title: string;
  formulaLatex?: string;
  formulaPlain: string;
  variables: { symbol: string; meaning: string; unit: string }[];
  explanation: string;
  fabRelevance: string;
}

/** CODATA 2018 Fundamental Physical Constants */
export const FUNDAMENTAL_CONSTANTS: PhysicalConstant[] = [
  {
    symbol: 'q',
    name: 'Elementary Charge',
    value: 1.602176634e-19,
    unit: 'C',
    description: 'Fundamental electric charge carried by a single proton or electron.',
  },
  {
    symbol: 'k_B',
    name: 'Boltzmann Constant',
    value: 1.380649e-23,
    unit: 'J/K',
    description: 'Relates mean kinetic energy of particles to thermodynamic temperature.',
  },
  {
    symbol: 'k_B (eV)',
    name: 'Boltzmann Constant in eV',
    value: 8.617333262e-5,
    unit: 'eV/K',
    description: 'Thermal voltage scaling constant used in semiconductor carrier statistics.',
  },
  {
    symbol: 'ε_0',
    name: 'Vacuum Permittivity',
    value: 8.8541878128e-12,
    unit: 'F/m (or 8.854e-14 F/cm)',
    description: 'Absolute permittivity of free space.',
  },
  {
    symbol: 'h',
    name: 'Planck Constant',
    value: 6.62607015e-34,
    unit: 'J·s',
    description: 'Quantum of electromagnetic action relating photon frequency to energy.',
  },
  {
    symbol: 'm_0',
    name: 'Electron Rest Mass',
    value: 9.1093837015e-31,
    unit: 'kg',
    description: 'Invariant mass of a stationary free electron.',
  },
  {
    symbol: 'N_A',
    name: 'Avogadro Constant',
    value: 6.02214076e23,
    unit: 'mol⁻¹',
    description: 'Number of constituent particles in one mole of a substance.',
  },
  {
    symbol: 'c',
    name: 'Speed of Light in Vacuum',
    value: 299792458,
    unit: 'm/s',
    description: 'Universal physical constant for speed of electromagnetic radiation.',
  },
];

/** Silicon (Si) & Dielectric Material Properties at 300 K */
export const MATERIAL_PROPERTIES_TABLE: MaterialProperty[] = [
  {
    category: 'Silicon (Si)',
    properties: [
      { property: 'Crystal Structure', symbol: '—', value: 'Diamond cubic', unit: '—' },
      { property: 'Lattice Constant', symbol: 'a', value: '0.54307', unit: 'nm', temperatureK: 300 },
      { property: 'Atomic Density', symbol: 'N_Si', value: '5.00 × 10²²', unit: 'atoms/cm³' },
      { property: 'Mass Density', symbol: 'ρ', value: '2.329', unit: 'g/cm³' },
      { property: 'Energy Bandgap', symbol: 'E_g', value: '1.124', unit: 'eV', temperatureK: 300 },
      { property: 'Intrinsic Carrier Concentration', symbol: 'n_i', value: '1.08 × 10¹⁰', unit: 'cm⁻³', temperatureK: 300 },
      { property: 'Relative Permittivity', symbol: 'ε_r', value: '11.7', unit: '—' },
      { property: 'Electron Effective Mass (Density-of-states)', symbol: 'm_de*/m_0', value: '1.08', unit: '—' },
      { property: 'Hole Effective Mass (Density-of-states)', symbol: 'm_dh*/m_0', value: '0.81', unit: '—' },
      { property: 'Effective DOS - Conduction Band', symbol: 'N_c', value: '2.86 × 10¹⁹', unit: 'cm⁻³', temperatureK: 300 },
      { property: 'Effective DOS - Valence Band', symbol: 'N_v', value: '3.10 × 10¹⁹', unit: 'cm⁻³', temperatureK: 300 },
      { property: 'Intrinsic Electron Mobility', symbol: 'μ_n', value: '1417', unit: 'cm²/(V·s)', temperatureK: 300 },
      { property: 'Intrinsic Hole Mobility', symbol: 'μ_p', value: '470.5', unit: 'cm²/(V·s)', temperatureK: 300 },
      { property: 'Thermal Conductivity', symbol: 'k_th', value: '148', unit: 'W/(m·K)', temperatureK: 300 },
      { property: 'Linear Thermal Expansion Coeff', symbol: 'α_th', value: '2.6 × 10⁻⁶', unit: 'K⁻¹', temperatureK: 300 },
      { property: 'Melting Point', symbol: 'T_m', value: '1414 (1687 K)', unit: '°C' },
    ],
  },
  {
    category: 'Silicon Dioxide (SiO2)',
    properties: [
      { property: 'Structure', symbol: '—', value: 'Amorphous (thermal oxide)', unit: '—' },
      { property: 'Molecular Weight', symbol: 'M_SiO2', value: '60.08', unit: 'g/mol' },
      { property: 'Mass Density', symbol: 'ρ', value: '2.27', unit: 'g/cm³' },
      { property: 'Molecular Density', symbol: 'N_mol', value: '2.27 × 10²²', unit: 'molecules/cm³' },
      { property: 'Energy Bandgap', symbol: 'E_g', value: '8.9 – 9.0', unit: 'eV' },
      { property: 'Relative Permittivity', symbol: 'κ (dielectric constant)', value: '3.9', unit: '—' },
      { property: 'Dielectric Breakdown Field', symbol: 'E_bd', value: '10 – 12', unit: 'MV/cm' },
      { property: 'Thermal Conductivity', symbol: 'k_th', value: '1.4', unit: 'W/(m·K)' },
      { property: 'Silicon Volume Expansion Ratio', symbol: 'Vol(SiO2)/Vol(Si)', value: '2.20', unit: '—', notes: 'Consumes 0.44-0.45 um Si per 1 um SiO2' },
      { property: 'Refractive Index (λ = 632.8 nm)', symbol: 'n', value: '1.457', unit: '—' },
    ],
  },
  {
    category: 'Silicon Nitride (Si3N4)',
    properties: [
      { property: 'Structure', symbol: '—', value: 'Amorphous (LPCVD / PECVD)', unit: '—' },
      { property: 'Mass Density', symbol: 'ρ', value: '3.10', unit: 'g/cm³' },
      { property: 'Energy Bandgap', symbol: 'E_g', value: '5.0 – 5.1', unit: 'eV' },
      { property: 'Relative Permittivity', symbol: 'κ', value: '7.0 – 7.5', unit: '—' },
      { property: 'Dielectric Breakdown Field', symbol: 'E_bd', value: '8 – 10', unit: 'MV/cm' },
      { property: 'Refractive Index (λ = 632.8 nm)', symbol: 'n', value: '2.00 – 2.05', unit: '—' },
      { property: 'Oxidation Masking Efficiency', symbol: '—', value: 'Excellent diffusion barrier for O2 and H2O', unit: '—' },
    ],
  },
  {
    category: 'Gallium Arsenide (GaAs)',
    properties: [
      { property: 'Crystal Structure', symbol: '—', value: 'Zincblende', unit: '—' },
      { property: 'Energy Bandgap', symbol: 'E_g', value: '1.424 (Direct)', unit: 'eV', temperatureK: 300 },
      { property: 'Relative Permittivity', symbol: 'ε_r', value: '12.9', unit: '—' },
      { property: 'Electron Mobility', symbol: 'μ_n', value: '8500', unit: 'cm²/(V·s)', temperatureK: 300 },
      { property: 'Hole Mobility', symbol: 'μ_p', value: '400', unit: 'cm²/(V·s)', temperatureK: 300 },
    ],
  },
  {
    category: 'Silicon Carbide (4H-SiC)',
    properties: [
      { property: 'Crystal Structure', symbol: '—', value: 'Hexagonal (4H Polytype)', unit: '—' },
      { property: 'Energy Bandgap', symbol: 'E_g', value: '3.26', unit: 'eV', temperatureK: 300 },
      { property: 'Critical Electric Field', symbol: 'E_crit', value: '2.8 – 3.0', unit: 'MV/cm' },
      { property: 'Relative Permittivity', symbol: 'ε_r', value: '9.7', unit: '—' },
      { property: 'Thermal Conductivity', symbol: 'k_th', value: '370 – 490', unit: 'W/(m·K)', temperatureK: 300 },
    ],
  },
];

/** Cleanroom Airborne Particulate Cleanliness Standards (ISO 14644-1 vs Fed-Std 209E) */
export const CLEANROOM_STANDARDS = [
  { isoClass: 'ISO Class 1', fedStd: '—', max01um: 10, max05um: '—', application: 'Extreme advanced lithography / EUV reticle pod' },
  { isoClass: 'ISO Class 2', fedStd: '—', max01um: 100, max05um: 4, application: 'Front-end FEOL semiconductor processing' },
  { isoClass: 'ISO Class 3', fedStd: 'Class 1', max01um: 1000, max05um: 35, application: 'Leading-edge 300mm automated cleanroom track' },
  { isoClass: 'ISO Class 4', fedStd: 'Class 10', max01um: 10000, max05um: 352, application: 'Sub-micron lithography and wafer fab aisles' },
  { isoClass: 'ISO Class 5', fedStd: 'Class 100', max01um: 100000, max05um: 3520, application: 'Wafer inspection, wet bench hoods, laminar benches' },
  { isoClass: 'ISO Class 6', fedStd: 'Class 1,000', max01um: '1,000,000', max05um: 35200, application: 'Wafer back-end packaging, test areas' },
  { isoClass: 'ISO Class 7', fedStd: 'Class 10,000', max01um: '—', max05um: 352000, application: 'Gowning airlocks, support corridors' },
];

/** Core Formulas Handbook Catalog */
export const HANDBOOK_FORMULAS: HandbookTopic[] = [
  {
    id: 'deal-grove',
    category: 'Thermal Oxidation',
    title: 'Deal-Grove Thermal Oxidation Model',
    formulaPlain: 'x_ox² + A · x_ox = B · (t + τ)',
    variables: [
      { symbol: 'x_ox', meaning: 'Oxide thickness grown', unit: 'µm or nm' },
      { symbol: 't', meaning: 'Oxidation time', unit: 'hours or minutes' },
      { symbol: 'B', meaning: 'Parabolic rate constant (diffusion-controlled)', unit: 'µm²/h' },
      { symbol: 'B/A', meaning: 'Linear rate constant (reaction-controlled)', unit: 'µm/h' },
      { symbol: 'τ', meaning: 'Time coordinate offset accounting for initial oxide', unit: 'hours' },
    ],
    explanation:
      'Models silicon thermal oxidation by balancing oxidant transport through the gas boundary layer, diffusion through existing oxide, and chemical reaction at the Si/SiO2 interface. At small thicknesses (x << A/2), growth is linear with rate B/A; at large thicknesses (x >> A/2), growth is parabolic with rate constant B.',
    fabRelevance: 'Essential for predicting gate oxide, pad oxide, field oxide, and LOCOS/STI sacrificial oxide runs in furnace oxidation tubes.',
  },
  {
    id: 'ion-implant-gaussian',
    category: 'Doping & Junctions',
    title: 'Ion Implantation Gaussian Depth Profile',
    formulaPlain: 'N(x) = (Φ / (√(2π) · ΔRp)) · exp(- (x - Rp)² / (2 · ΔRp²))',
    variables: [
      { symbol: 'N(x)', meaning: 'Dopant concentration at depth x', unit: 'cm⁻³' },
      { symbol: 'Φ', meaning: 'Implanted dose (fluence)', unit: 'ions/cm²' },
      { symbol: 'Rp', meaning: 'Projected range (mean penetration depth)', unit: 'nm or µm' },
      { symbol: 'ΔRp', meaning: 'Projected straggle (standard deviation)', unit: 'nm or µm' },
      { symbol: 'x', meaning: 'Substrate depth from wafer surface', unit: 'nm or µm' },
    ],
    explanation:
      'Calculates dopant distribution assuming nuclear and electronic stopping in amorphous silicon. The peak concentration occurs at x = Rp with Np = 0.3989 · Φ / ΔRp. Metallurgical junction depth xj occurs where N(xj) equals the substrate background doping Nb.',
    fabRelevance: 'Governs threshold voltage VT implants, CMOS well formation, ultra-shallow source/drain extensions, and halo/pocket profiles.',
  },
  {
    id: 'fick-diffusion',
    category: 'Diffusion & Annealing',
    title: 'Fick’s Second Law with Arrhenius Diffusivity',
    formulaPlain: '∂C/∂t = D · ∂²C/∂x²,  where D(T) = D_0 · exp(-E_a / (k_B · T))',
    variables: [
      { symbol: 'C(x,t)', meaning: 'Dopant concentration profile over time', unit: 'cm⁻³' },
      { symbol: 'D', meaning: 'Diffusion coefficient at temperature T', unit: 'cm²/s' },
      { symbol: 'D_0', meaning: 'Pre-exponential frequency factor', unit: 'cm²/s' },
      { symbol: 'E_a', meaning: 'Activation energy for vacancy/interstitialcy migration', unit: 'eV' },
      { symbol: 'k_B', meaning: 'Boltzmann constant', unit: 'eV/K' },
      { symbol: 'T', meaning: 'Annealing temperature', unit: 'K' },
    ],
    explanation:
      'Describes thermal redistribution of impurities during furnace drive-in, rapid thermal processing (RTP), or spike annealing. For constant surface concentration (predeposition), the solution is an erfc curve; for finite total dose (drive-in), the solution approaches a Gaussian profile with characteristic diffusion length 2√(Dt).',
    fabRelevance: 'Limits thermal budget (Dt) accumulation to avoid junction smearing and short-channel effects in scaled nodes.',
  },
  {
    id: 'rayleigh-litho',
    category: 'Photolithography',
    title: 'Rayleigh Lithography Resolution & Depth of Focus (DoF)',
    formulaPlain: 'CD = k_1 · (λ / NA),   DoF = k_2 · (λ / NA²)',
    variables: [
      { symbol: 'CD', meaning: 'Minimum printable critical dimension (half-pitch)', unit: 'nm' },
      { symbol: 'λ', meaning: 'Exposure wavelength (e.g. 193 nm ArF, 13.5 nm EUV)', unit: 'nm' },
      { symbol: 'NA', meaning: 'Numerical aperture (n · sin θ)', unit: '—' },
      { symbol: 'k_1', meaning: 'Process difficulty factor (theoretically ≥ 0.25 for single exposure)', unit: '—' },
      { symbol: 'DoF', meaning: 'Usable depth of focus window', unit: 'nm or µm' },
      { symbol: 'k_2', meaning: 'Optical process factor for focus budget', unit: '—' },
    ],
    explanation:
      'Defines optical diffraction limits for scanner projection systems. High NA (including immersion NA = 1.35 and High-NA EUV NA = 0.55) shrinks CD at the expense of quadratically reducing depth of focus, demanding chemical mechanical planarization (CMP) and extreme topography control.',
    fabRelevance: 'Forms the baseline roadmap for stepper/scanner capability and determines when multi-patterning (SADP, SAQP) or EUV is required.',
  },
  {
    id: 'child-langmuir-sheath',
    category: 'Plasma Etch & Deposition',
    title: 'Child-Langmuir Space-Charge Sheath Equation',
    formulaPlain: 'J = (4/9) · ε_0 · √(2q / M_ion) · (V_s^(3/2) / d_s²)',
    variables: [
      { symbol: 'J', meaning: 'Ion current density crossing the sheath to the wafer', unit: 'A/m²' },
      { symbol: 'V_s', meaning: 'Sheath voltage drop (DC bias + plasma potential)', unit: 'V' },
      { symbol: 'd_s', meaning: 'Dark sheath thickness above wafer chuck', unit: 'mm or µm' },
      { symbol: 'M_ion', meaning: 'Mass of accelerating ions (e.g. Ar⁺, CFx⁺)', unit: 'kg' },
      { symbol: 'ε_0', meaning: 'Vacuum permittivity', unit: 'F/m' },
    ],
    explanation:
      'Relates the DC self-bias voltage applied to the electrostatic chuck, RF power, and gas pressure to sheath thickness and ion acceleration energy in reactive ion etching (RIE) and inductively coupled plasma (ICP) reactors. Energetic directional ions dictate trench verticality and etch anisotropy.',
    fabRelevance: 'Critical for tuning plasma etch selectivity, avoiding micro-trenching, gate dielectric punch-through, and sidewall bow.',
  },
  {
    id: 'murphy-seeds-yield',
    category: 'Yield & Fab Economics',
    title: 'Murphy & Seeds Semiconductor Yield Models',
    formulaPlain: 'Y_Murphy = ((1 - exp(-D_0 · A)) / (D_0 · A))²,   Y_Seeds = exp(-√(D_0 · A))',
    variables: [
      { symbol: 'Y', meaning: 'Die functional yield percentage', unit: '% or fraction' },
      { symbol: 'D_0', meaning: 'Random defect density', unit: 'defects/cm²' },
      { symbol: 'A', meaning: 'Critical die area susceptible to faults', unit: 'cm² or mm²' },
    ],
    explanation:
      'Corrects for non-random spatial clustering of particulate defects across wafers, overcoming Poisson’s conservative pessimism for large die sizes. Murphy assumes a triangular distribution of defect density, while negative binomial models parameterize cluster coefficient alpha.',
    fabRelevance: 'Used by product engineers and fab planners to forecast wafer out yield, cost per good die, and die-to-reticle partitioning.',
  },
];
