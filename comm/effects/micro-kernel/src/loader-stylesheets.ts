/**
 * 子应用样式表注入 / 卸载（自 loader.ts 拆分出的内聚单元）。
 *
 * <p>职责：向宿主 document 注入子应用样式表并等待加载完成、按应用名卸载。
 * 与 manifest 加载、ESM entry 导入无耦合，仅依赖调用方注入 CSP nonce。
 *
 * @path comm\effects\micro-kernel\src\loader-stylesheets.ts
 * @author ydsz-team
 * @since 4.4.2
 */

import { createLogger } from '@ydsz-core/shared/utils';

/** 模块级日志器 */
const logger = createLogger('MicroKernel');

/**
 * 等待单个样式表加载完成的超时兜底（毫秒）。
 *
 * v4.4.1 P1：超时后按"已加载"放行并告警，避免弱网下激活链路被单张
 * 样式表卡死；JS 层失败仍由 error-boundary 分级降级兜底。
 */
const CSS_LOAD_TIMEOUT_MS = 3_000;

/**
 * 注入子应用样式表，并等待全部样式表加载完成（v4.4.1 P1 FOUC 修复）。
 *
 * v4.2.1 L2: 附加 SRI integrity（manifest.integrity.css）+ crossorigin，
 * 以及 CSP nonce（style-src 策略兼容）。
 *
 * 返回时机：全部 link 触发 load、或触发 error（告警放行）、或超时兜底。
 *
 * @param cssUrls 样式表 URL 列表
 * @param appName 子应用名（写入 data 属性，供卸载时精准移除）
 * @param integrity URL → SRI hash 映射
 * @param nonce 页面 CSP nonce（由 loader 通过 setCspNonce 设置后传入）
 */
export async function injectStylesheets(
  cssUrls: string[],
  appName: string,
  integrity?: Record<string, string>,
  nonce?: string,
): Promise<void> {
  const pending: Array<Promise<void>> = [];
  for (const href of cssUrls) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-micro-kernel-app', appName);
    // L2: SRI 校验（manifest 提供 hash 时）
    const hash = integrity?.[href];
    if (hash) {
      link.integrity = hash;
      link.crossOrigin = 'anonymous';
    }
    // L2: CSP nonce 兼容
    if (nonce) {
      link.setAttribute('nonce', nonce);
    }
    document.head.appendChild(link);
    pending.push(awaitStylesheetLoad(link, href));
  }
  await Promise.all(pending);
}

/**
 * 等待单个样式表 load/error 事件，附超时兜底。
 *
 * v4.4.1 P1：加载失败或超时不抛错（不阻塞激活），仅记录告警日志，
 * 由调用方决定是否需要进一步处理。
 *
 * @param link 样式表 link 元素
 * @param href 样式表地址（用于日志定位）
 */
function awaitStylesheetLoad(link: HTMLLinkElement, href: string): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = (reason: 'error' | 'loaded' | 'timeout'): void => {
      if (settled) return;
      settled = true;
      if (reason !== 'loaded') {
        logger.warn(
          `[MicroKernel] Stylesheet "${href}" not loaded (${reason}), mounting without it`,
        );
      }
      resolve();
    };
    link.addEventListener('load', () => finish('loaded'), { once: true });
    link.addEventListener('error', () => finish('error'), { once: true });
    setTimeout(() => finish('timeout'), CSS_LOAD_TIMEOUT_MS);
  });
}

/**
 * 移除指定应用注入的样式表。
 *
 * @param appName 子应用名
 */
export function removeStylesheets(appName: string): void {
  const links = document.querySelectorAll(`link[data-micro-kernel-app="${appName}"]`);
  for (const link of links) {
    link.remove();
  }
}
