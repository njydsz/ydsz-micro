/**
 * useLocale composable —— 在组件内部读取当前激活语种的文案。
 *
 * 设计目标：
 *  - 从 ConfigProvider 注入的 `locale` prop 读取当前语种；
 *  - 若未包裹 ConfigProvider 则回退到 'zh-CN'；
 *  - 业务方传入的 locale 覆写优先于内置双语包；
 *  - 提供 `t(key)` 函数，供组件模板内使用。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\useLocale.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { InjectionKey, Ref } from 'vue';

import { computed, inject, readonly, ref } from 'vue';

import { enUS } from './en-US';
import { zhCN } from './zh-CN';

/** 支持的语种类型 */
export type LocaleLang = 'zh-CN' | 'en-US';

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

/** 内置默认语言包 */
const BUILTIN_MESSAGES: LocaleRegistry = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

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
    if (current === 'en-US' || current === 'zh-CN') {
      return current;
    }
    return 'zh-CN';
  });

  /** RTL 方向 */
  const isRTL = computed<boolean>(() => {
    return injectedState?.value?.isRTL ?? false;
  });

  /** 合并后的消息表（外部覆写优先） */
  const resolvedMessages = computed<LocaleRegistry>(() => {
    if (hasCustomMessages && messages) {
      const merged: LocaleRegistry = {
        'en-US': {
          ...BUILTIN_MESSAGES['en-US'],
          ...(messages['en-US'] ?? {}),
        } as LocaleMessages,
        'zh-CN': {
          ...BUILTIN_MESSAGES['zh-CN'],
          ...(messages['zh-CN'] ?? {}),
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
