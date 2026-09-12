import { describe, expect, it } from 'vitest';
import {
  bowToRadius,
  calculateWaferWarpStress,
  radiusToBow,
  SUBSTRATE_PRESETS,
  FILM_PRESETS,
  WAFER_DIAMETER_PRESETS,
  type WaferStressInputs,
} from './wafer-warp-stress';

describe('Wafer Bow & Radius Conversion', () => {
  it('converts radius to bow for 300mm wafer with R = 100m', () => {
    // D = 0.3m, R = 100m => Bow = D^2 / (8*R) = 0.09 / 800 = 1.125e-4 m = 112.5 um
    const bow = radiusToBow(100, 300);
    expect(bow).toBeCloseTo(112.5, 4);
  });

  it('converts bow to radius for 300mm wafer with Bow = 112.5 um', () => {
    const radius = bowToRadius(112.5, 300);
    expect(radius).toBeCloseTo(100, 4);
  });

  it('handles flat wafer (infinite radius = 0 bow and 0 bow = infinite radius)', () => {
    expect(radiusToBow(Number.POSITIVE_INFINITY, 300)).toBe(0);
    expect(radiusToBow(Number.NEGATIVE_INFINITY, 200)).toBe(0);
    expect(bowToRadius(0, 300)).toBe(Number.POSITIVE_INFINITY);
  });

  it('preserves signs correctly (negative radius yields negative bow)', () => {
    const bow = radiusToBow(-50, 200);
    // D = 0.2m, R = -50m => Bow = 0.04 / (8 * -50) = -0.0001m = -100 um
    expect(bow).toBeCloseTo(-100, 4);
    const radius = bowToRadius(-100, 200);
    expect(radius).toBeCloseTo(-50, 4);
  });

  it('is a bidirectional inverse for arbitrary valid inputs', () => {
    const diameters = [100, 150, 200, 300];
    for (const d of diameters) {
      const originalRadius = 75.5;
      const computedBow = radiusToBow(originalRadius, d);
      const invertedRadius = bowToRadius(computedBow, d);
      expect(invertedRadius).toBeCloseTo(originalRadius, 4);
    }
  });

  it('returns NaN for invalid geometry inputs', () => {
    expect(radiusToBow(0, 300)).toBeNaN();
    expect(radiusToBow(100, -10)).toBeNaN();
    expect(bowToRadius(50, 0)).toBeNaN();
    expect(bowToRadius(Number.NaN, 300)).toBeNaN();
  });
});

describe('Stoney Equation & Stress Sign Conventions', () => {
  const baseSi100Input: WaferStressInputs = {
    biaxialModulusGPa: 180.5,
    thermalExpansionSubstratePpm: 2.6,
    waferDiameterMm: 300,
    substrateThicknessUm: 775,
    filmThicknessNm: 500,
    youngsModulusFilmGPa: 70,
    poissonRatioFilm: 0.17,
    thermalExpansionFilmPpm: 0.5,
    fractureToughness: 4.0,
    curvatureMode: 'radius',
    radiusPreM: Number.POSITIVE_INFINITY, // initially flat
    radiusPostM: 100, // curved concave
    tempDepositionC: 25,
    tempMeasurementC: 25,
  };

  it('calculates tensile stress for positive curvature change (concave / smiling)', () => {
    const res = calculateWaferWarpStress(baseSi100Input);
    expect(res.ok).toBe(true);
    // Ms = 180.5 GPa, ts = 775 um, tf = 500 nm, R_pre = inf, R_post = 100m
    // sigma = (180.5e9 * (7.75e-4)^2) / (6 * 500e-9) * (1/100) = 361.37 MPa
    expect(res.totalStressMPa).toBeCloseTo(361.37, 1);
    expect(res.stressType).toBe('tensile');
  });

  it('calculates compressive stress for negative curvature change (convex / frowning)', () => {
    const res = calculateWaferWarpStress({
      ...baseSi100Input,
      radiusPostM: -100,
    });
    expect(res.ok).toBe(true);
    expect(res.totalStressMPa).toBeCloseTo(-361.37, 1);
    expect(res.stressType).toBe('compressive');
  });

  it('produces identical stress between radius mode and bow mode', () => {
    const resRadius = calculateWaferWarpStress({
      ...baseSi100Input,
      radiusPreM: 200,
      radiusPostM: 50,
    });

    const bowPre = radiusToBow(200, 300);
    const bowPost = radiusToBow(50, 300);

    const resBow = calculateWaferWarpStress({
      ...baseSi100Input,
      curvatureMode: 'bow',
      bowPreUm: bowPre,
      bowPostUm: bowPost,
    });

    expect(resRadius.ok).toBe(true);
    expect(resBow.ok).toBe(true);
    expect(resBow.totalStressMPa).toBeCloseTo(resRadius.totalStressMPa, 3);
    expect(resBow.bowDeltaUm).toBeCloseTo(bowPost - bowPre, 3);
  });
});

