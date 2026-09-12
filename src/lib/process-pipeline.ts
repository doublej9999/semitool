/**
 * SemiTools Process Workflow Pipeline & Recipe Sequencing
 *
 * Implements multi-step semiconductor module sequencing:
 * - High-k Metal Gate (HKMG) Gate Stack Flow
 * - Shallow Trench Isolation (STI) Module Flow
 * - Cu Dual-Damascene Interconnect Flow
 * - FinFET Well & Epitaxy Flow
 *
 * Computes cumulative thermal budget, cumulative physical stack height,
 * cumulative wafer bow, and defect yield loss cascading across steps.
 */

export interface ProcessPipelineStep {
  id: string;
  stepNumber: number;
  name: string;
  nameZh: string;
  toolSlug: string;
  moduleCategory: 'Lithography' | 'Etch' | 'ThinFilm' | 'Thermal' | 'CMP' | 'Implant' | 'Metrology';
  temperatureC?: number;
  durationMin?: number;
  thicknessDeltaNm?: number; // positive for deposition/growth, negative for etch/CMP
  stressMpa?: number;
  defaultParams: Record<string, string | number>;
  description: string;
}

export interface ProcessPipelinePreset {
  id: string;
  title: string;
  titleZh: string;
  node: string;
  description: string;
  descriptionZh: string;
  steps: ProcessPipelineStep[];
}

export interface PipelineCumulativeMetrics {
  totalSteps: number;
  totalThicknessNm: number;
  cumulativeThermalBudgetDtCm2: number; // sum(D(T)*t) in cm^2
  estimatedCumulativeYield: number; // 0 to 1
  totalThermalTimeMin: number;
}

