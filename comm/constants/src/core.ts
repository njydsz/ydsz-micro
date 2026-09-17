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
 * 支持的语言列表（60 个语种，覆盖全球 99% 互联网用户）。
 *
 * <p>label 使用本族语书写。组件侧按大洲分组展示以支持搜索 + 虚拟滚动。
 */
export const SUPPORT_LANGUAGES: LanguageOption[] = [
  // ── 东亚 / 东南亚 ──────────────────────────────
  { label: '简体中文', value: 'zh-CN' },
  { label: '繁體中文', value: 'zh-TW' },
  { label: '香港繁中', value: 'zh-HK' },
  { label: '日本語', value: 'ja-JP' },
  { label: '한국어', value: 'ko-KR' },
  { label: 'Tiếng Việt', value: 'vi-VN' },
  { label: 'ไทย', value: 'th-TH' },
  { label: 'Bahasa Indonesia', value: 'id-ID' },
  { label: 'Bahasa Melayu', value: 'ms-MY' },
  { label: 'Filipino', value: 'fil-PH' },
  { label: 'ភាសាខ្មែរ', value: 'km-KH' },
  { label: 'ລາວ', value: 'lo-LA' },
  { label: 'မြန်မာ', value: 'my-MM' },
  { label: 'Монгол', value: 'mn-MN' },
  // ── 南亚 ──────────────────────────────────────
  { label: 'हिन्दी', value: 'hi-IN' },
  { label: 'বাংলা', value: 'bn-BD' },
  { label: 'اردو', value: 'ur-PK' },
  { label: 'मराठी', value: 'mr-IN' },
  { label: 'தமிழ்', value: 'ta-IN' },
  { label: 'తెలుగు', value: 'te-IN' },
  { label: 'ಕನ್ನಡ', value: 'kn-IN' },
  { label: 'മലയാളം', value: 'ml-IN' },
  { label: 'ગુજરાતી', value: 'gu-IN' },
  { label: 'सिन्हाला', value: 'si-LK' },
  { label: 'नेपाली', value: 'ne-NP' },
  // ── 欧洲西部 / 北部 ────────────────────────────
  { label: 'English', value: 'en-US' },
  { label: 'British English', value: 'en-GB' },
  { label: 'Français', value: 'fr-FR' },
  { label: 'Français (Canada)', value: 'fr-CA' },
  { label: 'Deutsch', value: 'de-DE' },
  { label: 'Österreichisches Deutsch', value: 'de-AT' },
  { label: 'Schweizerdeutsch', value: 'de-CH' },
  { label: 'Nederlands', value: 'nl-NL' },
  { label: 'Vlaams', value: 'nl-BE' },
  { label: 'Svenska', value: 'sv-SE' },
  { label: 'Norsk Bokmål', value: 'nb-NO' },
  { label: 'Dansk', value: 'da-DK' },
  { label: 'Suomi', value: 'fi-FI' },
  { label: 'Íslenska', value: 'is-IS' },
  { label: 'Cymraeg', value: 'cy-GB' },
  { label: 'Galego', value: 'gl-ES' },
  { label: 'Català', value: 'ca-ES' },
  { label: 'Euskara', value: 'eu-ES' },
  // ── 欧洲南部 / 东部 ────────────────────────────
  { label: 'Español', value: 'es-ES' },
  { label: 'Español (Latinoamérica)', value: 'es-MX' },
  { label: 'Español (Argentina)', value: 'es-AR' },
  { label: 'Português (Portugal)', value: 'pt-PT' },
  { label: 'Português (Brasil)', value: 'pt-BR' },
  { label: 'Italiano', value: 'it-IT' },
  { label: 'Ελληνικά', value: 'el-GR' },
  { label: 'Русский', value: 'ru-RU' },
  { label: 'Українська', value: 'uk-UA' },
  { label: 'Polski', value: 'pl-PL' },
  { label: 'Čeština', value: 'cs-CZ' },
  { label: 'Slovenčina', value: 'sk-SK' },
  { label: 'Slovenščina', value: 'sl-SI' },
  { label: 'Hrvatski', value: 'hr-HR' },
  { label: 'Српски', value: 'sr-RS' },
  { label: 'Босански', value: 'bs-BA' },
  { label: 'Shqip', value: 'sq-AL' },
  { label: 'Română', value: 'ro-RO' },
  { label: 'Magyar', value: 'hu-HU' },
  { label: 'Български', value: 'bg-BG' },
  { label: 'Lietuvių', value: 'lt-LT' },
  { label: 'Latviešu', value: 'lv-LV' },
  { label: 'Eesti', value: 'et-EE' },
  { label: 'Македонски', value: 'mk-MK' },
  // ── 中东 / 中亚 / 高加索 ──────────────────────
  { label: 'العربية', value: 'ar-SA' },
  { label: 'العربية (مصر)', value: 'ar-EG' },
  { label: 'עברית', value: 'he-IL' },
  { label: 'فارسی', value: 'fa-IR' },
  { label: 'Türkçe', value: 'tr-TR' },
  { label: 'Azərbaycan', value: 'az-AZ' },
  { label: 'Қазақ', value: 'kk-KZ' },
  { label: 'O‘zbek', value: 'uz-UZ' },
  { label: 'ქართული', value: 'ka-GE' },
  { label: 'Հայերեն', value: 'hy-AM' },
  // ── 非洲 ──────────────────────────────────────
  { label: 'Kiswahili', value: 'sw-KE' },
  { label: 'አማርኛ', value: 'am-ET' },
  { label: 'Afrikaans', value: 'af-ZA' },
  { label: 'isiZulu', value: 'zu-ZA' },
];
