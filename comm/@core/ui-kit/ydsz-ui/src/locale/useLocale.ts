/**
 * useLocale composable —— 在组件内部读取当前激活语种的文案。
 *
 * 设计目标：
 *  - 从 ConfigProvider 注入的 `locale` prop 读取当前语种；
 *  - 若未包裹 ConfigProvider 则回退到 'zh-CN'；
 *  - 业务方传入的 locale 覆写优先于内置双语包；
 *  - 提供 `t(key)` 函数，供组件模板内使用。
 *  - 14 种内置语种支持（zh-CN / en-US / ja-JP / zh-TW / ko-KR / fr-FR / de-DE /
 *    es-ES / pt-BR / ru-RU / ar-SA / hi-IN / th-TH / vi-VN）。
 *  - RTL 自动识别与 getDirection 工具函数。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\useLocale.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { InjectionKey, Ref } from 'vue';

import { computed, inject, readonly, ref } from 'vue';

import { enUS } from './en-US';
import { jaJP } from './ja-JP';
import { koKR } from './ko-KR';
import { zhCN } from './zh-CN';
import { zhTW } from './zh-TW';
import { frFR } from './fr-FR';
import { deDE } from './de-DE';
import { esES } from './es-ES';
import { ptBR } from './pt-BR';
import { ruRU } from './ru-RU';
import { arSA } from './ar-SA';
import { hiIN } from './hi-IN';
import { thTH } from './th-TH';
import { viVN } from './vi-VN';

/** 支持的语种类型 */
export type LocaleLang =
  | 'zh-CN'
  | 'en-US'
  | 'ja-JP'
  | 'zh-TW'
  | 'ko-KR'
  | 'fr-FR'
  | 'de-DE'
  | 'es-ES'
  | 'pt-BR'
  | 'ru-RU'
  | 'ar-SA'
  | 'hi-IN'
  | 'th-TH'
  | 'vi-VN';

/** 文案表类型 */
export type LocaleMessages = Record<string, string>;

/** useLocale 配置 */
export interface UseLocaleOptions {
  /** 内置消息表（便于测试或自定义组件使用） */
  messages?: Partial<Record<LocaleLang, Partial<LocaleMessages>>>;
}

interface LocaleLangState {
  lang: LocaleLang;
  isRTL: boolean;
}

/** 语言包注册表类型 */
type LocaleRegistry = Record<LocaleLang, LocaleMessages>;

/** 注入 key —— 从 ConfigProvider 读取当前语种对象 */
const LOCALE_LANG_KEY: InjectionKey<Ref<LocaleLangState | undefined>>
  = Symbol('ydsz-locale-lang');

/** RTL 语言列表（预留扩展） */
const rtlLanguages: LocaleLang[] = ['ar-SA'];

/** 内置默认语言包 —— 14 种语言 */
const BUILTIN_MESSAGES: LocaleRegistry = {
  'en-US': enUS,
  'ja-JP': jaJP,
  'ko-KR': koKR,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'fr-FR': frFR,
  'de-DE': deDE,
  'es-ES': esES,
  'pt-BR': ptBR,
  'ru-RU': ruRU,
  'ar-SA': arSA,
  'hi-IN': hiIN,
  'th-TH': thTH,
  'vi-VN': viVN,
};

/**
 * 获取指定语种的文本方向。
 *
 * @param lang - 语种代码
 * @returns 'ltr'（从左到右）或 'rtl'（从右到左）
 *
 * @example
 * ```ts
 * import { getDirection } from './useLocale';
 *
 * // ConfigProvider 用法
 * const dir = getDirection('ar-SA'); // 'rtl'
 * ```
 */
export function getDirection(lang: LocaleLang): 'ltr' | 'rtl' {
  return rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
}

/**
 * useLocale —— 获取国际化 t 函数。
 *
 * @param options - 配置项
 * @return { t, lang, isRTL } t 函数与当前语种 ref 和 RTL 状态
 *
 * @example
 * ```vue
 * <script setup>
 * const { t } = useLocale();
 * </script>
 * <template>
 *   <span>{{ t('table.empty') }}</span>
 * </template>
 * ```
 */
