import { describe, expect, it } from 'vitest';
import { findToolsForQuery, SYNONYM_MAP, type ToolMatch } from './tool-finder';
import { registerToolTranslations } from '@/lib/i18n/tool-translations';
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
    expect(entries.length).toBeGreaterThanOrEqual(60);
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
