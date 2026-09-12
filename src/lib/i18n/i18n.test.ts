import { describe, expect, it } from 'vitest';
import { matchLocaleFromCountry, matchLocaleFromBrowser, SUPPORTED_LOCALES } from './context';
import { getTranslation, translateCategory } from './translations';

describe('i18n Locale Resolution', () => {
  it('maps country codes to correct regional languages', () => {
    expect(matchLocaleFromCountry('CN')).toBe('zh-CN');
    expect(matchLocaleFromCountry('TW')).toBe('zh-TW');
    expect(matchLocaleFromCountry('HK')).toBe('zh-TW');
    expect(matchLocaleFromCountry('MO')).toBe('zh-TW');
    expect(matchLocaleFromCountry('KR')).toBe('ko');
    expect(matchLocaleFromCountry('JP')).toBe('ja');
    expect(matchLocaleFromCountry('US')).toBe('en');
    expect(matchLocaleFromCountry('DE')).toBe('en');
    expect(matchLocaleFromCountry('SG')).toBe('en');
  });

  it('matches browser language preferences properly', () => {
    expect(matchLocaleFromBrowser(['zh-CN', 'en-US'])).toBe('zh-CN');
    expect(matchLocaleFromBrowser(['zh-TW', 'zh-HK'])).toBe('zh-TW');
    expect(matchLocaleFromBrowser(['ko-KR', 'en'])).toBe('ko');
    expect(matchLocaleFromBrowser(['ja-JP'])).toBe('ja');
    expect(matchLocaleFromBrowser(['fr-FR', 'es-ES'])).toBe('en');
  });

  it('provides translations for all supported locales', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const trans = getTranslation(locale.code);
      expect(trans.tools.length).toBeGreaterThan(0);
      expect(trans.about.length).toBeGreaterThan(0);
      expect(trans.catWaferDie.length).toBeGreaterThan(0);

      const catTranslated = translateCategory('Wafer & Die', locale.code);
      expect(catTranslated.length).toBeGreaterThan(0);
    }
  });
});
