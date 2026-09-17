/**
 * 国际化配置入口 —— 配置 i18n、加载第三方库（dayjs）语言包
 *
 * EP 退场（ep-exit-refactor-plan v3 §P0-2）：移除 Element Plus 语言包装配与
 * `elementLocale` 导出（ElConfigProvider 已随 EP 退场移除，无下游消费）；
 * 组件库文案由 shadcn-ui / @ydsz/notification 自持，经 vue-i18n 统一管理。
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

async function loadDayjsLocale(lang: SupportedLanguagesType) {
  let locale;
  switch (lang) {
    case 'en-US': {
      locale = await import('dayjs/locale/en');
      break;
    }
    case 'zh-CN': {
      locale = await import('dayjs/locale/zh-cn');
      break;
    }
    case 'ja-JP': {
      locale = await import('dayjs/locale/ja');
      break;
    }
    case 'zh-TW': {
      locale = await import('dayjs/locale/zh-tw');
      break;
    }
    default: {
      locale = await import('dayjs/locale/en');
    }
  }
  if (locale) {
    dayjs.locale(locale);
  } else {
    logger.error(`Failed to load dayjs locale for ${lang}`);
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
