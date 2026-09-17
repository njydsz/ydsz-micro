// cspell:words i18n
/**
 * useComponentI18n —— 组件级国际化 composable。
 *
 * <p>提供轻量级多语言消息查找能力，适用于组件内部的固定文案
 *（如 loading、noData、error 等）。
 *
 * <p>设计要点：
 * <ul>
 *   <li>支持嵌套 key 访问：t('table.emptyText')</li>
 *   <li>支持简单占位：t('hello', { name: 'world' })</li>
 *   <li>locale 由外部注入，默认 fallback 中文</li>
 * </ul>
 *
 * <p>典型用法：
 * <pre>
 *   const { t, setLocale } = useComponentI18n({
 *     messages: {
 *       en: { table: { emptyText: 'No data' } },
 *       zh: { table: { emptyText: '暂无数据' } },
 *     },
 *   });
 *   const msg = t('table.emptyText');
 * </pre>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-component-i18n.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { ref } from 'vue';

/** 消息字典 */
type Messages = Record<string, string | Record<string, string>>;

/** 多语言包 */
type LocaleMessages = Record<string, Messages>;

/** 组件 i18n 配置 */
export interface UseComponentI18nOptions {
  /** 默认 locale，默认 'zh' */
  defaultLocale?: string;
  /** 多语言包 */
  messages: LocaleMessages;
}

/** i18n 句柄 */
export interface ComponentI18nHandle {
  /** 切换语言 */
  setLocale: (locale: string) => void;
  /** 当前语言 */
  locale: () => string;
  /** 翻译函数 */
  t: (key: string, params?: Record<string, string | number>) => string;
}

/**
 * useComponentI18n：组件级国际化。
 *
 * @param options - 配置项
 * @return i18n 句柄
 */
export function useComponentI18n(options: UseComponentI18nOptions): ComponentI18nHandle {
  const { defaultLocale = 'zh', messages } = options;
  const currentLocale = ref(defaultLocale);

  /**
   * 解析嵌套 key（如 table.emptyText）。
   */
  function resolveMessage(key: string): string | undefined {
    const localeMessages = messages[currentLocale.value] ?? messages[defaultLocale];
    if (!localeMessages) return undefined;

    const parts = key.split('.');
    let current: unknown = localeMessages;
    for (const part of parts) {
      current = (current as Record<string, unknown>)?.[part];
      if (current === undefined) return undefined;
    }
    return typeof current === 'string' ? current : undefined;
  }

  /**
   * 翻译：查找 message 并替换占位。
   */
  function t(key: string, params?: Record<string, string | number>): string {
    const message = resolveMessage(key) ?? key;
    if (!params) return message;

    let result = message;
    for (const [k, v] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
    return result;
  }

  function setLocale(locale: string): void {
    if (messages[locale]) {
      currentLocale.value = locale;
    }
  }

  function locale(): string {
    return currentLocale.value;
  }

  return {
    locale,
    setLocale,
    t,
  };
}
