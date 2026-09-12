# SemiTools

Semiconductor engineering calculators that run entirely in the browser. Every tool states its units, shows the formula it uses, and refuses to pretend a generic estimate is a fab-specific number.

**Live:** https://semitool.vercel.app

## Tools

| Tool | Route | What it does |
| --- | --- | --- |
| Wafer Die Calculator | `/tools/wafer-die-calculator` | Estimated usable die per wafer from wafer diameter, die size, street width and edge exclusion (die-centre-in-circle rule) |
| Wafer Map Generator | `/tools/wafer-map-generator` | SVG wafer map with die coordinates, row/column, Good / Defect / Skip / Edge status, CSV and JSON export |
| Wafer Mark Calculator | `/tools/wafer-mark-calculator` | Builds and validates wafer mark codes from lot, wafer number, product, layer and date |
| Yield Calculator | `/tools/yield-calculator` | Yield and reject rate from gross, good and defect die counts |
| Yield Model Calculator | `/tools/yield-model-calculator` | Poisson, Murphy and Seeds (Moore) yield models from defect density and critical area |
| Defect Density Calculator | `/tools/defect-density-calculator` | Back-calculates defect density D0 from a measured yield and critical area, per model |
| Die Cost Calculator | `/tools/die-cost-calculator` | Cost per gross die, cost per good die, scrap cost and cost multiplier from wafer cost and die counts |
| Process Capability Calculator | `/tools/process-capability-calculator` | Cp, Cpk, CPU and CPL plus the out-of-spec fraction from spec limits, a process mean and a sigma |
| Yield Confidence Interval Calculator | `/tools/yield-confidence-calculator` | Wilson and Clopper-Pearson intervals for a measured yield, plus sample-size planning |
| Throughput & OEE Calculator | `/tools/throughput-calculator` | Wafers per hour and OEE from process time, chamber count and availability / performance / quality |
| Sheet Resistance Calculator | `/tools/sheet-resistance-calculator` | Sheet resistance, resistivity and conductivity from a four-point probe measurement, plus a sheet resistance / resistivity converter |
| Wafer Area Calculator | `/tools/wafer-area-calculator` | Wafer area, usable area after edge exclusion, die area and the area-only die count upper bound, with utilisation against a measured count |
| Reticle Field Calculator | `/tools/reticle-field-calculator` | Dice per field, field utilisation and scribe-lane effect, plus shots per wafer and the dice they can carry |
| Thickness Converter | `/tools/thickness-converter` | Film thickness and length between ångström, nm, µm, mil, mm, cm, inch and m, with the exact inch and mil definitions |
| Pressure & Vacuum Converter | `/tools/pressure-converter` | Pressure and vacuum between Pa, kPa, MPa, bar, mbar, Torr, mTorr, atm and psi, with the Torr defined as 1/760 atm |
| Gas Flow Converter | `/tools/gas-flow-converter` | Gas flow between sccm, slm, m³/h, cfm, mol/min, mol/h and g/min, with the reference temperature and the gas as explicit inputs |
| Temperature Converter | `/tools/temperature-converter` | Temperature and temperature difference between Celsius, Fahrenheit, kelvin and Rankine, with absolute-zero checking |
| Lithography Resolution Calculator | `/tools/lithography-resolution-calculator` | Rayleigh resolution and depth of focus from wavelength, numerical aperture and k1 / k2, with the 0.25 diffraction limit flagged |
| Etch Rate & Selectivity Calculator | `/tools/etch-rate-calculator` | Etch rate and remaining fraction from before / after thickness and time, plus selectivity and overetch when those were measured |
| Film Stress Calculator | `/tools/film-stress-calculator` | Stoney film stress from curvature or bow, with the substrate biaxial modulus and a thickness-ratio validity check |
| Film Thickness Uniformity Calculator | `/tools/film-uniformity-calculator` | Across-wafer thickness uniformity from a list of readings: mean, range, sample sigma, three sigma and the percentage conventions |
| CD Uniformity Calculator | `/tools/cd-uniformity-calculator` | Mean, range, 3 sigma and all three uniformity percentages (range/mean, half range/mean, CV) from a pasted list of CD readings |
| Diffusion Length Calculator | `/tools/diffusion-length-calculator` | Diffusion length and thermal budget from a diffusivity and a time, with the characteristic, erfc and Gaussian length scales labelled separately |
| Arrhenius Rate Calculator | `/tools/arrhenius-calculator` | Arrhenius rate from a prefactor and an activation energy, and the activation energy and prefactor extracted from two rates at two temperatures |
| Deal-Grove Thermal Oxide Calculator | `/tools/thermal-oxide-calculator` | Oxide thickness from an oxidation time or the time to a target thickness, with an initial oxide, the linear / parabolic regime and the silicon consumed |
| Power Converter | `/tools/power-converter` | Power between W, mW, µW, kW, hp, BTU/h, cal/s, ft·lbf/s and the decibel units dBm and dBW, from exact unit definitions |
| RC Time Constant Calculator | `/tools/time-constant-calculator` | RC time constant with the exact 10-90% rise, 1% and 0.1% settling, the -3 dB corner frequency and tau in every time unit |
| RF Power Calculator | `/tools/rf-power-calculator` | RF power between dBm, dBW, W and mW and the RMS, peak and peak-to-peak voltage it drives into a chosen system impedance |
| Return Loss & VSWR Calculator | `/tools/return-loss-calculator` | Return loss, reflection coefficient, VSWR, mismatch loss and the reflected and delivered power fractions, any one from the others |
| Bin Yield Calculator | `/tools/bin-yield-calculator` | Roll up wafer-sort bin counts into per-bin share, cumulative yield, the pass fraction and the measured defect rate in DPPM |
| FIT & MTBF Calculator | `/tools/fit-mtbf-calculator` | Failure rate, FIT and MTBF from a life test, with the DPPM over a mission time and the time to a 1% or 10% failing fraction |
| Yield ⇄ DPPM Calculator | `/tools/yield-dppm-calculator` | Convert between yield, DPPM, DPB and the equivalent one-sided sigma and Cpk, in any direction |
| L-Network Impedance Match Calculator | `/tools/impedance-matching-calculator` | Match two real resistances with an L network: loaded Q, shunt side, and the series and shunt L and C values for the low-pass and high-pass builds |
| Microstrip Calculator | `/tools/microstrip-calculator` | Trace impedance, effective permittivity, guided wavelength and delay per millimetre from the geometry, or the width that reaches a target impedance |
| Shunt Stub Match Calculator | `/tools/stub-matching-calculator` | Both single-stub distances for a complex load with the short and open stub lengths, each re-simulated against the transmission-line equations |
| Weibull Life Calculator | `/tools/weibull-life-calculator` | Weibull fit by median rank: shape and scale, the fit correlation, B1 / B10 / B50 life, MTBF and the reliability at a mission time |
| SPC Control Chart Calculator | `/tools/spc-control-chart-calculator` | X-bar and R control limits, out-of-limit points, seven-in-a-row runs and the within-subgroup sigma |
| Acceptance Sampling Calculator | `/tools/acceptance-sampling-calculator` | The operating characteristic of a sample plan, and the zero acceptance sample size that rejects a lot as bad as a stated fraction |
| Ion Implantation & Doping Calculator | `/tools/ion-implantation-calculator` | Projected range Rp, straggle delta Rp, peak concentration and junction depth from implant energy, species and dose in silicon |
| PN Junction Depletion Calculator | `/tools/semiconductor-depletion-calculator` | Built-in potential, depletion width, electric field, junction capacitance and breakdown voltage under reverse bias for PN junctions |
| Cleanroom Classification & Airflow Calculator | `/tools/cleanroom-converter` | ISO 14644-1 and FED-STD-209E cleanroom particle limits, required air change rates (ACH), total airflow (CFM / m³/h) and FFU ceiling coverage |
| MOSFET Threshold & Gate Oxide Calculator | `/tools/mosfet-threshold-calculator` | Threshold voltage, equivalent oxide thickness (EOT), gate capacitance, flatband voltage, body effect and subthreshold swing for NMOS and PMOS transistors |
| Carrier Mobility & Silicon Resistivity Calculator | `/tools/carrier-mobility-calculator` | Caughey-Thomas electron and hole mobility, bulk silicon resistivity, conductivity and dopant concentration bisection solver |
## Stack

