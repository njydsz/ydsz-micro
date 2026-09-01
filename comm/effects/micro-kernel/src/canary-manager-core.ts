/**
 * canary-manager-core.ts — CanaryManager 核心分流逻辑
 *
 * 从 canary-manager.ts 提取的核心分流决策逻辑，包含：
 * - resolveVersion: 核心分流决策（advanced/simple 双模式）
 * - defaultStableResolution: 默认稳定版决策
 * - emitResolutionEvent: 分流决策事件触发
 * - 单例管理函数
 *
 * @path comm/effects/micro-kernel/src/canary-manager-core.ts
 * @author ydsz-team
 * @since 4.1.0
 */

import { createLogger } from "@YDSZ-core/shared/utils";

import { setStorage, STORAGE_KEYS } from "./storage-utils";
import type {
  CanaryAppConfig,
  CanaryGlobalConfig,
  CanaryMode,
  CanaryResolution,
  CanaryResolutionCallback,
  CanaryResolutionEvent,
  CanaryUserContext,
} from "./canary-types";
import type { CanaryManager } from "./canary-manager";
import type { DisposableManager } from "./manager-registry";
import { DEFAULT_CONFIG } from "./canary-types";
import { hashToPercentage } from "./canary-hash";

const logger = createLogger("Canary");

/**
 * CanaryManager 内部状态接口
 */
export interface CanaryManagerLike {
  config: CanaryGlobalConfig;
  cacheTimestamp: number;
  fetchPromise: null | Promise<void>;
  refreshTimerId: null | ReturnType<typeof setInterval>;
  resolutionCallbacks: CanaryResolutionCallback[];
}

/**
 * 默认稳定版决策
 *
 * @param _manager - 保留 manager 形参以对齐核心函数签名约定（当前决策不依赖实例状态）
 */
export function defaultStableResolution(
  _manager: CanaryManagerLike,
  appName: string,
  cfg?: CanaryAppConfig,
): CanaryResolution {
  if (cfg) {
    return {
      appName,
      resolved: cfg.stable,
      tag: "stable",
      whitelisted: false,
    };
  }
  return {
    appName,
    resolved: {
      version: "stable",
      tag: "stable",
      entry: "",
      percentage: 100,
    },
    tag: "stable",
    whitelisted: false,
  };
}

/**
 * P3-5: 触发所有分流决策回调。
 *
 * 异步触发（queueMicrotask）避免回调耗时阻塞 resolveVersion 热路径。
 * 回调内部抛出异常不影响分流结果（捕获并 log.warn）。
 */
export function emitResolutionEvent(
  manager: CanaryManagerLike,
  event: CanaryResolutionEvent,
): void {
  if (manager.resolutionCallbacks.length === 0) return;
  const callbacks = [...manager.resolutionCallbacks];
  // 异步触发：避免同步阻塞决策热路径
  queueMicrotask(() => {
    for (const cb of callbacks) {
      try {
        cb(event);
      } catch (error) {
        logger.warn("Canary resolution callback threw:", error);
      }
    }
  });
}

/**
 * 核心分流决策。
 *
 * **advanced 模式**（默认）决策流程：
 * 1. 灰度关闭 → 直接返回 stable
 * 2. 用户在白名单 → 强制命中 forceTag 版本
 * 3. 组织在白名单 → 强制命中 forceTag 版本（P3-5）
 * 4. 标签匹配 routeTags → 强制命中 forceTag 版本（P3-5）
 * 5. 按 userId FNV-1a 哈希 < canary.percentage → 命中 canary
 * 6. 否则 → stable
 *
 * **simple 模式**决策流程（P3-2）：
 * 1. 灰度关闭 → 直接返回 stable
 * 2. 存在 forceTag → 强制返回指定 tag 版本
 * 3. 否则 → stable（不做按用户哈希命中）
 *
 * 每次决策后触发 P3-5 分辨率事件（供遥测/分析使用）。
 *
 * @param manager - CanaryManager 实例
 * @param appName - 子应用名
 * @param user - 用户上下文
 * @returns 分流决策结果
 */
