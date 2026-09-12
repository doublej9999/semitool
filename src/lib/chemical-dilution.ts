/**
 * Semiconductor Wet Bench Chemical Dilution & RCA Clean Physics & Chemistry
 *
 * Implements volumetric dilution, C1*V1 = C2*V2 concentration solving,
 * component volume partitioning for standard fab cleaning recipes (RCA SC-1, SC-2,
 * Piranha SPM, DHF, BOE), oxide etch rate estimations, and thermal/safety heuristics.
 */

export interface ChemicalComponent {
  name: string;
  chemicalFormula: string;
  stockAssayPct: number; // e.g. 29% for NH4OH, 30% for H2O2, 37% for HCl, 49% for HF, 96% for H2SO4
  densityGPerMl: number; // g/mL at 20°C
  molarMassGPerMol: number;
}

export const STOCK_CHEMICALS: Record<string, ChemicalComponent> = {
  nh4oh: {
    name: 'Ammonium Hydroxide (NH₄OH / 29%)',
    chemicalFormula: 'NH4OH',
    stockAssayPct: 29.0,
    densityGPerMl: 0.90,
    molarMassGPerMol: 35.05,
  },
  h2o2: {
    name: 'Hydrogen Peroxide (H₂O₂ / 30%)',
    chemicalFormula: 'H2O2',
    stockAssayPct: 30.0,
    densityGPerMl: 1.11,
    molarMassGPerMol: 34.01,
  },
  hcl: {
    name: 'Hydrochloric Acid (HCl / 37%)',
    chemicalFormula: 'HCl',
    stockAssayPct: 37.0,
    densityGPerMl: 1.19,
    molarMassGPerMol: 36.46,
  },
  hf: {
    name: 'Hydrofluoric Acid (HF / 49%)',
    chemicalFormula: 'HF',
    stockAssayPct: 49.0,
    densityGPerMl: 1.15,
    molarMassGPerMol: 20.01,
  },
  nh4f: {
    name: 'Ammonium Fluoride (NH₄F / 40%)',
    chemicalFormula: 'NH4F',
    stockAssayPct: 40.0,
    densityGPerMl: 1.11,
    molarMassGPerMol: 37.04,
  },
  h2so4: {
    name: 'Sulfuric Acid (H₂SO₄ / 96%)',
    chemicalFormula: 'H2SO4',
    stockAssayPct: 96.0,
    densityGPerMl: 1.84,
    molarMassGPerMol: 98.08,
  },
  h3po4: {
    name: 'Phosphoric Acid (H₃PO₄ / 85%)',
    chemicalFormula: 'H3PO4',
    stockAssayPct: 85.0,
    densityGPerMl: 1.685,
    molarMassGPerMol: 97.99,
  },
  water: {
    name: 'Deionized Water (DIW / H₂O)',
    chemicalFormula: 'H2O',
    stockAssayPct: 100.0,
    densityGPerMl: 1.00,
    molarMassGPerMol: 18.015,
  },
};

export interface WetBenchRecipePreset {
  id: string;
  name: string;
  category: 'rca' | 'piranha' | 'hf-clean' | 'nitride-strip';
  description: string;
  temperatureC: number;
  components: {
    chemicalKey: string;
    ratioPart: number;
  }[];
  primaryFunction: string;
  safetyWarning?: string;
  oxideEtchRateAngstromsPerMin?: number; // estimated thermal SiO2 etch rate at nominal temp
}