export const PROCESS_PIPELINE_PRESETS: ProcessPipelinePreset[] = [
  {
    id: 'hkmg-gate-stack',
    title: '28nm HKMG Gate Stack Module',
    titleZh: '28nm 高介电常数金属栅 (HKMG) 工艺模块',
    node: '28nm / 22nm Planar/FinFET',
    description: 'RCA pre-clean through interfacial oxide, ALD HfO2, TiN metal gate, poly-Si capping, and high-temp RTA activation.',
    descriptionZh: '从界面氧化层生长、ALD HfO2沉积、TiN金属功函数层溅射到多晶硅帽层沉积与尖峰退火全流程。',
    steps: [
      {
        id: 'hkmg-1',
        stepNumber: 1,
        name: 'Chemical Pre-Clean & Native Oxide Strip',
        nameZh: 'RCA 湿法清洗与自然氧化层去除',
        toolSlug: 'wet-bench-calculator',
        moduleCategory: 'ThinFilm',
        temperatureC: 65,
        durationMin: 10,
        thicknessDeltaNm: 0,
        stressMpa: 0,
        defaultParams: { bathType: 'sc1', chemicalTemp: 65, etchTimeSec: 600 },
        description: 'SC-1 / SC-2 particle and metallic trace removal with HF dilute etch.',
      },
      {
        id: 'hkmg-2',
        stepNumber: 2,
        name: 'Interfacial Layer (IL) Rapid Thermal Oxidation',
        nameZh: '界面层 (IL) 快速热氧化生长',
        toolSlug: 'thermal-oxide-calculator',
        moduleCategory: 'Thermal',
        temperatureC: 850,
        durationMin: 0.5,
        thicknessDeltaNm: 0.8,
        stressMpa: -300,
        defaultParams: { temp: 850, time: 0.5, ambient: 'dry', initialTox: 0 },
        description: 'Sub-nanometer high-quality SiO2 / SiON interface formation.',
      },
      {
        id: 'hkmg-3',
        stepNumber: 3,
        name: 'ALD High-k Dielectric (HfO2) Deposition',
        nameZh: '原子层沉积 (ALD) HfO2 高k介质层',
        toolSlug: 'ald-cycle-calculator',
        moduleCategory: 'ThinFilm',
        temperatureC: 300,
        durationMin: 15,
        thicknessDeltaNm: 2.2,
        stressMpa: 150,
        defaultParams: { targetThickness: 2.2, gpc: 0.09, cycleTime: 2.5 },
        description: 'Digital atomic layer deposition of HfO2 for gate leakage reduction.',
      },
      {
        id: 'hkmg-4',
        stepNumber: 4,
        name: 'ALD / PVD TiN Metal Work Function Layer',
        nameZh: 'TiN 金属栅功函数调节层沉积',
        toolSlug: 'film-stress-calculator',
        moduleCategory: 'ThinFilm',
        temperatureC: 350,
        durationMin: 8,
        thicknessDeltaNm: 5.0,
        stressMpa: 1200,
        defaultParams: { filmThickness: 5, substrateThickness: 775, filmStress: 1200 },
        description: 'Midgap and band-edge threshold voltage tuning metal layer.',
      },
      {
        id: 'hkmg-5',
        stepNumber: 5,
        name: 'Poly-Si Gate Cap CVD',
        nameZh: '多晶硅电极保护帽层 CVD',
        toolSlug: 'cvd-kinetics-calculator',
        moduleCategory: 'ThinFilm',
        temperatureC: 620,
        durationMin: 25,
        thicknessDeltaNm: 60.0,
        stressMpa: -150,
        defaultParams: { tempC: 620, pressureTorr: 0.25, silaneFlowSccm: 80 },
        description: 'LPCVD polycrystalline silicon deposition for implant contact.',
      },
      {
        id: 'hkmg-6',
        stepNumber: 6,
        name: 'Source/Drain Spike RTA Dopant Activation',
        nameZh: '源漏极超快尖峰退火 (Spike RTA) 杂质激活',
        toolSlug: 'dopant-diffusion-calculator',
        moduleCategory: 'Thermal',
        temperatureC: 1050,
        durationMin: 0.05,
        thicknessDeltaNm: 0,
        stressMpa: 0,
        defaultParams: { tempC: 1050, timeSec: 3, dopant: 'boron' },
        description: 'Millisecond thermal activation with minimal dopant redistribution.',
      },
    ],
  },
  {
    id: 'cu-damascene-flow',
    title: 'Dual-Damascene Cu Interconnect Flow',
    titleZh: '后道双大马士革铜互连 (Cu Interconnect) 工艺模块',
    node: '45nm - 7nm Back-End-of-Line (BEOL)',
    description: 'Low-k ILD deposition, via/trench lithography & etch, TaN/Ta barrier PVD, Cu seed, electrochemical plating, and CMP.',
    descriptionZh: '低介电常数层间介质沉积、通孔/沟槽光刻刻蚀、TaN/Ta阻挡层、铜籽晶层、超填充电镀与化学机械抛光。',
    steps: [
      {
        id: 'dam-1',
        stepNumber: 1,
        name: 'SiOCH Low-k Dielectric CVD (k=2.55)',
        nameZh: '多孔 SiOCH 超低k介质层 PECVD',
        toolSlug: 'cvd-kinetics-calculator',
        moduleCategory: 'ThinFilm',
        temperatureC: 380,
        durationMin: 12,
        thicknessDeltaNm: 150,
        stressMpa: 45,
        defaultParams: { tempC: 380, pressureTorr: 4.0 },
        description: 'Interlayer dielectric deposition for RC interconnect delay reduction.',
      },
      {
        id: 'dam-2',
        stepNumber: 2,
        name: 'Dual Damascene Trench & Via RIE Etch',
        nameZh: '大马士革沟槽与微通孔反应离子刻蚀',
        toolSlug: 'arde-etch-calculator',
        moduleCategory: 'Etch',
        temperatureC: 20,
        durationMin: 4,
        thicknessDeltaNm: -150,
        stressMpa: 0,
        defaultParams: { targetDepth: 150, ardeFactor: 0.35 },
        description: 'High aspect ratio anisotropic fluorocarbon dielectric plasma etch.',
      },
      {
        id: 'dam-3',
        stepNumber: 3,
        name: 'PVD TaN / Ta Copper Diffusion Barrier',
        nameZh: 'PVD TaN / Ta 铜扩散阻挡层沉积',
        toolSlug: 'film-stress-calculator',
        moduleCategory: 'ThinFilm',
        temperatureC: 150,
        durationMin: 3,
        thicknessDeltaNm: 4.0,
        stressMpa: -1800,
        defaultParams: { filmThickness: 4, filmStress: -1800 },
        description: 'Prevents copper diffusion into low-k porous matrix.',
      },
      {
        id: 'dam-4',
        stepNumber: 4,
        name: 'Copper Acid Electroplating (Superfilling)',
        nameZh: '超填充酸性镀铜 (Superfilling ECD)',
        toolSlug: 'cu-plating-calculator',
        moduleCategory: 'ThinFilm',
        temperatureC: 25,
        durationMin: 6,
        thicknessDeltaNm: 600,
        stressMpa: 250,
        defaultParams: { currentDensity: 15, platingTimeSec: 360, waferDiameterMm: 300 },
        description: 'Bottom-up void-free trench filling using accelerator & suppressor additives.',
      },
      {
        id: 'dam-5',
        stepNumber: 5,
        name: 'Bulk Copper & Barrier CMP Polish',
        nameZh: '高平坦化铜与阻挡层化学机械抛光 (CMP)',
        toolSlug: 'cmp-preston-calculator',
        moduleCategory: 'CMP',
        temperatureC: 35,
        durationMin: 2.5,
        thicknessDeltaNm: -450,
        stressMpa: 0,
        defaultParams: { pressurePsi: 2.2, platenSpeedRpm: 90, prestonK: 4.8e-14 },
        description: 'Selective copper removal stopping on low-k dielectric planar surface.',
      },
    ],
  },
];