export function resolveVersionCore(
  manager: CanaryManagerLike,
  appName: string,
  user?: CanaryUserContext,
): CanaryResolution {
  const appConfig = manager.config.apps.find((a) => a.appName === appName);
  // 无灰度配置 → 稳定版
  if (!appConfig || !manager.config.enabled) {
    const resolution = defaultStableResolution(manager, appName, appConfig);
    emitResolutionEvent(manager, {
      appName,
      userId: user?.userId,
      orgId: user?.orgId,
      resolvedTag: "stable",
      resolvedVersion: resolution.resolved.version,
      whitelisted: false,
      reason: "stable_fallback",
      timestamp: Date.now(),
    });
    return resolution;
  }

  const allVersions = [
    appConfig.stable,
    ...appConfig.canaries.filter((c) => !c.disabled),
  ];
  const userIdWhitelisted =
    !!user?.userId && manager.config.whitelistUserIds.includes(user.userId);
  const mode: CanaryMode = manager.config.mode ?? "advanced";

  // ===== simple 模式：轻量 forceTag 分流 =====
  if (mode === "simple") {
    if (manager.config.forceTag) {
      const forced = allVersions.find((v) => v.tag === manager.config.forceTag);
      if (forced) {
        const resolution: CanaryResolution = {
          appName,
          resolved: forced,
          tag: forced.tag,
          whitelisted: userIdWhitelisted,
        };
        emitResolutionEvent(manager, {
          appName,
          userId: user?.userId,
          orgId: user?.orgId,
          resolvedTag: forced.tag,
          resolvedVersion: forced.version,
          whitelisted: userIdWhitelisted,
          reason: "force_tag",
          timestamp: Date.now(),
        });
        return resolution;
      }
    }
    // simple 模式无 forceTag → 直接回退 stable
    const resolution: CanaryResolution = {
      appName,
      resolved: appConfig.stable,
      tag: "stable",
      whitelisted: userIdWhitelisted,
    };
    emitResolutionEvent(manager, {
      appName,
      userId: user?.userId,
      orgId: user?.orgId,
      resolvedTag: "stable",
      resolvedVersion: appConfig.stable.version,
      whitelisted: userIdWhitelisted,
      reason: "stable_fallback",
      timestamp: Date.now(),
    });
    return resolution;
  }

  // ===== advanced 模式：白名单 + 标签路由 + 百分比哈希 =====

  // P3-5: 用户级白名单命中
  if (userIdWhitelisted && manager.config.forceTag) {
    const forced = allVersions.find((v) => v.tag === manager.config.forceTag);
    if (forced) {
      const resolution: CanaryResolution = {
        appName,
        resolved: forced,
        tag: forced.tag,
        whitelisted: true,
      };
      emitResolutionEvent(manager, {
        appName,
        userId: user?.userId,
        orgId: user?.orgId,
        resolvedTag: forced.tag,
        resolvedVersion: forced.version,
        whitelisted: true,
        reason: "whitelist_user",
        timestamp: Date.now(),
      });
      return resolution;
    }
  }

  // P3-5: 组织级白名单命中
  const orgWhitelisted =
    !!user?.orgId &&
    (manager.config.whitelistOrgIds?.length ?? 0) > 0 &&
    manager.config.whitelistOrgIds!.includes(user.orgId);
  if (orgWhitelisted && manager.config.forceTag) {
    const forced = allVersions.find((v) => v.tag === manager.config.forceTag);
    if (forced) {
      const resolution: CanaryResolution = {
        appName,
        resolved: forced,
        tag: forced.tag,
        whitelisted: true,
      };
      emitResolutionEvent(manager, {
        appName,
        userId: user?.userId,
        orgId: user?.orgId,
        resolvedTag: forced.tag,
        resolvedVersion: forced.version,
        whitelisted: true,
        reason: "whitelist_org",
        timestamp: Date.now(),
      });
      return resolution;
    }
  }

  // P3-5: 标签路由匹配
  const routeTags = manager.config.routeTags ?? [];
  const userTags = user?.tags ?? [];
  const tagMatched =
    routeTags.length > 0 &&
    userTags.length > 0 &&
    routeTags.some((rt) => userTags.includes(rt));
  if (tagMatched && manager.config.forceTag) {
    const forced = allVersions.find((v) => v.tag === manager.config.forceTag);
    if (forced) {
      const resolution: CanaryResolution = {
        appName,
        resolved: forced,
        tag: forced.tag,
        whitelisted: false,
      };
      emitResolutionEvent(manager, {
        appName,
        userId: user?.userId,
        orgId: user?.orgId,
        resolvedTag: forced.tag,
        resolvedVersion: forced.version,
        whitelisted: false,
        reason: "tag_match",
        timestamp: Date.now(),
      });
      return resolution;
    }
  }

  // 未登录用户或非白名单 → stable
  if (!user?.userId) {
    const resolution: CanaryResolution = {
      appName,
      resolved: appConfig.stable,
      tag: "stable",
      whitelisted: false,
    };
    emitResolutionEvent(manager, {
      appName,
      resolvedTag: "stable",
      resolvedVersion: appConfig.stable.version,
      whitelisted: false,
      reason: "stable_fallback",
      timestamp: Date.now(),
    });
    return resolution;
  }

  // 按递减百分比依次尝试命中
  let cumulative = 0;
  for (const ver of allVersions) {
    cumulative += ver.percentage;
    const userBucket = hashToPercentage(`${appName}:${user.userId}`);
    if (userBucket < cumulative) {
      const resolution: CanaryResolution = {
        appName,
        resolved: ver,
        tag: ver.tag,
        whitelisted: false,
      };
      emitResolutionEvent(manager, {
        appName,
        userId: user?.userId,
        orgId: user?.orgId,
        resolvedTag: ver.tag,
        resolvedVersion: ver.version,
        whitelisted: false,
        reason: "percentage_hash",
        timestamp: Date.now(),
      });
      return resolution;
    }
  }

  const resolution: CanaryResolution = {
    appName,
    resolved: appConfig.stable,
    tag: "stable",
    whitelisted: userIdWhitelisted || orgWhitelisted,
  };
  emitResolutionEvent(manager, {
    appName,
    userId: user?.userId,
    orgId: user?.orgId,
    resolvedTag: "stable",
    resolvedVersion: appConfig.stable.version,
    whitelisted: userIdWhitelisted || orgWhitelisted,
    reason: "stable_fallback",
    timestamp: Date.now(),
  });
  return resolution;
}

