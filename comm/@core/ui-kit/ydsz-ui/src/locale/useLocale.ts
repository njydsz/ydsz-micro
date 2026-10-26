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

import { useSimpleLocale } from '@ydsz-core/composables';

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

/** 词条命名占位参数（对应文案里的 `{name}`） */
export type LocaleParams = Record<string, string | number>;

/**
 * 填充词条里的命名占位。
 *
 * <p>未提供对应参数的占位保持原样，避免把 `{field}` 静默吞成空串——
 * 漏传参数应当在界面上可见，而不是渲染出一句读不通的文案。
 *
 * @param text - 已取到的词条原文
 * @param params - 占位名到值的映射
 * @returns 占位替换后的文本
 */
function interpolate(text: string, params: LocaleParams): string {
  return text.replaceAll(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  );
}

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

/** 已内置词典的语种白名单，用于校验外部传入值 */
const SUPPORTED_LOCALES: ReadonlySet<string> = new Set<LocaleLang>([
  'ar-SA',
  'de-DE',
  'en-US',
  'es-ES',
  'fr-FR',
  'hi-IN',
  'ja-JP',
  'ko-KR',
  'pt-BR',
  'ru-RU',
  'th-TH',
  'vi-VN',
  'zh-CN',
  'zh-TW',
]);

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
 *   <input :placeholder="t('orgChart.search', { field: filterBy })" />
 * </template>
 * ```
 */
export function useLocale(options: UseLocaleOptions = {}): {
  t: (key: string, fallbackOrParams?: string | LocaleParams) => string;
  lang: Readonly<Ref<LocaleLang>>;
  isRTL: Readonly<Ref<boolean>>;
} {
  const { messages } = options;

  // 读取 ConfigProvider 注入的语言偏好（如有）
  const injectedState = inject(LOCALE_LANG_KEY, ref<LocaleLangState | undefined>(undefined));
  /** 应用级语言偏好（Preferences 里切换的全站语言） */
  const appLocale = useSimpleLocale();

  /** 是否启用自定义覆写词典（优先级最高） */
  const hasCustomMessages = !!(messages && Object.keys(messages).length > 0);

  /**
   * 当前激活语种。
   *
   * <p>优先级：ConfigProvider 注入 → 应用级 useSimpleLocale（偏好设置里切换的
   * 全站语言）→ 'zh-CN'。此前只认注入值，导致业务方 setSimpleLocale('en-US')
   * 后组件词典仍是中文，两套 locale 各说各话。
   */
  const lang = computed<LocaleLang>(() => {
    const fromProvider = injectedState?.value?.lang;
    if (fromProvider && SUPPORTED_LOCALES.has(fromProvider)) {
      return fromProvider;
    }
    const fromApp = appLocale.currentLocale.value;
    if (SUPPORTED_LOCALES.has(fromApp)) {
      return fromApp as LocaleLang;
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

  /** 合并后的消息表（外部覆写优先于内置词典） */
  const resolvedMessages = computed<LocaleRegistry>(() => {
    if (!hasCustomMessages || !messages) return BUILTIN_MESSAGES;
    return Object.fromEntries(
      Object.entries(BUILTIN_MESSAGES).map(([locale, builtin]) => [
        locale,
        { ...builtin, ...(messages[locale as LocaleLang] ?? {}) },
      ]),
    ) as LocaleRegistry;
  });

  /**
   * 翻译函数。
   *
   * <p>词条按「当前语种 → zh-CN → en-US → 显式 fallback → key」逐级回退。
   * 小语种词典只覆盖高频文案，缺词条时回落到中文而非把 `selectDate` 这类
   * key 字面量渲染到界面上。
   *
   * @param key - 文案键名（如 'table.empty'）
   * @param fallbackOrParams - 字符串视为未命中时的回退文案；对象用于填充词条里的
   *   `{name}` 占位（组件文案含「搜索 {field}...」这类插值，词典本身不能存拼接逻辑）
   * @returns 对应语种的文案；未找到时返回 fallback 或 key 本身
   */
  function t(key: string, fallbackOrParams?: string | LocaleParams): string {
    const fallback = typeof fallbackOrParams === 'string' ? fallbackOrParams : undefined;
    const params = typeof fallbackOrParams === 'string' ? undefined : fallbackOrParams;
    const table = resolvedMessages.value[lang.value] ?? {};
    const hit = table[key]
      ?? (lang.value === 'zh-CN' ? undefined : resolvedMessages.value['zh-CN']?.[key])
      ?? (lang.value === 'en-US' ? undefined : resolvedMessages.value['en-US']?.[key]);
    const text = hit ?? fallback ?? key;
    return params ? interpolate(text, params) : text;
  }

  return {
    isRTL: readonly(isRTL),
    lang: readonly(lang),
    t,
  };
}

/** 导出注入键，供 ConfigProvider 使用 */
export { LOCALE_LANG_KEY };