/**
 * Calculates cumulative pipeline physical and thermal metrics
 */
export function calculatePipelineMetrics(steps: ProcessPipelineStep[]): PipelineCumulativeMetrics {
  let totalThicknessNm = 0;
  let cumulativeThermalBudgetDtCm2 = 0;
  let estimatedCumulativeYield = 1.0;
  let totalThermalTimeMin = 0;

  // Silicon intrinsic diffusion constants (Boron reference: D0 = 0.76 cm2/s, Ea = 3.46 eV)
  const D0 = 0.76;
  const EA = 3.46;
  const KB_EV = 8.617333262e-5;

  for (const step of steps) {
    // 1. Thickness
    totalThicknessNm += step.thicknessDeltaNm ?? 0;

    // 2. Thermal budget sum(D * t)
    if (step.temperatureC && step.temperatureC >= 400 && step.durationMin && step.durationMin > 0) {
      const tempK = step.temperatureC + 273.15;
      const tSec = step.durationMin * 60;
      const D = D0 * Math.exp(-EA / (KB_EV * tempK));
      cumulativeThermalBudgetDtCm2 += D * tSec;
      totalThermalTimeMin += step.durationMin;
    }

    // 3. Step transmission yield estimation (typical fab step yield is 99.5% - 99.9%)
    let stepYield = 0.9985;
    if (step.moduleCategory === 'Lithography' || step.moduleCategory === 'CMP') {
      stepYield = 0.997; // higher particulate / defect probability
    } else if (step.moduleCategory === 'Etch') {
      stepYield = 0.998;
    }
    estimatedCumulativeYield *= stepYield;
  }

  return {
    totalSteps: steps.length,
    totalThicknessNm: Number(totalThicknessNm.toFixed(1)),
    cumulativeThermalBudgetDtCm2: Number(cumulativeThermalBudgetDtCm2.toExponential(3)),
    estimatedCumulativeYield: Number(estimatedCumulativeYield.toFixed(4)),
    totalThermalTimeMin: Number(totalThermalTimeMin.toFixed(2)),
  };
}
