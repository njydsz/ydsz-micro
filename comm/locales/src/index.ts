/**
 * 国际化（i18n）对外导出入口，包含延迟绑定的翻译函数与语言包加载工具。
 *
 * @path comm\locales\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import {
  i18n,
  loadLocaleMessages,
  loadLocalesMap,
  loadLocalesMapFromDir,
  loadNamespacedLocalesMap,
  loadNamespaceMessages,
  preloadLocaleOnIdle,
  setupI18n,
} from "./i18n";

/**
 * 延迟绑定的翻译函数（重载签名）。
 *
 * @remarks
 * 避免模块顶层直接绑定 i18n.global.t，确保 i18n 初始化后才调用。
 * 使用显式重载替代 `Parameters<typeof i18n.global.t>`，
 * 避免 TypeScript 将最后一个重载的必填参数误作全签名必填参数。
 *
 * @param key - 翻译键名
 * @param locale - 目标语言标识（可选）
 * @param values - 插值参数：命名对象或位置数组（可选）
 * @returns 翻译后的文本
 */

/** 简单键值翻译（无插值） */
function $t(key: string): string;
/** 带 locale 参数的键值翻译 */
function $t(key: string, locale: string): string;
/** 带命名插值对象的翻译 */
function $t(key: string, values: Record<string, unknown>): string;
/** 带位置插值数组的翻译 */
function $t(key: string, values: Array<unknown>): string;
/** 带 locale 与插值的翻译 */
function $t(
  key: string,
  locale: string,
  values: Array<unknown> | Record<string, unknown>,
): string;
function $t(...args: unknown[]): string {
  return (i18n.global.t as (...a: unknown[]) => string)(...args);
}

/**
 * 检查指定 key 在当前语言的词条表中是否存在。
 *
 * @param key - 翻译键名
 * @returns 是否存在对应词条
 */
function $te(key: string): boolean {
  return i18n.global.te(key);
}

export {
  $t,
  $te,
  i18n,
  loadLocaleMessages,
  loadLocalesMap,
  loadLocalesMapFromDir,
  loadNamespacedLocalesMap,
  loadNamespaceMessages,
  preloadLocaleOnIdle,
  setupI18n,
};
export {
  type ImportLocaleFn,
  type ImportNamespaceFn,
  type LocaleSetupOptions,
  type NamespacedLocalesMap,
  type PreloadLocaleOptions,
  type SupportedLanguagesType,
} from "./typing";
export type { CompileError } from "@intlify/core-base";

export { useI18n } from "vue-i18n";

export type { Locale } from "vue-i18n";