export const RECIPE_PRESETS: WetBenchRecipePreset[] = [
  {
    id: 'sc1-standard',
    name: 'RCA SC-1 Standard (1 : 1 : 5)',
    category: 'rca',
    description: 'NH₄OH (29%) : H₂O₂ (30%) : DI H₂O = 1 : 1 : 5 volumetric at 70 °C',
    temperatureC: 70,
    components: [
      { chemicalKey: 'nh4oh', ratioPart: 1 },
      { chemicalKey: 'h2o2', ratioPart: 1 },
      { chemicalKey: 'water', ratioPart: 5 },
    ],
    primaryFunction: 'Particle removal, light organic clean, controlled silicon oxidation & stripping',
    safetyWarning: 'Evolves ammonia (NH₃) gas and oxygen (O₂). Requires dedicated wet bench exhaust. Self-heating from peroxide decomposition.',
  },
  {
    id: 'sc1-dilute',
    name: 'RCA Dilute SC-1 (1 : 2 : 50)',
    category: 'rca',
    description: 'NH₄OH (29%) : H₂O₂ (30%) : DI H₂O = 1 : 2 : 50 volumetric at 65 °C',
    temperatureC: 65,
    components: [
      { chemicalKey: 'nh4oh', ratioPart: 1 },
      { chemicalKey: 'h2o2', ratioPart: 2 },
      { chemicalKey: 'water', ratioPart: 50 },
    ],
    primaryFunction: 'Advanced particle removal with minimized silicon surface roughening (low NH₄OH etching)',
  },
  {
    id: 'sc2-standard',
    name: 'RCA SC-2 Standard (1 : 1 : 6)',
    category: 'rca',
    description: 'HCl (37%) : H₂O₂ (30%) : DI H₂O = 1 : 1 : 6 volumetric at 75 °C',
    temperatureC: 75,
    components: [
      { chemicalKey: 'hcl', ratioPart: 1 },
      { chemicalKey: 'h2o2', ratioPart: 1 },
      { chemicalKey: 'water', ratioPart: 6 },
    ],
    primaryFunction: 'Heavy transition metal (Fe, Cu, Ni, Zn) desorption via soluble metal chloride complexing',
    safetyWarning: 'Evolves acidic HCl fumes. Keep segregated from SC-1 / NH₄OH tanks to prevent explosive NH₄Cl salt precipitation in ductwork.',
  },
  {
    id: 'sc2-dilute',
    name: 'RCA Dilute SC-2 (1 : 1 : 50)',
    category: 'rca',
    description: 'HCl (37%) : H₂O₂ (30%) : DI H₂O = 1 : 1 : 50 volumetric at 70 °C',
    temperatureC: 70,
    components: [
      { chemicalKey: 'hcl', ratioPart: 1 },
      { chemicalKey: 'h2o2', ratioPart: 1 },
      { chemicalKey: 'water', ratioPart: 50 },
    ],
    primaryFunction: 'Economical trace ionic & alkali metal cleanup with low chemical consumption',
  },
  {
    id: 'piranha-3-1',
    name: 'Piranha Clean / SPM (3 : 1)',
    category: 'piranha',
    description: 'H₂SO₄ (96%) : H₂O₂ (30%) = 3 : 1 volumetric (exothermic clean)',
    temperatureC: 120,
    components: [
      { chemicalKey: 'h2so4', ratioPart: 3 },
      { chemicalKey: 'h2o2', ratioPart: 1 },
    ],
    primaryFunction: 'Aggressive organic destruction and cross-linked photoresist stripping',
    safetyWarning: 'EXTREME CAUTION: Violently exothermic upon mixing (>100 °C auto-heating). NEVER add water to sulfuric acid. Reacts explosively with bulk solvents/organics.',
  },
  {
    id: 'piranha-4-1',
    name: 'Piranha Clean / SPM (4 : 1)',
    category: 'piranha',
    description: 'H₂SO₄ (96%) : H₂O₂ (30%) = 4 : 1 volumetric (high Caro’s acid H₂SO₅ generation)',
    temperatureC: 130,
    components: [
      { chemicalKey: 'h2so4', ratioPart: 4 },
      { chemicalKey: 'h2o2', ratioPart: 1 },
    ],
    primaryFunction: 'High efficiency SPM clean for heavy carbonized ion-implanted resist removal',
    safetyWarning: 'EXTREME CAUTION: Forms peroxymonosulfuric acid (Caro’s acid). Corrosive oxidizer; handles only in quartz or PVDF/PTFE tanks.',
  },
  {
    id: 'dhf-50-1',
    name: 'Dilute HF (50 : 1 DHF)',
    category: 'hf-clean',
    description: 'DI H₂O : HF (49%) = 50 : 1 volumetric at 25 °C',
    temperatureC: 25,
    components: [
      { chemicalKey: 'hf', ratioPart: 1 },
      { chemicalKey: 'water', ratioPart: 50 },
    ],
    primaryFunction: 'Native oxide stripping (~15-20 Å) and silicon surface hydrogen passivation (H-terminated hydrophobic)',
    safetyWarning: 'HF penetrates skin deeply and decalcifies bone without immediate pain. Calcium gluconate antidote gel must be present at bench.',
    oxideEtchRateAngstromsPerMin: 32,
  },
  {
    id: 'dhf-100-1',
    name: 'Dilute HF (100 : 1 DHF)',
    category: 'hf-clean',
    description: 'DI H₂O : HF (49%) = 100 : 1 volumetric at 25 °C',
    temperatureC: 25,
    components: [
      { chemicalKey: 'hf', ratioPart: 1 },
      { chemicalKey: 'water', ratioPart: 100 },
    ],
    primaryFunction: 'Ultra-controlled slow oxide clearing and gate pre-clean',
    safetyWarning: 'HF emergency protocol applies even at low 100:1 concentration.',
    oxideEtchRateAngstromsPerMin: 16,
  },
  {
    id: 'boe-6-1',
    name: 'Buffered Oxide Etch / BOE (6 : 1 BHF)',
    category: 'hf-clean',
    description: 'NH₄F (40%) : HF (49%) = 6 : 1 volumetric at 25 °C',
    temperatureC: 25,
    components: [
      { chemicalKey: 'nh4f', ratioPart: 6 },
      { chemicalKey: 'hf', ratioPart: 1 },
    ],
    primaryFunction: 'Stable pH-buffered silicon dioxide etching with reduced photoresist peeling and steady etch rate',
    safetyWarning: 'High fluoride concentration. Corrodes glass quickly; use polypropylene, PTFE, or PFA labware only.',
    oxideEtchRateAngstromsPerMin: 850,
  },
  {
    id: 'hot-phosphoric',
    name: 'Hot Phosphoric Silicon Nitride Strip',
    category: 'nitride-strip',
    description: 'H₃PO₄ (85%) : DI H₂O = 9 : 1 boiling mix at 160 °C',
    temperatureC: 160,
    components: [
      { chemicalKey: 'h3po4', ratioPart: 9 },
      { chemicalKey: 'water', ratioPart: 1 },
    ],
    primaryFunction: 'High selectivity chemical etching of Si₃N₄ over SiO₂ (~30:1 to 50:1 selectivity)',
    safetyWarning: 'High operating temperature (155-165 °C). Reflux condenser or DIW replenishment required to maintain constant boiling point.',
    oxideEtchRateAngstromsPerMin: 1.5,
  },
];

