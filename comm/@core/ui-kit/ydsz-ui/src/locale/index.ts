/**
 * ydsz-ui 国际化出口。
 *
 * <p>提供中文 / 英文双语词条与 useLocale composable。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export { default as enUS } from './en-US';
export { default as zhCN } from './zh-CN';

export { useLocale, LOCALE_LANG_KEY, getDirection } from './useLocale';
export type { LocaleMessages, LocaleParams, LocaleLang, UseLocaleOptions } from './useLocale';
