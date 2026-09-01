/**
 * 轻内核错误边界
 *
 * - loadApp 失败 → 渲染降级 UI 到容器
 * - mount 抛错 → 自动卸载 + 标记该应用本次会话降级
 *
 * P0-E1 修复：所有动态值经 escapeHtml 转义后再注入 innerHTML，
 * 防止 config.name / config.entry / config.activeRule 含恶意字符导致 XSS。
 *
 * 职责拆分（行为不变，本文件保留错误类型定义与降级 UI 渲染）：
 * - error-utils.ts               locale 读取 / HTML 转义 / id 净化工具
 * - error-fallback-messages.ts   降级 UI i18n 消息与全局语言状态
 * - error-degradation.ts         会话级降级标记 / 重试计数 / 三级降级决策
 *
 * @path comm\effects\micro-kernel\src\error-boundary.ts
 * @author ydsz-team
 * @since 3.0.0
 */

import type { MicroAppConfig } from "@ydsz/micro-runtime";

import {
  type ErrorFallbackMessages,
  getGlobalErrorFallbackMessages,
  getPresetFallbackMessages,
  resolveEffectiveLocale,
} from "./error-fallback-messages";
import {
  getRetryCount,
  MAX_MICRO_RETRIES,
  setRetryCount,
  unmarkDegraded,
} from "./error-degradation";
import { ERROR_UI_CLASSES, injectErrorStyles } from "./error-ui-styles";
import { escapeHtml, sanitizeId } from "./error-utils";

// ---------------------------------------------------------------------------
// 向后兼容 re-export：全部移出符号经本模块透出，外部消费方零改动
// ---------------------------------------------------------------------------
export {
  getLocaleFromStorage,
  escapeHtml,
  sanitizeId,
} from "./error-utils";
export {
  type ErrorFallbackMessages,
  setErrorFallbackMessages,
  setCurrentLocale,
  getCurrentLocale,
  resolveEffectiveLocale,
  getErrorFallbackMessagesByLocale,
} from "./error-fallback-messages";
export {
  markDegraded,
  isDegraded,
  clearDegraded,
  resetRetryCount,
  getRetryCount,
  setRetryCount,
  MAX_MICRO_RETRIES,
  createErrorBoundaryManager,
  decideDegradationLevel,
  getNextAutoRetryDelay,
} from "./error-degradation";

/**
 * P1-8: 内核错误码枚举。
 *
 * 标准化的错误分类，供监控系统（Sentry / 内部 Logan）按 code 聚合报警。
 *
 * @since 4.0.1
 */
export enum KernelErrorCode {
  /** 子应用未导出必要的 mount/unmount 方法 */
  LIFECYCLE_MISSING = "LIFECYCLE_MISSING",
  /** ESM 入口模块 dynamic import 失败 */
  LOAD_ESM_IMPORT = "LOAD_ESM_IMPORT",
  /** manifest.json 拉取失败（HTTP 404 / 500 等） */
  LOAD_MANIFEST_FETCH = "LOAD_MANIFEST_FETCH",
  /** manifest.json 内容非法（JSON 解析失败 / 缺少 entry 字段） */
  LOAD_MANIFEST_INVALID = "LOAD_MANIFEST_INVALID",
  /** 加载超时 */
  LOAD_TIMEOUT = "LOAD_TIMEOUT",
  /** mount 调用抛错 */
  MOUNT_ERROR = "MOUNT_ERROR",
  /** 沙箱创建或进入失败 */
  SANDBOX_ERROR = "SANDBOX_ERROR",
  /** unmount 调用抛错 */
  UNMOUNT_ERROR = "UNMOUNT_ERROR",
  /** 静态注册表为空（宿主未注入 setStaticRegistry 且未提供 fetcher） */
  REGISTRY_STATIC_EMPTY = "REGISTRY_STATIC_EMPTY",
}

/**
 * P1-8: 携带 errorCode 的内核错误类。
 *
 * 所有内核内部抛出的错误统一使用本类，监控系统可读取 code 字段聚合。
 *
 * @since 4.0.1
 */
export class KernelError extends Error {
  override readonly cause?: unknown;
  readonly code: KernelErrorCode;

  constructor(code: KernelErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "KernelError";
    this.code = code;
    this.cause = cause;
  }
}

