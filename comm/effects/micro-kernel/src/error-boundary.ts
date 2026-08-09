/**
 * 轻内核错误边界
 *
 * - loadApp 失败 → 渲染降级 UI 到容器
 * - mount 抛错 → 自动卸载 + 标记该应用本次会话降级
 *
 * P0-E1 修复：所有动态值经 escapeHtml 转义后再注入 innerHTML，
 * 防止 config.name / config.entry / config.activeRule 含恶意字符导致 XSS。
 *
 * @path comm/effects/micro-kernel/src/error-boundary.ts
 * @author ydsz-team
 * @since 3.0.0
 */

import type { MicroAppConfig } from "@ydsz/micro-runtime";

import { createLogger } from "@YDSZ-core/shared/utils";

import { ERROR_UI_CLASSES, injectErrorStyles } from "./error-ui-styles";

/** 模块级日志器 */
const logger = createLogger("MicroKernel");

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
}

/**
 * P1-8: 携带 errorCode 的内核错误类。
 *
 * 所有内核内部抛出的错误统一使用本类，监控系统可读取 code 字段聚合。
 *
 * @since 4.0.1
 */
export class KernelError extends Error {
  readonly cause?: unknown;
  readonly code: KernelErrorCode;

  constructor(code: KernelErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "KernelError";
    this.code = code;
    this.cause = cause;
  }
}

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
 * P0-3: 获取当前生效的语言标识。
 *
 * 全局消息已设置时优先匹配其语言，否则回退到 localStorage。
 *
 * @since 4.0.1
 */
