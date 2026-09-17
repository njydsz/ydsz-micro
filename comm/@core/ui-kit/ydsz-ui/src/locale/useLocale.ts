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

import { computed, inject, ref } from 'vue';

import { enUS } from './en-US';
import { zhCN } from './zh-CN';

/** 支持的语种类型 */
export type LocaleLang = 'zh-CN' | 'en-US';

/** 文案表类型 */
export type LocaleMessages = Record<string, string>;

/** useLocale 配置 */
export interface UseLocaleOptions {
  /** 内置消息表（便于测试或自定义组件使用） */
  messages?: Record<LocaleLang, LocaleMessages>;
}

/** 语言包注册表类型 */
type LocaleRegistry = Record<LocaleLang, LocaleMessages>;

/** 注入 key —— 从 ConfigProvider 读取当前语种 lang */
const LOCALE_LANG_KEY = Symbol('ydsz-locale-lang') as InjectionKey<Ref<LocaleLang | undefined>>;

/** 内置默认语言包 */
const BUILTIN_MESSAGES: LocaleRegistry = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

/**
 * useLocale —— 获取国际化 t 函数。
 *
 * @param options - 配置项
 * @return { t, lang } t 函数与当前语种 ref
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
export function useLocale(options: UseLocaleOptions = {}) {
  const { messages } = options;

  // 读取 ConfigProvider 注入的语言偏好（如有）
  const injectedLang = inject(LOCALE_LANG_KEY, ref(undefined));

  /** 当前激活语种 */
  const lang = computed<LocaleLang>(() => {
    const current = injectedLang?.value;
    if (current === 'en-US' || current === 'zh-CN') {
      return current;
    }
    return 'zh-CN';
  });

  /** 合并后的消息表（外部覆写优先） */
  const resolvedMessages = computed<LocaleRegistry>(() => {
    const base = messages ?? BUILTIN_MESSAGES;
    return base;
  });

  /**
   * 翻译函数。
   *
   * @param key - 文案键名（如 'table.empty'）
   * @returns 对应语种的文案；未找到时返回 key 本身
   */
  function t(key: string): string {
    const table = resolvedMessages.value[lang.value] ?? {};
    return table[key] ?? key;
  }

  return {
    lang,
    t,
  };
}