describe('Thermal Mismatch Stress & Intrinsic Separation', () => {
  it('calculates compressive thermal stress for SiO2 on Si (alpha_film < alpha_substrate)', () => {
    // SiO2: alpha_f = 0.5e-6, Si: alpha_s = 2.6e-6, Ef = 70 GPa, nu_f = 0.17
    // M_f = 70 / (1 - 0.17) = 84.337 GPa
    // T_dep = 1000 C, T_meas = 25 C => deltaT = -975 C
    // delta_alpha = (2.6 - 0.5)e-6 = 2.1e-6
    // sigma_th = 84.337e9 * 2.1e-6 * (-975) = -172.68 MPa
    const res = calculateWaferWarpStress({
      biaxialModulusGPa: 180.5,
      thermalExpansionSubstratePpm: 2.6,
      waferDiameterMm: 300,
      substrateThicknessUm: 775,
      filmThicknessNm: 500,
      youngsModulusFilmGPa: 70,
      poissonRatioFilm: 0.17,
      thermalExpansionFilmPpm: 0.5,
      fractureToughness: 4.0,
      curvatureMode: 'radius',
      radiusPreM: Number.POSITIVE_INFINITY,
      radiusPostM: 100,
      tempDepositionC: 1000,
      tempMeasurementC: 25,
    });

    expect(res.ok).toBe(true);
    expect(res.thermalStressMPa).toBeCloseTo(-172.68, 1);
  });

  it('calculates tensile thermal stress for Al metal on Si (alpha_film > alpha_substrate)', () => {
    // Sputtered Al: alpha_f = 23.1e-6, Si: alpha_s = 2.6e-6
    // Ef = 70 GPa, nu_f = 0.33 => M_f = 70 / (1 - 0.33) = 104.478 GPa
    // deltaT = 25 - 300 = -275 C
    // delta_alpha = 2.6 - 23.1 = -20.5e-6
    // sigma_th = 104.478e9 * (-20.5e-6) * (-275) = +589.0 MPa (tensile)
    const res = calculateWaferWarpStress({
      biaxialModulusGPa: 180.5,
      thermalExpansionSubstratePpm: 2.6,
      waferDiameterMm: 300,
      substrateThicknessUm: 775,
      filmThicknessNm: 500,
      youngsModulusFilmGPa: 70,
      poissonRatioFilm: 0.33,
      thermalExpansionFilmPpm: 23.1,
      fractureToughness: 12.0,
      curvatureMode: 'radius',
      radiusPreM: Number.POSITIVE_INFINITY,
      radiusPostM: 100,
      tempDepositionC: 300,
      tempMeasurementC: 25,
    });

    expect(res.ok).toBe(true);
    expect(res.thermalStressMPa).toBeCloseTo(589.0, 0);
  });

  it('correctly isolates intrinsic stress as sigma_total - sigma_thermal', () => {
    const res = calculateWaferWarpStress({
      biaxialModulusGPa: 180.5,
      thermalExpansionSubstratePpm: 2.6,
      waferDiameterMm: 300,
      substrateThicknessUm: 775,
      filmThicknessNm: 500,
      youngsModulusFilmGPa: 70,
      poissonRatioFilm: 0.17,
      thermalExpansionFilmPpm: 0.5,
      fractureToughness: 4.0,
      curvatureMode: 'radius',
      radiusPreM: Number.POSITIVE_INFINITY,
      radiusPostM: 100,
      tempDepositionC: 1000,
      tempMeasurementC: 25,
    });

    expect(res.ok).toBe(true);
    expect(res.intrinsicStressMPa).toBeCloseTo(res.totalStressMPa - res.thermalStressMPa, 4);
  });
});

