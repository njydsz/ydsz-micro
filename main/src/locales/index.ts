/**
 * 国际化配置入口 —— 配置 i18n、加载第三方库（dayjs）语言包
 *
 * EP 退场（ep-exit-refactor-plan v3 §P0-2）：移除 Element Plus 语言包装配与
 * `elementLocale` 导出（ElConfigProvider 已随 EP 退场移除，无下游消费）；
 * 组件库文案由 ydsz-ui / @ydsz/notification 自持，经 vue-i18n 统一管理。
 *
 * @path main\src\locales\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { App } from 'vue';

import type { LocaleSetupOptions, SupportedLanguagesType } from '@ydsz/locales';

import { createLogger } from '@ydsz-core/shared/utils';

import {
  $t,
  loadLocalesMapFromDir,
  preloadLocaleOnIdle,
  setupI18n as coreSetup,
} from '@ydsz/locales';
import { preferences } from '@ydsz/preferences';

import dayjs from 'dayjs';

/** 模块级日志器 */
const logger = createLogger('Locales');

const modules = import.meta.glob('./langs/**/*.json');

const localesMap = loadLocalesMapFromDir(
  /\.\/langs\/([^/]+)\/(.*)\.json$/,
  modules,
);

async function loadMessages(lang: SupportedLanguagesType) {
  const [appLocaleMessages] = await Promise.all([
    localesMap[lang]?.(),
    loadDayjsLocale(lang),
  ]);
  return appLocaleMessages?.default;
}

/**
 * 加载 dayjs 语言包。
 *
 * <p>基于语种标识动态导入对应的 dayjs locale 模块，覆盖 63 个语种。
 * 未显式列出的语种回退到 en，保证日期时间格式化始终可用。
 *
 * @param lang - 当前激活语种
 */
async function loadDayjsLocale(lang: SupportedLanguagesType) {
  const dayjsLocaleMap: Record<SupportedLanguagesType, string> = {
    'af-ZA': 'af',
    'am-ET': 'am',
    'ar-SA': 'ar',
    'ar-EG': 'ar',
    'az-AZ': 'az',
    'bg-BG': 'bg',
    'bn-BD': 'bn',
    'bs-BA': 'bs',
    'ca-ES': 'ca',
    'cs-CZ': 'cs',
    'cy-GB': 'cy',
    'da-DK': 'da',
    'de-DE': 'de',
    'de-AT': 'de-at',
    'de-CH': 'de-ch',
    'el-GR': 'el',
    'en-US': 'en',
    'en-GB': 'en-gb',
    'es-ES': 'es',
    'es-MX': 'es-mx',
    'es-AR': 'es',
    'et-EE': 'et',
    'eu-ES': 'eu',
    'fa-IR': 'fa',
    'fi-FI': 'fi',
    'fil-PH': 'tl-ph',
    'fr-FR': 'fr',
    'fr-CA': 'fr-ca',
    'gl-ES': 'gl',
    'gu-IN': 'gu',
    'he-IL': 'he',
    'hi-IN': 'hi',
    'hr-HR': 'hr',
    'hu-HU': 'hu',
    'hy-AM': 'hy-am',
    'id-ID': 'id',
    'is-IS': 'is',
    'it-IT': 'it',
    'ja-JP': 'ja',
    'ka-GE': 'ka',
    'kk-KZ': 'kk',
    'km-KH': 'km',
    'kn-IN': 'kn',
    'ko-KR': 'ko',
    'lo-LA': 'lo',
    'lt-LT': 'lt',
    'lv-LV': 'lv',
    'mk-MK': 'mk',
    'ml-IN': 'ml',
    'mn-MN': 'mn',
    'mr-IN': 'mr',
    'ms-MY': 'ms',
    'my-MM': 'my',
    'nb-NO': 'nb',
    'ne-NP': 'ne',
    'nl-NL': 'nl',
    'nl-BE': 'nl-be',
    'pl-PL': 'pl',
    'pt-BR': 'pt-br',
    'pt-PT': 'pt',
    'ro-RO': 'ro',
    'ru-RU': 'ru',
    'si-LK': 'si',
    'sk-SK': 'sk',
    'sl-SI': 'sl',
    'sq-AL': 'sq',
    'sr-RS': 'sr-cyrl',
    'sv-SE': 'sv',
    'sw-KE': 'sw',
    'ta-IN': 'ta',
    'te-IN': 'te',
    'th-TH': 'th',
    'tr-TR': 'tr',
    'uk-UA': 'uk',
    'ur-PK': 'ur',
    'uz-UZ': 'uz',
    'vi-VN': 'vi',
    'zh-CN': 'zh-cn',
    'zh-TW': 'zh-tw',
    'zh-HK': 'zh-hk',
    'zu-ZA': 'zu',
  };

  const dayjsCode = dayjsLocaleMap[lang] ?? 'en';
  try {
    const locale = await import(`dayjs/locale/${dayjsCode}`);
    dayjs.locale(locale.default ?? locale);
  } catch (error) {
    logger.warn(`Failed to load dayjs locale '${dayjsCode}' for ${lang}: ${error}`);
    // 回退到英文
    const fallback = await import('dayjs/locale/en');
    dayjs.locale(fallback.default ?? fallback);
  }
}

/**
 * 初始化应用国际化（i18n）。
 *
 * @param app - Vue 应用实例
 * @param options - 额外的 i18n 配置项，会覆盖默认值（如默认语言、消息加载器）
 */
async function setupI18n(app: App, options: LocaleSetupOptions = {}) {
  const defaultLocale = options.defaultLocale ?? preferences.app.locale;
  await coreSetup(app, {
    defaultLocale,
    loadMessages,
    missingWarn: !import.meta.env.PROD,
    ...options,
  });

  // F2: 首屏完成后空闲预加载另一语种，使切换近似瞬时
  const alternateLocale: SupportedLanguagesType =
    defaultLocale === 'zh-CN' ? 'en-US' : 'zh-CN';
  preloadLocaleOnIdle(alternateLocale, localesMap);
}

export { $t, setupI18n };
