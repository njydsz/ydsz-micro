/**
 * 错误码 i18n 映射 — 严格 key 类型定义
 *
 * <p>导出 {@link ErrorCode} 类型：后端业务错误码的字符串字面值联合类型。
 * 该类型由 {@code comm/effects/request/src/error-codes.generated.ts} 中
 * {@code ErrorCode} 常量对象派生而来（438 个错误码的全部 code 值），
 * 作为 {@link ZH_CN_MESSAGES} / {@link EN_US_MESSAGES} 等映射对象的 key 类型，
 * 确保前端不可能引用到一个后端不存在的错误码文案。
 *
 * <p>当后端新增 / 修改错误码时，由 {@code pnpm gen:error-codes} 同步本类型；
 * 对应语种文案则在本目录的 {@code zh-CN.ts} / {@code en-US.ts} 中补齐。
 *
 * @path comm/locales/errors/types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { ErrorCodeType } from '@ydsz/request';

/**
 * 后端业务错误码的严格字符串联合类型。
 *
 * @remarks
 * 直接使用 {@code import type} 由 @ydsz/request 的 {@code ErrorCodeType} 派生，
 * 避免独立维护一份容易出现漂移的错误码清单。
 * 该 import 在编译期被擦除，不会引入运行时循环依赖。
 */
export type ErrorCode = ErrorCodeType;
