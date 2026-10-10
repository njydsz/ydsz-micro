/**
 * ydsz-ui 国际化出口。
 *
 * <p>提供 zh-CN / en-US / ja-JP / zh-TW 四语种文案与 useLocale composable。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export { default as enUS } from './en-US';
export { default as jaJP } from './ja-JP';
export { default as zhCN } from './zh-CN';
export { default as zhTW } from './zh-TW';

export { useLocale, LOCALE_LANG_KEY } from './useLocale';
export type { LocaleMessages, LocaleLang, UseLocaleOptions } from './useLocale';