export function resolveEffectiveLocale(): string {
  // 检测全局消息当前语言：捷克塞到 globalMessages 中取 title 对比中文默认值
  const isChinese = globalMessages.title === zhCNMessages.title;
  if (isChinese) {
    // 全局消息为中文默认；检查用户是否偏好英文
    const storageLocale = getLocaleFromStorage();
    return storageLocale.startsWith("en") ? "en-US" : "zh-CN";
  }
  // 全局消息已被覆盖为非中文，按当前消息语言定
  return globalMessages.title === enUSMessages.title ? "en-US" : "zh-CN";
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
 * 错误降级 UI 消息配置，支持 i18n。
 *
 * @remarks
 * 默认提供中英文消息，业务方可通过 {@link setErrorFallbackMessages} 注入自定义消息，
 * 或通过 MicroAppConfig 传入自定义消息覆盖全局配置。
 */
export interface ErrorFallbackMessages {
  /** 错误标题 */
  title: string;
  /** 错误描述 */
  description: string;
  /** 剩余重试次数提示 */
  retriesLeft: string;
  /** 重试按钮文案 */
  retry: string;
  /** 返回首页按钮文案 */
  goHome: string;
  /** 技术详情折叠标题 */
  technicalDetails: string;
  /** 技术详情 - 应用名称 */
  appName: string;
  /** 技术详情 - 入口地址 */
  entry: string;
  /** 技术详情 - 激活规则 */
  activeRule: string;
  /** 技术详情 - 重试次数 */
  retryCount: string;
  /** 重新加载中提示 */
  reloading: string;
  /** 三级降级：前往子应用独立部署地址按钮（v3.7 新增） */
  goToSubAppUrl?: string;
}

/** 默认中文消息 */
const zhCNMessages: ErrorFallbackMessages = {
  title: "应用加载失败",
  description: "子应用可能正在发版或网络异常，请稍后重试。",
  retriesLeft: "剩余重试次数：",
  retry: "重试加载",
  goHome: "返回首页",
  technicalDetails: "技术详情",
  appName: "应用名称：",
  entry: "入口地址：",
  activeRule: "激活规则：",
  retryCount: "重试次数：",
  reloading: "重新加载中...",
  goToSubAppUrl: "前往子应用独立页",
};

/** 默认英文消息 */
const enUSMessages: ErrorFallbackMessages = {
  title: "Failed to Load Application",
  description:
    "The sub-application may be deploying or experiencing network issues. Please try again later.",
  retriesLeft: "Retries left: ",
  retry: "Retry",
  goHome: "Go Home",
  technicalDetails: "Technical Details",
  appName: "App Name: ",
  entry: "Entry: ",
  activeRule: "Active Rule: ",
  retryCount: "Retry Count: ",
  reloading: "Reloading...",
  goToSubAppUrl: "Open Sub-App Page",
};

/** 当前全局消息配置 */
let globalMessages: ErrorFallbackMessages = zhCNMessages;

/**
 * 设置全局错误降级 UI 消息。
 *
 * @param messages - 消息配置对象
 */
export function setErrorFallbackMessages(
  messages: ErrorFallbackMessages,
): void {
  globalMessages = messages;
}

/**
 * 根据语言标识获取预置消息。
 *
 * @param locale - 语言标识，如 'zh-CN'、'en-US'
 * @returns 消息配置对象
 */
export function getErrorFallbackMessagesByLocale(
  locale: string,
): ErrorFallbackMessages {
  if (locale.startsWith("en")) {
    return enUSMessages;
  }
  return zhCNMessages;
}

/** 本次会话应用降级 set（key = app.name，该应用不再尝试微前端加载，走整页跳转） */
const degradedApps = new Set<string>();

/** 将指定子应用标记为本次会话降级，后续不再尝试微前端加载，直接整页跳转 */
export function markDegraded(appName: string): void {
  degradedApps.add(appName);
  logger.warn(`${appName} degraded to full-page navigation`);
}

/** 判断指定子应用是否已被标记为本会话降级状态 */
export function isDegraded(appName: string): boolean {
  return degradedApps.has(appName);
}

/** 清空本次会话的全部子应用降级标记 */
export function clearDegraded(): void {
  degradedApps.clear();
}

/** 每个应用的微前端重试计数器（达到上限后回退整页跳转） */
const retryCounters = new Map<string, number>();
/** 用户可见的 micro 重试上限：-1 表示不自动重试（直接走占位 UI） */
const MAX_MICRO_RETRIES = 3;
/** 静默自动重试上限：首次失败后静默重试 N 次（不展示 UI，应对 CDN 偶发抖动） */
const MAX_AUTO_RETRIES = 1;

/** 重置指定应用的重试计数 */
export function resetRetryCount(appName: string): void {
  retryCounters.delete(appName);
}

/** v3.7.0: 读取应用重试计数（内部用） */
export function getRetryCount(appName: string): number {
  return retryCounters.get(appName) ?? 0;
}

/** v3.7.0: 设置应用重试计数 */
export function setRetryCount(appName: string, count: number): void {
  retryCounters.set(appName, count);
}

/**
 * P0-A1: 创建 error-boundary 生命周期管理器。
 *
 * 清空降级集合 + 重试计数器。
 *
 * @since 4.1.0
 */
export function createErrorBoundaryManager(): import("./manager-registry").DisposableManager {
  return {
    name: "error-boundary",
    dispose(): void {
      degradedApps.clear();
      retryCounters.clear();
    },
  };
}

/**
 * 获取自动重试退避延迟（ms）。
 *
 * 第 n 次退避：baseDelay * 2^n + jitter，用于 CDN 偶发故障恢复。
 */
function getAutoRetryDelay(attempt: number): number {
  const base = 500;
  const jitter = Math.random() * 200;
  return base * 2 ** attempt + jitter;
}

/**
 * 三级降级决策：自动静默重试 → 占位 UI（允许手动重试）→ 整页跳转
 *
 * - attempt < MAX_AUTO_RETRIES → 静默自动重试（不展示 UI）
 * - MAX_AUTO_RETRIES <= attempt < MAX_MICRO_RETRIES → 展示占位 UI 允许手动重试
 * - attempt >= MAX_MICRO_RETRIES → 标记降级 + 整页跳转
 *
 * @param appName - 应用名
 * @returns 'auto-retry' | 'show-ui' | 'full-page'
 */
export function decideDegradationLevel(
  appName: string,
): "auto-retry" | "full-page" | "show-ui" {
  const count = retryCounters.get(appName) ?? 0;
  if (count < MAX_AUTO_RETRIES) return "auto-retry";
  if (count < MAX_MICRO_RETRIES) return "show-ui";
  return "full-page";
}

/** 获取下次自动重试延迟（仅 auto-retry 级别有意义） */
export function getNextAutoRetryDelay(appName: string): number {
  const count = retryCounters.get(appName) ?? 0;
  return getAutoRetryDelay(count);
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

  const retryCount = retryCounters.get(config.name) ?? 0;
  const canRetry = onRetry && retryCount < MAX_MICRO_RETRIES;
  // P0-3: 未显式提供消息时，根据当前全局配置自动选择（已包含 localStorage 后备）
  const msg =
    messages ??
    (resolveEffectiveLocale().startsWith("en") ? enUSMessages : zhCNMessages);

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

    retryCounters.set(config.name, retryCount + 1);

    // 微前端级重试：清除降级标记 → 重新激活
    degradedApps.delete(config.name);
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