Next.js (App Router) · TypeScript · React 19 · Tailwind CSS v4 · lucide-react · Fuse.js · Vitest

All calculations are client-side. There is no account, database, payment or server-side compute.

## Architecture

```
src/
  app/                      routes, metadata, sitemap, robots, 404
    tools/<slug>/page.tsx   server component: per-tool metadata + SEO content, renders the calculator
  components/
    shell/                  AppShell, ToolSidebar, CommandPalette (layout around every page)
    tools/                  ToolCard, FavoriteButton, ToolPageShell, ToolExplorer, FavoritesSection, UnitConverter, SeriesField
  lib/                      pure calculation + platform logic (no React)
    units.ts                shared length units (angstrom, nm, um, mil, mm, cm, inch, m) and their conversions
    wafer.ts                die estimation, wafer map generation, geometry validation
    wafer-area.ts           wafer / usable area, edge-exclusion loss, area-only die count, utilisation
    sheet-resistance.ts     four-point probe sheet resistance, resistivity, conductivity, converter
    reticle.ts              die pitch, dice per field, field utilisation, shots per wafer
    pressure.ts             pressure and vacuum units (Pa, bar, mbar, Torr, mTorr, atm, psi)
    gas-flow.ts             gas flow units, molar volume at a stated standard, gas molar masses
    temperature.ts          Celsius / Fahrenheit / kelvin / Rankine, absolute and difference modes
    lithography.ts          Rayleigh resolution and depth of focus from wavelength, NA, k1 and k2
    etch.ts                 etch rate, selectivity, overetch and remaining fraction
    stress.ts               Stoney film stress, biaxial modulus, curvature from bow
    series.ts               measurement-list parsing and mean / range / sigma / uniformity statistics
    diffusion.ts            diffusion length, thermal budget and its length scales
    arrhenius.ts            Arrhenius rate, Ea extraction and the Boltzmann constant
    oxide.ts                Deal-Grove linear-parabolic oxidation and the silicon consumed
    power.ts                power units including dBm / dBW and the power-voltage-impedance link
    rf.ts                   return loss, reflection coefficient, VSWR and mismatch loss
    time.ts                 time units, the RC time constant, rise / settling and the corner frequency
    reliability.ts          failure rate, FIT, MTBF and the DPPM implied over a mission time
    dppm.ts                 yield / DPPM / DPB / sigma conversions, reusing the normal helpers
    bin.ts                  wafer-sort bin parsing and the per-bin / cumulative yield rollup
    impedance.ts            L-network matching from the resistance ratio
    tline.ts                guided wavelength and the Hammerstad-Jensen microstrip model
    stub.ts                 single shunt-stub matching of a complex load, with a re-simulation check
    weibull.ts              log gamma, median-rank Weibull fitting and B life
    spc.ts                  X-bar and R control charts with the Shewhart constants
    sampling.ts             binomial and hypergeometric acceptance probabilities
    format.ts               shared result-panel number formatting
    marking.ts              wafer mark formatting
    yield.ts                yield / reject rate
    yield-model.ts          Poisson / Murphy / Seeds yield models and their inverses
    die-cost.ts             cost per gross die, cost per good die, scrap cost
    capability.ts           Cp / Cpk and the normal-distribution out-of-spec fraction
    confidence.ts           Wilson and Clopper-Pearson binomial intervals, sample size
    throughput.ts           single-step wafers per hour and OEE
    search.ts               Fuse.js wrapper used by the palette and the toolbox page
    favorites.ts            favourite tools store (localStorage, useSyncExternalStore)
    preferences.ts          persisted UI preferences (collapsed categories / rail)
    site.ts                 canonical URL, site name, repository URL
  tools/                    tool registry, mirroring the it-tools structure
    <slug>/index.ts         tool metadata (name, path, description, keywords, category, icon)
    <slug>/Calculator.tsx   the tool UI ('use client')
    index.ts                registry: tools, toolsByCategory, getTool, getRelatedTools
```

