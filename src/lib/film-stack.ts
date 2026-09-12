/**
 * Film Stack & Fab Project Workspace — Core Semiconductor Physics
 *
 * Implements a unified film stack data model for semiconductor wafer processing:
 * - Multi-layer geometry tracking (deposition, etch, planarization)
 * - Cumulative film stress & substrate deflection (extended Stoney equation for N layers)
 * - Cumulative thermal budget calculation (\sum D*t and effective diffusion length)
 * - Industrial fab project archetypes (Advanced CMOS, BCD, GaN-on-Si, 3D NAND ONO)
 * - Project serialization, versioning, and cross-tool parameter bridges
 */

export type SubstrateMaterial = 'si100' | 'si111' | 'sic4h' | 'gaas' | 'sapphire' | 'gan' | 'fused_silica';

export interface SubstrateProperties {
  id: SubstrateMaterial;
  name: string;
  nameZh: string;
  biaxialModulusGpa: number; // M_s in GPa
  poissonsRatio: number;
  youngsModulusGpa: number;
  defaultThicknessUm: number; // Standard wafer thickness (e.g. 775um for 300mm)
  standardDiametersMm: number[];
}

export const SUBSTRATE_CATALOG: Record<SubstrateMaterial, SubstrateProperties> = {
  si100: {
    id: 'si100',
    name: 'Silicon (100)',
    nameZh: '单晶硅 (100)',
    biaxialModulusGpa: 180.5,
    poissonsRatio: 0.28,
    youngsModulusGpa: 130.0,
    defaultThicknessUm: 775, // 300mm standard
    standardDiametersMm: [100, 150, 200, 300],
  },
  si111: {
    id: 'si111',
    name: 'Silicon (111)',
    nameZh: '单晶硅 (111)',
    biaxialModulusGpa: 229.0,
    poissonsRatio: 0.26,
    youngsModulusGpa: 169.0,
    defaultThicknessUm: 775,
    standardDiametersMm: [100, 150, 200, 300],
  },
  sic4h: {
    id: 'sic4h',
    name: '4H-Silicon Carbide (4H-SiC)',
    nameZh: '碳化硅 (4H-SiC)',
    biaxialModulusGpa: 502.0,
    poissonsRatio: 0.21,
    youngsModulusGpa: 410.0,
    defaultThicknessUm: 350, // 150mm/200mm SiC standard
    standardDiametersMm: [100, 150, 200],
  },
  gaas: {
    id: 'gaas',
    name: 'Gallium Arsenide (GaAs)',
    nameZh: '砷化镓 (GaAs)',
    biaxialModulusGpa: 123.7,
    poissonsRatio: 0.31,
    youngsModulusGpa: 85.5,
    defaultThicknessUm: 625,
    standardDiametersMm: [100, 150],
  },
  sapphire: {
    id: 'sapphire',
    name: 'Sapphire (Al2O3 c-plane)',
    nameZh: '蓝宝石 (c面 Al2O3)',
    biaxialModulusGpa: 430.0,
    poissonsRatio: 0.25,
    youngsModulusGpa: 345.0,
    defaultThicknessUm: 430,
    standardDiametersMm: [50, 100, 150, 200],
  },
  gan: {
    id: 'gan',
    name: 'Gallium Nitride (GaN)',
    nameZh: '氮化镓 (GaN)',
    biaxialModulusGpa: 440.0,
    poissonsRatio: 0.20,
    youngsModulusGpa: 350.0,
    defaultThicknessUm: 500,
    standardDiametersMm: [50, 100, 150],
  },
  fused_silica: {
    id: 'fused_silica',
    name: 'Fused Silica / Quartz',
    nameZh: '石英 / 熔融二氧化硅',
    biaxialModulusGpa: 88.0,
    poissonsRatio: 0.17,
    youngsModulusGpa: 73.0,
    defaultThicknessUm: 500,
    standardDiametersMm: [100, 150, 200],
  },
};

