import { describe, expect, it } from 'vitest';
import { findToolsForQuery, SYNONYM_MAP, type ToolMatch } from './tool-finder';
import { getTranslatedTool, registerToolTranslations } from '@/lib/i18n/tool-translations';
import { en } from '@/lib/i18n/tool-dictionaries/en';
import { zhCN } from '@/lib/i18n/tool-dictionaries/zh-CN';
import { ja } from '@/lib/i18n/tool-dictionaries/ja';
import { ko } from '@/lib/i18n/tool-dictionaries/ko';
import { tools } from '@/tools';

// getTranslatedTool reads a synchronous cache; install the dictionaries the
// browser would have loaded lazily so localized matching is exercised here.
registerToolTranslations('en', en);
registerToolTranslations('zh-CN', zhCN);
registerToolTranslations('ja', ja);
registerToolTranslations('ko', ko);

function topPath(query: string, locale: Parameters<typeof findToolsForQuery>[1]): string {
  const [top] = findToolsForQuery(query, locale, tools);
  if (!top) throw new Error(`no match for: ${query}`);
  return top.tool.path;
}

function topPaths(query: string, locale: Parameters<typeof findToolsForQuery>[1]): string[] {
  return findToolsForQuery(query, locale, tools).map((match) => match.tool.path);
}

