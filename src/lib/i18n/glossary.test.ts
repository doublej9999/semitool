import { describe, expect, it } from 'vitest';
import { GLOSSARY } from './glossary/en';
import { GLOSSARY_ZH_CN } from './glossary/zh-CN';
import { GLOSSARY_ZH_TW } from './glossary/zh-TW';
import { GLOSSARY_KO } from './glossary/ko';
import { GLOSSARY_JA } from './glossary/ja';
import { getGlossaryTerm, registerGlossary } from './glossary';

const LOCALE_MAPS: Array<[string, Record<string, string>]> = [
  ['zh-CN', GLOSSARY_ZH_CN],
  ['zh-TW', GLOSSARY_ZH_TW],
  ['ko', GLOSSARY_KO],
  ['ja', GLOSSARY_JA],
];

describe('fab-term glossary', () => {
  it('has a non-empty English value for every key', () => {
    const keys = Object.keys(GLOSSARY);
    expect(keys.length).toBeGreaterThan(80);
    for (const key of keys) {
      expect(typeof GLOSSARY[key], `key ${key} is not a string`).toBe('string');
      expect(GLOSSARY[key].trim().length, `key ${key} is empty`).toBeGreaterThan(0);
    }
  });

  it('has exactly the same keys in every locale with non-empty values', () => {
    const enKeys = Object.keys(GLOSSARY).sort();
    for (const [locale, map] of LOCALE_MAPS) {
      expect(Object.keys(map).sort(), `locale ${locale} key set differs`).toEqual(enKeys);
      for (const key of enKeys) {
        expect(map[key].trim().length, `locale ${locale} key ${key} is empty`).toBeGreaterThan(0);
      }
    }
  });

  it('resolves terms through the cache with English fallback', () => {
    // Unregistered locale falls back to English; unknown key falls back to the key itself.
    expect(getGlossaryTerm('ko', 'waferDiameter')).toBe('Wafer diameter');
    expect(getGlossaryTerm('en', 'notARealKey')).toBe('notARealKey');

    registerGlossary('ko', GLOSSARY_KO);
    expect(getGlossaryTerm('ko', 'waferDiameter')).toBe('웨이퍼 직경');
  });
});
