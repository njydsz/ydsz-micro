/**
 * 业务常量定义 — 登录路径、支持语言列表及语言选项结构。
 *
 * @path comm\constants\src\core.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { SupportedLanguagesType } from '@ydsz/locales';

/**
 * 登录页面路由地址。
 */
export const LOGIN_PATH = '/auth/login';

/**
 * 语言切换下拉项的数据结构。
 *
 * @remarks
 * `value` 与 vue-i18n 的 locale 标识保持一致，新增语种时需同步扩展
 * `SUPPORT_LANGUAGES` 与对应的语言包，否则切换后词条会全部回退为 key。
 */
export interface LanguageOption {
  /** 展示名称，按惯例使用该语言的**本族语**书写（如简体中文、English），不参与翻译 */
  label: string;
  /** 语言标识，需与语言包目录名及 vue-i18n locale 一致 */
  value: SupportedLanguagesType;
}

/**
 * 支持的语言列表（22 个语种，覆盖全球 95%+ 互联网用户）。
 *
 * <p>label 使用本族语书写，按常用度 + 语系分组排列。
 */
export const SUPPORT_LANGUAGES: LanguageOption[] = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
  { label: '繁體中文', value: 'zh-TW' },
  { label: '日本語', value: 'ja-JP' },
  { label: '한국어', value: 'ko-KR' },
  { label: 'Español', value: 'es-ES' },
  { label: 'Português (Brasil)', value: 'pt-BR' },
  { label: 'Français', value: 'fr-FR' },
  { label: 'Deutsch', value: 'de-DE' },
  { label: 'Русский', value: 'ru-RU' },
  { label: 'العربية', value: 'ar-SA' },
  { label: 'हिन्दी', value: 'hi-IN' },
  { label: 'Tiếng Việt', value: 'vi-VN' },
  { label: 'ไทย', value: 'th-TH' },
  { label: 'Bahasa Indonesia', value: 'id-ID' },
  { label: 'Italiano', value: 'it-IT' },
  { label: 'Nederlands', value: 'nl-NL' },
  { label: 'Polski', value: 'pl-PL' },
  { label: 'Türkçe', value: 'tr-TR' },
  { label: 'Українська', value: 'uk-UA' },
  { label: 'Čeština', value: 'cs-CZ' },
  { label: 'Português (Portugal)', value: 'pt-PT' },
  { label: 'Svenska', value: 'sv-SE' },
];
