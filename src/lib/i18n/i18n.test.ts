import { describe, expect, it } from 'vitest';
import { matchLocaleFromCountry, matchLocaleFromBrowser, SUPPORTED_LOCALES } from './context';
import { getTranslation, registerDictionary, translateCategory } from './translations';
import { searchTools } from '../search';
import {
  getToolTranslations,
  getTranslatedTool,
  registerToolTranslations,
  translateToolName,
} from './tool-translations';
import { en as enDict } from './dictionaries/en';
import { zhCN as zhCnDict } from './dictionaries/zh-CN';
import { zhTW as zhTwDict } from './dictionaries/zh-TW';
import { ko as koDict } from './dictionaries/ko';
import { ja as jaDict } from './dictionaries/ja';
import { en as enToolDict } from './tool-dictionaries/en';
import { zhCN as zhCnToolDict } from './tool-dictionaries/zh-CN';
import { zhTW as zhTwToolDict } from './tool-dictionaries/zh-TW';
import { ko as koToolDict } from './tool-dictionaries/ko';
import { ja as jaToolDict } from './tool-dictionaries/ja';
import {
  ensureToolCopy,
  getToolCopy,
  interpolateCopy,
  lookupCopy,
  registerToolCopy,
  resolveCopyMessage,
} from './tool-copy';
import type { CopyResource } from './tool-copy';
import { TOOL_COPY_LOADERS } from './tool-copy/resources/registry';
import { tools } from '@/tools';
import type { Tool } from '@/tools/tools.types';

// Prime the lazy dictionary caches so sync getters resolve every locale in node.
registerDictionary('en', enDict);
registerDictionary('zh-CN', zhCnDict);
registerDictionary('zh-TW', zhTwDict);
registerDictionary('ko', koDict);
registerDictionary('ja', jaDict);
registerToolTranslations('en', enToolDict);
registerToolTranslations('zh-CN', zhCnToolDict);
registerToolTranslations('zh-TW', zhTwToolDict);
registerToolTranslations('ko', koToolDict);
registerToolTranslations('ja', jaToolDict);

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

  it('provides complete translations for all supported locales with exact key parity', () => {
    const enTrans = getTranslation('en');
    const baseKeys = Object.keys(enTrans).sort() as (keyof typeof enTrans)[];
    expect(baseKeys.length).toBeGreaterThan(400);

    for (const locale of SUPPORTED_LOCALES) {
      const trans = getTranslation(locale.code);
      const localeKeys = Object.keys(trans).sort();
      expect(localeKeys, `Locale ${locale.code} key set does not match English`).toEqual(baseKeys);
      for (const key of baseKeys) {
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
    } as unknown as Tool;

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
      const dict = getToolTranslations(locale);
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
describe('tool copy infrastructure', () => {
  it('interpolates parameters and falls back to English msgids', () => {
    expect(interpolateCopy('Hello {name}', { name: 'Ada' })).toBe('Hello Ada');
    expect(lookupCopy(undefined, 'en', 'Unknown {value}', { value: 4 })).toBe('Unknown 4');
  });

  it('loads generated resources through the registry and caches them', async () => {
    const loaded = await ensureToolCopy('yield-calculator');
    expect(loaded).toBeDefined();
    expect(getToolCopy('yield-calculator')).toBe(loaded);
    expect(await ensureToolCopy('yield-calculator')).toBe(loaded);
    expect(await ensureToolCopy('not-generated')).toBeUndefined();
  });

  it('covers every registered tool loader with valid CopyResource structure', async () => {
    const toolIds = Object.keys(TOOL_COPY_LOADERS);
    expect(toolIds.length).toBeGreaterThanOrEqual(60);

    for (const toolId of toolIds) {
      const loader = TOOL_COPY_LOADERS[toolId];
      expect(loader, `Loader for ${toolId} must exist`).toBeDefined();
      const copy = await loader();
      expect(copy, `Loaded copy for ${toolId} must be an object`).toBeDefined();
      const locales = ['zh-CN', 'zh-TW', 'ko', 'ja'] as const;
      for (const loc of locales) {
        expect(copy[loc], `Copy for ${toolId} missing locale ${loc}`).toBeDefined();
        for (const [msgid, val] of Object.entries(copy[loc] || {})) {
          expect(typeof val, `${toolId}.${loc}.${msgid} must be a string`).toBe('string');
          expect(val.length, `${toolId}.${loc}.${msgid} must not be empty`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('resolves copy messages with fallback hierarchy and interpolation', () => {
    const resource: CopyResource = {
      'zh-CN': {
        'Hello {name}': '你好 {name}',
        'Same Key': 'Same Key',
      },
    };
    const shared = {
      'Same Key': '共享键',
      'Shared Only': '仅在共享',
    };

    // English always returns the interpolated msgid
    expect(resolveCopyMessage(resource, shared, 'en', 'Hello {name}', { name: 'World' })).toBe('Hello World');
    // Specific translation in resource
    expect(resolveCopyMessage(resource, shared, 'zh-CN', 'Hello {name}', { name: '世界' })).toBe('你好 世界');
    // Resource has identical key -> falls back to shared
    expect(resolveCopyMessage(resource, shared, 'zh-CN', 'Same Key')).toBe('共享键');
    // Not in resource -> falls back to shared
    expect(resolveCopyMessage(resource, shared, 'zh-CN', 'Shared Only')).toBe('仅在共享');
    // In neither -> falls back to msgid
    expect(resolveCopyMessage(resource, shared, 'zh-CN', 'Completely Unknown')).toBe('Completely Unknown');
  });

  it('allows deterministic test registration without changing lookup semantics', () => {
    const resource: CopyResource = { 'zh-CN': { Greeting: '问候' } };
    registerToolCopy('test-resource', resource);
    expect(getToolCopy('test-resource')).toBe(resource);
    expect(lookupCopy(resource, 'zh-CN', 'Greeting')).toBe('问候');
    expect(lookupCopy(resource, 'zh-CN', 'Missing')).toBe('Missing');
  });
});
