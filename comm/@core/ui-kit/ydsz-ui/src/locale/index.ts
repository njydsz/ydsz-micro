/**
 * ydsz-ui 国际化出口。
 *
 * <p>提供 zh-CN / en-US / ja-JP / zh-TW / ko-KR / fr-FR / de-DE / es-ES /
 * pt-BR / ru-RU / ar-SA / hi-IN / th-TH / vi-VN 十四种语种文案与 useLocale composable。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export { default as enUS } from './en-US';
export { default as jaJP } from './ja-JP';
export { default as koKR } from './ko-KR';
export { default as zhCN } from './zh-CN';
export { default as zhTW } from './zh-TW';
export { default as frFR } from './fr-FR';
export { default as deDE } from './de-DE';
export { default as esES } from './es-ES';
export { default as ptBR } from './pt-BR';
export { default as ruRU } from './ru-RU';
export { default as arSA } from './ar-SA';
export { default as hiIN } from './hi-IN';
export { default as thTH } from './th-TH';
export { default as viVN } from './vi-VN';

export { useLocale, LOCALE_LANG_KEY, getDirection } from './useLocale';
export type { LocaleMessages, LocaleLang, UseLocaleOptions } from './useLocale';
