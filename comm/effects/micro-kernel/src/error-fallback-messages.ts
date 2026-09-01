/**
 * 错误降级 UI 消息（i18n 层）
 *
 * 从 error-boundary.ts 拆出（仅移动，无行为变更）：
 * ErrorFallbackMessages 接口、中英文预置消息与全局消息/语言状态。
 *
 * 注意：resolveEffectiveLocale 依赖本模块的 currentLocale 状态，
 * 故随状态一起移入本模块（而非 error-utils），避免循环依赖。
 *
 * @path comm/effects/micro-kernel/src/error-fallback-messages.ts
 * @author ydsz-team
 * @since 4.2.1
 */

import { getLocaleFromStorage } from "./error-utils";

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
  /** v4.4.1 E1: 复制诊断信息按钮文案（可选，缺省隐藏该按钮） */
  copyDiagnostics?: string;
  /** v4.4.1 E1: 诊断信息已复制提示（可选） */
  diagnosticsCopied?: string;
}

/**
 * v4.4.1 E1: 内核错误分类信息。
 *
 * 按 KernelErrorCode 分组给出面向用户的类别与处置提示，
 * 降级 UI 据此展示分类徽标与建议动作，替代笼统的"加载失败"。
 */
export interface ErrorCategoryInfo {
  /** 错误类别（如"网络加载失败"） */
  label: string;
  /** 处置建议（面向用户的一句话） */
  hint: string;
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
  copyDiagnostics: "复制诊断信息",
  diagnosticsCopied: "已复制",
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
 * v4.2.1 N12: 显式当前语言状态。
 *
 * 替代此前通过 `globalMessages.title === zhCNMessages.title` 的字符串比较
 * 推断语言（脆弱：默认文案任何微调都会破坏推断）。
 */
let currentLocale: string = "zh-CN";

/**
 * 设置全局错误降级 UI 消息。
 *
 * v4.2.1 N12: 同时根据消息内容推断并同步 currentLocale。
 *
 * @param messages - 消息配置对象
 */
export function setErrorFallbackMessages(
  messages: ErrorFallbackMessages,
): void {
  globalMessages = messages;
  // 推断语言：与内置文案匹配时更新 currentLocale
  if (messages.title === enUSMessages.title) {
    currentLocale = "en-US";
  } else if (messages.title === zhCNMessages.title) {
    currentLocale = "zh-CN";
  }
}

/**
 * v4.2.1 N12: 显式设置当前语言（推荐由主应用在语言切换时调用）。
 *
 * @param locale - 语言标识，如 'zh-CN' / 'en-US'
 * @since 4.2.1
 */
export function setCurrentLocale(locale: string): void {
  currentLocale = locale;
}

/**
 * v4.2.1 N12: 获取当前生效的语言标识。
 *
 * 优先级：显式设置的 currentLocale > localStorage 偏好 > navigator.language。
 *
 * @since 4.2.1
 */
export function getCurrentLocale(): string {
  if (currentLocale) return currentLocale;
  return getLocaleFromStorage();
}

/**
 * v4.2.1 N12: 获取当前生效的语言标识（内部使用）。
 *
 * 优先读取显式设置的 currentLocale，其次 localStorage 偏好。
 * 保留导出以兼容旧调用方（renderErrorFallback 等内部使用）。
 *
 * @since 4.0.1
 */
export function resolveEffectiveLocale(): string {
  return getCurrentLocale();
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

/**
 * 获取当前全局消息配置（供 renderErrorFallback 回退使用）。
 *
 * @returns 全局消息配置对象
 */
export function getGlobalErrorFallbackMessages(): ErrorFallbackMessages {
  return globalMessages;
}

/**
 * 获取内置中英文预置消息（供 renderErrorFallback 按 locale 回退使用）。
 *
 * @param locale - 语言标识
 * @returns 消息配置对象
 */
export function getPresetFallbackMessages(
  locale: string,
): ErrorFallbackMessages {
  return locale.startsWith("en") ? enUSMessages : zhCNMessages;
}

// ==================== v4.4.1 E1: 错误分类（KernelErrorCode 分组） ====================

/** 错误分类预置文案（zh-CN） */
const zhCNCategories: Record<string, ErrorCategoryInfo> = {
  LIFECYCLE_MISSING: {
    label: "子应用构建异常",
    hint: "子应用产物缺少生命周期导出，通常为构建配置问题，请联系开发人员。",
  },
  MOUNT_ERROR: {
    label: "子应用挂载失败",
    hint: "子应用初始化阶段出错，可能是版本不兼容，建议重试或稍后再试。",
  },
  UNMOUNT_ERROR: {
    label: "子应用卸载异常",
    hint: "子应用退出清理出错，功能已恢复，可继续使用其他应用。",
  },
  SANDBOX_ERROR: {
    label: "运行环境冲突",
    hint: "子应用运行环境初始化失败，建议刷新页面重试。",
  },
  REGISTRY_STATIC_EMPTY: {
    label: "应用注册表未就绪",
    hint: "主应用配置未加载完成，建议刷新页面重试。",
  },
  LOAD_TIMEOUT: {
    label: "网络加载超时",
    hint: "子应用响应过慢，请检查网络后重试；若持续超时可能正在发版。",
  },
  LOAD_ESM_IMPORT: {
    label: "网络加载失败",
    hint: "子应用资源加载失败，可能是网络波动或正在发版，请稍后重试。",
  },
  LOAD_MANIFEST_FETCH: {
    label: "网络加载失败",
    hint: "子应用描述文件获取失败，请检查网络后重试。",
  },
  LOAD_MANIFEST_INVALID: {
    label: "子应用版本异常",
    hint: "子应用产物校验失败，可能正在灰度发版，请稍后重试。",
  },
};

/** 错误分类预置文案（en-US） */
const enUSCategories: Record<string, ErrorCategoryInfo> = {
  LIFECYCLE_MISSING: {
    label: "Sub-App Build Issue",
    hint: "The sub-app bundle is missing lifecycle exports. Please contact the development team.",
  },
  MOUNT_ERROR: {
    label: "Sub-App Mount Failed",
    hint: "The sub-app failed during initialization. Retry or try again later.",
  },
  UNMOUNT_ERROR: {
    label: "Sub-App Unmount Issue",
    hint: "Cleanup on exit failed, but the system has recovered. Other apps remain usable.",
  },
  SANDBOX_ERROR: {
    label: "Runtime Conflict",
    hint: "Failed to initialize the sub-app runtime. Refresh the page to retry.",
  },
  REGISTRY_STATIC_EMPTY: {
    label: "Registry Not Ready",
    hint: "Host configuration is not loaded yet. Refresh the page to retry.",
  },
  LOAD_TIMEOUT: {
    label: "Network Timeout",
    hint: "The sub-app responded too slowly. Check your network and retry; it may be deploying.",
  },
  LOAD_ESM_IMPORT: {
    label: "Network Failure",
    hint: "Failed to load sub-app resources. Possible network fluctuation or deployment in progress.",
  },
  LOAD_MANIFEST_FETCH: {
    label: "Network Failure",
    hint: "Failed to fetch the sub-app manifest. Check your network and retry.",
  },
  LOAD_MANIFEST_INVALID: {
    label: "Version Mismatch",
    hint: "Sub-app bundle verification failed. A canary rollout may be in progress, please retry later.",
  },
};

/** 分类映射回退值（未知错误码） */
const UNKNOWN_CATEGORY: Record<string, ErrorCategoryInfo> = {
  "zh-CN": { label: "加载失败", hint: "发生未知错误，请稍后重试。" },
  "en-US": { label: "Load Failed", hint: "An unknown error occurred. Please try again later." },
};

/**
 * v4.4.1 E1: 按内核错误码获取面向用户的分类信息。
 *
 * @param code - KernelErrorCode 枚举值（字符串）
 * @param locale - 语言标识（zh-CN / en-US，其他回退 zh-CN）
 * @returns 分类标签与处置建议；未知错误码返回通用回退文案
 */
export function getErrorCategoryInfo(
  code: string,
  locale: string,
): ErrorCategoryInfo {
  const table = locale.startsWith("en") ? enUSCategories : zhCNCategories;
  return table[code] ?? UNKNOWN_CATEGORY[locale.startsWith("en") ? "en-US" : "zh-CN"];
}
