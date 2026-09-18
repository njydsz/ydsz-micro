/**
 * 国际化配置入口 —— 配置 i18n、加载第三方库（dayjs）语言包
 *
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
 * <p>基于语种标识动态导入对应的 dayjs locale 模块。
 * 未显式列出的语种回退到 en，保证日期时间格式化始终可用。
 *
 * @param lang - 当前激活语种
 */
async function loadDayjsLocale(lang: SupportedLanguagesType) {
  const dayjsLocaleMap: Partial<Record<SupportedLanguagesType, string>> = {
    'en-US': 'en',
    'zh-CN': 'zh-cn',
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

  // 首屏完成后空闲预加载另一语种，使切换近似瞬时
  const alternateLocale: SupportedLanguagesType =
    defaultLocale === 'zh-CN' ? 'en-US' : 'zh-CN';
  preloadLocaleOnIdle(alternateLocale, localesMap);
}

export { $t, setupI18n };
