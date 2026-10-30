/**
 * ydsz-ui 国际化出口。
 *
 * <p>提供 zh-CN / en-US / ja-JP / zh-TW / ko-KR / fr-FR / de-DE / es-ES /
 * pt-BR / ru-RU / ar-SA / hi-IN / th-TH / vi-VN / it-IT / pl-PL / nl-NL /
 * tr-TR / uk-UA / cs-CZ / sv-SE / fi-FI / da-DK / no-NB / hu-HU / ro-RO /
 * bg-BG / sk-SK / el-GR / he-IL / id-ID / ms-MY 三十二种语种文案与 useLocale composable。
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
export { default as itIT } from './it-IT';
export { default as plPL } from './pl-PL';
export { default as nlNL } from './nl-NL';
export { default as trTR } from './tr-TR';
export { default as ukUA } from './uk-UA';
export { default as csCZ } from './cs-CZ';
export { default as svSE } from './sv-SE';
export { default as fiFI } from './fi-FI';
export { default as daDK } from './da-DK';
export { default as noNB } from './no-NB';
export { default as huHU } from './hu-HU';
export { default as roRO } from './ro-RO';
export { default as bgBG } from './bg-BG';
export { default as skSK } from './sk-SK';
export { default as elGR } from './el-GR';
export { default as heIL } from './he-IL';
export { default as idID } from './id-ID';
export { default as msMY } from './ms-MY';

export { useLocale, LOCALE_LANG_KEY, getDirection } from './useLocale';
export type { LocaleMessages, LocaleParams, LocaleLang, UseLocaleOptions } from './useLocale';