describe('Critical Cracking Thickness & Failure Limits', () => {
  it('computes critical cracking thickness hc accurately', () => {
    // hc = (Gamma * Ef) / (Z * sigma^2)
    // Gamma = 4.0 J/m^2, Ef = 70e9 Pa, Z = 1.12
    // totalStress = 361.37 MPa = 3.6137e8 Pa
    // hc = (4 * 70e9) / (1.12 * (3.6137e8)^2) = 2.8e11 / 1.4626e17 = 1.914e-6 m = 1914 nm
    const res = calculateWaferWarpStress({
      biaxialModulusGPa: 180.5,
      thermalExpansionSubstratePpm: 2.6,
      waferDiameterMm: 300,
      substrateThicknessUm: 775,
      filmThicknessNm: 500,
      youngsModulusFilmGPa: 70,
      poissonRatioFilm: 0.17,
      thermalExpansionFilmPpm: 0.5,
      fractureToughness: 4.0,
      crackShapeFactorZ: 1.12,
      curvatureMode: 'radius',
      radiusPreM: Number.POSITIVE_INFINITY,
      radiusPostM: 100,
      tempDepositionC: 25,
      tempMeasurementC: 25,
    });

    expect(res.ok).toBe(true);
    expect(res.criticalThicknessNm).toBeCloseTo(1914, 0);
    expect(res.exceedsCriticalThickness).toBe(false);
  });

  it('triggers critical cracking warning when film thickness exceeds hc', () => {
    // With R_post = 10m, sigma = 3613.7 MPa => hc ≈ 19.14 nm, while tf = 500 nm > hc
    const highStressRes = calculateWaferWarpStress({
      biaxialModulusGPa: 180.5,
      thermalExpansionSubstratePpm: 2.6,
      waferDiameterMm: 300,
      substrateThicknessUm: 775,
      filmThicknessNm: 500,
      youngsModulusFilmGPa: 70,
      poissonRatioFilm: 0.17,
      thermalExpansionFilmPpm: 0.5,
      fractureToughness: 4.0,
      curvatureMode: 'radius',
      radiusPreM: Number.POSITIVE_INFINITY,
      radiusPostM: 10,
      tempDepositionC: 25,
      tempMeasurementC: 25,
    });

    expect(highStressRes.ok).toBe(true);
    expect(highStressRes.criticalThicknessNm).toBeCloseTo(19.14, 0);
    expect(highStressRes.exceedsCriticalThickness).toBe(true);
    expect(highStressRes.warnings.some((w) => w.includes('exceeds critical'))).toBe(true);
  });

  it('flags warning when thickness ratio tf / ts exceeds 1.0%', () => {
    // ts = 500 um = 500,000 nm. 1% is 5,000 nm.
    const res = calculateWaferWarpStress({
      biaxialModulusGPa: 180.5,
      thermalExpansionSubstratePpm: 2.6,
      waferDiameterMm: 100,
      substrateThicknessUm: 500,
      filmThicknessNm: 6000, // 1.2%
      youngsModulusFilmGPa: 70,
      poissonRatioFilm: 0.17,
      thermalExpansionFilmPpm: 0.5,
      fractureToughness: 4.0,
      curvatureMode: 'radius',
      radiusPreM: 100,
      radiusPostM: 50,
      tempDepositionC: 25,
      tempMeasurementC: 25,
    });

    expect(res.ok).toBe(true);
    expect(res.isThicknessRatioValid).toBe(false);
    expect(res.warnings.some((w) => w.includes('thickness ratio'))).toBe(true);
  });

  it('flags lithography chucking warning when bow exceeds 150 um', () => {
    // Bow = 160 um on 300 mm wafer
    const res = calculateWaferWarpStress({
      biaxialModulusGPa: 180.5,
      thermalExpansionSubstratePpm: 2.6,
      waferDiameterMm: 300,
      substrateThicknessUm: 775,
      filmThicknessNm: 500,
      youngsModulusFilmGPa: 70,
      poissonRatioFilm: 0.17,
      thermalExpansionFilmPpm: 0.5,
      fractureToughness: 4.0,
      curvatureMode: 'bow',
      bowPreUm: 0,
      bowPostUm: 160,
      tempDepositionC: 25,
      tempMeasurementC: 25,
    });

    expect(res.ok).toBe(true);
    expect(res.warpPostUm).toBe(160);
    expect(res.warnings.some((w) => w.includes('chucking failure'))).toBe(true);
  });
});

