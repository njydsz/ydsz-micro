/**
 * ydsz-ui 国际化出口。
 *
 * <p>提供 zh-CN / en-US 双语包与 useLocale composable。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export { default as enUS } from './en-US';
export { default as zhCN } from './zh-CN';

export { useLocale, LOCALE_LANG_KEY } from './useLocale';
export type { LocaleMessages, LocaleLang, UseLocaleOptions } from './useLocale';
