import type { ToolTranslation } from '../types';

export const en: Record<string, ToolTranslation> = {
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
};