export interface RecipeCalculationResult {
  recipeName: string;
  totalVolumeLiters: number;
  totalMassGrams: number;
  components: {
    chemicalKey: string;
    name: string;
    formula: string;
    ratioPart: number;
    volumeMl: number;
    volumeLiters: number;
    massGrams: number;
    volumePct: number;
    massPct: number;
    activeChemicalMassGrams: number;
    activeAssayPct: number;
    effectiveConcentrationWtPct: number;
  }[];
  temperatureC: number;
  estimatedEtchRateAngstromsPerMin?: number;
  estimatedTimeToClear100nmMinutes?: number;
  safetyNotes: string[];
}

/**
 * Calculate component breakdown for a volumetric ratio recipe
 */
export function calculateRecipeVolumes(
  preset: WetBenchRecipePreset,
  totalVolumeLiters: number,
): RecipeCalculationResult {
  const safeTotalVol = Math.max(0.001, totalVolumeLiters);
  const totalParts = preset.components.reduce((sum, c) => sum + c.ratioPart, 0);

  let totalMassG = 0;
  const rawComponents = preset.components.map((c) => {
    const chem = STOCK_CHEMICALS[c.chemicalKey] || {
      name: c.chemicalKey,
      chemicalFormula: '',
      stockAssayPct: 100,
      densityGPerMl: 1.0,
      molarMassGPerMol: 18.0,
    };

    const volumeFraction = c.ratioPart / totalParts;
    const volumeLiters = safeTotalVol * volumeFraction;
    const volumeMl = volumeLiters * 1000;
    const massGrams = volumeMl * chem.densityGPerMl;
    const activeChemicalMassGrams = massGrams * (chem.stockAssayPct / 100);

    totalMassG += massGrams;

    return {
      chemicalKey: c.chemicalKey,
      name: chem.name,
      formula: chem.chemicalFormula,
      ratioPart: c.ratioPart,
      volumeMl,
      volumeLiters,
      massGrams,
      volumePct: volumeFraction * 100,
      massPct: 0, // computed below
      activeChemicalMassGrams,
      activeAssayPct: chem.stockAssayPct,
      effectiveConcentrationWtPct: 0, // computed below
    };
  });

  const components = rawComponents.map((c) => {
    const massPct = totalMassG > 0 ? (c.massGrams / totalMassG) * 100 : 0;
    const effectiveConcentrationWtPct = totalMassG > 0 ? (c.activeChemicalMassGrams / totalMassG) * 100 : 0;
    return {
      ...c,
      massPct,
      effectiveConcentrationWtPct,
    };
  });

  const safetyNotes: string[] = [];
  if (preset.safetyWarning) {
    safetyNotes.push(preset.safetyWarning);
  }
  if (preset.components.some((c) => c.chemicalKey === 'hf' || c.chemicalKey === 'nh4f')) {
    safetyNotes.push('Fluoride hazard: Never use standard glass beakers; use fluoropolymer (PTFE, PFA, PP). Have calcium gluconate antidote within arm’s reach.');
  }
  if (preset.components.some((c) => c.chemicalKey === 'h2so4')) {
    safetyNotes.push('Acid-to-water rule: Always add sulfuric acid or hydrogen peroxide slowly. NEVER pour water into hot concentrated acid.');
  }

  let estimatedTimeToClear100nm: number | undefined;
  if (preset.oxideEtchRateAngstromsPerMin && preset.oxideEtchRateAngstromsPerMin > 0) {
    // 100 nm = 1000 Å
    estimatedTimeToClear100nm = 1000 / preset.oxideEtchRateAngstromsPerMin;
  }

  return {
    recipeName: preset.name,
    totalVolumeLiters: safeTotalVol,
    totalMassGrams: totalMassG,
    components,
    temperatureC: preset.temperatureC,
    estimatedEtchRateAngstromsPerMin: preset.oxideEtchRateAngstromsPerMin,
    estimatedTimeToClear100nmMinutes: estimatedTimeToClear100nm,
    safetyNotes,
  };
}