/**
 * 刷新远端配置
 */
export async function refreshFromRemoteCore(
  manager: CanaryManagerLike,
): Promise<void> {
  const url = manager.config.remoteUrl;
  if (!url) return;

  if (manager.fetchPromise) return manager.fetchPromise;
  manager.fetchPromise = (async () => {
    try {
      // @infra-fetch 基础设施层直用，无统一客户端上下文（canary 远端配置拉取）
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      manager.config = { ...DEFAULT_CONFIG, ...data };
      manager.cacheTimestamp = Date.now();
      setStorage(STORAGE_KEYS.CANARY_CONFIG, manager.config);
      logger.info("Canary config refreshed from remote");
    } catch (error) {
      logger.warn(`Canary refresh failed, using cached: ${error}`);
    } finally {
      manager.fetchPromise = null;
    }
  })();
  return manager.fetchPromise;
}

/**
 * P0-1: 停止远端配置自动刷新定时器。
 */
export function resetAutoRefreshCore(manager: CanaryManagerLike): void {
  if (manager.refreshTimerId !== null) {
    clearInterval(manager.refreshTimerId);
    manager.refreshTimerId = null;
  }
}

// ==================== 单例管理 ====================

type CanaryManagerInterface = CanaryManager;

let instanceGetter: (() => CanaryManagerInterface) | null = null;
let instanceDestroyer: (() => void) | null = null;

/**
 * 注册 CanaryManager 单例工厂
 */
export function __registerCanaryManager(
  getter: () => CanaryManagerInterface,
  destroyer: () => void,
): void {
  instanceGetter = getter;
  instanceDestroyer = destroyer;
}

/**
 * 获取灰度管理器单例。
 */
export function getCanaryManager(): CanaryManagerInterface {
  if (!instanceGetter) {
    throw new Error(
      "CanaryManager not initialized. Ensure canary-manager.ts is imported.",
    );
  }
  return instanceGetter();
}

/**
 * 重置单例（测试用）。
 */
export function resetCanaryManager(): void {
  instanceDestroyer?.();
}

/**
 * P0-A1: 创建 canary-manager 生命周期管理器。
 *
 * @since 4.1.0
 */
export function createCanaryManagerLifecycle(): DisposableManager {
  return {
    name: "canary-manager",
    dispose(): void {
      instanceDestroyer?.();
    },
  };
}