The layout follows [it-tools](https://github.com/corentinth/it-tools): a persistent left sidebar with collapsible categories, a command palette (Ctrl/Cmd + K) with fuzzy search, favourite tools pinned to the top, and one uniform tool page layout (title, description, tool, formula, notes, FAQ, related tools).

### Adding a tool

1. Create `src/tools/<slug>/index.ts` with `defineTool({...})` and `src/tools/<slug>/Calculator.tsx` with the UI.
2. Add the tool to `src/tools/index.ts`.
3. Create `src/app/tools/<slug>/page.tsx` that exports `metadata` and renders `<ToolPageShell tool={tool} faq={[...]}>`.
4. Put every calculation in `src/lib/` and unit-test it; keep the component a thin shell.

`src/lib/registry.test.ts` fails if a registered tool has no matching route, a duplicate path, or no keywords, and `getRelatedTools` is covered as well.

## Accuracy policy

- Units are always visible in the UI (`Å`, `nm`, `µm`, `mil`, `mm`, `cm`, `inch`, `m`); a bare number is never shown, and every length conversion goes through one shared table in `src/lib/units.ts`.
- The conversion tools state where a factor comes from: the Torr is exactly 1/760 atm, the inch is exactly 25.4 mm, the Celsius offset is exactly 273.15 K.
- Gas flow treats the reference temperature as an input rather than a hidden constant, because sccm and slm mean nothing without the standard they refer to; molar and mass rows are shown separately from the volumetric ones.
- Temperature separates an absolute reading from a temperature difference, because a difference converts without the offset (10 °C is 50 °F, but a 10 °C rise is an 18 °F rise).
- Wafer die counts are labelled *Estimated usable die* and are **not** a fab cutting result.
- Generic geometry is labelled as generic: results may not match a specific fab, customer, equipment or MES specification.
- Invalid input produces a specific message (`Wafer diameter must be greater than 0.`), never a generic "Invalid input".
- Yield is `Good die / Gross die × 100%`, reject rate is `Defect die / Gross die × 100%`; good + defect die are allowed to be less than gross.
- Yield models (Poisson, Murphy, Seeds) and the defect density derived from them are labelled as model outputs, not measurements, and never as a fab-, customer- or equipment-specific specification. The model shown is named, and it is stated that a real yield can be lower than the model because systematic loss is not modelled.
- Cp/Cpk are computed from the sigma you enter. Whether that sigma makes them Cp/Cpk (short-term) or Pp/Ppk (long-term) is not guessed, and no 1.5σ shift is applied; the out-of-spec fraction is a normal-distribution tail with the mean and sigma given.
- Confidence intervals are binomial sampling intervals for a measured pass rate; they are not a statement about systematic or clustered loss, and the sample-size figure is a normal-approximation planning value.
- Throughput and OEE model one process step; line output is set by the bottleneck step, and the availability / performance / quality factors are inputs you supply rather than assumed defaults.
- Sheet resistance uses the thin-film four-point probe relation with the geometric factor pi / ln 2. The tool prints the thickness / spacing ratio it relied on and warns when the ratio leaves the thin-film regime, and it never claims compliance with a metrology standard.
- The wafer area tool prints the area-only die count as an explicit upper bound (it divides one area by another and cannot tile a circle), not as a die-per-wafer count.
- The reticle field tool counts shots by stepping whole fields and keeping those whose centre lands inside the usable circle. Dice per wafer is therefore an upper bound, and no particular stepper, scanner or field size is assumed.
- The lithography tool prints the Rayleigh half pitch and the paraxial depth of focus, and flags a k1 below 0.25 rather than presenting it as reachable by plain illumination. Numerical apertures above the practical 193 nm immersion ceiling are rejected.
- Etch selectivity is a ratio for one set of conditions and is labelled as such; a blank or zero mask loss is treated as not measured instead of returning an infinite selectivity.
- The uniformity tools name all three numbers the industry calls uniformity (range/mean, half range/mean, coefficient of variation) instead of printing one unlabelled percentage, and they use the n-1 sample standard deviation. With one site the spread is reported as undefined, never as zero.
- Film stress uses the Stoney relation with the substrate biaxial modulus, prints the film-to-substrate thickness ratio it relied on and warns above one percent where Stoney underestimates a stiff film. The type of stress (tensile / compressive) is a selection, not derived from a signed curvature, because curvature sign conventions differ between tools.
- The bow-to-curvature conversion uses the exact chord-and-sagitta relation rather than the small-deflection form L squared over 8 d, so a strongly bowed wafer is not turned into a falsely high curvature.
- The diffusion tool prints all three length scales (root D t, 2 root D t and root 2 D t) with the boundary condition each belongs to, because quoting one as another is a quiet factor-of-two error; the thermal budget is reported as a length squared and is described as additive while the lengths are not.
- Deal-Grove A and B are inputs at the process temperature, not constants: only the classic (100) 1000 C dry and steam pairs ship as presets, and the tool says the model under-predicts growth below roughly 30 nm and ignores the furnace ramp.
- The Arrhenius extractor is a two-parameter fit through two points, so it is exact by construction and says nothing about scatter; temperatures are converted to kelvin with the 273.15 offset and absolute zero is rejected.
- The power converter keeps the linear units (W, hp, BTU/h) and the logarithmic decibel units (dBm, dBW) in one table but never mixes the maths: a zero watt reading has no finite decibel value and is shown as a dash, not as a large negative number.
- Return loss uses the 20 log10 amplitude convention and mismatch loss the 10 log10 power convention, stated on the page because confusing them is a factor-of-two error in dB; a reflection coefficient of 1 or a return loss of 0 dB is rejected as not a passive load.
- The RF power tool asks for the system impedance instead of assuming 50 ohm, and treats the wave as a sine, so its peak and peak-to-peak rows describe a CW sine and not the envelope of a modulated signal.
- The time constant tool uses the exact ln factors (2.197, 4.605, 6.908 tau) rather than the rounded rules of thumb, and states that the single-pole RC model breaks down once a real network has more than one pole.
- The FIT and MTBF tool evaluates 1 - exp(-rate t) as -expm1(-rate t) so a low rate keeps its significant digits, and reports zero failures as "no failures" rather than printing an unbounded MTBF that would look like a measured number.
- The bin rollup is exact arithmetic on real counts and marks the pass bin: when no bin is starred it says the largest bin was assumed to be the pass bin, and it rejects a malformed line by number instead of skipping it and understating the total die.
- The yield / DPPM tool converts a figure already in hand and says so; the sigma and Cpk columns are one-sided normal equivalents, and a 100% yield reports 0 DPPM with a blank sigma because no finite z gives zero defects.
- The normal-distribution helpers are shared, not re-derived: the yield tools reuse erfc / normalCdf from lib/capability.ts and inverseNormalCdf from lib/confidence.ts.
- The microstrip synthesis starts from the Hammerstad fit and then bisects the forward model, so the width that is quoted reproduces the requested impedance instead of carrying the fit's own ~1% error into the answer.
- The stub match prints a re-simulation column: the reported distance and stub length are pushed back through the transmission-line equations and the resulting normalised admittance is compared with 1, so the placement is checked rather than asserted.
- The L-network tool says outright that Q is set by the resistance ratio and that a complex load cannot be matched by an L network alone, instead of accepting a load reactance it would silently ignore.
- The Weibull fit reports its own correlation coefficient and warns when the data does not support the assumption, because a line through six points can look convincing and still be meaningless; it also states that run-out units would need a censored estimator.
- The Weibull page notes that eta is the 63.2 percentile and not the mean, since quoting eta as MTBF overstates life whenever beta is above 1.
- The acceptance sampling tool reports which distribution it used. The binomial and the hypergeometric share a mean but not a spread, so the finite lot is stricter below the mean and more forgiving above it, and leaving that implicit would make the probability look arbitrary.
- The control chart tool states that an in-control chart is a stability claim, not a capability one, and refuses mixed subgroup sizes rather than averaging ranges over different sizes.

## Scripts

```bash
npm run dev     # local development
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
npm run test    # Vitest (unit tests for lib + registry)
```

CI (`.github/workflows/ci.yml`) runs lint, test and build on every push and pull request.

## SEO

Per-tool metadata (title, description, keywords, canonical, Open Graph), one H1 per page, FAQ blocks emitted as `FAQPage` JSON-LD alongside `SoftwareApplication`, `sitemap.xml`, `robots.txt` and a 404 page. The canonical host comes from `NEXT_PUBLIC_SITE_URL` (default `https://semitool.vercel.app`).

## Privacy

No analytics, no cookies, no server-side storage of inputs. Favourites and sidebar preferences stay in `localStorage`.