/**
 * Two-concentration dilution solver: C1 * V1 = C2 * V2
 */
export interface DilutionSolverResult {
  stockConcentration: number;
  stockVolumeMl: number;
  stockVolumeLiters: number;
  targetConcentration: number;
  targetVolumeLiters: number;
  solventWaterVolumeMl: number;
  solventWaterVolumeLiters: number;
  dilutionFactor: number;
}

export function solveC1V1(params: {
  stockConcentration: number;
  targetConcentration: number;
  targetVolumeLiters: number;
}): DilutionSolverResult {
  const c1 = Math.max(0.0001, params.stockConcentration);
  const c2 = Math.min(c1, Math.max(0.00001, params.targetConcentration));
  const v2 = Math.max(0.001, params.targetVolumeLiters);

  // V1 = (C2 * V2) / C1
  const v1Liters = (c2 * v2) / c1;
  const v1Ml = v1Liters * 1000;
  const vWaterLiters = Math.max(0, v2 - v1Liters);
  const vWaterMl = vWaterLiters * 1000;
  const dilutionFactor = c1 / c2;

  return {
    stockConcentration: c1,
    stockVolumeMl: v1Ml,
    stockVolumeLiters: v1Liters,
    targetConcentration: c2,
    targetVolumeLiters: v2,
    solventWaterVolumeMl: vWaterMl,
    solventWaterVolumeLiters: vWaterLiters,
    dilutionFactor,
  };
}
