/**
 * 错误码 i18n 映射对外入口
 *
 * <p>对外暴露按语种分组的错误码映射对象与统一查找函数，
 * 响应拦截器应从此模块导入 {@link resolveErrorMessage} 来解析业务错误码。
 *
 * <p>设计决策：本模块**不**直接引用 `@ydsz/preferences`，
 * 由调用方传入当前语种字符串。这保持 `comm/locales` 作为纯词条包的低耦合，
 * 避免引入运行时循环依赖（ `@ydsz/request → @ydsz/locales → @ydsz/preferences` ）。
 *
 * @path comm/locales/errors/index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { ErrorCode } from './types';
import { ZH_CN_MESSAGES, getZhCnMessage } from './zh-CN';
import { EN_US_MESSAGES, getEnUsMessage } from './en-US';
import type { SupportedLanguagesType } from '../typing';

// Re-export for direct use by tests or external tooling
export { ZH_CN_MESSAGES, EN_US_MESSAGES, getZhCnMessage, getEnUsMessage };
export type { ErrorCode } from './types';

/**
 * 支持语言与错误码映射表的对应关系。
 *
 * @remarks
 * 当新增语种支持时在此处添加对应映射即可。
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
 *   <li>按传入的 {@code locale} 选择对应语种映射表</li>
 *   <li>在映射表中查找 {@code code} 对应的文案</li>
 * </ol>
 *
 * <p>若指定语种未定义映射表或未命中，**不会**自动 fallback 到别的语种——
 * 调用方应将 {@code undefined} 视为「未命中」，并降级使用 {@code serverMessage}。
 *
 * 这样设计是为了让调用方可以精确区分「已知码但当前语种缺翻译」
 * 和「前端未收录该码」两种情况，避免静默 fallback 导致翻译缺失难以排查。
 *
 * @param code - 后端业务错误码（{@code YdszResponse.code}）
 * @param locale - 目标语种标识（通常由调用方传入 `preferences.app.locale`）
 * @returns 匹配的本地化文案；未命中或未维护该语种时返回 {@code undefined}
 */
export function resolveErrorMessage(code: ErrorCode, locale: SupportedLanguagesType): string | undefined {
  const map = LOCALE_MESSAGE_MAP[locale];
  if (!map) return undefined;
  return map[code];
}
