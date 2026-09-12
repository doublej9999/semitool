import { describe, expect, it } from 'vitest';
import { matchLocaleFromCountry, matchLocaleFromBrowser, SUPPORTED_LOCALES } from './context';
import { getTranslation, translateCategory } from './translations';
import { searchTools } from '../search';
import { getTranslatedTool, translateToolName, TOOL_TRANSLATIONS } from './tool-translations';
import { tools } from '@/tools';

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

  it('provides complete translations for all supported locales with no missing keys', () => {
    const baseKeys = Object.keys(getTranslation('en')) as (keyof ReturnType<typeof getTranslation>)[];
    expect(baseKeys.length).toBeGreaterThan(120);

    for (const locale of SUPPORTED_LOCALES) {
      const trans = getTranslation(locale.code);
      for (const key of baseKeys) {
        expect(trans[key], `Locale ${locale.code} missing key: ${key}`).toBeDefined();
        expect(typeof trans[key]).toBe('string');
        expect(trans[key].trim().length, `Locale ${locale.code} key ${key} is empty`).toBeGreaterThan(0);
      }

      // Check specific core domains
      expect(trans.travelerModalTitle.length).toBeGreaterThan(0);
      expect(trans.handbookTitle.length).toBeGreaterThan(0);
      expect(trans.scratchpadTitle.length).toBeGreaterThan(0);
      expect(trans.csvUploadBtn.length).toBeGreaterThan(0);
      expect(trans.valueLabel.length).toBeGreaterThan(0);
      expect(trans.unitColumn.length).toBeGreaterThan(0);
      expect(trans.privacyHeading.length).toBeGreaterThan(0);
      expect(trans.aboutHeading.length).toBeGreaterThan(0);
      expect(trans.contactHeading.length).toBeGreaterThan(0);
      expect(trans.notFoundHeading.length).toBeGreaterThan(0);

      const catTranslated = translateCategory('Wafer & Die', locale.code);
      expect(catTranslated.length).toBeGreaterThan(0);
    }
  });

  it('provides tool translations for all registered tools', () => {
    const sampleTool = {
      name: 'Wafer Die Calculator',
      path: '/tools/wafer-die-calculator',
      description: 'Estimated gross die per wafer',
      category: 'Wafer & Die',
      keywords: ['gross die'],
      icon: () => null,
    } as any;

    expect(translateToolName(sampleTool.path, 'zh-CN')).toContain('晶圆');
    expect(translateToolName(sampleTool.path, 'ja')).toBeDefined();
    expect(translateToolName(sampleTool.path, 'ko')).toBeDefined();

    const translatedZh = getTranslatedTool(sampleTool, 'zh-CN');
    expect(translatedZh.name).toContain('晶圆');
    expect(translatedZh.description.length).toBeGreaterThan(0);
    expect(translatedZh.keywords.length).toBeGreaterThan(0);
  });

  it('covers all tools in tool registry across all supported locales', () => {
    const locales = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko'] as const;
    for (const locale of locales) {
      const dict = TOOL_TRANSLATIONS[locale];
      expect(dict).toBeDefined();
      for (const tool of tools) {
        const trans = dict[tool.path];
        expect(trans, `Missing translation for ${tool.path} in locale ${locale}`).toBeDefined();
        expect(trans.name.length).toBeGreaterThan(0);
        expect(trans.description.length).toBeGreaterThan(0);
      }
    }
  });

  it('supports localized tool search in different languages', () => {
    const zhResults = searchTools('热阻', tools, 'zh-CN');
    expect(zhResults.length).toBeGreaterThan(0);
    expect(zhResults[0].path).toBe('/tools/thermal-resistance-calculator');

    const koResults = searchTools('솔더', tools, 'ko');
    expect(koResults.length).toBeGreaterThan(0);
    expect(koResults[0].path).toBe('/tools/thermal-fatigue-calculator');

    const jaResults = searchTools('研磨', tools, 'ja');
    expect(jaResults.length).toBeGreaterThan(0);
    expect(jaResults[0].path).toBe('/tools/cmp-preston-calculator');
  });
});