export function useLocale(options: UseLocaleOptions = {}): {
  t: (key: string, fallback?: string) => string;
  lang: Readonly<Ref<LocaleLang>>;
  isRTL: Readonly<Ref<boolean>>;
} {
  const { messages } = options;

  // 读取 ConfigProvider 注入的语言偏好（如有）
  const injectedState = inject(LOCALE_LANG_KEY, ref<LocaleLangState | undefined>(undefined));

  /** 是否启用自定义覆写词典（优先级最高） */
  const hasCustomMessages = !!(messages && Object.keys(messages).length > 0);

  /** 当前激活语种 */
  const lang = computed<LocaleLang>(() => {
    const current = injectedState?.value?.lang;
    if (
      current === 'zh-CN'
      || current === 'en-US'
      || current === 'ja-JP'
      || current === 'zh-TW'
      || current === 'ko-KR'
      || current === 'fr-FR'
      || current === 'de-DE'
      || current === 'es-ES'
      || current === 'pt-BR'
      || current === 'ru-RU'
      || current === 'ar-SA'
      || current === 'hi-IN'
      || current === 'th-TH'
      || current === 'vi-VN'
    ) {
      return current;
    }
    return 'zh-CN';
  });

  /** RTL 方向 —— 自动判断或注入覆盖 */
  const isRTL = computed<boolean>(() => {
    // 优先使用注入的显式 isRTL
    if (injectedState?.value?.isRTL !== undefined) {
      return injectedState.value.isRTL;
    }
    // 自动根据语种判断
    return rtlLanguages.includes(lang.value);
  });

  /** 合并后的消息表（外部覆写优先） */
  const resolvedMessages = computed<LocaleRegistry>(() => {
    if (hasCustomMessages && messages) {
      const merged: LocaleRegistry = {
        'en-US': {
          ...BUILTIN_MESSAGES['en-US'],
          ...(messages['en-US'] ?? {}),
        } as LocaleMessages,
        'ja-JP': {
          ...BUILTIN_MESSAGES['ja-JP'],
          ...(messages['ja-JP'] ?? {}),
        } as LocaleMessages,
        'ko-KR': {
          ...BUILTIN_MESSAGES['ko-KR'],
          ...(messages['ko-KR'] ?? {}),
        } as LocaleMessages,
        'zh-CN': {
          ...BUILTIN_MESSAGES['zh-CN'],
          ...(messages['zh-CN'] ?? {}),
        } as LocaleMessages,
        'zh-TW': {
          ...BUILTIN_MESSAGES['zh-TW'],
          ...(messages['zh-TW'] ?? {}),
        } as LocaleMessages,
        'fr-FR': {
          ...BUILTIN_MESSAGES['fr-FR'],
          ...(messages['fr-FR'] ?? {}),
        } as LocaleMessages,
        'de-DE': {
          ...BUILTIN_MESSAGES['de-DE'],
          ...(messages['de-DE'] ?? {}),
        } as LocaleMessages,
        'es-ES': {
          ...BUILTIN_MESSAGES['es-ES'],
          ...(messages['es-ES'] ?? {}),
        } as LocaleMessages,
        'pt-BR': {
          ...BUILTIN_MESSAGES['pt-BR'],
          ...(messages['pt-BR'] ?? {}),
        } as LocaleMessages,
        'ru-RU': {
          ...BUILTIN_MESSAGES['ru-RU'],
          ...(messages['ru-RU'] ?? {}),
        } as LocaleMessages,
        'ar-SA': {
          ...BUILTIN_MESSAGES['ar-SA'],
          ...(messages['ar-SA'] ?? {}),
        } as LocaleMessages,
        'hi-IN': {
          ...BUILTIN_MESSAGES['hi-IN'],
          ...(messages['hi-IN'] ?? {}),
        } as LocaleMessages,
        'th-TH': {
          ...BUILTIN_MESSAGES['th-TH'],
          ...(messages['th-TH'] ?? {}),
        } as LocaleMessages,
        'vi-VN': {
          ...BUILTIN_MESSAGES['vi-VN'],
          ...(messages['vi-VN'] ?? {}),
        } as LocaleMessages,
      };
      return merged;
    }
    return BUILTIN_MESSAGES;
  });

  /**
   * 翻译函数。
   *
   * @param key - 文案键名（如 'table.empty'）
   * @param fallback - 未找到时的回退文案
   * @returns 对应语种的文案；未找到时返回 fallback 或 key 本身
   */
  function t(key: string, fallback?: string): string {
    const table = resolvedMessages.value[lang.value] ?? {};
    return table[key] ?? fallback ?? key;
  }

  return {
    isRTL: readonly(isRTL),
    lang: readonly(lang),
    t,
  };
}

/** 导出注入键，供 ConfigProvider 使用 */
export { LOCALE_LANG_KEY };
