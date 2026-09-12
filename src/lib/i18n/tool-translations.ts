import type { SupportedLocale } from './context';
import type { Tool } from '@/tools/tools.types';

export interface ToolTranslation {
  name: string;
  description: string;
  keywords: string[];
}

export const TOOL_TRANSLATIONS: Record<SupportedLocale, Record<string, ToolTranslation>> = {
  "en": {
    "/tools/wafer-die-calculator": {
      "name": "Wafer Die Calculator",
      "description": "Estimated gross die per wafer from wafer diameter, die dimensions, street width and edge exclusion.",
      "keywords": [
        "gross die",
        "die per wafer",
        "dpw",
        "street width",
        "edge exclusion",
        "scribe line",
        "die yield"
      ]
    },
    "/tools/wafer-map-generator": {
      "name": "Wafer Map Generator",
      "description": "Interactive visual wafer grid with coordinate layout, pass/fail bin statistics, and CSV/JSON export.",
      "keywords": [
        "wafer map",
        "die map",
        "grid layout",
        "binning",
        "visualization",
        "interactive map"
      ]
    },
    "/tools/wafer-mark-calculator": {
      "name": "Wafer Mark Calculator",
      "description": "Format, validate and compute checksums for SEMI M12 and M13 silicon wafer laser markings.",
      "keywords": [
        "semi mark",
        "semi m12",
        "semi m13",
        "wafer id",
        "checksum",
        "laser mark",
        "traceability"
      ]
    },
    "/tools/yield-calculator": {
      "name": "Wafer Yield Calculator",
      "description": "Calculate overall fab and assembly test yields from wafer in, die count and good units produced.",
      "keywords": [
        "yield",
        "wafer yield",
        "line yield",
        "die yield",
        "pass rate",
        "fab yield"
      ]
    },
    "/tools/yield-model-calculator": {
      "name": "Yield Model Calculator",
      "description": "Side-by-side comparison of Murphy, Poisson, Seeds, and Bose-Einstein semiconductor yield models.",
      "keywords": [
        "yield model",
        "murphy",
        "poisson",
        "seeds",
        "bose einstein",
        "defect density model"
      ]
    },
    "/tools/defect-density-calculator": {
      "name": "Defect Density Calculator",
      "description": "Extract baseline defect density (D0) from measured yield and die area using standard models.",
      "keywords": [
        "defect density",
        "d0",
        "yield loss",
        "killer defect",
        "poisson yield"
      ]
    },
    "/tools/die-cost-calculator": {
      "name": "Die Cost Calculator",
      "description": "Calculate net cost per good die from raw wafer cost, gross die, line yield and packaging fees.",
      "keywords": [
        "die cost",
        "wafer cost",
        "good die",
        "cost per chip",
        "manufacturing cost"
      ]
    },
    "/tools/process-capability-calculator": {
      "name": "Process Capability Calculator",
      "description": "Calculate Cp, Cpk, Pp, and Ppk indices from upper/lower specification limits and sample statistics.",
      "keywords": [
        "cpk",
        "cp",
        "ppk",
        "process capability",
        "six sigma",
        "specification limit",
        "spc"
      ]
    },
    "/tools/yield-confidence-calculator": {
      "name": "Yield Confidence Calculator",
      "description": "Wilson score and Clopper-Pearson confidence intervals for small sample test yield validation.",
      "keywords": [
        "confidence interval",
        "wilson score",
        "clopper pearson",
        "sample size",
        "yield confidence"
      ]
    },
    "/tools/throughput-calculator": {
      "name": "Fab Throughput Calculator",
      "description": "Calculate tool wafers-per-hour (WPH) from process recipe time, robot transfer overhead and batch size.",
      "keywords": [
        "throughput",
        "wph",
        "wafers per hour",
        "tact time",
        "cycle time",
        "equipment capacity"
      ]
    },
    "/tools/sheet-resistance-calculator": {
      "name": "Sheet Resistance & Resistivity Calculator",
      "description": "Four-point probe sheet resistance (Rs) and volume resistivity with thickness & geometric corrections.",
      "keywords": [
        "sheet resistance",
        "resistivity",
        "four point probe",
        "rs",
        "ohms per square",
        "bulk resistivity"
      ]
    },
    "/tools/wafer-area-calculator": {
      "name": "Wafer Area & Edge Exclusion Calculator",
      "description": "Usable area calculation accounting for wafer flats, notches, and configurable edge exclusion rings.",
      "keywords": [
        "wafer area",
        "edge exclusion",
        "flat",
        "notch",
        "usable area",
        "surface area"
      ]
    },
    "/tools/reticle-field-calculator": {
      "name": "Reticle Field & Stepper Exposure Calculator",
      "description": "Determine maximum die array rows and columns within stepper or scanner optical exposure fields.",
      "keywords": [
        "reticle field",
        "stepper field",
        "scanner field",
        "die per shot",
        "exposure field",
        "photolithography"
      ]
    },
    "/tools/thickness-converter": {
      "name": "Thin Film Thickness Converter",
      "description": "Exact conversion between ångströms (Å), nanometres (nm), micrometres (µm), mils, and millimetres.",
      "keywords": [
        "film thickness",
        "angstrom",
        "nanometer",
        "micrometer",
        "mil",
        "unit converter"
      ]
    },
    "/tools/pressure-converter": {
      "name": "Vacuum & Pressure Converter",
      "description": "High-precision conversion between Pa, mbar, Torr, mTorr, and standard atmospheric pressure (atm).",
      "keywords": [
        "vacuum",
        "pressure converter",
        "torr",
        "mtorr",
        "mbar",
        "pascal",
        "chamber pressure"
      ]
    },
    "/tools/gas-flow-converter": {
      "name": "Gas Mass Flow Converter",
      "description": "Convert between sccm, slm, and mol/s under 0°C, 20°C, and 25°C standard reference conditions.",
      "keywords": [
        "sccm",
        "slm",
        "gas flow",
        "mass flow controller",
        "mfc",
        "standard conditions"
      ]
    },
    "/tools/temperature-converter": {
      "name": "Temperature Converter",
      "description": "Convert between Celsius (°C), Kelvin (K), and Fahrenheit (°F) with thermal energy kT (eV) readout.",
      "keywords": [
        "temperature",
        "celsius",
        "kelvin",
        "fahrenheit",
        "thermal energy",
        "kt"
      ]
    },
    "/tools/lithography-resolution-calculator": {
      "name": "Lithography Resolution & DoF Calculator",
      "description": "Rayleigh criterion calculations for minimum resolvable feature size and depth of focus (DoF).",
      "keywords": [
        "rayleigh",
        "resolution",
        "depth of focus",
        "dof",
        "numerical aperture",
        "na",
        "k1 factor"
      ]
    },
    "/tools/etch-rate-calculator": {
      "name": "Etch Rate & Selectivity Calculator",
      "description": "Etch rate computation from thickness change and time, with etch selectivity to mask and underlayer.",
      "keywords": [
        "etch rate",
        "selectivity",
        "plasma etch",
        "wet etch",
        "material removal rate"
      ]
    },
    "/tools/cd-uniformity-calculator": {
      "name": "Critical Dimension (CD) Uniformity Calculator",
      "description": "Statistical analysis of wafer CD measurements: mean, range, sample sigma (3σ), and ±3σ percentage.",
      "keywords": [
        "cd uniformity",
        "critical dimension",
        "3 sigma",
        "range",
        "across wafer variation"
      ]
    },
    "/tools/film-stress-calculator": {
      "name": "Thin Film Stress Calculator",
      "description": "Stoney equation calculation of tensile or compressive film stress from substrate curvature change.",
      "keywords": [
        "film stress",
        "stoney equation",
        "radius of curvature",
        "tensile",
        "compressive",
        "wafer bow"
      ]
    },
    "/tools/film-uniformity-calculator": {
      "name": "Film Thickness Uniformity Calculator",
      "description": "Wafer film thickness uniformity analysis: max, min, mean, and half-range percentage (±%).",
      "keywords": [
        "film uniformity",
        "half range",
        "thickness variation",
        "metrology",
        "ellipsometry"
      ]
    },
    "/tools/diffusion-length-calculator": {
      "name": "Diffusion Length Calculator",
      "description": "Characteristic impurity diffusion length 2√(Dt) from diffusivity D and thermal anneal time t.",
      "keywords": [
        "diffusion length",
        "diffusivity",
        "annealing",
        "dopant diffusion",
        "fick law"
      ]
    },
    "/tools/arrhenius-calculator": {
      "name": "Arrhenius Rate Calculator",
      "description": "Arrhenius reaction rate from prefactor and activation energy, and Ea extraction from two-point rates.",
      "keywords": [
        "arrhenius",
        "activation energy",
        "prefactor",
        "reaction rate",
        "temperature dependence",
        "ea"
      ]
    },
    "/tools/thermal-oxide-calculator": {
      "name": "Thermal Oxide Growth Calculator",
      "description": "Deal-Grove oxidation model for dry O2 and wet H2O silicon thermal oxide thickness vs time.",
      "keywords": [
        "deal grove",
        "thermal oxide",
        "silicon oxidation",
        "dry o2",
        "wet h2o",
        "oxide growth"
      ]
    },
    "/tools/power-converter": {
      "name": "RF Power & dBm Converter",
      "description": "Convert between Watts (W), milliwatts (mW), and decibel-milliwatts (dBm) with peak-to-peak voltage.",
      "keywords": [
        "rf power",
        "dbm",
        "watts",
        "mw",
        "vpp",
        "radio frequency"
      ]
    },
    "/tools/time-constant-calculator": {
      "name": "RC / RL Time Constant Calculator",
      "description": "Calculate RC (τ = RC) and RL (τ = L/R) time constants, 10%-90% rise time, and transient voltages.",
      "keywords": [
        "time constant",
        "rc circuit",
        "rl circuit",
        "tau",
        "rise time",
        "cutoff frequency"
      ]
    },
    "/tools/rf-power-calculator": {
      "name": "RF Power & Reflection Calculator",
      "description": "Forward and reflected power analysis: reflection coefficient, absorbed load power, and return loss.",
      "keywords": [
        "rf power",
        "reflected power",
        "forward power",
        "absorbed power",
        "reflection coefficient"
      ]
    },
    "/tools/return-loss-calculator": {
      "name": "Return Loss & VSWR Calculator",
      "description": "Bidirectional conversion between return loss (RL), VSWR, reflection coefficient (Γ), and reflected power.",
      "keywords": [
        "return loss",
        "vswr",
        "reflection coefficient",
        "s11",
        "impedance match"
      ]
    },
    "/tools/impedance-matching-calculator": {
      "name": "L-Section Impedance Matching Network",
      "description": "Design low-pass and high-pass L-section matching networks for RF plasma generator loads.",
      "keywords": [
        "l section",
        "impedance matching",
        "rf matching",
        "plasma load",
        "smith chart"
      ]
    },
    "/tools/microstrip-calculator": {
      "name": "Microstrip Impedance Calculator",
      "description": "Characteristic impedance Z0 and effective dielectric constant from trace width, height and εr.",
      "keywords": [
        "microstrip",
        "characteristic impedance",
        "z0",
        "dielectric constant",
        "transmission line"
      ]
    },
    "/tools/stub-matching-calculator": {
      "name": "Single Stub Tuner Matching Calculator",
      "description": "Transmission line distance and stub length for open-circuit and short-circuit single-stub matching.",
      "keywords": [
        "stub tuner",
        "single stub",
        "stub matching",
        "transmission line",
        "quarter wave"
      ]
    },
    "/tools/bin-yield-calculator": {
      "name": "Bin Yield & Multi-Bin Sorter",
      "description": "Aggregate chip probe (CP/FT) multi-bin classification data into percentages and overall passing yield.",
      "keywords": [
        "bin yield",
        "multi bin",
        "wafer sort",
        "chip probe",
        "binning statistics"
      ]
    },
    "/tools/fit-mtbf-calculator": {
      "name": "FIT & MTBF Reliability Calculator",
      "description": "Reliability conversions between FIT (failures in 10^9 hours), failure rate λ, and MTBF hours.",
      "keywords": [
        "fit",
        "mtbf",
        "failure rate",
        "reliability",
        "failures in time"
      ]
    },
    "/tools/yield-dppm-calculator": {
      "name": "Yield to Defect DPPM Converter",
      "description": "Exact conversion between percentage yield (%) and defective parts per million (DPPM).",
      "keywords": [
        "dppm",
        "parts per million",
        "yield to dppm",
        "defect rate",
        "quality level"
      ]
    },
    "/tools/weibull-life-calculator": {
      "name": "Weibull Reliability Life Calculator",
      "description": "Reliability R(t), failure rate and MTTF analysis using Weibull shape (β) and scale (η) parameters.",
      "keywords": [
        "weibull",
        "shape parameter",
        "characteristic life",
        "mttf",
        "reliability life"
      ]
    },
    "/tools/spc-control-chart-calculator": {
      "name": "SPC Control Chart Calculator",
      "description": "X-bar and R/S control limits (UCL/LCL) calculation with Nelson rule violation checks.",
      "keywords": [
        "spc",
        "xbar r",
        "control chart",
        "ucl",
        "lcl",
        "nelson rules",
        "statistical process control"
      ]
    },
    "/tools/acceptance-sampling-calculator": {
      "name": "Acceptance Sampling Calculator",
      "description": "Binomial and Poisson acceptance probability (Pa) and Operating Characteristic (OC) curves.",
      "keywords": [
        "acceptance sampling",
        "oc curve",
        "sampling plan",
        "aql",
        "lot acceptance"
      ]
    },
    "/tools/ion-implantation-calculator": {
      "name": "Ion Implantation Projected Range Calculator",
      "description": "Estimate projected range Rp, straggle ΔRp, and peak dopant concentration from ion energy and dose.",
      "keywords": [
        "ion implantation",
        "projected range",
        "straggle",
        "peak concentration",
        "doping profile"
      ]
    },
    "/tools/semiconductor-depletion-calculator": {
      "name": "PN Junction Depletion Width Calculator",
      "description": "Built-in potential Vbi, depletion width W, and junction capacitance from dopings and reverse bias.",
      "keywords": [
        "pn junction",
        "depletion width",
        "built in potential",
        "junction capacitance",
        "band bending"
      ]
    },
    "/tools/cleanroom-converter": {
      "name": "Cleanroom Class & Particle Concentration",
      "description": "Compare and convert particle concentration limits between ISO 14644-1 and FED-STD-209E standards.",
      "keywords": [
        "cleanroom",
        "iso class",
        "fed std 209e",
        "particle count",
        "airborne particulate"
      ]
    },
    "/tools/carrier-mobility-calculator": {
      "name": "Carrier Mobility & Drift Velocity",
      "description": "Caughey-Thomas model for doping-dependent electron/hole mobility and high-field saturation drift velocity.",
      "keywords": [
        "carrier mobility",
        "drift velocity",
        "electron mobility",
        "hole mobility",
        "caughey thomas"
      ]
    },
    "/tools/cmp-preston-calculator": {
      "name": "CMP Removal Rate & Preston Equation",
      "description": "Preston equation material removal rate (MRR) from downforce pressure P, relative velocity V and kp.",
      "keywords": [
        "cmp",
        "preston equation",
        "material removal rate",
        "mrr",
        "polishing rate"
      ]
    },
    "/tools/film-color-calculator": {
      "name": "Oxide & Nitride Film Color Calculator",
      "description": "Predict visible interference colors of thermal SiO2 and Si3N4 thin films under normal white illumination.",
      "keywords": [
        "film color",
        "interference color",
        "sio2 color",
        "oxide thickness color",
        "thin film interference"
      ]
    },
    "/tools/mosfet-threshold-calculator": {
      "name": "MOSFET Threshold Voltage Calculator",
      "description": "Long-channel MOSFET flatband and threshold voltage (Vt) from tox, substrate doping and workfunction.",
      "keywords": [
        "mosfet",
        "threshold voltage",
        "vth",
        "flatband voltage",
        "oxide capacitance"
      ]
    },
    "/tools/thermal-fatigue-calculator": {
      "name": "Solder Joint Thermal Fatigue Life",
      "description": "Coffin-Manson and Norris-Landzberg thermal cycling fatigue life estimation for package solder joints.",
      "keywords": [
        "coffin manson",
        "norris landzberg",
        "thermal fatigue",
        "solder joint",
        "temperature cycling"
      ]
    },
    "/tools/thermal-resistance-calculator": {
      "name": "Thermal Resistance & Junction Temperature",
      "description": "Package junction temperature (Tj) and thermal resistance network (θjc, θca) analysis.",
      "keywords": [
        "thermal resistance",
        "junction temperature",
        "theta jc",
        "thermal management",
        "heat dissipation"
      ]
    },
    "/tools/wire-bonding-calculator": {
      "name": "Wire Bonding Loop Profile & Shear Force",
      "description": "Estimate bond wire loop length, ball shear strength and wire pull force limits from wire diameter.",
      "keywords": [
        "wire bonding",
        "ball shear",
        "wire pull",
        "loop height",
        "wire length",
        "packaging"
      ]
    },
    "/tools/chemical-dilution-calculator": {
      "name": "Chemical Dilution & Wet Clean Calculator",
      "description": "RCA SC-1, SC-2, Piranha SPM, DHF, and BOE chemical dilution volumes, component mass/weight %, C1·V1=C2·V2 solver, and oxide etch rate estimation.",
      "keywords": [
        "chemical dilution",
        "rca clean",
        "sc1 clean",
        "sc2 clean",
        "piranha etch",
        "spm",
        "dhf",
        "dilute hf",
        "boe",
        "buffered oxide etch",
        "wet bench",
        "c1v1 c2v2",
        "semiconductor cleaning",
        "oxide etch rate"
      ]
    },
    "/tools/plasma-sheath-calculator": {
      "name": "Plasma Sheath & Debye Length Calculator",
      "description": "Electron Debye length, Bohm velocity, Child-Langmuir RF bias sheath thickness, plasma frequency, and ion collisionality regime for RIE/ICP/PECVD.",
      "keywords": [
        "plasma sheath",
        "debye length",
        "bohm velocity",
        "bohm criterion",
        "child langmuir",
        "plasma frequency",
        "rf bias",
        "rie etch",
        "icp plasma",
        "sheath capacitance",
        "floating potential",
        "mean free path",
        "semiconductor plasma"
      ]
    },
    "/tools/ald-cycle-calculator": {
      "name": "ALD Cycle & Precursor Exposure Calculator",
      "description": "Atomic layer deposition (ALD) cycle timing, Langmuir precursor exposure saturation (θ), growth per cycle (GPC), and total thickness solver.",
      "keywords": [
        "ald",
        "atomic layer deposition",
        "ald cycle",
        "gpc",
        "growth per cycle",
        "precursor exposure",
        "langmuir",
        "saturation curve",
        "tma",
        "al2o3",
        "hfo2",
        "tio2",
        "precursor consumption",
        "purge time",
        "pulse time"
      ]
    },
    "/tools/dopant-diffusion-calculator": {
      "name": "Dopant Diffusion & Junction Depth Calculator",
      "description": "Constant-source (erfc) and limited-source (Gaussian) dopant diffusion in Silicon, Arrhenius D(T) coefficients (B, P, As, Sb), junction depth (xj), and oxide mask thickness.",
      "keywords": [
        "dopant diffusion",
        "junction depth",
        "xj",
        "fick law",
        "erfc",
        "gaussian diffusion",
        "predeposition",
        "drive-in",
        "boron diffusion",
        "phosphorus diffusion",
        "arsenic diffusion",
        "thermal budget",
        "oxide mask",
        "solid solubility"
      ]
    },
    "/tools/cvd-kinetics-calculator": {
      "name": "CVD & Epitaxy Kinetics Calculator",
      "description": "Grove boundary layer mass transfer, Arrhenius surface reaction rate, transition temperature, and susceptor depletion dynamics for CVD/Epi.",
      "keywords": [
        "cvd",
        "epitaxy",
        "chemical vapor deposition",
        "grove model",
        "boundary layer",
        "mass transfer",
        "surface reaction",
        "arrhenius",
        "growth rate",
        "silane",
        "lpcvd",
        "teos"
      ]
    },
    "/tools/four-point-probe-calculator": {
      "name": "Four-Point Probe Calculator (ASTM F84)",
      "description": "ASTM F84 / SEMI MF84 collinear four-point probe sheet resistance, wafer resistivity, thickness correction factor, and NIST dopant density inversion.",
      "keywords": [
        "four point probe",
        "astm f84",
        "semi mf84",
        "sheet resistance",
        "resistivity",
        "thickness correction",
        "dopant density",
        "irvin curves",
        "carrier mobility"
      ]
    },
    "/tools/split-lot-calculator": {
      "name": "Split-Lot & DOE Recipe Overlay Calculator",
      "description": "Split-lot and Design of Experiments (DOE) recipe overlay matrix, multi-wafer parameter variance tracking, response delta comparisons, and run-sheet export.",
      "keywords": [
        "split lot",
        "doe",
        "design of experiments",
        "recipe overlay",
        "recipe split",
        "fab traveler",
        "process delta",
        "process tuning",
        "cleanroom run sheet"
      ]
    },
    "/tools/curve-fitting-calculator": {
      "name": "Curve Fitting & Parameter Extraction Calculator",
      "description": "Extract semiconductor kinetic parameters: Arrhenius activation energy (Ea), Deal-Grove oxidation rate constants (B, B/A), and least-squares linear regression with R² goodness-of-fit.",
      "keywords": [
        "curve fitting",
        "arrhenius fit",
        "activation energy",
        "deal-grove parameter",
        "linear regression",
        "parameter extraction",
        "kinetics",
        "oxidation rate constants",
        "diffusion activation energy"
      ]
    },
    "/tools/arde-etch-calculator": {
      "name": "ARDE & Microloading Calculator",
      "description": "Aspect-ratio-dependent etching (RIE lag), pattern microloading, and selectivity simulation.",
      "keywords": [
        "arde",
        "rie lag",
        "microloading",
        "aspect ratio",
        "etch rate",
        "selectivity",
        "taper angle",
        "coburn winter"
      ]
    },
    "/tools/cmp-endpoint-calculator": {
      "name": "CMP Endpoint & Pad Life Calculator",
      "description": "Chemical mechanical planarization motor current endpoint, optical fringe timing, and pad conditioning wear.",
      "keywords": [
        "cmp",
        "endpoint",
        "pad life",
        "conditioning",
        "optical fringe",
        "preston",
        "planarization",
        "pad wear"
      ]
    },
    "/tools/wafer-warp-stress-calculator": {
      "name": "Wafer Bow, Warp & Thin Film Stress Calculator",
      "description": "Calculate thin film residual stress via Stoney equation, wafer bow and warp curvature, thermal expansion mismatch stress, and critical cracking thickness.",
      "keywords": [
        "stoney equation",
        "wafer bow",
        "wafer warp",
        "film stress",
        "thermal mismatch",
        "biaxial modulus",
        "thin film residual stress",
        "curvature"
      ]
    },
    "/tools/wet-bench-calculator": {
      "name": "Wet Bench Chemical Lifetime & Spike Calculator",
      "description": "RCA clean (SC-1/SC-2), SPM Piranha, and BOE etch bath lifetime, chemical spike dosing, and dissolved silicon loading decay.",
      "keywords": [
        "wet bench",
        "rca clean",
        "sc-1",
        "sc-2",
        "piranha",
        "spm",
        "boe",
        "chemical spike",
        "bath life",
        "etch bath"
      ]
    },
    "/tools/cu-plating-calculator": {
      "name": "Copper Electroplating & Damascene Calculator",
      "description": "Copper electrochemical deposition (ECD), Dual Damascene trench superfilling, seed layer terminal effect, and Faraday electrolysis kinetics.",
      "keywords": [
        "copper plating",
        "ecd",
        "electroplating",
        "damascene",
        "superfilling",
        "faraday law",
        "terminal effect",
        "current density"
      ]
    }
  },
  "zh-CN": {
    "/tools/wafer-die-calculator": {
      "name": "晶圆出芯数计算器",
      "description": "基于晶圆直径、芯片尺寸、划片槽宽度和边缘去除估算理论总芯数（Gross Die）及面积利用率。",
      "keywords": [
        "晶圆出芯数",
        "出片数",
        "芯片数",
        "划片槽",
        "边缘去除",
        "晶圆利用率",
        "Gross Die",
        "DPW"
      ]
    },
    "/tools/wafer-map-generator": {
      "name": "交互式晶圆图生成器",
      "description": "交互式可视化晶圆网格图，支持芯片坐标排布、合格/不良统计及 CSV/JSON 格式导出。",
      "keywords": [
        "晶圆图",
        "晶圆地图",
        "芯片排布",
        "分选统计",
        "晶圆可视化",
        "wafer map"
      ]
    },
    "/tools/wafer-mark-calculator": {
      "name": "SEMI 晶圆标刻与校验码计算器",
      "description": "符合 SEMI M12 与 M13 标准的单晶硅晶圆激光打标字符格式化与校验和校验算法。",
      "keywords": [
        "晶圆打标",
        "SEMI标刻",
        "SEMI M12",
        "SEMI M13",
        "晶圆编号",
        "激光打标",
        "校验码"
      ]
    },
    "/tools/yield-calculator": {
      "name": "晶圆良率计算器",
      "description": "基于投片晶圆数、产出合格芯片数与良品率计算晶圆制造综合良率及封装测试良率。",
      "keywords": [
        "良率计算",
        "晶圆良率",
        "制程良率",
        "芯片良率",
        "成品率",
        "生产良率"
      ]
    },
    "/tools/yield-model-calculator": {
      "name": "良率模型对比计算器",
      "description": "横向对比 Murphy、Poisson、Seeds 和 Bose-Einstein 半导体良率预测模型。",
      "keywords": [
        "良率模型",
        "墨菲模型",
        "泊松模型",
        "Seeds模型",
        "缺陷密度模型",
        "良率预测"
      ]
    },
    "/tools/defect-density-calculator": {
      "name": "缺陷密度计算器",
      "description": "基于芯片面积和实测良率反推晶圆缺陷密度 D0，量化评估洁净室与工艺水平。",
      "keywords": [
        "缺陷密度",
        "D0",
        "致命缺陷",
        "良率损失",
        "泊松分布",
        "洁净度"
      ]
    },
    "/tools/die-cost-calculator": {
      "name": "晶圆芯片成本计算器",
      "description": "根据晶圆加工成本、晶圆出芯数、制造良率与封装测试费用测算单颗芯片净成本。",
      "keywords": [
        "芯片成本",
        "晶圆成本",
        "单颗成本",
        "芯片报价",
        "制造成本",
        "封装测试成本"
      ]
    },
    "/tools/process-capability-calculator": {
      "name": "制程能力指数计算器 (Cp / Cpk)",
      "description": "基于规格公差上限 USL、下限 LSL 以及样本均值和标准差计算制程能力 Cp、Cpk、Pp、Ppk。",
      "keywords": [
        "制程能力",
        "工序能力",
        "Cp",
        "Cpk",
        "Pp",
        "Ppk",
        "六西格玛",
        "统计过程控制"
      ]
    },
    "/tools/yield-confidence-calculator": {
      "name": "良率置信区间计算器",
      "description": "基于小批量抽样测试数据计算 Wilson 分数或 Clopper-Pearson 良率置信区间。",
      "keywords": [
        "置信区间",
        "良率区间",
        "Wilson得分",
        "Clopper Pearson",
        "抽样置信度"
      ]
    },
    "/tools/throughput-calculator": {
      "name": "机台产能与节拍计算器 (WPH)",
      "description": "基于单步工艺耗时、传输机械手开销与批次大小计算晶圆厂机台 WPH（每小时晶圆数）。",
      "keywords": [
        "机台产能",
        "WPH",
        "每小时晶圆数",
        "节拍时间",
        "设备生产率",
        "周期时间"
      ]
    },
    "/tools/sheet-resistance-calculator": {
      "name": "四探针方块电阻与电阻率计算器",
      "description": "由四探针电压电流测量值、探针间距、薄膜厚度及几何修正因子计算方阻与体电阻率。",
      "keywords": [
        "方阻",
        "方块电阻",
        "四探针",
        "电阻率",
        "薄膜电阻率",
        "薄层电阻",
        "Rs"
      ]
    },
    "/tools/wafer-area-calculator": {
      "name": "晶圆有效面积与边缘去除计算器",
      "description": "计算含平边（Flat）或缺口（Notch）的晶圆总面积，以及扣除边缘去除后的有效工艺面积。",
      "keywords": [
        "晶圆面积",
        "边缘去除",
        "有效面积",
        "平边",
        "缺口",
        "Edge Exclusion"
      ]
    },
    "/tools/reticle-field-calculator": {
      "name": "光罩曝光视场计算器",
      "description": "计算步进光刻机/扫描光刻机（Stepper/Scanner）曝光视场内可容纳的芯片阵列行数与列数。",
      "keywords": [
        "光罩视场",
        "曝光视场",
        "光刻视场",
        "单步曝光",
        "步进光刻",
        "Reticle Field"
      ]
    },
    "/tools/thickness-converter": {
      "name": "薄膜厚度单位换算",
      "description": "在埃（Å）、纳米（nm）、微米（µm）、密耳（mil）和毫米（mm）之间精确换算薄膜厚度。",
      "keywords": [
        "薄膜厚度",
        "厚度换算",
        "埃",
        "纳米",
        "微米",
        "膜厚单位",
        "单位转换"
      ]
    },
    "/tools/pressure-converter": {
      "name": "真空与气压单位换算",
      "description": "在帕斯卡（Pa）、毫巴（mbar）、托（Torr）、毫托（mTorr）和标准大气压（atm）间高精度换算。",
      "keywords": [
        "真空度",
        "气压换算",
        "托",
        "帕斯卡",
        "毫巴",
        "真空腔体",
        "Torr",
        "Pa"
      ]
    },
    "/tools/gas-flow-converter": {
      "name": "气体质量流量换算 (sccm / slm)",
      "description": "在标准立方厘米每分（sccm）、标准升每分（slm）、mol/s 及不同标况参考温度间换算气体流量。",
      "keywords": [
        "气体流量",
        "质量流量计",
        "MFC",
        "sccm",
        "slm",
        "标准立方厘米"
      ]
    },
    "/tools/temperature-converter": {
      "name": "温度单位换算",
      "description": "在摄氏度（°C）、开尔文（K）和华氏度（°F）之间精确互换，并提供半导体热能 kT（eV）。",
      "keywords": [
        "温度换算",
        "摄氏度",
        "开尔文",
        "热能量",
        "玻尔兹曼",
        "kT"
      ]
    },
    "/tools/lithography-resolution-calculator": {
      "name": "光刻分辨率与焦深计算器 (Rayleigh)",
      "description": "利用瑞利判据基于曝光波长 λ、数值孔径 NA 和工艺因子 k1/k2 计算理论分辨率与焦点深度（DoF）。",
      "keywords": [
        "光刻分辨率",
        "焦深",
        "DoF",
        "瑞利准则",
        "数值孔径",
        "NA",
        "k1因子",
        "曝光极限"
      ]
    },
    "/tools/etch-rate-calculator": {
      "name": "刻蚀速率与选择比计算器",
      "description": "根据刻蚀前后薄膜厚度变化与处理时间计算刻蚀速率，并计算目标层与掩膜层/下层选择比。",
      "keywords": [
        "刻蚀速率",
        "选择比",
        "刻蚀选择性",
        "等离子体刻蚀",
        "湿法刻蚀",
        "Etch Rate"
      ]
    },
    "/tools/cd-uniformity-calculator": {
      "name": "关键尺寸 (CD) 均匀性计算器",
      "description": "分析晶圆多点 CD 量测数据，计算均值、极差（Range）、标准差（3σ）及 ±3σ 均匀性百分比。",
      "keywords": [
        "关键尺寸",
        "CD均匀性",
        "线宽均匀性",
        "3西格玛",
        "极差",
        "片内均一性"
      ]
    },
    "/tools/film-stress-calculator": {
      "name": "薄膜应力计算器 (Stoney 公式)",
      "description": "基于晶圆衬底弹性模量、泊松比及沉积前后曲率半径变化由 Stoney 公式计算薄膜张/压应力。",
      "keywords": [
        "薄膜应力",
        "Stoney公式",
        "曲率半径",
        "张应力",
        "压应力",
        "晶圆弯曲",
        "翘曲"
      ]
    },
    "/tools/film-uniformity-calculator": {
      "name": "薄膜厚度均匀性计算器",
      "description": "由晶圆面内多点膜厚读数计算最大值、最小值、平均值及半极差百分比均匀度（±%）。",
      "keywords": [
        "膜厚均匀性",
        "薄膜均匀度",
        "半极差",
        "椭偏仪",
        "膜厚量测"
      ]
    },
    "/tools/diffusion-length-calculator": {
      "name": "热扩散长度计算器",
      "description": "根据半导体杂质扩散系数 D 与退火热处理时间 t 计算特征扩散长度 2√(Dt)。",
      "keywords": [
        "扩散长度",
        "扩散深度",
        "热扩散",
        "杂质退火",
        "掺杂扩散",
        "扩散时间"
      ]
    },
    "/tools/arrhenius-calculator": {
      "name": "Arrhenius 反应速率与活化能计算器",
      "description": "由指前因子与活化能 Ea 计算温度相关反应速率，或通过两点实测速率提取表观活化能。",
      "keywords": [
        "阿伦尼乌斯",
        "活化能",
        "反应速率",
        "指前因子",
        "温度依赖性",
        "Arrhenius",
        "Ea"
      ]
    },
    "/tools/thermal-oxide-calculator": {
      "name": "热氧化生长厚度计算器 (Deal-Grove)",
      "description": "利用经典 Deal-Grove 模型计算单晶硅在干氧（Dry O2）或湿氧（Wet H2O）条件下的热氧化层生长厚度。",
      "keywords": [
        "热氧化",
        "氧化层厚度",
        "Deal-Grove模型",
        "干氧氧化",
        "湿氧氧化",
        "二氧化硅生长"
      ]
    },
    "/tools/power-converter": {
      "name": "射频功率与 dBm 换算",
      "description": "在瓦特（W）、毫瓦（mW）与毫瓦分贝（dBm）之间精确换算，并提供峰峰值电压参考。",
      "keywords": [
        "射频功率",
        "dBm换算",
        "瓦特换算",
        "mW换算",
        "峰峰值电压",
        "Vpp"
      ]
    },
    "/tools/time-constant-calculator": {
      "name": "RC / RL 时间常数计算器",
      "description": "计算 RC（τ = RC）和 RL（τ = L/R）瞬态电路时间常数、上升时间与充放电响应。",
      "keywords": [
        "时间常数",
        "RC电路",
        "RL电路",
        "上升时间",
        "充放电",
        "暂态响应"
      ]
    },
    "/tools/rf-power-calculator": {
      "name": "射频功率与反射计算器",
      "description": "由前向入射功率与反向反射功率计算反射系数、负载净吸收功率及回波损耗。",
      "keywords": [
        "射频功率",
        "反射功率",
        "前向功率",
        "吸收功率",
        "反射系数",
        "RF匹配"
      ]
    },
    "/tools/return-loss-calculator": {
      "name": "回波损耗与驻波比计算器 (VSWR)",
      "description": "在回波损耗（Return Loss）、电压驻波比（VSWR）、电压反射系数（Γ）与反射功率百分比间换算。",
      "keywords": [
        "回波损耗",
        "驻波比",
        "VSWR",
        "反射系数",
        "S11",
        "阻抗匹配"
      ]
    },
    "/tools/impedance-matching-calculator": {
      "name": "L型阻抗匹配网络计算器",
      "description": "为射频等离子体发生器与负载设计低通或高通 L 型 LC 阻抗匹配网络元件参数。",
      "keywords": [
        "阻抗匹配",
        "L型匹配",
        "LC网络",
        "射频电源",
        "等离子体匹配",
        "史密斯圆图"
      ]
    },
    "/tools/microstrip-calculator": {
      "name": "微带线阻抗计算器",
      "description": "根据微带线导线宽度、介质厚度、介电常数与铜箔厚度估算特性阻抗 Z0 与有效介电常数。",
      "keywords": [
        "微带线",
        "特性阻抗",
        "Z0",
        "介电常数",
        "传输线",
        "PCB微带线"
      ]
    },
    "/tools/stub-matching-calculator": {
      "name": "单枝节阻抗匹配计算器",
      "description": "计算开路或短路单枝节微波匹配传输线的位置距离与枝节长度。",
      "keywords": [
        "单枝节",
        "短截线",
        "截线匹配",
        "开路线",
        "短路线",
        "微波匹配"
      ]
    },
    "/tools/bin-yield-calculator": {
      "name": "多Bin分选与测试良率计算器",
      "description": "分析芯片晶圆测试（CP/FT）多 Bin 分选结果，统计各 Bin 分布占比与总体良品率。",
      "keywords": [
        "Bin分选",
        "多Bin良率",
        "CP测试",
        "FT测试",
        "晶圆分选",
        "良率统计"
      ]
    },
    "/tools/fit-mtbf-calculator": {
      "name": "失效率 FIT 与平均无故障时间 MTBF",
      "description": "在 FIT（每十亿小时失效数）、失效率 λ（/小时）和平均无故障时间 MTBF 间精确换算。",
      "keywords": [
        "FIT",
        "MTBF",
        "失效率",
        "可靠性",
        "平均无故障时间",
        "失效率单位"
      ]
    },
    "/tools/yield-dppm-calculator": {
      "name": "良率与缺陷 DPPM 转换",
      "description": "在制造/封测良率百分比（%）与每百万缺陷数（DPPM / Parts Per Million）之间精确互换。",
      "keywords": [
        "DPPM",
        "百万分率",
        "良率转DPPM",
        "缺陷率",
        "PPM换算",
        "品质指标"
      ]
    },
    "/tools/weibull-life-calculator": {
      "name": "威布尔可靠性寿命分析",
      "description": "基于形状参数 β（斜率）和特征寿命 η 计算指定工作时间的可靠度 R(t)、失效率及中位寿命。",
      "keywords": [
        "威布尔分析",
        "Weibull",
        "特征寿命",
        "可靠度",
        "失效率曲线",
        "浴盆曲线"
      ]
    },
    "/tools/spc-control-chart-calculator": {
      "name": "统计过程控制 SPC 控制图计算器",
      "description": "计算 X-bar & R / S 控制图中心线与上/下控制限（UCL / LCL），并提供 Nelson 判异规则检查。",
      "keywords": [
        "SPC",
        "控制图",
        "Xbar-R",
        "控制限",
        "UCL",
        "LCL",
        "Nelson规则",
        "过程受控"
      ]
    },
    "/tools/acceptance-sampling-calculator": {
      "name": "抽样检验与接收概率计算器 (OC曲线)",
      "description": "基于二项分布或泊松分布计算抽样方案（n, c）在不同批量批不合格品率下的接收概率 Pa 及 OC 曲线。",
      "keywords": [
        "抽样检验",
        "OC曲线",
        "接收概率",
        "AQL",
        "批接收",
        "抽样方案"
      ]
    },
    "/tools/ion-implantation-calculator": {
      "name": "离子注入投影射程与峰值浓度计算器",
      "description": "根据注入能量估算杂质投影射程 Rp 与跨距 ΔRp，由注入剂量估算高斯掺杂峰值体浓度。",
      "keywords": [
        "离子注入",
        "投影射程",
        "Rp",
        "跨距",
        "注入能量",
        "注入剂量",
        "峰值浓度"
      ]
    },
    "/tools/semiconductor-depletion-calculator": {
      "name": "PN结势垒区宽度与内建电势计算器",
      "description": "由掺杂浓度 Na、Nd 与外加反偏电压计算突变 PN 结内建电势 Vbi、耗尽层宽度及势垒电容。",
      "keywords": [
        "PN结",
        "耗尽层宽度",
        "内建电势",
        "势垒电容",
        "空间电荷区",
        "反向偏压"
      ]
    },
    "/tools/cleanroom-converter": {
      "name": "洁净室等级与颗粒浓度 (ISO / FS209E)",
      "description": "在 ISO 14644-1（Class 1-9）与美联邦标准 FED-STD-209E（Class 1-100000）间换算空气洁净度颗粒上限。",
      "keywords": [
        "洁净室等级",
        "无尘室",
        "ISO 14644",
        "FS209E",
        "颗粒浓度",
        "百级无尘室",
        "千级洁净室"
      ]
    },
    "/tools/carrier-mobility-calculator": {
      "name": "载流子迁移率与漂移速度计算器",
      "description": "根据半导体中掺杂浓度（Caughey-Thomas 经验模型）估算电子与空穴低场迁移率及电场饱和漂移速度。",
      "keywords": [
        "载流子迁移率",
        "漂移速度",
        "电子迁移率",
        "空穴迁移率",
        "饱和速度",
        "Caughey Thomas"
      ]
    },
    "/tools/cmp-preston-calculator": {
      "name": "CMP 材料去除率计算器 (Preston 方程)",
      "description": "利用经典 Preston 方程由下压力 P、相对线速度 V 及 Preston 系数 kp 估算化学机械抛光材料去除速率（MRR）。",
      "keywords": [
        "CMP",
        "化学机械抛光",
        "Preston方程",
        "材料去除率",
        "MRR",
        "研磨压力"
      ]
    },
    "/tools/film-color-calculator": {
      "name": "二氧化硅与氮化硅薄膜干涉颜色查表",
      "description": "基于垂直白光干涉原理，根据热氧化硅（SiO2）和氮化硅（Si3N4）薄膜厚度查表预测晶圆表面干涉可见颜色。",
      "keywords": [
        "薄膜颜色",
        "干涉色",
        "氧化层颜色",
        "氮化硅颜色",
        "SiO2颜色",
        "膜厚颜色对照表"
      ]
    },
    "/tools/mosfet-threshold-calculator": {
      "name": "MOSFET 阈值电压计算器",
      "description": "基于栅氧厚度、衬底掺杂浓度与功函数差计算长沟道 MOS 场效应管平带电压与阈值电压 Vt。",
      "keywords": [
        "MOSFET",
        "阈值电压",
        "Vt",
        "平带电压",
        "栅氧厚度",
        "功函数差"
      ]
    },
    "/tools/thermal-fatigue-calculator": {
      "name": "焊点热疲劳寿命计算器 (Coffin-Manson)",
      "description": "基于修正 Coffin-Manson / Norris-Landzberg 模型估算半导体器件封装焊点在温度循环下的热疲劳失效循环数。",
      "keywords": [
        "热疲劳",
        "Coffin Manson",
        "Norris Landzberg",
        "焊点寿命",
        "温度循环",
        "封装可靠性"
      ]
    },
    "/tools/thermal-resistance-calculator": {
      "name": "芯片结温与热阻计算器",
      "description": "由芯片功耗与结-壳（θjc）、壳-环境（θca）热阻计算芯片工作结温 Tj 并评估散热设计裕量。",
      "keywords": [
        "芯片结温",
        "热阻",
        "Tj",
        "结温计算",
        "Theta JC",
        "散热设计",
        "热耗散"
      ]
    },
    "/tools/wire-bonding-calculator": {
      "name": "引线键合线弧与剪切力计算器",
      "description": "基于金线/铜线直径与线弧跨度几何估算键合线展开长度、金球剪切力（Ball Shear）与焊线拉力（Wire Pull）。",
      "keywords": [
        "引线键合",
        "打线",
        "线弧高度",
        "金球剪切力",
        "焊线拉力",
        "Ball Shear",
        "Wire Pull"
      ]
    },
    "/tools/chemical-dilution-calculator": {
      "name": "化学品配比稀释与湿法清洗计算器",
      "description": "RCA SC-1/SC-2、Piranha SPM、DHF 与 BOE 缓冲氢氟酸配比计算，组分质量/有效浓度百分比、C1·V1=C2·V2 稀释方程与二氧化硅刻蚀速率估算。",
      "keywords": [
        "化学配比",
        "湿法清洗",
        "稀释计算器",
        "RCA清洗",
        "SC-1",
        "SC-2",
        "皮拉尼亚",
        "SPM",
        "氢氟酸",
        "DHF",
        "BOE",
        "缓冲刻蚀液",
        "湿法槽",
        "C1V1",
        "二氧化硅腐蚀速率"
      ]
    },
    "/tools/plasma-sheath-calculator": {
      "name": "等离子体鞘层与德拜长度计算器",
      "description": "电子德拜长度（Debye Length）、玻姆声速（Bohm Velocity）、Child-Langmuir 射频偏压鞘层厚度、等离子体频率与离子碰撞无量纲参数估算。",
      "keywords": [
        "等离子体鞘层",
        "德拜长度",
        "玻姆速度",
        "玻姆判据",
        "Child Langmuir",
        "鞘层厚度",
        "等离子体频率",
        "射频偏压",
        "RIE刻蚀",
        "ICP等离子体",
        "鞘层电容",
        "平均自由程"
      ]
    },
    "/tools/ald-cycle-calculator": {
      "name": "原子层沉积 (ALD) 周期与前驱体曝光计算器",
      "description": "原子层沉积（ALD）单周期时序、朗缪尔（Langmuir）前驱体曝光饱和度（θ）、每周期生长速率（GPC）及薄膜厚度与前驱体消耗量计算。",
      "keywords": [
        "原子层沉积",
        "ALD",
        "ALD周期",
        "每周期生长速率",
        "GPC",
        "前驱体曝光",
        "朗缪尔饱和",
        "TMA",
        "氧化铝",
        "氧化铪",
        "前驱体消耗",
        "吹扫时间",
        "脉冲时间"
      ]
    },
    "/tools/dopant-diffusion-calculator": {
      "name": "杂质热扩散与结深计算器",
      "description": "恒定表面源（erfc）与有限表面源（高斯分布）硅中杂质热扩散计算、阿伦尼乌斯扩散系数 D(T)（硼 B、磷 P、砷 As、锑 Sb）、冶金结深 xj 及二氧化硅掩膜厚度估算。",
      "keywords": [
        "杂质扩散",
        "热扩散",
        "结深",
        "xj",
        "菲克定律",
        "预淀积",
        "再分布",
        "推进扩散",
        "高斯扩散",
        "erfc",
        "硼扩散",
        "磷扩散",
        "热预算",
        "氧化物掩膜"
      ]
    },
    "/tools/cvd-kinetics-calculator": {
      "name": "化学气相沉积 (CVD) 与外延动力学计算器",
      "description": "基于格罗夫（Grove）边界层传质模型与阿伦尼乌斯表面反应速率，计算 CVD/外延薄膜生长速率、机制转变温度及沿晶托前驱体耗尽均匀性。",
      "keywords": [
        "CVD",
        "化学气相沉积",
        "外延",
        "外延生长速率",
        "Grove模型",
        "边界层",
        "传质控制",
        "表面反应控制",
        "阿伦尼乌斯",
        "硅烷",
        "LPCVD",
        "TEOS"
      ]
    },
    "/tools/four-point-probe-calculator": {
      "name": "四探针电阻率与方阻计算器 (ASTM F84)",
      "description": "基于 ASTM F84 / SEMI MF84 标准的共线四探针薄层电阻、晶圆体电阻率、有限厚度几何修正系数及 NIST/Thurber 掺杂浓度反推计算器。",
      "keywords": [
        "四探针",
        "ASTM F84",
        "SEMI MF84",
        "薄层电阻",
        "方块电阻",
        "电阻率",
        "厚度修正",
        "掺杂浓度反推",
        "载流子迁移率"
      ]
    },
    "/tools/split-lot-calculator": {
      "name": "Split-Lot 实验与 DOE 配方对比计算器",
      "description": "半导体分批实验（Split-Lot）及正交试验（DOE）配方矩阵对比，晶圆级参数偏差监控、工艺响应 Delta 分析及制造流转卡导出。",
      "keywords": [
        "split lot",
        "DOE",
        "实验设计",
        "配方对比",
        "分批实验",
        "晶圆流转卡",
        "工艺偏差",
        "配方调整",
        "洁净室工单"
      ]
    },
    "/tools/curve-fitting-calculator": {
      "name": "曲线拟合与工艺参数提取计算器",
      "description": "半导体反应动力学参数提取：阿伦尼乌斯激活能 (Ea)、Deal-Grove 氧化速率常数 (B, B/A) 以及一元线性回归与 R² 拟合优度判定。",
      "keywords": [
        "曲线拟合",
        "阿伦尼乌斯拟合",
        "激活能提取",
        "Deal-Grove 参数提取",
        "线性回归",
        "参数拟合",
        "动力学参数",
        "氧化速率常数",
        "扩散激活能"
      ]
    },
    "/tools/arde-etch-calculator": {
      "name": "高深宽比刻蚀与微负载效应计算器 (ARDE)",
      "description": "深宽比相关刻蚀效应 (ARDE / RIE Lag)、图形微负载效应（Microloading）及掩膜选择比与侧壁陡直度仿真。",
      "keywords": [
        "ARDE",
        "RIE滞后",
        "微负载效应",
        "深宽比",
        "刻蚀速率",
        "选择比",
        "侧壁倾角",
        "Coburn-Winter"
      ]
    },
    "/tools/cmp-endpoint-calculator": {
      "name": "CMP 终点检测与研磨垫寿命计算器",
      "description": "化学机械平坦化电机电流终点判定、光学干涉条纹周期测厚与金刚石修整器研磨垫磨损预测。",
      "keywords": [
        "CMP",
        "终点检测",
        "研磨垫寿命",
        "光学干涉条纹",
        "修整器磨损",
        "沟槽深度",
        "平坦化"
      ]
    },
    "/tools/wafer-warp-stress-calculator": {
      "name": "晶圆弯曲、翘曲与薄膜残余应力计算器",
      "description": "基于 Stoney 方程计算薄膜残余应力、晶圆弯曲度（Bow）与翘曲度（Warp）曲率半径转换、热膨胀失配应力及薄膜开裂/剥离临界厚度。",
      "keywords": [
        "Stoney 方程",
        "晶圆弯曲",
        "晶圆翘曲",
        "薄膜应力",
        "热失配应力",
        "双轴弹性模量",
        "残余应力",
        "曲率半径"
      ]
    },
    "/tools/wet-bench-calculator": {
      "name": "湿法清洗槽寿命与加药补加计算器",
      "description": "RCA清洗（SC-1/SC-2）、SPM硫酸双氧水去胶及BOE缓冲氧化硅刻蚀槽寿命评估、化学药液定时定量补加与硅负载老化模型。",
      "keywords": [
        "湿法清洗",
        "RCA清洗",
        "SC-1",
        "SC-2",
        "SPM",
        "BOE",
        "药液补加",
        "槽寿命",
        "刻蚀槽"
      ]
    },
    "/tools/cu-plating-calculator": {
      "name": "铜互连电镀与双大马士革超充填计算器",
      "description": "铜电化学沉积 (ECD)、双大马士革沟槽超保形填充 (Superfilling)、晶圆种子层终端效应 (Terminal Effect) 与法拉第电解动力学。",
      "keywords": [
        "铜互连",
        "电镀",
        "ECD",
        "大马士革",
        "超充填",
        "法拉第定律",
        "终端效应",
        "电流密度",
        "添加剂"
      ]
    },
  },
  "zh-TW": {
    "/tools/wafer-die-calculator": {
      "name": "晶圓出芯數計算器",
      "description": "依據晶圓直徑、晶粒尺寸、切割道寬度及邊緣排除估算理論總晶粒數（Gross Die）及晶圓利用率。",
      "keywords": [
        "晶圓出芯數",
        "晶粒數",
        "切割道",
        "邊緣排除",
        "晶圓利用率",
        "Gross Die",
        "DPW"
      ]
    },
    "/tools/wafer-map-generator": {
      "name": "互動式晶圓圖生成器",
      "description": "視覺化互動式晶圓分佈圖，支援晶粒座標排布、良品統計與 CSV/JSON 匯出。",
      "keywords": [
        "晶圓圖",
        "晶片排布",
        "晶圓分佈",
        "分選統計",
        "晶圓視覺化"
      ]
    },
    "/tools/wafer-mark-calculator": {
      "name": "SEMI 晶圓標刻與校驗碼計算器",
      "description": "符合 SEMI M12 與 M13 標準的矽晶圓雷射刻字格式驗證與校驗碼計算。",
      "keywords": [
        "晶圓標刻",
        "SEMI刻字",
        "SEMI M12",
        "SEMI M13",
        "晶圓編號",
        "雷射刻字",
        "校驗碼"
      ]
    },
    "/tools/yield-calculator": {
      "name": "晶圓良率計算器",
      "description": "根據投片晶圓數、合格晶粒產出數與良品率計算晶圓製造及封裝測試綜合良率指標。",
      "keywords": [
        "良率計算",
        "晶圓良率",
        "製程良率",
        "晶粒良率",
        "成品率"
      ]
    },
    "/tools/yield-model-calculator": {
      "name": "良率模型對比計算器",
      "description": "橫向比較 Murphy、Poisson、Seeds 及 Bose-Einstein 半導體晶粒良率預測模型。",
      "keywords": [
        "良率模型",
        "墨菲模型",
        "卜瓦松模型",
        "Seeds模型",
        "缺陷密度模型"
      ]
    },
    "/tools/defect-density-calculator": {
      "name": "缺陷密度計算器",
      "description": "由晶粒面積與實測良率反推晶圓缺陷密度 D0，評估製程與潔淨室潔淨度水準。",
      "keywords": [
        "缺陷密度",
        "D0",
        "致命缺陷",
        "良率損失",
        "潔淨度"
      ]
    },
    "/tools/die-cost-calculator": {
      "name": "晶片製造單位成本計算器",
      "description": "依據晶圓代工成本、晶圓出晶數、製程良率與封測費用計算單顆晶片淨成本。",
      "keywords": [
        "晶片成本",
        "晶圓成本",
        "單顆成本",
        "製造成本",
        "封測成本"
      ]
    },
    "/tools/process-capability-calculator": {
      "name": "製程能力指數計算器 (Cp / Cpk)",
      "description": "依據規格上下限 USL/LSL 與樣本平均值、標準差計算製程能力指標 Cp、Cpk、Pp、Ppk。",
      "keywords": [
        "製程能力",
        "Cp",
        "Cpk",
        "Pp",
        "Ppk",
        "六標準差",
        "品質管制"
      ]
    },
    "/tools/yield-confidence-calculator": {
      "name": "良率信賴區間計算器",
      "description": "根據少量樣本測試數據計算 Wilson 或 Clopper-Pearson 良率信賴區間。",
      "keywords": [
        "信賴區間",
        "良率區間",
        "Wilson得分",
        "Clopper Pearson",
        "抽樣檢驗"
      ]
    },
    "/tools/throughput-calculator": {
      "name": "機台產能與節拍計算器 (WPH)",
      "description": "根據製程耗時、機械手臂搬運延遲與批次量計算機台 WPH（每小時晶圓處理數）。",
      "keywords": [
        "機台產能",
        "WPH",
        "每小時晶圓數",
        "生產節拍",
        "週期時間"
      ]
    },
    "/tools/sheet-resistance-calculator": {
      "name": "四探針薄層電阻與電阻率計算器",
      "description": "由四探針電壓電流讀數、探針間距、薄膜厚度及修正因子計算方阻 Rs 與電阻率。",
      "keywords": [
        "薄層電阻",
        "方塊電阻",
        "四探針",
        "電阻率",
        "Rs"
      ]
    },
    "/tools/wafer-area-calculator": {
      "name": "晶圓有效面積與邊緣去除計算器",
      "description": "計算包含平邊或凹槽（Notch）的晶圓總面積，及扣除邊緣排除區後的有效利用面積。",
      "keywords": [
        "晶圓面積",
        "邊緣排除",
        "有效面積",
        "平邊",
        "凹槽",
        "Edge Exclusion"
      ]
    },
    "/tools/reticle-field-calculator": {
      "name": "光罩曝光視場計算器",
      "description": "計算步進/掃描式曝光機視場範圍內可容納之晶粒陣列排列列數與行數。",
      "keywords": [
        "光罩視場",
        "曝光視場",
        "步進曝光機",
        "Reticle Field"
      ]
    },
    "/tools/thickness-converter": {
      "name": "薄膜厚度單位換算",
      "description": "精準轉換埃（Å）、奈米（nm）、微米（µm）、密耳（mil）與毫米（mm）薄膜厚度單位。",
      "keywords": [
        "薄膜厚度",
        "厚度換算",
        "奈米",
        "微米",
        "埃",
        "單位轉換"
      ]
    },
    "/tools/pressure-converter": {
      "name": "真空與氣壓單位換算",
      "description": "精準轉換帕斯卡（Pa）、毫巴（mbar）、托（Torr）、毫托（mTorr）及標準大氣壓（atm）。",
      "keywords": [
        "真空度",
        "氣壓換算",
        "托",
        "帕斯卡",
        "毫巴",
        "Torr",
        "Pa"
      ]
    },
    "/tools/gas-flow-converter": {
      "name": "氣體質量流量換算 (sccm / slm)",
      "description": "在 sccm、slm、mol/s 及不同標準狀態參考溫度間精確換算氣體流量。",
      "keywords": [
        "氣體流量",
        "流量控制器",
        "MFC",
        "sccm",
        "slm"
      ]
    },
    "/tools/temperature-converter": {
      "name": "溫度單位換算",
      "description": "精準轉換攝氏（°C）、熱力學溫標（K）與華氏（°F），並提供熱能量 kT（eV）。",
      "keywords": [
        "溫度換算",
        "攝氏",
        "絕對溫度",
        "熱能量",
        "kT"
      ]
    },
    "/tools/lithography-resolution-calculator": {
      "name": "微影解析度與焦深計算器 (Rayleigh)",
      "description": "依據瑞利準則根據波長 λ、數值孔徑 NA 及製程因子 k1/k2 計算解析度與焦點深度 DoF。",
      "keywords": [
        "微影解析度",
        "焦深",
        "DoF",
        "瑞利準則",
        "數值孔徑",
        "NA"
      ]
    },
    "/tools/etch-rate-calculator": {
      "name": "蝕刻速率與選擇比計算器",
      "description": "根據蝕刻前後薄膜厚度變化與製程時間計算蝕刻速率，並評估對光阻及下層之選擇比。",
      "keywords": [
        "蝕刻速率",
        "選擇比",
        "電漿蝕刻",
        "濕法蝕刻",
        "Etch Rate"
      ]
    },
    "/tools/cd-uniformity-calculator": {
      "name": "關鍵尺寸 (CD) 均勻性計算器",
      "description": "分析晶圓多點關鍵尺寸量測數據，計算平均值、全距、標準差（3σ）及均勻度百分比。",
      "keywords": [
        "關鍵尺寸",
        "CD均勻性",
        "線寬",
        "3標準差",
        "片內均勻度"
      ]
    },
    "/tools/film-stress-calculator": {
      "name": "薄膜應力計算器 (Stoney 公式)",
      "description": "利用 Stoney 公式依據基板彈性模數、帕松比與沉積前後曲率半徑變化計算張應力或壓應力。",
      "keywords": [
        "薄膜應力",
        "Stoney公式",
        "曲率半徑",
        "張應力",
        "壓應力",
        "翹曲"
      ]
    },
    "/tools/film-uniformity-calculator": {
      "name": "薄膜厚度均勻性計算器",
      "description": "由晶圓面內多點膜厚量測值計算最大值、最小值、平均值與半極差百分比均勻度（±%）。",
      "keywords": [
        "膜厚均勻性",
        "均勻度",
        "橢偏儀",
        "膜厚量測"
      ]
    },
    "/tools/diffusion-length-calculator": {
      "name": "熱擴散長度計算器",
      "description": "根據雜質擴散係數 D 與退火熱處理時間 t 計算特徵擴散長度 2√(Dt)。",
      "keywords": [
        "熱擴散",
        "擴散長度",
        "熱處理",
        "退火",
        "雜質擴散"
      ]
    },
    "/tools/arrhenius-calculator": {
      "name": "Arrhenius 反應速率與活化能計算器",
      "description": "利用阿基尼斯方程式計算溫度反應速率，或由兩組實測速率數據提取活化能 Ea。",
      "keywords": [
        "阿基尼斯",
        "活化能",
        "反應速率",
        "溫度依存性",
        "Ea"
      ]
    },
    "/tools/thermal-oxide-calculator": {
      "name": "熱氧化層生長厚度計算器 (Deal-Grove)",
      "description": "利用 Deal-Grove 模型計算矽晶圓在乾氧或濕氧條件下的熱氧化層厚度與生長耗時。",
      "keywords": [
        "熱氧化",
        "Deal-Grove模型",
        "乾氧氧化",
        "濕氧氧化",
        "氧化膜"
      ]
    },
    "/tools/power-converter": {
      "name": "射頻功率與 dBm 換算",
      "description": "在瓦特（W）、毫瓦（mW）與分貝毫瓦（dBm）間精確轉換，並提供峰對峰電壓。",
      "keywords": [
        "射頻功率",
        "dBm換算",
        "瓦特",
        "峰對峰電壓",
        "Vpp"
      ]
    },
    "/tools/time-constant-calculator": {
      "name": "RC / RL 時間常數計算器",
      "description": "計算 RC 及 RL 電路之時間常數 τ、10%-90% 上升時間與充放電暫態曲線。",
      "keywords": [
        "時間常數",
        "RC電路",
        "RL電路",
        "暫態響應",
        "上升時間"
      ]
    },
    "/tools/rf-power-calculator": {
      "name": "射頻功率與反射損耗計算器",
      "description": "由前向功率與反射功率計算反射係數 Γ、負載吸收功率與回波損耗 dB。",
      "keywords": [
        "射頻功率",
        "反射功率",
        "前向功率",
        "吸收功率",
        "反射係數"
      ]
    },
    "/tools/return-loss-calculator": {
      "name": "回波損耗與電壓駐波比計算器 (VSWR)",
      "description": "在回波損耗（RL）、駐波比（VSWR）、反射係數（Γ）與反射功率百分比間相互轉換。",
      "keywords": [
        "回波損耗",
        "駐波比",
        "VSWR",
        "反射係數",
        "阻抗匹配"
      ]
    },
    "/tools/impedance-matching-calculator": {
      "name": "L型阻抗匹配網路計算器",
      "description": "為半導體電漿射頻負載設計低通/高通 L 型 LC 阻抗匹配電路之電容與電感值。",
      "keywords": [
        "阻抗匹配",
        "L型匹配",
        "電漿負載",
        "史密斯圖"
      ]
    },
    "/tools/microstrip-calculator": {
      "name": "微帶線特性阻抗計算器",
      "description": "依據微帶線走線寬度、介電層厚度、介電常數及銅厚計算特性阻抗 Z0 與有效介電常數。",
      "keywords": [
        "微帶線",
        "特性阻抗",
        "Z0",
        "介電常數",
        "傳輸線"
      ]
    },
    "/tools/stub-matching-calculator": {
      "name": "單截線阻抗匹配計算器",
      "description": "計算開路或短路傳輸線單截線匹配之安裝位置與截線長度。",
      "keywords": [
        "單截線",
        "截線匹配",
        "短截線",
        "傳輸線匹配"
      ]
    },
    "/tools/bin-yield-calculator": {
      "name": "多Bin分選與晶粒測試良率計算器",
      "description": "分析晶圓針測（CP/FT）多 Bin 分選計數，統計各 Bin 分布佔比與通過良品率。",
      "keywords": [
        "Bin分選",
        "CP測試",
        "FT測試",
        "分選良率"
      ]
    },
    "/tools/fit-mtbf-calculator": {
      "name": "失效率 FIT 與平均故障間隔 MTBF",
      "description": "在 FIT（十億小時失效率）、失效率 λ（小時）與平均無故障時間 MTBF 間精準換算。",
      "keywords": [
        "FIT",
        "MTBF",
        "失效率",
        "可靠度",
        "平均無故障時間"
      ]
    },
    "/tools/yield-dppm-calculator": {
      "name": "良率與缺陷 DPPM 轉換",
      "description": "在良品率百分比（%）與百萬分率缺陷數（DPPM）之間精準雙向換算。",
      "keywords": [
        "DPPM",
        "百萬分率",
        "良率轉DPPM",
        "品質水準"
      ]
    },
    "/tools/weibull-life-calculator": {
      "name": "韋伯可靠度壽命分析",
      "description": "依據形狀參數 β 與特徵壽命 η 計算指定工作時間之可靠度 R(t)、累積失效率與 MTTF。",
      "keywords": [
        "韋伯分析",
        "Weibull",
        "特徵壽命",
        "可靠度分析"
      ]
    },
    "/tools/spc-control-chart-calculator": {
      "name": "統計製程管制 SPC 管制圖計算器",
      "description": "計算 X-bar & R / S 計量型管制圖之中心線及管制界限（UCL / LCL），支援 Nelson 規則判異。",
      "keywords": [
        "SPC",
        "管制圖",
        "Xbar-R",
        "管制界限",
        "UCL",
        "LCL"
      ]
    },
    "/tools/acceptance-sampling-calculator": {
      "name": "抽樣檢驗與接收機率計算器 (OC曲線)",
      "description": "依據二項分佈或卜瓦松分佈計算計數型抽樣計畫（n, c）之允收機率 Pa 與抽樣特性曲線。",
      "keywords": [
        "抽樣檢驗",
        "OC曲線",
        "允收機率",
        "AQL"
      ]
    },
    "/tools/ion-implantation-calculator": {
      "name": "離子植入投影射程與峰值濃度計算器",
      "description": "依據離子植入能量計算投影射程 Rp 與離散跨距 ΔRp，由劑量計算高斯峰值摻雜濃度。",
      "keywords": [
        "離子植入",
        "投影射程",
        "Rp",
        "跨距",
        "高斯分佈"
      ]
    },
    "/tools/semiconductor-depletion-calculator": {
      "name": "PN接面空乏區寬度與內建電位計算器",
      "description": "由摻雜濃度與外加逆偏電壓計算階梯式 PN 接面之內建電位 Vbi、空乏層寬度及接面電容。",
      "keywords": [
        "PN接面",
        "空乏層寬度",
        "內建電位",
        "逆向偏壓"
      ]
    },
    "/tools/cleanroom-converter": {
      "name": "無塵室等級與微粒濃度 (ISO / FS209E)",
      "description": "在 ISO 14644-1（Class 1-9）與美國聯邦標準 FS209E 間對照換算各粒徑懸浮微粒濃度上限。",
      "keywords": [
        "無塵室等級",
        "潔淨室",
        "ISO 14644",
        "FS209E",
        "微粒濃度"
      ]
    },
    "/tools/carrier-mobility-calculator": {
      "name": "載子遷移率與漂移速度計算器",
      "description": "利用 Caughey-Thomas 模型依據摻雜濃度計算矽中電子與電洞遷移率及高電場飽和漂移速度。",
      "keywords": [
        "載子遷移率",
        "漂移速度",
        "電子遷移率",
        "電洞遷移率"
      ]
    },
    "/tools/cmp-preston-calculator": {
      "name": "CMP 材料去除率計算器 (Preston 方程)",
      "description": "利用 Preston 方程式依據研磨下壓力 P、相對速度 V 與 Preston 係數估算化學機械研磨去除速率。",
      "keywords": [
        "CMP",
        "化學機械研磨",
        "Preston方程式",
        "去除速率"
      ]
    },
    "/tools/film-color-calculator": {
      "name": "二氧化矽與氮化矽薄膜干涉顏色查表",
      "description": "依據薄膜光學干涉原理，由 SiO2 與 Si3N4 膜厚查表快速預測矽晶圓表面反射之可見干涉色彩。",
      "keywords": [
        "薄膜顏色",
        "干涉色",
        "氧化層顏色",
        "SiO2顏色對照表"
      ]
    },
    "/tools/mosfet-threshold-calculator": {
      "name": "MOSFET 臨界電壓計算器",
      "description": "根據閘極氧化層厚度、基板摻雜濃度與功函數差計算長通道 MOSFET 平帶電壓與臨界電壓 Vt。",
      "keywords": [
        "MOSFET",
        "臨界電壓",
        "Vt",
        "閘極氧化層"
      ]
    },
    "/tools/thermal-fatigue-calculator": {
      "name": "銲點熱疲勞壽命計算器 (Coffin-Manson)",
      "description": "利用修正 Coffin-Manson / Norris-Landzberg 模型估算封裝銲點在溫度循環應力下之抗疲勞壽命圈數。",
      "keywords": [
        "熱疲勞",
        "Coffin Manson",
        "銲點壽命",
        "溫度循環"
      ]
    },
    "/tools/thermal-resistance-calculator": {
      "name": "晶片接面溫度與熱阻計算器",
      "description": "依據晶片功耗與接面至外殼（θjc）、外殼至環境（θca）熱阻計算工作結溫 Tj 與散熱安全餘量。",
      "keywords": [
        "接面溫度",
        "熱阻",
        "Tj",
        "結溫計算",
        "散熱設計"
      ]
    },
    "/tools/wire-bonding-calculator": {
      "name": "打線接合弧高與剪切拉力計算器",
      "description": "依據鍵合引線直徑與跨距幾何估算金線展開長度、金球推力（Ball Shear）與打線拉力（Wire Pull）規格。",
      "keywords": [
        "打線接合",
        "引線鍵合",
        "金球推力",
        "打線拉力"
      ]
    },
    "/tools/chemical-dilution-calculator": {
      "name": "化學品配比稀釋與濕法清洗計算器",
      "description": "RCA SC-1/SC-2、Piranha SPM、DHF 與 BOE 緩衝氫氟酸配比計算，組分質量/有效重量百分比、C1·V1=C2·V2 稀釋方程與二氧化矽蝕刻速率估算。",
      "keywords": [
        "化學配比",
        "濕法清洗",
        "稀釋計算器",
        "RCA清洗",
        "SC-1",
        "SC-2",
        "皮拉尼亞",
        "SPM",
        "氫氟酸",
        "DHF",
        "BOE",
        "緩衝蝕刻液",
        "濕法槽",
        "C1V1",
        "蝕刻速率"
      ]
    },
    "/tools/plasma-sheath-calculator": {
      "name": "電漿鞘層與德拜長度計算器",
      "description": "電子德拜長度（Debye Length）、玻姆聲速（Bohm Velocity）、Child-Langmuir 射頻偏壓鞘層厚度、電漿頻率與離子碰撞無因次參數估算。",
      "keywords": [
        "電漿鞘層",
        "德拜長度",
        "玻姆速度",
        "玻姆準則",
        "Child Langmuir",
        "鞘層厚度",
        "電漿頻率",
        "射頻偏壓",
        "RIE蝕刻",
        "ICP電漿",
        "鞘層電容",
        "平均自由徑"
      ]
    },
    "/tools/ald-cycle-calculator": {
      "name": "原子層沉積 (ALD) 週期與前驅物曝光計算器",
      "description": "原子層沉積（ALD）單週期時序、朗繆爾（Langmuir）前驅物曝光飽和度（θ）、每週期生長速率（GPC）及薄膜厚度與前驅物消耗量計算。",
      "keywords": [
        "原子層沉積",
        "ALD",
        "ALD週期",
        "每週期生長速率",
        "GPC",
        "前驅物曝光",
        "朗繆爾飽和",
        "TMA",
        "氧化鋁",
        "氧化鉿",
        "前驅物消耗",
        "吹掃時間",
        "脈衝時間"
      ]
    },
    "/tools/dopant-diffusion-calculator": {
      "name": "雜質熱擴散與接面深度計算器",
      "description": "恆定表面源（erfc）與有限表面源（高斯分佈）矽中雜質熱擴散計算、阿基尼斯擴散係數 D(T)（硼 B、磷 P、砷 As、銻 Sb）、冶金接面深度 xj 及二氧化矽遮罩厚度估算。",
      "keywords": [
        "雜質擴散",
        "熱擴散",
        "接面深度",
        "xj",
        "菲克定律",
        "預沉積",
        "再分佈",
        "推進擴散",
        "高斯擴散",
        "erfc",
        "硼擴散",
        "磷擴散",
        "熱預算",
        "氧化層遮罩"
      ]
    },
    "/tools/cvd-kinetics-calculator": {
      "name": "化學氣相沉積 (CVD) 與磊晶動力學計算器",
      "description": "依據格羅夫（Grove）邊界層傳質模型與阿基尼斯表面反應速率，計算 CVD/磊晶薄膜生長速率、機制轉變溫度及沿晶托前驅物消耗均勻性。",
      "keywords": [
        "CVD",
        "化學氣相沉積",
        "磊晶",
        "磊晶生長速率",
        "Grove模型",
        "邊界層",
        "傳質控制",
        "表面反應控制",
        "阿基尼斯",
        "矽烷",
        "LPCVD",
        "TEOS"
      ]
    },
    "/tools/four-point-probe-calculator": {
      "name": "四探針電阻率與方阻計算器 (ASTM F84)",
      "description": "基於 ASTM F84 / SEMI MF84 標準的共線四探針薄層電阻、晶圓體電阻率、有限厚度幾何修正係數及 NIST/Thurber 摻雜濃度反推計算器。",
      "keywords": [
        "四探針",
        "ASTM F84",
        "SEMI MF84",
        "薄層電阻",
        "方塊電阻",
        "電阻率",
        "厚度修正",
        "摻雜濃度反推",
        "載流子遷移率"
      ]
    },
    "/tools/split-lot-calculator": {
      "name": "Split-Lot 實驗與 DOE 配方對比計算器",
      "description": "半導體分批實驗（Split-Lot）及正交試驗（DOE）配方矩陣對比，晶圓級參數偏差監控、工藝響應 Delta 分析及製造流轉卡導出。",
      "keywords": [
        "split lot",
        "DOE",
        "實驗設計",
        "配方對比",
        "分批實驗",
        "晶圓流轉卡",
        "工藝偏差",
        "配方微調",
        "無塵室工單"
      ]
    },
    "/tools/curve-fitting-calculator": {
      "name": "曲線擬合與工藝參數提取計算器",
      "description": "半導體反應動力學參數提取：阿倫尼烏斯活化能 (Ea)、Deal-Grove 氧化速率常數 (B, B/A) 以及一元線性迴歸與 R² 擬合優度判定。",
      "keywords": [
        "曲線擬合",
        "阿倫尼烏斯擬合",
        "活化能提取",
        "Deal-Grove 參數提取",
        "線性迴歸",
        "參數擬合",
        "動力學參數",
        "氧化速率常數",
        "擴散活化能"
      ]
    },
    "/tools/arde-etch-calculator": {
      "name": "高深寬比蝕刻與微負載效應計算器 (ARDE)",
      "description": "深寬比相關蝕刻效應 (ARDE / RIE Lag)、圖形微負載效應（Microloading）及光阻選擇比與側壁傾角模擬。",
      "keywords": [
        "ARDE",
        "RIE滯後",
        "微負載效應",
        "深寬比",
        "蝕刻速率",
        "選擇比",
        "側壁傾角",
        "Coburn-Winter"
      ]
    },
    "/tools/cmp-endpoint-calculator": {
      "name": "CMP 終點檢測與研磨墊壽命計算器",
      "description": "化學機械平坦化馬達電流終點判定、光學干涉條紋週期測厚與鑽石修整盤研磨墊損耗預測。",
      "keywords": [
        "CMP",
        "終點檢測",
        "研磨墊壽命",
        "光學干涉條紋",
        "修整器磨損",
        "溝槽深度",
        "平坦化"
      ]
    },
    "/tools/wafer-warp-stress-calculator": {
      "name": "晶圓彎曲、翹曲與薄膜殘餘應力計算器",
      "description": "基於 Stoney 方程式計算薄膜殘餘應力、晶圓彎曲度（Bow）與翹曲度（Warp）曲率半徑轉換、熱膨脹失配應力及薄膜裂紋/剝離臨界厚度。",
      "keywords": [
        "Stoney 方程式",
        "晶圓彎曲",
        "晶圓翹曲",
        "薄膜應力",
        "熱失配應力",
        "雙軸彈性模量",
        "殘餘應力",
        "曲率半徑"
      ]
    },
    "/tools/wet-bench-calculator": {
      "name": "濕法清洗槽壽命與加藥補充計算器",
      "description": "RCA清洗（SC-1/SC-2）、SPM硫酸雙氧水去阻劑及BOE緩衝氧化矽蝕刻槽壽命評估、化學藥液定時定量補加與矽負載老化模型。",
      "keywords": [
        "濕法清洗",
        "RCA清洗",
        "SC-1",
        "SC-2",
        "SPM",
        "BOE",
        "藥液補充",
        "槽壽命",
        "蝕刻槽"
      ]
    },
    "/tools/cu-plating-calculator": {
      "name": "銅互連電鍍與雙大馬士革超充填計算器",
      "description": "銅電化學沉積 (ECD)、雙大馬士革溝槽超保形填充 (Superfilling)、晶圓種子層終端效應 (Terminal Effect) 與法拉第電解動力學。",
      "keywords": [
        "銅互連",
        "電鍍",
        "ECD",
        "大馬士革",
        "超充填",
        "法拉第定律",
        "終端效應",
        "電流密度",
        "添加劑"
      ]
    },
  },
  "ja": {
    "/tools/wafer-die-calculator": {
      "name": "ウェーハダイ取得数計算ツール",
      "description": "ウェーハ径、ダイサイズ、スクライブライン幅、エッジ除外から総ダイ数（Gross Die）と面積利用率を算出。",
      "keywords": [
        "ウェーハ",
        "ダイ取得数",
        "チップ数",
        "スクライブライン",
        "エッジ除外",
        "Gross Die"
      ]
    },
    "/tools/wafer-map-generator": {
      "name": "対話型ウェーハマップ生成ツール",
      "description": "ダイ配置、良品・不良品統計、CSV/JSONエクスポートに対応した視覚的ウェーハマップ。",
      "keywords": [
        "ウェーハマップ",
        "ダイマップ",
        "ウェーハ図",
        "ビニング",
        "可視化"
      ]
    },
    "/tools/wafer-mark-calculator": {
      "name": "SEMI規格ウェーハ刻印チェッカー",
      "description": "SEMI M12/M13規格に準拠したウェーハレーザーマーキングのフォーマット生成とチェックサム検証。",
      "keywords": [
        "SEMI刻印",
        "SEMI M12",
        "SEMI M13",
        "ウェーハID",
        "チェックサム",
        "レーザーマーク"
      ]
    },
    "/tools/yield-calculator": {
      "name": "ウェーハ歩留まり計算ツール",
      "description": "投入ウェーハ数、良品ダイ数からウェーハ処理およびパッケージング歩留まり指標を算出。",
      "keywords": [
        "歩留まり",
        "歩留まり計算",
        "ウェーハ歩留まり",
        "良品率"
      ]
    },
    "/tools/yield-model-calculator": {
      "name": "歩留まり予測モデル比較ツール",
      "description": "Murphy、Poisson、Seeds、Bose-Einsteinモデルによる欠陥密度からの歩留まり予測比較。",
      "keywords": [
        "歩留まりモデル",
        "ポアソンモデル",
        "マーフィーモデル",
        "欠陥密度モデル"
      ]
    },
    "/tools/defect-density-calculator": {
      "name": "欠陥密度計算ツール (D0)",
      "description": "ダイ面積と実測歩留まりからウェーハ欠陥密度（D0）を逆算し、プロセス品質を評価。",
      "keywords": [
        "欠陥密度",
        "D0",
        "キラー欠陥",
        "歩留まり低下",
        "クリーン度"
      ]
    },
    "/tools/die-cost-calculator": {
      "name": "チップ製造原価計算ツール",
      "description": "ウェーハコスト、取得ダイ数、ライン歩留まり、パッケージング費用からチップ1個の正味原価を算出。",
      "keywords": [
        "チップ原価",
        "ウェーハコスト",
        "製造原価",
        "チップコスト"
      ]
    },
    "/tools/process-capability-calculator": {
      "name": "工程能力指数計算ツール (Cp / Cpk)",
      "description": "規格限界（USL/LSL）と平均値・標準偏差から工程能力指数 Cp、Cpk、Pp、Ppk を算出。",
      "keywords": [
        "工程能力",
        "Cp",
        "Cpk",
        "Pp",
        "Ppk",
        "品質管理",
        "SPC"
      ]
    },
    "/tools/yield-confidence-calculator": {
      "name": "歩留まり信頼区間計算ツール",
      "description": "サンプリング試験データから Wilson または Clopper-Pearson 歩留まり信頼区間を推定。",
      "keywords": [
        "信頼区間",
        "歩留まり信頼区間",
        "サンプルサイズ",
        "ウィルソン法"
      ]
    },
    "/tools/throughput-calculator": {
      "name": "装置スループット計算ツール (WPH)",
      "description": "プロセス時間、搬送オーバーヘッド、カセットサイズから装置 WPH（枚/時）を計算。",
      "keywords": [
        "スループット",
        "WPH",
        "時間あたりウェーハ数",
        "タクトタイム",
        "装置能力"
      ]
    },
    "/tools/sheet-resistance-calculator": {
      "name": "四探針シート抵抗・抵抗率計算ツール",
      "description": "四探針法測定電圧・電流、探針間隔、膜厚、幾何補正係数からシート抵抗と体積抵抗率を算出。",
      "keywords": [
        "シート抵抗",
        "四探針",
        "抵抗率",
        "面抵抗",
        "Rs"
      ]
    },
    "/tools/wafer-area-calculator": {
      "name": "ウェーハ有効面積・エッジ除外計算ツール",
      "description": "オリフラ・ノッチを含むウェーハ全面積と、エッジ除外（Edge Exclusion）後の有効面積を計算。",
      "keywords": [
        "ウェーハ面積",
        "エッジ除外",
        "有効面積",
        "オリフラ",
        "ノッチ"
      ]
    },
    "/tools/reticle-field-calculator": {
      "name": "レチクル露光フィールド計算ツール",
      "description": "ステッパー／スキャナーの最大露光ショット内に配置可能なダイ配列数と面積効率を計算。",
      "keywords": [
        "レチクル",
        "露光フィールド",
        "ステッパー",
        "スキャナー",
        "ショット"
      ]
    },
    "/tools/thickness-converter": {
      "name": "薄膜膜厚単位換算ツール",
      "description": "オングストローム（Å）、nm、µm、mil、mm 間の薄膜膜厚を即座に相互変換。",
      "keywords": [
        "膜厚換算",
        "オングストローム",
        "ナノメートル",
        "マイクロメートル",
        "単位変換"
      ]
    },
    "/tools/pressure-converter": {
      "name": "真空度・圧力単位換算ツール",
      "description": "パスカル（Pa）、mbar、Torr、mTorr、気圧（atm）の高精度真空・プロセス圧力換算。",
      "keywords": [
        "真空度",
        "圧力換算",
        "パスカル",
        "トール",
        "Torr",
        "Pa"
      ]
    },
    "/tools/gas-flow-converter": {
      "name": "ガス流量換算ツール (sccm / slm)",
      "description": "sccm、slm、mol/s および基準温度（0℃/20℃/25℃）間のガス質量流量を高精度換算。",
      "keywords": [
        "ガス流量",
        "マスフロー",
        "MFC",
        "sccm",
        "slm"
      ]
    },
    "/tools/temperature-converter": {
      "name": "温度単位換算ツール",
      "description": "摂氏（°C）、ケルビン（K）、華氏（°F）間の換算と半導体熱エネルギー kT（eV）の算出。",
      "keywords": [
        "温度換算",
        "摂氏",
        "ケルビン",
        "熱エネルギー",
        "kT"
      ]
    },
    "/tools/lithography-resolution-calculator": {
      "name": "露光解像度・焦点深度計算ツール (レイリー基準)",
      "description": "レイリーの式に基づき、露光波長 λ、NA、プロセス係数 k1/k2 から限界解像度と焦点深度（DoF）を計算。",
      "keywords": [
        "露光解像度",
        "焦点深度",
        "DoF",
        "レイリーの式",
        "開口数",
        "NA"
      ]
    },
    "/tools/etch-rate-calculator": {
      "name": "エッチングレート・選択比計算ツール",
      "description": "エッチング前後の膜厚差と処理時間からエッチング速度を求め、下地やマスクに対する選択比を算出。",
      "keywords": [
        "エッチングレート",
        "選択比",
        "ドライエッチング",
        "ウェットエッチング"
      ]
    },
    "/tools/cd-uniformity-calculator": {
      "name": "CD（線幅）均一性計算ツール",
      "description": "ウェーハ面内マルチポイントCD測定値から、平均値、レンジ、3σ、均一性（%）を算出。",
      "keywords": [
        "CD均一性",
        "線幅均一性",
        "3シグマ",
        "面内ばらつき"
      ]
    },
    "/tools/film-stress-calculator": {
      "name": "薄膜応力計算ツール (Stoneyの式)",
      "description": "Stoneyの式に基づき、成膜前後のウェーハ曲率半径変化から薄膜内部応力（引張/圧縮）を算出。",
      "keywords": [
        "薄膜応力",
        "Stoneyの式",
        "曲率半径",
        "反り",
        "ウェーハボウ"
      ]
    },
    "/tools/film-uniformity-calculator": {
      "name": "膜厚均一性計算ツール",
      "description": "面内多点膜厚測定データから、Max、Min、平均値、ハーフレンジ均一性（±%）を算出。",
      "keywords": [
        "膜厚均一性",
        "面内均一性",
        "ハーフレンジ",
        "エリプソメトリー"
      ]
    },
    "/tools/diffusion-length-calculator": {
      "name": "熱拡散長計算ツール (2√Dt)",
      "description": "不純物拡散係数 D と熱処理アニール時間 t から特性拡散長 2√(Dt) を算出。",
      "keywords": [
        "拡散長",
        "不純物拡散",
        "熱処理",
        "アニール",
        "2√Dt"
      ]
    },
    "/tools/arrhenius-calculator": {
      "name": "アレニウス反応速度・活性化エネルギー計算ツール",
      "description": "頻度因子と活性化エネルギー Ea から反応速度を算出、または2点の測定値から Ea を抽出。",
      "keywords": [
        "アレニウス",
        "活性化エネルギー",
        "Ea",
        "反応速度",
        "温度依存性"
      ]
    },
    "/tools/thermal-oxide-calculator": {
      "name": "熱酸化膜成長シミュレーター (Deal-Groveモデル)",
      "description": "Deal-Groveモデルに基づき、ドライ酸化およびウェット酸化条件下でのシリコン酸化膜成長膜厚を算出。",
      "keywords": [
        "熱酸化",
        "Deal-Groveモデル",
        "ドライ酸化",
        "ウェット酸化",
        "酸化膜厚"
      ]
    },
    "/tools/power-converter": {
      "name": "RF電力・dBm換算ツール",
      "description": "ワット（W）、ミリワット（mW）、dBm 間の高周波電力換算とピーク間電圧換算。",
      "keywords": [
        "RF電力",
        "dBm換算",
        "ワット",
        "高周波",
        "Vpp"
      ]
    },
    "/tools/time-constant-calculator": {
      "name": "RC / RL 時定数計算ツール",
      "description": "RC回路およびRL回路の時定数 τ、立ち上がり時間（10%-90%）、過渡応答電圧を計算。",
      "keywords": [
        "時定数",
        "RC回路",
        "RL回路",
        "過渡応答",
        "立ち上がり時間"
      ]
    },
    "/tools/rf-power-calculator": {
      "name": "RF反射電力・透過電力計算ツール",
      "description": "進行波電力と反射波電力から、反射係数、負荷吸収実効電力、リターンロスを算出。",
      "keywords": [
        "高周波電力",
        "反射電力",
        "進行波",
        "負荷吸収電力",
        "反射係数"
      ]
    },
    "/tools/return-loss-calculator": {
      "name": "リターンロス・VSWR換算ツール",
      "description": "リターンロス（dB）、電圧定在波比（VSWR）、反射係数（Γ）、反射電力（%）を相互変換。",
      "keywords": [
        "リターンロス",
        "VSWR",
        "定在波比",
        "反射係数",
        "S11"
      ]
    },
    "/tools/impedance-matching-calculator": {
      "name": "L型インピーダンス整合回路計算ツール",
      "description": "RFプラズマ電源と負荷間のインピーダンスマッチングを行うローパス/ハイパスLセクションLC回路定数を設計。",
      "keywords": [
        "インピーダンス整合",
        "マッチャー",
        "L型整合",
        "プラズマ負荷"
      ]
    },
    "/tools/microstrip-calculator": {
      "name": "マイクロストリップ線路インピーダンス計算ツール",
      "description": "パターン線幅、誘電体厚、比誘電率、銅厚からマイクロストリップラインの特性インピーダンス Z0 を算出。",
      "keywords": [
        "マイクロストリップ",
        "特性インピーダンス",
        "Z0",
        "伝送線路"
      ]
    },
    "/tools/stub-matching-calculator": {
      "name": "シングルスタブ整合計算ツール",
      "description": "オープン/ショートスタブを用いた高周波伝送線路のスタブ位置距離とスタブ長を算出。",
      "keywords": [
        "スタブ整合",
        "シングルスタブ",
        "高周波整合",
        "伝送線路"
      ]
    },
    "/tools/bin-yield-calculator": {
      "name": "マルチビン歩留まり分類集計ツール",
      "description": "ウェーハプロービング（CP/FT）のBin分類テストデータから、各Bin比率と良品率を自動集計。",
      "keywords": [
        "Bin分類",
        "歩留まり集計",
        "プロービング",
        "ウェーハテスト"
      ]
    },
    "/tools/fit-mtbf-calculator": {
      "name": "FIT・MTBF信頼性換算ツール",
      "description": "FIT（10^9時間あたりの故障数）、故障率 λ、平均故障間隔 MTBF 間の高精度換算。",
      "keywords": [
        "FIT",
        "MTBF",
        "故障率",
        "信頼性工学",
        "寿命計算"
      ]
    },
    "/tools/yield-dppm-calculator": {
      "name": "歩留まり・不良率 DPPM 換算ツール",
      "description": "歩留まり率（%）と百万分率不良数（DPPM: Defect Parts Per Million）を相互換算。",
      "keywords": [
        "DPPM",
        "不良率",
        "PPM換算",
        "品質管理"
      ]
    },
    "/tools/weibull-life-calculator": {
      "name": "ワイブル信頼性寿命解析ツール",
      "description": "形状パラメータ β（傾き）と特性寿命 η から、任意時間での信頼度 R(t) や MTTF を算出。",
      "keywords": [
        "ワイブル解析",
        "Weibull",
        "特性寿命",
        "信頼度",
        "MTTF"
      ]
    },
    "/tools/spc-control-chart-calculator": {
      "name": "SPC管理図・工程管理限界計算ツール",
      "description": "X-bar & R/S 管理図の中心線および管理限界線（UCL/LCL）を算出、異常判定ルールに対応。",
      "keywords": [
        "SPC",
        "管理図",
        "Xbar-R",
        "管理限界",
        "UCL",
        "LCL"
      ]
    },
    "/tools/acceptance-sampling-calculator": {
      "name": "計数値抜取検査・OC曲線計算ツール",
      "description": "二項分布・ポアソン分布に基づき、抜取方式（n, c）の合格確率 Pa および OC 曲線（検査特性曲線）を計算。",
      "keywords": [
        "抜取検査",
        "OC曲線",
        "合格判定",
        "AQL"
      ]
    },
    "/tools/ion-implantation-calculator": {
      "name": "イオン注入飛程・ピーク濃度計算ツール",
      "description": "注入エネルギーとドーズ量から投影飛程 Rp、ストラグリング ΔRp、ピーク不純物濃度を算出。",
      "keywords": [
        "イオン注入",
        "投影飛程",
        "Rp",
        "ストラグリング",
        "注入エネルギー"
      ]
    },
    "/tools/semiconductor-depletion-calculator": {
      "name": "PN接合空乏層幅・内蔵電位計算ツール",
      "description": "アクセプタ・ドナー濃度と逆バイアス電圧から、PN接合の内蔵電位 Vbi、空乏層幅 W、接合容量を計算。",
      "keywords": [
        "PN接合",
        "空乏層幅",
        "内蔵電位",
        "接合容量",
        "逆バイアス"
      ]
    },
    "/tools/cleanroom-converter": {
      "name": "クリーンルーム規格・粒子濃度換算ツール",
      "description": "ISO 14644-1（クラス1〜9）と米国連邦規格 FED-STD-209E 間の清浄度クラス相互換算。",
      "keywords": [
        "クリーンルーム",
        "清浄度規格",
        "ISO 14644",
        "FS209E",
        "微粒子濃度"
      ]
    },
    "/tools/carrier-mobility-calculator": {
      "name": "キャリア移動度・ドリフト速度計算ツール",
      "description": "Caughey-Thomasモデルに基づき、不純物濃度に応じたシリコン中の電子・正孔移動度とドリフト速度を算出。",
      "keywords": [
        "キャリア移動度",
        "ドリフト速度",
        "電子移動度",
        "正孔移動度"
      ]
    },
    "/tools/cmp-preston-calculator": {
      "name": "CMP研磨レート計算ツール (プレストン方程式)",
      "description": "プレストン（Preston）の式に基づき、研磨圧力 P、相対速度 V、材料定数からCMP加工除去速度（MRR）を計算。",
      "keywords": [
        "CMP",
        "化学機械研磨",
        "プレストンの式",
        "研磨速度"
      ]
    },
    "/tools/film-color-calculator": {
      "name": "酸化膜・窒化膜 干渉色判定ツール",
      "description": "光の垂直干渉理論に基づき、SiO2（熱酸化膜）および Si3N4 膜厚からウェーハ表面に見える干渉色を照会。",
      "keywords": [
        "干渉色",
        "薄膜色",
        "SiO2色",
        "酸化膜色",
        "光干渉"
      ]
    },
    "/tools/mosfet-threshold-calculator": {
      "name": "MOSFET しきい値電圧計算ツール (Vth)",
      "description": "ゲート酸化膜厚、基板濃度、仕事関数差から長チャネル MOSFET のフラットバンド電圧およびしきい値電圧 Vt を計算。",
      "keywords": [
        "MOSFET",
        "しきい値電圧",
        "Vth",
        "ゲート酸化膜"
      ]
    },
    "/tools/thermal-fatigue-calculator": {
      "name": "はんだ接合部熱疲労寿命予測ツール (Coffin-Manson)",
      "description": "温度サイクル試験条件下での Norris-Landzberg / Coffin-Manson モデルによるICパッケージはんだ寿命予測。",
      "keywords": [
        "熱疲労",
        "はんだ寿命",
        "Coffin Manson",
        "温度サイクル試験"
      ]
    },
    "/tools/thermal-resistance-calculator": {
      "name": "接合部ジャンクション温度・熱抵抗計算ツール",
      "description": "消費電力と熱抵抗（θjc, θca）からICジャンクション動作温度 Tj を計算し、熱設計マージンを検証。",
      "keywords": [
        "熱抵抗",
        "ジャンクション温度",
        "Tj",
        "熱設計"
      ]
    },
    "/tools/wire-bonding-calculator": {
      "name": "ワイヤボンディング・ループ長＆シェア強度計算ツール",
      "description": "金線・銅線ワイヤ径とスパン長からループ展開長、ボールシェア強度（Ball Shear）、プル強度（Wire Pull）を計算。",
      "keywords": [
        "ワイヤボンディング",
        "ループ長",
        "ボールシェア",
        "ワイヤプル"
      ]
    },
    "/tools/chemical-dilution-calculator": {
      "name": "薬液希釈・ウェット洗浄配合計算ツール",
      "description": "RCA SC-1/SC-2、ピラニアSPM、DHF、BOEバッファードフッ酸の体積比率・質量・実効重量%、C1·V1=C2·V2希釈方程式および酸化膜エッチングレート算出。",
      "keywords": [
        "薬液希釈",
        "ウェット洗浄",
        "RCA洗浄",
        "SC-1",
        "SC-2",
        "ピラニア洗浄",
        "SPM",
        "フッ酸",
        "DHF",
        "BOE",
        "バッファードフッ酸",
        "ウェットベンチ",
        "エッチングレート"
      ]
    },
    "/tools/plasma-sheath-calculator": {
      "name": "プラズマシース＆デバイ長計算ツール",
      "description": "電子デバイ遮蔽長（Debye Length）、ボーム音速（Bohm Velocity）、Child-Langmuir式高周波RFバイアスシース厚、プラズマ振動数およびイオン衝突性判定。",
      "keywords": [
        "プラズマシース",
        "デバイ長",
        "ボーム速度",
        "ボーム基準",
        "Child Langmuir",
        "シース厚",
        "プラズマ周波数",
        "RFバイアス",
        "RIEエッチング",
        "ICPプラズマ",
        "平均自由行程"
      ]
    },
    "/tools/ald-cycle-calculator": {
      "name": "原子層堆積 (ALD) サイクル・プリカーサ露光量計算ツール",
      "description": "原子層堆積（ALD）のサイクルシーケンス、ラングミュア（Langmuir）飽和度（θ）、1サイクルあたり成長膜厚（GPC）、合計膜厚およびプリカーサ消費量を算出。",
      "keywords": [
        "原子層堆積",
        "ALD",
        "ALDサイクル",
        "GPC",
        "飽和曲線",
        "ラングミュア",
        "プリカーサ露光量",
        "パージ時間",
        "TMA",
        "Al2O3",
        "HfO2",
        "段差被覆性",
        "前駆体消費量"
      ]
    },
    "/tools/dopant-diffusion-calculator": {
      "name": "不純物熱拡散・接合深さ計算ツール (xj)",
      "description": "定表面濃度（erfc）および有限拡散源（ガウス分布）によるシリコン熱拡散、アレニウス拡散係数 D(T)（B, P, As, Sb）、冶金接合深さ xj、酸化膜マスク必要厚さを算出。",
      "keywords": [
        "不純物拡散",
        "熱拡散",
        "接合深さ",
        "xj",
        "フィックの法則",
        "プリデポジション",
        "ドライブイン",
        "ガウス分布",
        "erfc",
        "ボロン拡散",
        "リン拡散",
        "サーマルバジェット",
        "酸化膜マスク"
      ]
    },
    "/tools/cvd-kinetics-calculator": {
      "name": "CVD・エピタキシャル成長速度・反応動力学計算ツール",
      "description": "Grove境界層物質移動モデルおよびArrhenius表面反応速度論に基づき、CVD/エピタキシャル成長速度、律速領域遷移温度、サセプタ沿いの原料枯渇を算出。",
      "keywords": [
        "CVD",
        "化学気相成長",
        "エピタキシャル",
        "成長速度",
        "Groveモデル",
        "境界層",
        "物質移動律速",
        "反応律速",
        "アレニウス",
        "シラン",
        "LPCVD",
        "TEOS"
      ]
    },
    "/tools/four-point-probe-calculator": {
      "name": "四探針抵抗率・シート抵抗計算ツール (ASTM F84)",
      "description": "ASTM F84 / SEMI MF84 規格に準拠した直線配置四探針シート抵抗、ウェーハ体積抵抗率、有限厚み幾何補正係数、NISTドーパント濃度逆算ツール。",
      "keywords": [
        "四探針法",
        "ASTM F84",
        "SEMI MF84",
        "シート抵抗",
        "体積抵抗率",
        "厚み補正",
        "不純物濃度",
        "移動度"
      ]
    },
    "/tools/split-lot-calculator": {
      "name": "Split-Lot / DOE レシピ比較計算ツール",
      "description": "半導体スプリットロットおよび実験計画法（DOE）のレシピ対比マトリクス、ウェーハ別パラメータ偏差追跡、応答デルタ分析およびトラベラー出力。",
      "keywords": [
        "スプリットロット",
        "split lot",
        "DOE",
        "実験計画法",
        "レシピ比較",
        "ランシート",
        "パラメータ偏差",
        "プロセス調整"
      ]
    },
    "/tools/curve-fitting-calculator": {
      "name": "曲線フィッティング・反応速度パラメータ抽出計算ツール",
      "description": "半導体動力学パラメータ抽出：アレニウスプロットによる活性化エネルギー (Ea)、Deal-Grove 酸化速度定数 (B, B/A)、最小二乗線形回帰と決定係数 R²。",
      "keywords": [
        "曲線フィッティング",
        "アレニウスプロット",
        "活性化エネルギー",
        "Deal-Grove パラメータ",
        "線形回帰",
        "パラメータ抽出",
        "反応速度論",
        "酸化速度定数"
      ]
    },
    "/tools/arde-etch-calculator": {
      "name": "高アスペクト比エッチング (ARDE)・マイクロローディング計算ツール",
      "description": "アスペクト比依存エッチング (RIE Lag)、パターン密度マイクロローディング効果、およびマスク選択比・テーパー角シミュレーション。",
      "keywords": [
        "ARDE",
        "RIEラグ",
        "マイクロローディング",
        "アスペクト比",
        "エッチングレート",
        "選択比",
        "テーパー角",
        "ドライエッチング"
      ]
    },
    "/tools/cmp-endpoint-calculator": {
      "name": "CMP 終点検出・研磨パッド寿命計算ツール",
      "description": "化学機械研磨 (CMP) のモーター電流終点検出、光学干渉フリンジ周期解析、およびダイヤモンドコンディショナーによるパッド溝摩耗予測。",
      "keywords": [
        "CMP",
        "終点検出",
        "パッド寿命",
        "コンディショニング",
        "光干渉",
        "光学フリンジ",
        "平坦化"
      ]
    },
    "/tools/wafer-warp-stress-calculator": {
      "name": "ウェーハボウ・ワープ＆薄膜応力計算ツール",
      "description": "Stoney式に基づく薄膜残留応力、ウェーハのボウ (Bow) およびワープ (Warp) 曲率半径換算、熱膨張係数差による熱応力、臨界クラック膜厚を算出。",
      "keywords": [
        "Stoney式",
        "ウェーハボウ",
        "ウェーハワープ",
        "薄膜応力",
        "熱膨張ミスマッチ",
        "二軸弾性係数",
        "残留応力",
        "曲率半径"
      ]
    },
    "/tools/wet-bench-calculator": {
      "name": "ウェットベンチ薬液寿命・スパイク補充計算ツール",
      "description": "RCA洗浄（SC-1/SC-2）、SPMピラニア洗浄、BOEエッチングバスの寿命予測、薬品スパイク補充量、および溶存シリコン蓄積モデル。",
      "keywords": [
        "ウェットベンチ",
        "RCA洗浄",
        "SC-1",
        "SC-2",
        "ピラニア",
        "SPM",
        "BOE",
        "薬液補充",
        "バス寿命",
        "エッチング槽"
      ]
    },
    "/tools/cu-plating-calculator": {
      "name": "Cu 電解めっき・ダマシン超充填計算ツール",
      "description": "銅電気化学めっき (ECD)、デュアルダマシン微細トレンチのボトムアップ超充填、シード層ターミナル効果、ファラデー電気分解解析。",
      "keywords": [
        "Cuめっき",
        "電解めっき",
        "ECD",
        "ダマシン",
        "スーパーフィリング",
        "ファラデーの法則",
        "ターミナル効果",
        "添加剤"
      ]
    }
  },
  "ko": {
    "/tools/wafer-die-calculator": {
      "name": "웨이퍼 다이 계산기",
      "description": "웨이퍼 크기, 다이 규격, 스크라이브 레인 폭, 에지 제외 영역을 고려한 예상 총 다이 수(Gross Die) 및 면적 효율 계산.",
      "keywords": [
        "웨이퍼 다이",
        "다이 수율",
        "스크라이브",
        "에지 제외",
        "Gross Die",
        "DPW"
      ]
    },
    "/tools/wafer-map-generator": {
      "name": "대화형 웨이퍼 맵 생성기",
      "description": "다이 배치, 양품/불량 통계 및 CSV/JSON 내보내기를 지원하는 대화형 웨이퍼 맵 시각화.",
      "keywords": [
        "웨이퍼 맵",
        "다이 맵",
        "웨이퍼 지도",
        "비닝 통계",
        "시각화"
      ]
    },
    "/tools/wafer-mark-calculator": {
      "name": "SEMI 규격 웨이퍼 마킹 계산기",
      "description": "SEMI M12/M13 표준에 부합하는 실리콘 웨이퍼 레이저 마킹 문자열 생성 및 체크섬 검증.",
      "keywords": [
        "웨이퍼 마킹",
        "SEMI 마크",
        "SEMI M12",
        "SEMI M13",
        "체크섬",
        "레이저 마킹"
      ]
    },
    "/tools/yield-calculator": {
      "name": "웨이퍼 수율 계산기",
      "description": "투입 웨이퍼 수와 양품 칩 수를 기반으로 웨이퍼 가공 및 패키징 테스트 종합 수율 계산.",
      "keywords": [
        "수율 계산",
        "웨이퍼 수율",
        "공정 수율",
        "양품률"
      ]
    },
    "/tools/yield-model-calculator": {
      "name": "수율 모델 비교 계산기",
      "description": "Murphy, Poisson, Seeds, Bose-Einstein 반도체 결함 밀도 기반 수율 예측 모델 비교.",
      "keywords": [
        "수율 모델",
        "포아송 모델",
        "머피 모델",
        "결함 밀도 모델"
      ]
    },
    "/tools/defect-density-calculator": {
      "name": "결함 밀도 계산기 (D0)",
      "description": "다이 면적 및 측정 수율을 역산하여 결함 밀도 D0 추정 및 공정 품질 평가.",
      "keywords": [
        "결함 밀도",
        "D0",
        "킬러 결함",
        "수율 손실",
        "청정도"
      ]
    },
    "/tools/die-cost-calculator": {
      "name": "다이 제조 원가 계산기",
      "description": "웨이퍼 단가, 획득 다이 수, 공정 수율 및 패키징 비용을 반영한 단품 다이 원가 계산.",
      "keywords": [
        "다이 원가",
        "웨이퍼 비용",
        "칩 제조원가",
        "단가 계산"
      ]
    },
    "/tools/process-capability-calculator": {
      "name": "공정 능력 지수 계산기 (Cp / Cpk)",
      "description": "규격 상한(USL)/하한(LSL) 및 평균, 표준편차로부터 공정능력지수 Cp, Cpk, Pp, Ppk 산출.",
      "keywords": [
        "공정 능력",
        "Cp",
        "Cpk",
        "Pp",
        "Ppk",
        "식스시그마",
        "SPC"
      ]
    },
    "/tools/yield-confidence-calculator": {
      "name": "수율 신뢰구간 계산기",
      "description": "샘플 검사 데이터로부터 Wilson Score 또는 Clopper-Pearson 수율 신뢰구간 추정.",
      "keywords": [
        "신뢰구간",
        "수율 신뢰도",
        "샘플 크기",
        "윌슨 점수"
      ]
    },
    "/tools/throughput-calculator": {
      "name": "장비 생산능력 및 WPH 계산기",
      "description": "공정 시간, 핸들러 오버헤드, 배치 크기를 기반으로 시간당 웨이퍼 처리량(WPH) 계산.",
      "keywords": [
        "WPH",
        "시간당 생산량",
        "스루풋",
        "택트 타임",
        "장비 생산성"
      ]
    },
    "/tools/sheet-resistance-calculator": {
      "name": "4탐침 면저항 및 비저항 계산기",
      "description": "4-포인트 프로브 측정 전압/전류, 탐침 간격, 박막 두께로부터 면저항 Rs 및 비저항 계산.",
      "keywords": [
        "면저항",
        "비저항",
        "4탐침",
        "시트 저항",
        "Rs"
      ]
    },
    "/tools/wafer-area-calculator": {
      "name": "웨이퍼 유효 면적 및 에지 제외 계산기",
      "description": "플랫 또는 노치가 포함된 웨이퍼 총면적과 에지 제외 영역을 뺀 순수 유효 공정 면적 계산.",
      "keywords": [
        "웨이퍼 면적",
        "에지 제외",
        "유효 면적",
        "플랫존",
        "노치"
      ]
    },
    "/tools/reticle-field-calculator": {
      "name": "레티클 노광 필드 계산기",
      "description": "스테퍼/스캐너 유효 노광 샷 영역 내 배치 가능한 다이 배열 행/열 수 및 노광 수 계산.",
      "keywords": [
        "레티클",
        "노광 필드",
        "스테퍼",
        "스캐너",
        "샷 영역"
      ]
    },
    "/tools/thickness-converter": {
      "name": "박막 두께 단위 변환기",
      "description": "옹스트롬(Å), 나노미터(nm), 마이크로미터(µm), mil, 밀리미터(mm) 간 박막 두께 정밀 변환.",
      "keywords": [
        "두께 변환",
        "옹스트롬",
        "나노미터",
        "마이크로미터",
        "단위 변환"
      ]
    },
    "/tools/pressure-converter": {
      "name": "진공 및 압력 단위 변환기",
      "description": "파스칼(Pa), 밀리바(mbar), 토르(Torr), 밀리토르(mTorr), 기압(atm) 간 고정밀 진공도 변환.",
      "keywords": [
        "진공도",
        "압력 변환",
        "파스칼",
        "토르",
        "Torr",
        "Pa"
      ]
    },
    "/tools/gas-flow-converter": {
      "name": "가스 유량 변환기 (sccm / slm)",
      "description": "sccm, slm, mol/s 및 기준온도 조건에 따른 반도체 공정 가스 질량유량 정밀 변환.",
      "keywords": [
        "가스 유량",
        "MFC",
        "sccm",
        "slm",
        "질량 유량계"
      ]
    },
    "/tools/temperature-converter": {
      "name": "온도 단위 변환기",
      "description": "섭씨(°C), 켈빈(K), 화씨(°F) 상호 변환 및 열에너지 kT(eV) 계산.",
      "keywords": [
        "온도 변환",
        "섭씨",
        "켈빈",
        "열에너지",
        "kT"
      ]
    },
    "/tools/lithography-resolution-calculator": {
      "name": "노광 해상도 및 초점심도 계산기 (Rayleigh)",
      "description": "레일리 공식을 기반으로 파장 λ, 개구수 NA, 공정계수 k1/k2로부터 최소 선폭 해상도 및 DoF 산출.",
      "keywords": [
        "해상도",
        "초점심도",
        "DoF",
        "레일리 공식",
        "개구수",
        "NA"
      ]
    },
    "/tools/etch-rate-calculator": {
      "name": "식각율 및 선택비 계산기",
      "description": "식각 전후 박막 두께와 공정 시간을 기반으로 에칭율(Etch Rate) 및 마스크/하부막 선택비 계산.",
      "keywords": [
        "식각율",
        "선택비",
        "에칭율",
        "플라즈마 식각",
        "습식 식각"
      ]
    },
    "/tools/cd-uniformity-calculator": {
      "name": "임계 선폭 (CD) 균일도 계산기",
      "description": "웨이퍼 멀티포인트 CD 측정 데이터의 평균, 범위, 3-시그마 및 균일도 퍼센트 분석.",
      "keywords": [
        "CD 균일도",
        "임계 선폭",
        "3시그마",
        "면내 균일도"
      ]
    },
    "/tools/film-stress-calculator": {
      "name": "박막 응력 계산기 (Stoney)",
      "description": "웨이퍼 두께 및 성막 전후 곡률반경 변화를 바탕으로 Stoney 공식을 이용해 인장/압축 응력 계산.",
      "keywords": [
        "박막 응력",
        "Stoney 공식",
        "곡률 반경",
        "인장 응력",
        "압축 응력",
        "웨이퍼 휨"
      ]
    },
    "/tools/film-uniformity-calculator": {
      "name": "박막 두께 균일도 계산기",
      "description": "웨이퍼 멀티포인트 측정 두께 데이터로부터 최대, 최소, 평균 및 Half-Range 백분율 균일도 계산.",
      "keywords": [
        "두께 균일도",
        "막두께 균일도",
        "엘립소미터"
      ]
    },
    "/tools/diffusion-length-calculator": {
      "name": "열확산 거리 계산기 (2√Dt)",
      "description": "도펀트 확산 계수 D와 열처리 어닐링 시간 t로부터 특성 확산 거리 2√(Dt) 계산.",
      "keywords": [
        "확산 거리",
        "열확산",
        "어닐링",
        "도펀트 확산",
        "2√Dt"
      ]
    },
    "/tools/arrhenius-calculator": {
      "name": "아레니우스 반응속도 및 활성화 에너지 계산기",
      "description": "빈도인자와 활성화 에너지 Ea로부터 반응속도 계산 또는 두 측정점으로부터 Ea 추출.",
      "keywords": [
        "아레니우스",
        "활성화 에너지",
        "Ea",
        "반응속도",
        "온도 의존성"
      ]
    },
    "/tools/thermal-oxide-calculator": {
      "name": "열산화막 성장 계산기 (Deal-Grove)",
      "description": "Deal-Grove 모델을 사용하여 건식/습식 산화 공정 조건에 따른 실리콘 산화막 두께 계산.",
      "keywords": [
        "열산화",
        "Deal-Grove 모델",
        "건식 산화",
        "습식 산화",
        "산화막 두께"
      ]
    },
    "/tools/power-converter": {
      "name": "RF 전력 및 dBm 변환기",
      "description": "와트(W), 밀리와트(mW), dBm 간의 정밀 상호 변환 및 Vpp 전압 계산.",
      "keywords": [
        "RF 전력",
        "dBm 변환",
        "와트",
        "고주파",
        "Vpp"
      ]
    },
    "/tools/time-constant-calculator": {
      "name": "RC / RL 시정수 계산기",
      "description": "RC 및 RL 회로의 시정수 τ, 상승 시간(Rise Time) 및 과도응답 충방전 특성 계산.",
      "keywords": [
        "시정수",
        "RC 회로",
        "RL 회로",
        "상승 시간",
        "과도 응답"
      ]
    },
    "/tools/rf-power-calculator": {
      "name": "RF 반사 전력 및 흡수 전력 계산기",
      "description": "입사 전력과 반사 전력으로부터 반사계수, 부하 전달 순전력 및 반사손실 계산.",
      "keywords": [
        "RF 전력",
        "반사 전력",
        "입사 전력",
        "반사계수",
        "부하 전력"
      ]
    },
    "/tools/return-loss-calculator": {
      "name": "반사손실 및 정재파비 계산기 (VSWR)",
      "description": "반사손실(Return Loss), 전압정재파비(VSWR), 반사계수(Γ), 반사율 간의 상호 변환.",
      "keywords": [
        "반사손실",
        "VSWR",
        "정재파비",
        "반사계수",
        "임피던스 매칭"
      ]
    },
    "/tools/impedance-matching-calculator": {
      "name": "L형 임피던스 매칭 네트워크 계산기",
      "description": "RF 플라즈마 부하 정합을 위한 저역통과/고역통과 L형 매칭 회로 LC 값 산출.",
      "keywords": [
        "임피던스 매칭",
        "L형 매칭",
        "매처",
        "플라즈마 부하"
      ]
    },
    "/tools/microstrip-calculator": {
      "name": "마이크로스트립 임피던스 계산기",
      "description": "신호선 폭, 절연체 두께, 유전율, 동박 두께로부터 마이크로스트립 특성 임피던스 Z0 계산.",
      "keywords": [
        "마이크로스트립",
        "특성 임피던스",
        "Z0",
        "전송선로"
      ]
    },
    "/tools/stub-matching-calculator": {
      "name": "단일 스터브 임피던스 매칭 계산기",
      "description": "단락 또는 개방 스터브를 이용한 전송선로 임피던스 정합 위치 및 스터브 길이 계산.",
      "keywords": [
        "스터브 매칭",
        "단일 스터브",
        "임피던스 정합"
      ]
    },
    "/tools/bin-yield-calculator": {
      "name": "멀티 Bin 분류 및 테스트 수율 계산기",
      "description": "웨이퍼 프로빙(CP/FT) 다중 Bin 분류 데이터를 바탕으로 Bin별 비율 및 통과 수율 집계.",
      "keywords": [
        "Bin 분류",
        "수율 집계",
        "웨이퍼 테스트",
        "CP 테스트"
      ]
    },
    "/tools/fit-mtbf-calculator": {
      "name": "FIT 및 MTBF 신뢰성 변환기",
      "description": "FIT(10^9시간당 고장률), 고장률 λ 및 평균 무고장 시간(MTBF) 간 정밀 환산.",
      "keywords": [
        "FIT",
        "MTBF",
        "고장률",
        "신뢰성",
        "평균 무고장 시간"
      ]
    },
    "/tools/yield-dppm-calculator": {
      "name": "수율 및 결함 DPPM 변환기",
      "description": "공정 수율(%)과 백만분율 결함 수(DPPM) 간의 고정밀 양방향 환산.",
      "keywords": [
        "DPPM",
        "백만분율",
        "불량률",
        "품질 수준"
      ]
    },
    "/tools/weibull-life-calculator": {
      "name": "와이블 신뢰성 수명 분석기",
      "description": "형상 모수 β와 척도 모수 η를 기반으로 특정 시간에서의 신뢰도 R(t) 및 평균 수명 산출.",
      "keywords": [
        "와이블 분석",
        "Weibull",
        "특성 수명",
        "신뢰도",
        "MTTF"
      ]
    },
    "/tools/spc-control-chart-calculator": {
      "name": "통계적 공정 관리 (SPC) 관리도 계산기",
      "description": "X-bar & R/S 계량형 관리도의 중심선 및 상하 관리한계(UCL/LCL) 계산 및 이상 규칙 검사.",
      "keywords": [
        "SPC",
        "관리도",
        "Xbar-R",
        "관리한계",
        "UCL",
        "LCL"
      ]
    },
    "/tools/acceptance-sampling-calculator": {
      "name": "샘플링 검사 및 합격 확률 계산기 (OC 곡선)",
      "description": "계수형 샘플링 검사 계획(n, c)의 로트 부적합품률에 따른 합격 확률 Pa 및 OC 곡선 산출.",
      "keywords": [
        "샘플링 검사",
        "OC 곡선",
        "합격 확률",
        "AQL"
      ]
    },
    "/tools/ion-implantation-calculator": {
      "name": "이온 주입 투영 비정 및 피크 농도 계산기",
      "description": "이온 주입 에너지 및 도즈량으로부터 투영 비정(Rp), 편차(ΔRp), 피크 도핑 농도 산출.",
      "keywords": [
        "이온 주입",
        "투영 비정",
        "Rp",
        "스트래글링",
        "피크 농도"
      ]
    },
    "/tools/semiconductor-depletion-calculator": {
      "name": "PN 접합 공핍층 폭 및 내장 전위 계산기",
      "description": "도핑 농도와 역방향 바이어스로부터 PN 접합 내장 전위(Vbi), 공핍층 폭(W) 및 접합 커패시턴스 계산.",
      "keywords": [
        "PN 접합",
        "공핍층 폭",
        "내장 전위",
        "접합 용량"
      ]
    },
    "/tools/cleanroom-converter": {
      "name": "클린룸 등급 및 입자 농도 변환기 (ISO / FS209E)",
      "description": "ISO 14644-1 및 미국 연방 규격 FS209E 간의 클린룸 청정도 등급 및 입경별 입자 한계 농도 변환.",
      "keywords": [
        "클린룸 등급",
        "청정도",
        "ISO 14644",
        "FS209E",
        "입자 농도"
      ]
    },
    "/tools/carrier-mobility-calculator": {
      "name": "캐리어 이동도 및 드리프트 속도 계산기",
      "description": "Caughey-Thomas 경험 모델을 바탕으로 도핑 농도에 따른 전자 및 정공 이동도와 포화 드리프트 속도 계산.",
      "keywords": [
        "캐리어 이동도",
        "드리프트 속도",
        "전자 이동도",
        "정공 이동도"
      ]
    },
    "/tools/cmp-preston-calculator": {
      "name": "CMP 가공 제거율 계산기 (Preston)",
      "description": "프레스톤(Preston) 방정식을 기반으로 가공 압력 P, 상대속도 V 및 계수로부터 화학기계연마(CMP) 제거율 계산.",
      "keywords": [
        "CMP",
        "화학기계연마",
        "프레스톤 방정식",
        "제거율"
      ]
    },
    "/tools/film-color-calculator": {
      "name": "산화막 및 질화막 간섭 색상 조견표",
      "description": "빛의 간섭 원리에 따라 열산화막(SiO2) 및 질화막(Si3N4) 두께에 따른 웨이퍼 표면 반사 간섭 색상 예측.",
      "keywords": [
        "박막 색상",
        "간섭색",
        "SiO2 색상",
        "산화막 색상표"
      ]
    },
    "/tools/mosfet-threshold-calculator": {
      "name": "MOSFET 문턱전압 계산기 (Vth)",
      "description": "게이트 산화막 두께, 기판 도핑 농도, 일함수 차이로부터 MOSFET 평탄대역 전압 및 문턱전압(Vth) 계산.",
      "keywords": [
        "MOSFET",
        "문턱전압",
        "Vth",
        "게이트 산화막"
      ]
    },
    "/tools/thermal-fatigue-calculator": {
      "name": "솔더 접합부 열피로 수명 계산기 (Coffin-Manson)",
      "description": "Norris-Landzberg / Coffin-Manson 모델을 이용하여 온도 사이클 시험 조건에서의 패키지 솔더 피로 수명 산출.",
      "keywords": [
        "열피로",
        "솔더 수명",
        "Coffin Manson",
        "온도 사이클"
      ]
    },
    "/tools/thermal-resistance-calculator": {
      "name": "접합부 온도 및 열저항 계산기 (Tj)",
      "description": "소비 전력과 열저항(θjc, θca)으로부터 반도체 접합부 온도(Tj) 계산 및 방열 설계 마진 평가.",
      "keywords": [
        "열저항",
        "접합 온도",
        "Tj",
        "방열 설계"
      ]
    },
    "/tools/wire-bonding-calculator": {
      "name": "와이어 본딩 루프 및 전단/인장강도 계산기",
      "description": "와이어 직경 및 본딩 스팬 지오메트리로부터 루프 전개 길이, 볼 쉐어(Ball Shear) 및 와이어 풀(Pull) 강도 산출.",
      "keywords": [
        "와이어 본딩",
        "루프 높이",
        "볼 쉐어",
        "와이어 풀"
      ]
    },
    "/tools/chemical-dilution-calculator": {
      "name": "화학 케미컬 희석 및 습식 세정 계산기",
      "description": "RCA SC-1/SC-2, 피라냐 SPM, DHF, BOE 완충 불산 용액의 배합 체적, 성분 질량 및 중량%, C1·V1=C2·V2 희석 방정식 및 실리콘 산화막 식각율 계산.",
      "keywords": [
        "케미컬 희석",
        "습식 세정",
        "RCA 세정",
        "SC-1",
        "SC-2",
        "피라냐",
        "SPM",
        "불산 희석",
        "DHF",
        "BOE",
        "습식 벤치",
        "식각 속도",
        "산화막 식각"
      ]
    },
    "/tools/plasma-sheath-calculator": {
      "name": "플라즈마 시스 & 드바이 길이 계산기",
      "description": "전자 드바이 길이(Debye Length), 보름 속도(Bohm Velocity), Child-Langmuir RF 바이어스 시스 두께, 플라즈마 주파수 및 이온 충돌성 해석.",
      "keywords": [
        "플라즈마 시스",
        "드바이 길이",
        "보름 속도",
        "보름 기준",
        "Child Langmuir",
        "시스 두께",
        "플라즈마 주파수",
        "RF 바이어스",
        "RIE 식각",
        "ICP 플라즈마",
        "평균 자유 행로"
      ]
    },
    "/tools/ald-cycle-calculator": {
      "name": "원자층 증착 (ALD) 사이클 및 전구체 노출 계산기",
      "description": "원자층 증착(ALD) 사이클 시퀀스, 랭뮤어(Langmuir) 흡착 포화도(θ), 사이클당 증착 두께(GPC), 총 박막 두께 및 전구체 소모량 정밀 계산.",
      "keywords": [
        "원자층 증착",
        "ALD",
        "ALD 사이클",
        "GPC",
        "포화 곡선",
        "랭뮤어",
        "전구체 노출",
        "퍼지 시간",
        "TMA",
        "Al2O3",
        "HfO2",
        "단차 피복성",
        "전구체 소모량"
      ]
    },
    "/tools/dopant-diffusion-calculator": {
      "name": "도펀트 열확산 및 접합 깊이 계산기 (xj)",
      "description": "일정 표면 농도(erfc) 및 한정 표면원(가우시안 분포) 실리콘 열확산, 아레니우스 확산 계수 D(T) (B, P, As, Sb), 야금학적 접합 깊이 xj 및 산화막 마스크 두께 계산.",
      "keywords": [
        "도펀트 확산",
        "열확산",
        "접합 깊이",
        "xj",
        "픽의 법칙",
        "프리데포지션",
        "드라이브인",
        "가우시안 확산",
        "erfc",
        "붕소 확산",
        "인 확산",
        "열 예산",
        "산화막 마스크"
      ]
    },
    "/tools/cvd-kinetics-calculator": {
      "name": "CVD 및 에피택시 성장 속도·반응 역학 계산기",
      "description": "Grove 경계층 물질 전달 모델 및 아레니우스 표면 반응 속도론을 바탕으로 CVD/에피택시 박막 성장 속도, 율속 단계 전이 온도 및 전구체 고갈 균일도 계산.",
      "keywords": [
        "CVD",
        "화학기상증착",
        "에피택시",
        "성장 속도",
        "Grove 모델",
        "경계층",
        "물질 전달 율속",
        "표면 반응 율속",
        "아레니우스",
        "실란",
        "LPCVD",
        "TEOS"
      ]
    },
    "/tools/four-point-probe-calculator": {
      "name": "4포인트 프로브 비저항 및 면저항 계산기 (ASTM F84)",
      "description": "ASTM F84 / SEMI MF84 표준 직선 4탐침 면저항, 웨이퍼 체적 비저항, 유한 두께 기하학 보정 계수 및 NIST 도펀트 농도 역산 계산기.",
      "keywords": [
        "4탐침",
        "포포인트 프로브",
        "ASTM F84",
        "SEMI MF84",
        "면저항",
        "비저항",
        "두께 보정",
        "도핑 농도"
      ]
    },
    "/tools/split-lot-calculator": {
      "name": "Split-Lot 및 DOE 레시피 비교 계산기",
      "description": "반도체 스플릿 롯 및 실험계획법(DOE) 레시피 오버레이 매트릭스, 웨이퍼별 공정 파라미터 변동 모니터링, 응답 델타 비교 및 공정 트래블러 내보내기.",
      "keywords": [
        "스플릿 롯",
        "split lot",
        "DOE",
        "실험계획법",
        "레시피 비교",
        "웨이퍼 트래블러",
        "공정 편차",
        "클린룸 런시트"
      ]
    },
    "/tools/curve-fitting-calculator": {
      "name": "곡선 피팅 및 반응 동역학 파라미터 추출 계산기",
      "description": "반도체 키네틱 파라미터 추출: 아레니우스 활성화 에너지(Ea), Deal-Grove 산화 속도 상수(B, B/A) 및 최소제곱 선형 회귀와 R² 적합도 분석.",
      "keywords": [
        "곡선 피팅",
        "아레니우스 피팅",
        "활성화 에너지",
        "Deal-Grove 파라미터",
        "선형 회귀",
        "파라미터 추출",
        "반응 속도론",
        "산화 속도 상수"
      ]
    },
    "/tools/arde-etch-calculator": {
      "name": "고종횡비 식각 (ARDE) 및 마이크로로딩 계산기",
      "description": "종횡비 의존성 식각(ARDE / RIE Lag), 패턴 밀도 마이크로로딩 효과 및 마스크 선택비와 측벽 테이퍼 각도 시뮬레이션.",
      "keywords": [
        "ARDE",
        "RIE 래그",
        "마이크로로딩",
        "종횡비",
        "식각률",
        "선택비",
        "테이퍼 각도",
        "플라즈마 식각"
      ]
    },
    "/tools/cmp-endpoint-calculator": {
      "name": "CMP 종말점 검출 및 패드 수명 계산기",
      "description": "화학기계적 연마(CMP) 모터 전류 종말점(EPD), 광학 간섭 무늬 주기 및 다이아몬드 컨디셔너 패드 홈 마모 수명 예측.",
      "keywords": [
        "CMP",
        "종말점",
        "EPD",
        "패드 수명",
        "컨디셔닝",
        "광학 간섭",
        "평탄화",
        "그루브 마모"
      ]
    },
    "/tools/wafer-warp-stress-calculator": {
      "name": "웨이퍼 보우·와프 및 박막 잔류응력 계산기",
      "description": "Stoney 공식을 이용한 박막 잔류 응력, 웨이퍼 보우(Bow) 및 와프(Warp) 곡률 반경 환산, 열팽창계수 부정합 열응력 및 임계 균열 두께 계산.",
      "keywords": [
        "Stoney 공식",
        "웨이퍼 보우",
        "웨이퍼 와프",
        "박막 응력",
        "열팽창 불일치",
        "이축 탄성계수",
        "잔류 응력",
        "곡률 반경"
      ]
    },
    "/tools/wet-bench-calculator": {
      "name": "웨트 벤치 화학 약액 수명 및 스파이크 보충 계산기",
      "description": "RCA 세정(SC-1/SC-2), SPM 피라냐, BOE 식각 배스 수명 평가, 화학 약액 스파이크 보충량 및 용해 실리콘 누적 감쇠 모델.",
      "keywords": [
        "웨트 벤치",
        "RCA 세정",
        "SC-1",
        "SC-2",
        "피라냐",
        "SPM",
        "BOE",
        "약액 보충",
        "배스 수명",
        "식각조"
      ]
    },
    "/tools/cu-plating-calculator": {
      "name": "구리 전기도금 및 다마신 슈퍼필링 계산기",
      "description": "구리 전기화학 증착(ECD), 듀얼 다마신 트렌치 바텀업 슈퍼필링, 시드층 터미널 효과 및 패러데이 전기분해 역학 계산.",
      "keywords": [
        "구리 도금",
        "전기도금",
        "ECD",
        "다마신",
        "슈퍼필링",
        "패러데이 법칙",
        "터미널 효과",
        "전류 밀도"
      ]
    }
  }
};

export function getTranslatedTool(
  tool: Tool,
  locale: SupportedLocale,
): { name: string; description: string; keywords: string[] } {
  const dict = TOOL_TRANSLATIONS[locale];
  if (dict && dict[tool.path]) {
    return {
      name: dict[tool.path].name,
      description: dict[tool.path].description,
      keywords: dict[tool.path].keywords || tool.keywords,
    };
  }
  return {
    name: tool.name,
    description: tool.description,
    keywords: tool.keywords,
  };
}

export function translateToolName(path: string, locale: SupportedLocale): string {
  const dict = TOOL_TRANSLATIONS[locale];
  if (dict && dict[path]) {
    return dict[path].name;
  }
  return path;
}
