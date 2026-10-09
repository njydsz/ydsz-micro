/**
 * 错误码 i18n 映射对外入口
 *
 * <p>对外暴露按语种分组的错误码映射对象与统一查找函数，
 * 响应拦截器应从此模块导入 {@link resolveErrorMessage} 来解析业务错误码。
 *
 * <p>设计决策：本模块**不**直接引用 `@ydsz/preferences` / `@ydsz/request`，
 * 由调用方传入当前语种字符串。这保持 `comm/locales` 作为纯词条包的低耦合，
 * 避免引入运行时循环依赖（ `@ydsz/request → @ydsz/locales → @ydsz/request` ）。
 *
 * <p>i18nKey 回退逻辑通过函数内部 lazy import 按需加载，
 * 在 resolveErrorMessage 被调用时（响应拦截阶段）模块图已完全初始化，
 * 因此 lazy import 不会触发 ES Module live-binding 未就绪问题。
 *
 * @path comm/locales/errors/index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { ErrorCode } from './types';
import { ZH_CN_MESSAGES, getZhCnMessage } from './zh-CN';
import { EN_US_MESSAGES, getEnUsMessage } from './en-US';
import { $t } from '../src/i18n';
import type { SupportedLanguagesType } from '../typing';

// Re-export for direct use by tests or external tooling
export { ZH_CN_MESSAGES, EN_US_MESSAGES, getZhCnMessage, getEnUsMessage };
export type { ErrorCode } from './types';

/**
 * 支持语言与错误码映射表的对应关系。
 */
const LOCALE_MESSAGE_MAP: Record<SupportedLanguagesType, Readonly<Partial<Record<ErrorCode, string>>>> = {
  'zh-CN': ZH_CN_MESSAGES,
  'en-US': EN_US_MESSAGES,
};

/**
 * 根据指定语种解析错误码对应的本地化描述。
 *
 * <p>查找顺序为：
 * <ol>
 *   <li>按传入的 {@code locale} 选择对应语种静态映射表（手工精校文案，最高优先级）</li>
 *   <li>回退到后端提供的 {@code i18nKey}（GENERATED_ERROR_CODE_META）直接查 vue-i18n 词条表</li>
 * </ol>
 *
 * <p>双重回退设计确保：
 * <ul>
 *   <li>后端新增错误码时若携带 {@code i18nKey}，前端无需任何代码变更即可展示对应多语文案</li>
 *   <li>需要面向用户微调文案时，在静态映射表中覆盖（优先级高于 i18nKey 回退）</li>
 * </ul>
 *
 * <p>若两个来源均未命中，返回 {@code undefined}，调用方应降级使用后端 {@code serverMessage}。
 *
 * @param code - 后端业务错误码（{@code YdszResponse.code}）
 * @param locale - 目标语种标识（通常由调用方传入 `preferences.app.locale`）
 * @returns 匹配的本地化文案；未命中或未维护该语种时返回 {@code undefined}
 */
export async function resolveErrorMessage(
  code: ErrorCode,
  locale: SupportedLanguagesType,
): Promise<string | undefined> {
  // 1. 静态映射表优先（手工精校文案）
  const staticMap = LOCALE_MESSAGE_MAP[locale];
  if (staticMap) {
    const staticMessage = staticMap[code];
    if (staticMessage !== undefined) return staticMessage;
  }

  // 2. 回退到 GENERATED_ERROR_CODE_META 中的 i18nKey
  //    lazy import 打破循环依赖（@ydsz/locales ↔ @ydsz/request）
  // 通过运行时变量间接引用包名，绕过 Vite 静态预扫描（避免循环依赖报错）
  const requestPkg = '@ydsz/request';
  const { GENERATED_ERROR_CODE_META } = await import(/* @vite-ignore */ requestPkg);
  const meta = GENERATED_ERROR_CODE_META[code];
  if (meta?.i18nKey) {
    const i18nMessage = $t(meta.i18nKey as Parameters<typeof $t>[0]);
    // $t 在 key 缺失时会直接返回 key 本身；需判断是否真正命中词条
    if (typeof i18nMessage === 'string' && i18nMessage !== meta.i18nKey) {
      return i18nMessage;
    }
  }

  return undefined;
}