describe('findToolsForQuery (English)', () => {
  it('matches a die-count question to the wafer die calculator', () => {
    expect(topPath('how many dies fit on a 300mm wafer', 'en')).toBe('/tools/wafer-die-calculator');
  });

  it('matches an oxide color question to the film color calculator', () => {
    expect(topPath('what color will 100nm oxide look', 'en')).toBe('/tools/film-color-calculator');
  });

  it('matches a bent wafer to the warp/stress tools', () => {
    expect(['/tools/wafer-warp-stress-calculator', '/tools/film-stress-calculator']).toContain(
      topPath('wafer is bent after deposition', 'en'),
    );
  });

  it('matches leakage complaints to the junction depletion calculator', () => {
    expect(topPath('reduce leaks in my SRAM', 'en')).toBe('/tools/semiconductor-depletion-calculator');
  });

  it('matches capability questions to the process capability calculator', () => {
    expect(topPath('check if my process is capable', 'en')).toBe('/tools/process-capability-calculator');
  });

  it('matches slurry removal to the CMP Preston calculator', () => {
    expect(topPath('slurry removal rate on my polisher', 'en')).toBe('/tools/cmp-preston-calculator');
  });

  it('matches impedance matching to an RF match tool', () => {
    expect(['/tools/impedance-matching-calculator', '/tools/return-loss-calculator']).toContain(
      topPath('match impedance 50 ohm', 'en'),
    );
  });

  it('matches a low-yield complaint to the yield calculator', () => {
    expect(topPath('my wafer yield is low', 'en')).toBe('/tools/yield-calculator');
  });

  it('matches wafers-per-hour throughput to the throughput calculator', () => {
    expect(topPath('how many wafers per hour can my tool run', 'en')).toBe('/tools/throughput-calculator');
  });

  it('respects the limit and returns ranked positive-score matches only', () => {
    const matches = findToolsForQuery('how many dies fit on a 300mm wafer', 'en', tools);
    expect(matches.length).toBeLessThanOrEqual(3);
    for (const match of matches) {
      expect(match.score).toBeGreaterThan(0);
      expect(match.matchedTerms.length).toBeGreaterThan(0);
    }
    const scores = matches.map((match) => match.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });
});

describe('findToolsForQuery (CJK)', () => {
  it('matches simplified Chinese die-count phrasing', () => {
    expect(topPath('晶圆能切多少颗', 'zh-CN')).toBe('/tools/wafer-die-calculator');
  });

  it('matches simplified Chinese film-color phrasing', () => {
    expect(topPath('薄膜是什么颜色', 'zh-CN')).toBe('/tools/film-color-calculator');
  });

  it('matches Japanese film-color phrasing', () => {
    expect(topPath('ウェーハの色を調べたい', 'ja')).toBe('/tools/film-color-calculator');
  });

  it('matches Korean yield phrasing', () => {
    expect(topPath('웨이퍼 수율을 계산하고 싶어', 'ko')).toBe('/tools/yield-calculator');
  });
});

// --- Per-category intent spot checks (new SYNONYM_MAP entries) -----------------

describe('intents: Wafer & Die', () => {
  it('matches usable-area questions to the wafer area calculator', () => {
    expect(topPath('what is my usable wafer area', 'en')).toBe('/tools/wafer-area-calculator');
    expect(topPath('晶圆有效面积', 'zh-CN')).toBe('/tools/wafer-area-calculator');
  });

  it('matches pass/fail map requests to the wafer map generator', () => {
    expect(topPath('pass fail die map', 'en')).toBe('/tools/wafer-map-generator');
  });
});

describe('intents: Mark & Traceability', () => {
  it('matches wafer laser marking questions to the wafer mark calculator', () => {
    expect(topPath('semi m12 checksum', 'en')).toBe('/tools/wafer-mark-calculator');
    expect(topPath('웨이퍼 레이저 마킹', 'ko')).toBe('/tools/wafer-mark-calculator');
    expect(topPath('ウェーハ刻印チェック', 'ja')).toBe('/tools/wafer-mark-calculator');
  });
});

describe('intents: Yield & Quality', () => {
  it('matches yield-model comparisons to the yield model calculator', () => {
    expect(topPath('murphy model comparison', 'en')).toBe('/tools/yield-model-calculator');
    expect(topPath('수율 모델 비교', 'ko')).toBe('/tools/yield-model-calculator');
  });

  it('matches DPPM conversions to the yield DPPM calculator', () => {
    expect(topPath('yield to dppm conversion', 'en')).toBe('/tools/yield-dppm-calculator');
  });

  it('matches wafer-sort binning to the bin yield calculator', () => {
    expect(topPath('wafer sort bin distribution', 'en')).toBe('/tools/bin-yield-calculator');
  });

  it('matches split-lot experiments to the split-lot calculator', () => {
    expect(topPath('split lot doe wafers', 'en')).toBe('/tools/split-lot-calculator');
  });

  it('matches solder-joint thermal cycling to the thermal fatigue calculator', () => {
    expect(topPath('solder joints cracking temperature cycling', 'en')).toBe(
      '/tools/thermal-fatigue-calculator',
    );
    expect(topPath('はんだ接合の温度サイクル', 'ja')).toBe('/tools/thermal-fatigue-calculator');
  });
});

describe('intents: Metrology & Layout', () => {
  it('matches design-rule questions to the DRC checker', () => {
    expect(topPath('design rule check before tapeout', 'en')).toBe('/tools/drc-rule-checker');
    expect(topPath('版图设计规则检查', 'zh-CN')).toBe('/tools/drc-rule-checker');
  });

  it('matches RC delay complaints to the layout parasitics estimator', () => {
    expect(topPath('rc delay and ir drop', 'en')).toBe('/tools/layout-parasitics-calculator');
  });

  it('matches MOSFET threshold questions to the threshold voltage calculator', () => {
    expect(topPath('mosfet threshold voltage', 'en')).toBe('/tools/mosfet-threshold-calculator');
  });

  it('matches KLARF parsing to the STDF/KLARF explorer', () => {
    expect(topPath('parse klarf wafer test data', 'en')).toBe('/tools/stdf-klarf-explorer');
    expect(topPath('klarfファイル解析', 'ja')).toBe('/tools/stdf-klarf-explorer');
  });

  it('matches stepper field questions to the reticle field calculator', () => {
    expect(topPath('reticle field dies per shot', 'en')).toBe('/tools/reticle-field-calculator');
  });
});

describe('intents: Lithography & Etch', () => {
  it('matches RIE lag complaints to the ARDE calculator', () => {
    expect(topPath('rie lag in deep trenches', 'en')).toBe('/tools/arde-etch-calculator');
    expect(topPath('rieラグとマイクロローディング', 'ja')).toBe('/tools/arde-etch-calculator');
  });

  it('matches CD uniformity questions to the CD uniformity calculator', () => {
    expect(topPath('线宽均匀性', 'zh-CN')).toBe('/tools/cd-uniformity-calculator');
    expect(topPath('cd 균일도 분석', 'ko')).toBe('/tools/cd-uniformity-calculator');
  });

  it('matches film thickness uniformity to the uniformity calculator', () => {
    expect(topPath('film thickness uniformity', 'en')).toBe('/tools/film-uniformity-calculator');
    expect(topPath('条纹均匀性', 'zh-CN')).toBe('/tools/film-uniformity-calculator');
  });

  it('matches chamber etching questions to an etch/plasma tool', () => {
    expect(['/tools/etch-rate-calculator', '/tools/plasma-sheath-calculator']).toContain(
      topPath('is my chamber pressure right for etching silicon nitride', 'en'),
    );
  });
});

describe('intents: Thin Film & Deposition', () => {
  it('matches CMP endpoint questions to the endpoint calculator', () => {
    expect(topPath('cmp endpoint detection', 'en')).toBe('/tools/cmp-endpoint-calculator');
    expect(topPath('cmp 종말점 패드 수명', 'ko')).toBe('/tools/cmp-endpoint-calculator');
  });

  it('matches damascene superfill problems to the copper plating calculator', () => {
    expect(topPath('damascene trench superfill void', 'en')).toBe('/tools/cu-plating-calculator');
    expect(topPath('铜电镀填孔', 'zh-CN')).toBe('/tools/cu-plating-calculator');
  });

  it('matches chuck slipping to the wafer warp/stress calculator', () => {
    expect(topPath('my wafers keep slipping at the chuck', 'en')).toBe(
      '/tools/wafer-warp-stress-calculator',
    );
  });
});

describe('intents: Thermal & Diffusion', () => {
  it('matches activation energy extraction to the Arrhenius calculator', () => {
    expect(topPath('activation energy from two temperatures', 'en')).toBe(
      '/tools/arrhenius-calculator',
    );
    expect(topPath('活化能计算', 'zh-CN')).toBe('/tools/arrhenius-calculator');
  });

  it('matches curve fitting to the parameter extraction calculator', () => {
    expect(topPath('fit oxidation data to a curve', 'en')).toBe('/tools/curve-fitting-calculator');
  });

  it('matches junction depth questions to the dopant diffusion calculator', () => {
    expect(topPath('junction depth after drive in', 'en')).toBe('/tools/dopant-diffusion-calculator');
  });

  it('matches junction temperature complaints to the thermal resistance calculator', () => {
    expect(topPath('junction temperature too hot', 'en')).toBe(
      '/tools/thermal-resistance-calculator',
    );
    expect(topPath('접합 온도 열저항', 'ko')).toBe('/tools/thermal-resistance-calculator');
  });
});

describe('intents: RF & Signal', () => {
  it('matches reflected power complaints to the RF power calculator', () => {
    expect(topPath('too much reflected power', 'en')).toBe('/tools/rf-power-calculator');
    expect(topPath('反射功率太大', 'zh-CN')).toBe('/tools/rf-power-calculator');
  });

  it('matches microstrip questions to the microstrip calculator', () => {
    expect(topPath('microstrip trace width', 'en')).toBe('/tools/microstrip-calculator');
    expect(topPath('마이크로스트립 임피던스', 'ko')).toBe('/tools/microstrip-calculator');
  });

  it('matches stub tuner questions to the stub matching calculator', () => {
    expect(topPath('single stub tuner', 'en')).toBe('/tools/stub-matching-calculator');
  });
});

describe('intents: Unit Conversion', () => {
  it('matches thickness unit conversions to the thickness converter', () => {
    expect(topPath('angstrom to nanometer', 'en')).toBe('/tools/thickness-converter');
  });

  it('matches dBm conversions to the power converter', () => {
    expect(topPath('dbm to watts', 'en')).toBe('/tools/power-converter');
  });

  it('matches time constant questions to the RC/RL calculator', () => {
    expect(topPath('時定数を計算', 'ja')).toBe('/tools/time-constant-calculator');
  });

  it('matches mTorr vacuum conversions to the pressure converter', () => {
    expect(topPath('mtorr to pascal', 'en')).toBe('/tools/pressure-converter');
  });
});

describe('intents: Wet Process & Clean', () => {
  it('matches bath lifetime questions to the wet bench calculator', () => {
    expect(topPath('hydrofluoric bath lifetime', 'en')).toBe('/tools/wet-bench-calculator');
    expect(topPath('药液槽寿命', 'zh-CN')).toBe('/tools/wet-bench-calculator');
    expect(topPath('불산 배스 수명', 'ko')).toBe('/tools/wet-bench-calculator');
  });

  it('matches wafer contamination cleanup to a wet clean tool', () => {
    expect(['/tools/wet-bench-calculator', '/tools/chemical-dilution-calculator']).toContain(
      topPath('웨이퍼 오염 제거', 'ko'),
    );
  });
});

describe('findToolsForQuery (edge cases)', () => {
  it('is deterministic for repeated queries', () => {
    const query = 'wafer is bent after deposition';
    const first = findToolsForQuery(query, 'en', tools);
    const second = findToolsForQuery(query, 'en', tools);
    expect(second).toEqual(first);
    expect(second.map((m: ToolMatch) => m.tool.path)).toEqual(first.map((m: ToolMatch) => m.tool.path));
  });

  it('returns an empty list for empty, tiny or stopword-only queries', () => {
    expect(findToolsForQuery('', 'en', tools)).toEqual([]);
    expect(findToolsForQuery('   ', 'en', tools)).toEqual([]);
    expect(findToolsForQuery('a', 'en', tools)).toEqual([]);
    expect(findToolsForQuery('the is of', 'en', tools)).toEqual([]);
  });

  it('caps results at the requested limit', () => {
    expect(findToolsForQuery('wafer yield die', 'en', tools, 1)).toHaveLength(1);
    expect(findToolsForQuery('wafer yield die', 'en', tools, 5).length).toBeLessThanOrEqual(5);
  });
});

describe('SYNONYM_MAP coverage', () => {
  it('covers a broad set of intents with non-empty lowercase term lists', () => {
    const entries = Object.entries(SYNONYM_MAP);
    expect(entries.length).toBeGreaterThanOrEqual(200);
    for (const [phrase, targets] of entries) {
      expect(phrase).toBe(phrase.toLowerCase().trim());
      expect(targets.length).toBeGreaterThan(0);
      for (const target of targets) {
        expect(target).toBe(target.toLowerCase());
      }
    }
  });

  it('includes CJK phrasings for Chinese, Japanese and Korean intents', () => {
    const han = /[\u3400-\u9fff]/; // Chinese + Japanese kanji
    const kana = /[\u3040-\u30ff]/; // Hiragana + Katakana
    const hangul = /[\uac00-\ud7af]/;
    const keys = Object.keys(SYNONYM_MAP);
    expect(keys.filter((key) => han.test(key) && !kana.test(key)).length).toBeGreaterThanOrEqual(10);
    expect(keys.filter((key) => kana.test(key)).length).toBeGreaterThanOrEqual(5);
    expect(keys.filter((key) => hangul.test(key)).length).toBeGreaterThanOrEqual(5);
  });
});

describe('SYNONYM_MAP target liveness', () => {
  // Mirror of tool-finder matching rules: fields are normalized the same way,
  // latin targets match on word boundaries, CJK/spaced targets as substrings.
  const CJK = /[\u3040-\u30ff\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af\u3130-\u318f]/;
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const fieldMatches = (field: string, term: string) => {
    if (CJK.test(term) || term.includes(' ')) return field.includes(term);
    return new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(field);
  };

  const registryFields: string[] = [];
  type Locale = Parameters<typeof findToolsForQuery>[1];
  const locales: Locale[] = ['en', 'zh-CN', 'ja', 'ko'];
  for (const locale of locales) {
    for (const tool of tools) {
      const { name, description, keywords } = getTranslatedTool(tool, locale);
      registryFields.push(normalize(name), normalize(description), ...keywords.map(normalize));
    }
  }

  it('only points at terms that exist in some localized registry field', () => {
    const dead: string[] = [];
    for (const [phrase, targets] of Object.entries(SYNONYM_MAP)) {
      for (const target of targets) {
        if (!registryFields.some((field) => fieldMatches(field, target))) {
          dead.push(`"${phrase}" -> "${target}"`);
        }
      }
    }
    expect(dead).toEqual([]);
  });
});

describe('registry coverage gate (every tool reachable in the top 3)', () => {
  /** Locale that a phrase is most natural in, derived from its script. */
  function localeForPhrase(phrase: string): 'en' | 'zh-CN' | 'ja' | 'ko' {
    if (/[\u3040-\u30ff]/.test(phrase)) return 'ja';
    if (/[\uac00-\ud7af]/.test(phrase)) return 'ko';
    if (/[\u3400-\u9fff]/.test(phrase)) return 'zh-CN';
    return 'en';
  }

  const top3ByPhrase = new Map<string, string[]>();
  for (const phrase of Object.keys(SYNONYM_MAP)) {
    top3ByPhrase.set(phrase, topPaths(phrase, localeForPhrase(phrase)));
  }

  it('reaches every registered tool in the top 3 for at least one intent phrase', () => {
    const reachable = new Set<string>();
    for (const paths of top3ByPhrase.values()) {
      for (const path of paths) reachable.add(path);
    }
    const unreachable = tools.filter((tool) => !reachable.has(tool.path)).map((tool) => tool.path);
    expect(unreachable).toEqual([]);
  });

  it('returns at least one top-3 match for every intent phrase', () => {
    const dead = [...top3ByPhrase.entries()].filter(([, paths]) => paths.length === 0).map(([phrase]) => phrase);
    expect(dead).toEqual([]);
  });

  it('exposes the ranked sample queries used by the UI smoke checks', () => {
    const samples: Array<[string, Parameters<typeof findToolsForQuery>[1], string]> = [
      ['how many dies fit on a 300mm wafer', 'en', '/tools/wafer-die-calculator'],
      ['hydrofluoric bath lifetime', 'en', '/tools/wet-bench-calculator'],
      ['条纹均匀性', 'zh-CN', '/tools/film-uniformity-calculator'],
      ['ウェーハの反り', 'ja', '/tools/wafer-warp-stress-calculator'],
      ['웨이퍼 오염 제거', 'ko', '/tools/wet-bench-calculator'],
    ];
    for (const [query, locale, expected] of samples) {
      expect(topPaths(query, locale)).toContain(expected);
    }
  });
});