/**
 * 渲染错误降级 UI。
 *
 * v3.1: onRetry 回调优先于整页刷新。
 * 点击「重试」时：
 *   - 若 onRetry 存在且重试次数 < MAX_MICRO_RETRIES → 调用 onRetry 重新激活子应用
 *   - 否则 → 回退到 window.location.href 整页跳转
 *
 * v3.2: 增强 UI 展示，提供错误详情、重试计数、返回首页等选项
 *
 * v3.3: 支持 i18n，通过 ErrorFallbackMessages 配置消息
 *
 * v3.4: 支持 HTMLElement 容器，与 MicroAppConfig.container 类型对齐
 *
 * P0-E1: 所有动态值（config.name / config.entry / config.activeRule）经 escapeHtml
 *        转义后注入，防止 XSS。元素 id 使用 sanitizeId 净化后的应用名。
 *
 * v4.0 P2-3: 键盘可访问性增强
 *   - 渲染后自动聚焦「重试」按钮
 *   - 容器设置 role="alert" aria-live="assertive"，屏幕阅读器可感知
 *   - Escape 键返回首页
 *   - 按钮设置可见 focus 样式（outline）
 *
 * @param config - 子应用配置
 * @param container - 容器（HTMLElement 或 null）
 * @param onRetry - 微前端级重试回调（清除降级标记 → 重新激活），不传则直接整页跳转
 * @param messages - 可选的自定义消息配置，不传则使用全局配置
 */
