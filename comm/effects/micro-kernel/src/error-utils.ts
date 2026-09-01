/**
 * 错误边界工具函数
 *
 * 从 error-boundary.ts 拆出（仅移动，无行为变更）：
 * locale 读取与 HTML 净化工具，供 fallback 消息层与降级 UI 复用。
 *
 * @path comm/effects/micro-kernel/src/error-utils.ts
 * @author ydsz-team
 * @since 4.2.1
 */

/**
 * P0-3: 从 localStorage 中读取用户语言偏好，作为 i18n 后备。
 *
 * bootstrap.ts 在 watchEffect 中调用 setErrorFallbackMessages 初始化全局消息，
 * 但当 error boundary 在 preferences 初始化之前触发错误时（如首屏子应用加载失败），
 * globalMessages 默认为中文。通过读取 localStorage 可提前对齐用户偏好。
 *
 * @returns 'zh-CN' | 'en-US'
 *
 * @since 4.0.1
 */
export function getLocaleFromStorage(): string {
  try {
    // 与 main/src/preferences 中 localStorage key 约定对齐
    const stored = localStorage.getItem("YDSZ:preferences");
    if (stored) {
      const prefs = JSON.parse(stored);
      if (prefs?.app?.locale) return prefs.app.locale;
    }
    // 兜底到 navigator.language
    if (typeof navigator !== "undefined" && navigator.language) {
      return navigator.language;
    }
  } catch {
    // 静默
  }
  return "zh-CN";
}

/**
 * P0-E1: 转义 HTML 特殊字符，防止 XSS。
 *
 * 将 &, <, >, ", ' 转义为对应的 HTML 实体，
 * 确保动态值安全地注入 innerHTML。
 */
export function escapeHtml(str: string): string {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * P0-E1: 将应用名净化为合法的 HTML id。
 *
 * HTML id 不允许空格和特殊字符，将非字母数字字符替换为 `-`。
 */
export function sanitizeId(appName: string): string {
  return appName.replaceAll(/[^\w-]/g, "-");
}

/**
 * v4.4.1 E1: 复制诊断信息到剪贴板（含旧浏览器 execCommand 回退）。
 *
 * @param diagnostics - 诊断字段集合（appName / errorCode / timestamp 等）
 * @returns 复制成功返回 true；剪贴板不可用或写入失败返回 false
 */
export async function copyDiagnosticsToClipboard(
  diagnostics: Record<string, unknown>,
): Promise<boolean> {
  const text = JSON.stringify(diagnostics, null, 2);
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 剪贴板 API 失败（权限拒绝 / 非安全上下文）走 execCommand 回退
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}