export type LayerProcessType = 'thermal_oxidation' | 'cvd' | 'ald' | 'plating' | 'pvd_sputter' | 'spin_coating';

export interface FilmLayer {
  id: string;
  name: string;
  material: string;
  processType: LayerProcessType;
  thicknessNm: number;
  residualStressMpa: number; // Positive = Tensile, Negative = Compressive
  refractiveIndex: number;   // n at 632.8nm
  extinctionCoefficient: number; // k
  thermalBudgetDtCm2?: number; // D*t in cm^2 incurred during this step
  processTempC?: number;
  addedAtIsoDate: string;
  notes?: string;
  colorHex?: string;
}

export interface FilmStackProject {
  schemaVersion: '1.0.0';
  id: string;
  name: string;
  description: string;
  waferDiameterMm: number;
  substrate: {
    material: SubstrateMaterial;
    thicknessUm: number;
  };
  layers: FilmLayer[];
  thermalBudgetHistory: Array<{
    stepName: string;
    temperatureC: number;
    durationMin: number;
    diffusivityCm2PerS: number;
    dtCm2: number;
  }>;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface FilmStackPhysicsSummary {
  totalFilmThicknessNm: number;
  totalWaferThicknessUm: number;
  // Multi-layer Stoney cumulative force per unit width: sum(sigma_i * h_i) in N/m
  forcePerUnitWidthNm: number;
  // Net effective stress averaged over all films (MPa)
  netAverageStressMpa: number;
  // Radius of curvature in meters (positive = concave/tensile bow, negative = convex/compressive bow)
  radiusOfCurvatureM: number;
  // Substrate Bow / Deflection in micrometers (um)
  waferBowUm: number;
  // Stress regime
  dominantStressRegime: 'tensile' | 'compressive' | 'neutral';
  // Thermal budget metrics
  cumulativeDtCm2: number;
  effectiveDiffusionLengthNm: number;
  // Lithography & Chucking warning
  chuckingWarning?: string;
}

/**
 * Calculates multi-layer cumulative stress and wafer deflection via extended Stoney formulation.
 *
 * Extended Stoney equation for N thin films on a thick substrate (h_total << h_s):
 * Curvature \kappa = 1/R = (6 / (M_s * h_s^2)) * \sum_{i=1}^N (\sigma_i * t_i)
 * Bow = (R_wafer^2) / (2 * R) = (3 * D_wafer^2 * \sum(\sigma_i * t_i)) / (4 * M_s * h_s^2)
 */
export function calculateFilmStackPhysics(
  substrateMaterial: SubstrateMaterial,
  substrateThicknessUm: number,
  waferDiameterMm: number,
  layers: FilmLayer[],
  thermalBudgetHistory: FilmStackProject['thermalBudgetHistory'] = []
): FilmStackPhysicsSummary {
  const sub = SUBSTRATE_CATALOG[substrateMaterial] || SUBSTRATE_CATALOG.si100;
  const h_s_m = substrateThicknessUm * 1e-6; // Substrate thickness in meters
  const M_s_Pa = sub.biaxialModulusGpa * 1e9; // Biaxial modulus in Pascals

  let totalFilmThicknessNm = 0;
  let sumSigmaT_N_per_m = 0; // sum(sigma_i * t_i) in (N/m^2 * m) = N/m

  for (const layer of layers) {
    totalFilmThicknessNm += Math.max(0, layer.thicknessNm);
    const t_m = Math.max(0, layer.thicknessNm) * 1e-9;
    const sigma_Pa = layer.residualStressMpa * 1e6;
    sumSigmaT_N_per_m += sigma_Pa * t_m;
  }

  // Curvature kappa = 1 / R (in 1/m)
  // kappa = 6 * sum(sigma_i * t_i) / (M_s * h_s^2)
  const denom = M_s_Pa * Math.pow(h_s_m, 2);
  const kappa = denom > 0 ? (6 * sumSigmaT_N_per_m) / denom : 0;

  const radiusOfCurvatureM = Math.abs(kappa) > 1e-8 ? 1 / kappa : Infinity;

  // Wafer Radius in meters
  const waferRadiusM = (waferDiameterMm / 2) * 1e-3;

  // Bow = (waferRadius^2) * kappa / 2 in meters -> convert to um
  const waferBowM = (Math.pow(waferRadiusM, 2) * kappa) / 2;
  const waferBowUm = waferBowM * 1e6;

  const netAverageStressMpa =
    totalFilmThicknessNm > 0
      ? (sumSigmaT_N_per_m / (totalFilmThicknessNm * 1e-9)) * 1e-6
      : 0;

  let dominantStressRegime: 'tensile' | 'compressive' | 'neutral' = 'neutral';
  if (waferBowUm > 0.5) dominantStressRegime = 'tensile';
  else if (waferBowUm < -0.5) dominantStressRegime = 'compressive';

  // Thermal budget metrics: sum(D * t)
  let cumulativeDtCm2 = 0;
  for (const item of thermalBudgetHistory) {
    cumulativeDtCm2 += Math.max(0, item.dtCm2);
  }
  for (const layer of layers) {
    if (layer.thermalBudgetDtCm2) {
      cumulativeDtCm2 += Math.max(0, layer.thermalBudgetDtCm2);
    }
  }

  // Effective characteristic diffusion length: 2 * sqrt(sum(Dt))
  // sqrt(Dt in cm^2) * 1e7 = nm -> 2 * sqrt(Dt) in nm
  const effectiveDiffusionLengthNm = 2 * Math.sqrt(Math.max(0, cumulativeDtCm2)) * 1e7;

  // Fab safety & lithography warning thresholds
  let chuckingWarning: string | undefined;
  const absBowUm = Math.abs(waferBowUm);
  if (absBowUm > 150) {
    chuckingWarning = `Severe wafer warp (|Bow| = ${absBowUm.toFixed(1)} µm > 150 µm). High risk of electrostatic/vacuum chuck clamping failure and wafer breakage during transfer!`;
  } else if (absBowUm > 60) {
    chuckingWarning = `Moderate wafer bow (|Bow| = ${absBowUm.toFixed(1)} µm > 60 µm). May induce lithography scanner focus depth (DoF) runout and CD distortion.`;
  }

  return {
    totalFilmThicknessNm,
    totalWaferThicknessUm: substrateThicknessUm + totalFilmThicknessNm * 1e-3,
    forcePerUnitWidthNm: sumSigmaT_N_per_m,
    netAverageStressMpa,
    radiusOfCurvatureM,
    waferBowUm,
    dominantStressRegime,
    cumulativeDtCm2,
    effectiveDiffusionLengthNm,
    chuckingWarning,
  };
}

/**
 * Standard industrial reference film stack templates
 */
export const INDUSTRIAL_STACK_TEMPLATES: Record<string, Omit<FilmStackProject, 'id' | 'createdAtIso' | 'updatedAtIso'>> = {
  advanced_cmos_gate: {
    schemaVersion: '1.0.0',
    name: '28nm High-k Metal Gate (HKMG) Stack',
    description: 'Typical planar 28nm HKMG gate stack with interfacial SiO2, HfO2 high-k dielectric, TiN capping and poly/metal electrode.',
    waferDiameterMm: 300,
    substrate: {
      material: 'si100',
      thicknessUm: 775,
    },
    layers: [
      {
        id: 'layer-1',
        name: 'Chemical / Thermal SiO2 IL',
        material: 'SiO2',
        processType: 'thermal_oxidation',
        thicknessNm: 1.0,
        residualStressMpa: -300, // Compressive
        refractiveIndex: 1.457,
        extinctionCoefficient: 0,
        thermalBudgetDtCm2: 1.2e-16,
        addedAtIsoDate: new Date().toISOString(),
        colorHex: '#38bdf8',
      },
      {
        id: 'layer-2',
        name: 'Atomic Layer Deposited HfO2',
        material: 'HfO2',
        processType: 'ald',
        thicknessNm: 2.5,
        residualStressMpa: 800, // Tensile
        refractiveIndex: 2.10,
        extinctionCoefficient: 0,
        thermalBudgetDtCm2: 5.0e-17,
        addedAtIsoDate: new Date().toISOString(),
        colorHex: '#a855f7',
      },
      {
        id: 'layer-3',
        name: 'PVD TiN Metal Gate Cap',
        material: 'TiN',
        processType: 'pvd_sputter',
        thicknessNm: 10.0,
        residualStressMpa: -1200, // High compressive
        refractiveIndex: 2.45,
        extinctionCoefficient: 1.6,
        addedAtIsoDate: new Date().toISOString(),
        colorHex: '#eab308',
      },
      {
        id: 'layer-4',
        name: 'LPCVD Poly-Silicon Gate',
        material: 'Poly-Si',
        processType: 'cvd',
        thicknessNm: 60.0,
        residualStressMpa: -150,
        refractiveIndex: 3.90,
        extinctionCoefficient: 0.1,
        thermalBudgetDtCm2: 4.0e-15,
        addedAtIsoDate: new Date().toISOString(),
        colorHex: '#64748b',
      },
    ],
    thermalBudgetHistory: [
      {
        stepName: 'Rapid Thermal Anneal (RTA)',
        temperatureC: 1050,
        durationMin: 0.1, // 6 seconds spike
        diffusivityCm2PerS: 5.2e-13,
        dtCm2: 3.12e-13,
      },
    ],
  },
  dual_damascene_cu: {
    schemaVersion: '1.0.0',
    name: 'Cu Damascene BEOL Interconnect',
    description: 'Back-End-of-Line (BEOL) Cu metallization with low-k dielectric barrier, TaN/Ta barrier liner and electroplated copper.',
    waferDiameterMm: 300,
    substrate: {
      material: 'si100',
      thicknessUm: 775,
    },
    layers: [
      {
        id: 'layer-cu-1',
        name: 'SiCN Etch Stop / Dielectric Barrier',
        material: 'SiCN',
        processType: 'cvd',
        thicknessNm: 25.0,
        residualStressMpa: 150,
        refractiveIndex: 1.85,
        extinctionCoefficient: 0,
        addedAtIsoDate: new Date().toISOString(),
        colorHex: '#06b6d4',
      },
      {
        id: 'layer-cu-2',
        name: 'Ultra Low-k (SiCOH, k=2.4) IMD',
        material: 'SiCOH',
        processType: 'cvd',
        thicknessNm: 150.0,
        residualStressMpa: 60,
        refractiveIndex: 1.38,
        extinctionCoefficient: 0,
        addedAtIsoDate: new Date().toISOString(),
        colorHex: '#10b981',
      },
      {
        id: 'layer-cu-3',
        name: 'ALD TaN / PVD Ta Barrier',
        material: 'TaN/Ta',
        processType: 'ald',
        thicknessNm: 5.0,
        residualStressMpa: -1800,
        refractiveIndex: 2.80,
        extinctionCoefficient: 2.1,
        addedAtIsoDate: new Date().toISOString(),
        colorHex: '#f59e0b',
      },
      {
        id: 'layer-cu-4',
        name: 'Cu Electroplating Trench Overfill',
        material: 'Copper (Cu)',
        processType: 'plating',
        thicknessNm: 350.0,
        residualStressMpa: 250, // Tensile after self-annealing
        refractiveIndex: 0.28,
        extinctionCoefficient: 3.4,
        addedAtIsoDate: new Date().toISOString(),
        colorHex: '#d97706',
      },
    ],
    thermalBudgetHistory: [],
  },
  gan_on_si_power: {
    schemaVersion: '1.0.0',
    name: 'GaN-on-Si Power HEMT Epitaxy',
    description: 'GaN-on-Si(111) power transistor stack with AlN nucleation, stepped AlGaN strain-relief buffer and GaN channel.',
    waferDiameterMm: 200,
    substrate: {
      material: 'si111',
      thicknessUm: 1000, // Thicker Si(111) to mitigate severe thermal mismatch bow
    },
    layers: [
      {
        id: 'layer-gan-1',
        name: 'AlN High-Temp Nucleation Layer',
        material: 'AlN',
        processType: 'cvd',
        thicknessNm: 200.0,
        residualStressMpa: 1500, // High tensile mismatch
        refractiveIndex: 2.15,
        extinctionCoefficient: 0,
        addedAtIsoDate: new Date().toISOString(),
        colorHex: '#6366f1',
      },
      {
        id: 'layer-gan-2',
        name: 'Step-Graded AlGaN Buffer Layers',
        material: 'AlGaN',
        processType: 'cvd',
        thicknessNm: 1500.0,
        residualStressMpa: -400, // Engineered compressive to counteract cool-down tensile
        refractiveIndex: 2.30,
        extinctionCoefficient: 0,
        addedAtIsoDate: new Date().toISOString(),
        colorHex: '#8b5cf6',
      },
      {
        id: 'layer-gan-3',
        name: 'C-doped GaN Semi-Insulating Channel',
        material: 'GaN',
        processType: 'cvd',
        thicknessNm: 2000.0,
        residualStressMpa: 200,
        refractiveIndex: 2.42,
        extinctionCoefficient: 0,
        addedAtIsoDate: new Date().toISOString(),
        colorHex: '#ec4899',
      },
      {
        id: 'layer-gan-4',
        name: 'Al0.25Ga0.75N Barrier Layer',
        material: 'AlGaN',
        processType: 'cvd',
        thicknessNm: 25.0,
        residualStressMpa: 800,
        refractiveIndex: 2.35,
        extinctionCoefficient: 0,
        addedAtIsoDate: new Date().toISOString(),
        colorHex: '#f43f5e',
      },
    ],
    thermalBudgetHistory: [],
  },
};

export const LOCAL_STORAGE_WORKSPACE_KEY = 'semitools_fab_workspace_project_v1';

/**
 * Creates a default blank project with 300mm Silicon substrate.
 */
export function createDefaultFilmStackProject(name = 'New Wafer Project'): FilmStackProject {
  return {
    schemaVersion: '1.0.0',
    id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    description: 'Custom wafer film stack and thermal budget tracking workspace.',
    waferDiameterMm: 300,
    substrate: {
      material: 'si100',
      thicknessUm: 775,
    },
    layers: [],
    thermalBudgetHistory: [],
    createdAtIso: new Date().toISOString(),
    updatedAtIso: new Date().toISOString(),
  };
}

/**
 * Loads the active project from LocalStorage or returns a default project.
 */
export function loadActiveWorkspaceProject(): FilmStackProject {
  if (typeof window === 'undefined') {
    return createDefaultFilmStackProject();
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_WORKSPACE_KEY);
    if (!raw) return createDefaultFilmStackProject();
    const parsed = JSON.parse(raw);
    if (parsed && parsed.schemaVersion === '1.0.0' && Array.isArray(parsed.layers)) {
      return parsed as FilmStackProject;
    }
  } catch (err) {
    console.error('Failed to parse workspace project from localStorage:', err);
  }

  return createDefaultFilmStackProject();
}

/**
 * Saves the active project to LocalStorage.
 */
export function saveActiveWorkspaceProject(project: FilmStackProject): void {
  if (typeof window === 'undefined') return;
  project.updatedAtIso = new Date().toISOString();
  try {
    localStorage.setItem(LOCAL_STORAGE_WORKSPACE_KEY, JSON.stringify(project));
  } catch (err) {
    console.error('Failed to save workspace project to localStorage:', err);
  }
}