export function renderErrorFallback(
  config: MicroAppConfig,
  container: HTMLElement | null,
  onRetry?: () => Promise<void>,
  messages?: ErrorFallbackMessages,
): void {
  const el = container;
  if (!el) return;

  const retryCount = getRetryCount(config.name);
  const canRetry = onRetry && retryCount < MAX_MICRO_RETRIES;
  // P0-3 + v4.2.1 N12: 未显式提供消息时，优先使用 setErrorFallbackMessages 注入的
  // 全局消息（自定义文案真正生效）；全局消息未被覆盖时回退到 locale 内置文案。
  const msg =
    messages ??
    getGlobalErrorFallbackMessages() ??
    getPresetFallbackMessages(resolveEffectiveLocale());

  // P0-E1: 转义所有动态值，防止 XSS
  const escName = escapeHtml(config.name);
  const escEntry = escapeHtml(config.entry);
  const escActiveRule = escapeHtml(
    typeof config.activeRule === "string"
      ? config.activeRule
      : String(config.activeRule),
  );
  const escTitle = escapeHtml(msg.title);
  const escDescription = escapeHtml(msg.description);
  const escRetry = escapeHtml(msg.retry);
  const escGoHome = escapeHtml(msg.goHome);
  const escTechnicalDetails = escapeHtml(msg.technicalDetails);
  const escAppNameLabel = escapeHtml(msg.appName);
  const escEntryLabel = escapeHtml(msg.entry);
  const escActiveRuleLabel = escapeHtml(msg.activeRule);
  const escRetryCountLabel = escapeHtml(msg.retryCount);
  const escReloading = escapeHtml(msg.reloading);
  const escRetriesLeft = escapeHtml(msg.retriesLeft);
  // v3.7.0: 第三级降级按钮文案
  const escGoToSubAppUrl = escapeHtml(msg.goToSubAppUrl || "独立访问");

  // P0-E1: 净化应用名为合法 HTML id
  const safeId = sanitizeId(config.name);
  const retryBtnId = `micro-kernel-retry-${safeId}`;
  const homeBtnId = `micro-kernel-home-${safeId}`;
  // v3.7.0: 第三级降级按钮 id
  const subAppUrlBtnId = `micro-kernel-suburl-${safeId}`;

  // P1-2: 注入 CSS 样式（首次调用时生效，注入到 document.head）
  if (typeof document !== "undefined") {
    injectErrorStyles();
  }

  const C = ERROR_UI_CLASSES;

  el.innerHTML =
    // P2-3 (v4.2 class-based): role="alert" + aria-live 让屏幕阅读器感知错误
    // tabindex="-1" 让容器可编程聚焦
    `<div role="alert" aria-live="assertive" tabindex="-1" class="${C.container}">` +
    // 错误图标（aria-hidden 不朗读装饰性图标）
    `<div aria-hidden="true" class="${C.iconWrap}">` +
    `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--micro-error-danger)" stroke-width="2">` +
    `<circle cx="12" cy="12" r="10"/>` +
    `<line x1="12" y1="8" x2="12" y2="12"/>` +
    `<line x1="12" y1="16" x2="12.01" y2="16"/>` +
    `</svg></div>` +
    // 错误标题
    `<h2 class="${C.title}">${escTitle}</h2>` +
    // 应用名称
    `<p class="${C.appName}">${escName}</p>` +
    // 错误描述
    `<p class="${C.description}">${escDescription}${
      canRetry ? `<br/>${escRetriesLeft}${MAX_MICRO_RETRIES - retryCount}` : ""
    }</p>` +
    // 操作按钮组
    `<div class="${C.actions}">${
      canRetry
        ? // P2-3: focus-visible outline 通过 CSS class 控制
          `<button id="${retryBtnId}" class="${C.btnPrimary}" aria-label="${escRetry} ${escName}">${escRetry}</button>`
        : ""
    }<button id="${homeBtnId}" class="${C.btnSecondary}" aria-label="${escGoHome}">${escGoHome}</button>${
      // v3.7.0: 第三级降级按钮 — retry 耗尽后展示，允许用户跳转子应用独立地址
      !canRetry && escEntry
        ? `<button id="${subAppUrlBtnId}" class="${C.btnGhost}" aria-label="${escGoToSubAppUrl} — ${escName}">${escGoToSubAppUrl}</button>`
        : ""
    }</div>` +
    // 技术详情（可折叠）
    `<details class="${C.details}">` +
    `<summary>${escTechnicalDetails}</summary>` +
    `<div class="${C.detailsBody}">` +
    `<div>${escAppNameLabel}${escName}</div>` +
    `<div>${escEntryLabel}${escEntry}</div>` +
    `<div>${escActiveRuleLabel}${escActiveRule}</div>` +
    `<div>${escRetryCountLabel}${retryCount}/${MAX_MICRO_RETRIES}</div>` +
    `</div></details>` +
    `</div>`;

  // P2-3: 自动聚焦第一个可交互元素
  // 优先聚焦「重试」按钮，否则「返回首页」
  // 屏幕阅读器会朗读 role="alert" 的容器内容，键盘用户可直接 Enter 激活
  const firstFocusable =
    document.getElementById(retryBtnId) || document.getElementById(homeBtnId);
  if (firstFocusable) {
    firstFocusable.focus();
  }

  // 重试按钮事件
  document.getElementById(retryBtnId)?.addEventListener("click", () => {
    if (!onRetry) return;

    setRetryCount(config.name, retryCount + 1);

    // 微前端级重试：清除降级标记 → 重新激活
    unmarkDegraded(config.name);
    el.innerHTML =
      `<div role="status" aria-live="polite" style="display:flex;flex-direction:column;align-items:center;justify-content:center;` +
      `height:100%;font-family:var(--font-sans, sans-serif)">` +
      `<div aria-hidden="true" style="width:40px;height:40px;border:3px solid var(--el-border-color-lighter, #ebeef5);` +
      `border-top-color:var(--el-color-primary, #409eff);border-radius:50%;` +
      `animation:spin 0.8s linear infinite"></div>` +
      `<p style="margin:16px 0 0;font-size:14px;color:var(--el-text-color-secondary, #909399)">${
        escReloading
      }</p>` +
      `<style>@keyframes spin { to { transform: rotate(360deg); } }</style>` +
      `</div>`;

    onRetry().catch(() => {
      // 重试失败 → 重新渲染错误 UI（进入更高级别降级）
      renderErrorFallback(config, el, onRetry, messages);
    });
  });

  // 返回首页按钮事件
  document.getElementById(homeBtnId)?.addEventListener("click", () => {
    window.location.href = "/";
  });

  // v3.7.0: 三级降级第三级按钮 — 跳转子应用独立部署地址（full 模式 = 超过 micro 重试上限）
  document.getElementById(subAppUrlBtnId)?.addEventListener("click", () => {
    const subUrl = config.entry.replace(/\/$/, "");
    window.location.href = subUrl || "/";
  });

  // P2-3: Escape 键返回首页（避免用户键盘被困在错误容器中）
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      window.location.href = "/";
    }
  };
  el.addEventListener("keydown", onKeydown);
}