describe('Input Validation Guards', () => {
  it('guards against non-positive substrate thickness', () => {
    const res = calculateWaferWarpStress({
      biaxialModulusGPa: 180.5,
      thermalExpansionSubstratePpm: 2.6,
      waferDiameterMm: 300,
      substrateThicknessUm: 0,
      filmThicknessNm: 500,
      youngsModulusFilmGPa: 70,
      poissonRatioFilm: 0.17,
      thermalExpansionFilmPpm: 0.5,
      fractureToughness: 4.0,
      curvatureMode: 'radius',
      radiusPreM: 100,
      radiusPostM: 50,
      tempDepositionC: 25,
      tempMeasurementC: 25,
    });

    expect(res.ok).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('guards against non-positive film thickness or diameter', () => {
    const resFilm = calculateWaferWarpStress({
      biaxialModulusGPa: 180.5,
      thermalExpansionSubstratePpm: 2.6,
      waferDiameterMm: 300,
      substrateThicknessUm: 775,
      filmThicknessNm: -10,
      youngsModulusFilmGPa: 70,
      poissonRatioFilm: 0.17,
      thermalExpansionFilmPpm: 0.5,
      fractureToughness: 4.0,
      curvatureMode: 'radius',
      radiusPreM: 100,
      radiusPostM: 50,
      tempDepositionC: 25,
      tempMeasurementC: 25,
    });
    expect(resFilm.ok).toBe(false);

    const resDia = calculateWaferWarpStress({
      biaxialModulusGPa: 180.5,
      thermalExpansionSubstratePpm: 2.6,
      waferDiameterMm: 0,
      substrateThicknessUm: 775,
      filmThicknessNm: 500,
      youngsModulusFilmGPa: 70,
      poissonRatioFilm: 0.17,
      thermalExpansionFilmPpm: 0.5,
      fractureToughness: 4.0,
      curvatureMode: 'radius',
      radiusPreM: 100,
      radiusPostM: 50,
      tempDepositionC: 25,
      tempMeasurementC: 25,
    });
    expect(resDia.ok).toBe(false);
  });

  it('guards against unphysical Poisson ratio >= 1 or <= -1', () => {
    const res = calculateWaferWarpStress({
      biaxialModulusGPa: 180.5,
      thermalExpansionSubstratePpm: 2.6,
      waferDiameterMm: 300,
      substrateThicknessUm: 775,
      filmThicknessNm: 500,
      youngsModulusFilmGPa: 70,
      poissonRatioFilm: 1.0,
      thermalExpansionFilmPpm: 0.5,
      fractureToughness: 4.0,
      curvatureMode: 'radius',
      radiusPreM: 100,
      radiusPostM: 50,
      tempDepositionC: 25,
      tempMeasurementC: 25,
    });
    expect(res.ok).toBe(false);
  });

  it('guards against zero post-process radius', () => {
    const res = calculateWaferWarpStress({
      biaxialModulusGPa: 180.5,
      thermalExpansionSubstratePpm: 2.6,
      waferDiameterMm: 300,
      substrateThicknessUm: 775,
      filmThicknessNm: 500,
      youngsModulusFilmGPa: 70,
      poissonRatioFilm: 0.17,
      thermalExpansionFilmPpm: 0.5,
      fractureToughness: 4.0,
      curvatureMode: 'radius',
      radiusPreM: 100,
      radiusPostM: 0,
      tempDepositionC: 25,
      tempMeasurementC: 25,
    });
    expect(res.ok).toBe(false);
  });
});

describe('Preset Constants Verification', () => {
  it('verifies all required substrate biaxial moduli from prompt', () => {
    const si100 = SUBSTRATE_PRESETS.find((s) => s.id === 'si100');
    expect(si100?.biaxialModulusGPa).toBe(180.5);

    const si111 = SUBSTRATE_PRESETS.find((s) => s.id === 'si111');
    expect(si111?.biaxialModulusGPa).toBe(229.0);

    const gaas100 = SUBSTRATE_PRESETS.find((s) => s.id === 'gaas100');
    expect(gaas100?.biaxialModulusGPa).toBe(123.9);

    const sic4h = SUBSTRATE_PRESETS.find((s) => s.id === 'sic4h');
    expect(sic4h?.biaxialModulusGPa).toBe(501.0);

    const fusedSilica = SUBSTRATE_PRESETS.find((s) => s.id === 'fused-silica');
    expect(fusedSilica?.biaxialModulusGPa).toBe(85.0);

    const sapphire = SUBSTRATE_PRESETS.find((s) => s.id === 'sapphire');
    expect(sapphire?.biaxialModulusGPa).toBe(603.0);
  });

  it('verifies wafer diameter presets and default thicknesses', () => {
    expect(WAFER_DIAMETER_PRESETS).toHaveLength(4);
    const d300 = WAFER_DIAMETER_PRESETS.find((w) => w.diameterMm === 300);
    expect(d300?.defaultThicknessUm).toBe(775);
    const d200 = WAFER_DIAMETER_PRESETS.find((w) => w.diameterMm === 200);
    expect(d200?.defaultThicknessUm).toBe(725);
  });

  it('verifies film presets exist and contain required materials', () => {
    const requiredFilmIds = [
      'sio2-thermal',
      'si3n4-pecvd',
      'poly-si-lpcvd',
      'cu-sputtered',
      'al-sputtered',
      'al2o3-ald',
      'tin-sputtered',
    ];
    for (const id of requiredFilmIds) {
      const film = FILM_PRESETS.find((f) => f.id === id);
      expect(film).toBeDefined();
      expect(film?.youngsModulusGPa).toBeGreaterThan(0);
      expect(film?.poissonRatio).toBeGreaterThan(0);
    }
  });
});
