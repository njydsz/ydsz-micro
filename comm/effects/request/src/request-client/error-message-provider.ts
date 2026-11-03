/**
 * 错误消息格式化器的可注入提供者。
 *
 * <p>打破 request → locales 循环依赖：preset-interceptors 不再直接
 * import `$t`，而是通过本模块获取 formatter；locales 在初始化时注入
 * 实际实现（`i18n.global.t`）。
 *
 * @path comm\effects\request\src\request-client\error-message-provider.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { MakeErrorMessageFn } from './types';

let _formatter: MakeErrorMessageFn = (err) => {
  const e = err as { message?: string };
  return e?.message ?? 'Request error';
};

/** locales 在初始化阶段调用此函数注入 */
export function registerErrorMessageFormatter(fn: MakeErrorMessageFn): void {
  _formatter = fn;
}

/** preset-interceptors 内部调用获取当前格式化器 */
export function getErrorMessageFormatter(): MakeErrorMessageFn {
  return _formatter;
}
