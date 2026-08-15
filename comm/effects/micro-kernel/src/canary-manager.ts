/**
 * 灰度版本分流管理器（v4.0 Canary）
 *
 * 在 VersionManager 基础上扩展灰度能力：
 * - 按用户 ID / 组织 / 自定义标签分流
 * - 多版本并发（stable + canary 同时运行）
 * - 版本回滚与一键禁用
 * - 本地缓存 + Nacos 远端拉取灰度配置
 *
 * 用法：
 *   const cm = getCanaryManager();
 *   const version = cm.resolveVersion('workflow-web', userId);
 *   // → { version: 'v4.0.0', tag: 'canary', percentage: 10, entry: '...' }
 *
 * @path comm/effects/micro-kernel/src/canary-manager.ts
 * @since 4.0.0
 */

import { satisfiesVersion } from "@YDSZ-core/shared/semver";
import { createLogger } from "@YDSZ-core/shared/utils";

import { getStorage, setStorage, STORAGE_KEYS } from "./storage-utils";

const logger = createLogger("Canary");

/**
 * 灰度分流模式（P3-2 新增）。
 *
 * - `advanced`（默认）：完整分流 — 白名单 + forceTag + 按 userId FNV-1a 哈希百分比命中。
 *   适用于多 canary 版本并行、按用户百分比精细放量的复杂场景。
 * - `simple`：轻量分流 — 仅支持 forceTag / 全局开关，不做按用户哈希的百分比命中。
 *   适用于"一键切 canary / 快速回滚"或灰度配置只有单一 canary 版本的场景，
 *   显著降低决策成本并避免哈希不确定性。
 *
 * @since 4.1.0
 */
export type CanaryMode = "advanced" | "simple";

/** 灰度标签 */
export type CanaryTag = "alpha" | "beta" | "canary" | "stable";

/** 单版本配置 */
export interface CanaryVersion {
  /** semver 版本号（如 '4.0.0'） */
  version: string;
  /** 灰度标签 */
  tag: CanaryTag;
  /** 该版本的入口地址（CDN 或子路径） */
  entry: string;
  /** 分流权重（0-100），stable 默认 100 */
  percentage: number;
  /** 该版本要求的最低内核版本 */
  minKernelVersion?: string;
  /** 是否已禁用 */
  disabled?: boolean;
  /** 发布时间 */
  releasedAt?: string;
}

/** 单个子应用的灰度配置 */
export interface CanaryAppConfig {
  appName: string;
  /** 默认 stable 入口 */
  stable: CanaryVersion;
  /** canary 版本列表（支持多 canary 并行） */
  canaries: CanaryVersion[];
}

/** 灰度总配置（对齐 Nacos 配置结构） */
export interface CanaryGlobalConfig {
  /** 全局开关 */
  enabled: boolean;
  /**
   * 分流模式（P3-2）。
   *
   * - `advanced`（默认）：完整 FNV-1a 哈希百分比分流
   * - `simple`：轻量 forceTag 分流，不做按用户哈希命中
   */
  mode?: CanaryMode;
  /** 灰度用户白名单（命中即走 canary） */
  whitelistUserIds: string[];
  /**
   * 组织级白名单（P3-5）。
   *
   * 命中即走 forceTag 指定的灰度版本。适用于"按部门/团队灰度"场景
   * （如：仅研发部门看到新功能，其他部门保持 stable）。
   */
  whitelistOrgIds?: string[];
  /**
   * 标签路由规则（P3-5）。
   *
   * 用户的 tags 中包含任意指定 tag → 命中 forceTag 版本。
   * 优先级低于白名单但高于百分比哈希。
   * 适用于"内部测试用户"或"VIP 用户"灰度场景。
   */
  routeTags?: string[];
  /** 灰度命中后强制指定 tag */
  forceTag?: CanaryTag;
  /** 子应用灰度配置列表 */
  apps: CanaryAppConfig[];
  /** 配置拉取的远端 URL（Nacos 或静态 JSON） */
  remoteUrl?: string;
  /** 远端缓存时长（ms），默认 60s */
  cacheTtl?: number;
}

/** 用户上下文 */
export interface CanaryUserContext {
  userId: string;
  /** 组织 ID（用于组织级灰度白名单，P3-5） */
  orgId?: string;
  /** 用户标签（用于标签路由，P3-5） */
  tags?: string[];
}

/**
 * 分流决策事件（P3-5: 遥测回调数据）。
 *
 * 供分析平台（如 Sentry / 埋点系统）订阅灰度命中结果，
 * 灰度效果评估（转化率对比 / 错误率监控）依赖此事件。
 */
export interface CanaryResolutionEvent {
  appName: string;
  userId?: string;
  orgId?: string;
  resolvedTag: CanaryTag;
  resolvedVersion: string;
  whitelisted: boolean;
  reason:
    | "whitelist_user"
    | "whitelist_org"
    | "force_tag"
    | "tag_match"
    | "percentage_hash"
    | "stable_fallback";
  timestamp: number;
}

/** 分流事件回调类型（P3-5） */
export type CanaryResolutionCallback = (event: CanaryResolutionEvent) => void;

/** 分流决策结果 */
export interface CanaryResolution {
  appName: string;
  /** 命中的版本 */
  resolved: CanaryVersion;
  /** canary 标签（stable 表示未命中灰度） */
  tag: CanaryTag;
  /** 是否命中白名单 */
  whitelisted: boolean;
}

const DEFAULT_CONFIG: CanaryGlobalConfig = {
  enabled: false,
  whitelistUserIds: [],
  whitelistOrgIds: [],
  routeTags: [],
  apps: [],
  cacheTtl: 60_000,
};

/**
 * 哈希函数：将 userId 映射到 0-100 区间，保证同一用户固定命中。
 * 使用 FNV-1a 32-bit 变体，分布均匀且零依赖。
 */
function hashToPercentage(input: string): number {
  let h = 0x81_1c_9d_c5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01_00_01_93);
  }
  return Math.abs(h % 100);
}

/**
 * 灰度管理器单例
 */
class CanaryManager {
  private cacheTimestamp = 0;
  private config: CanaryGlobalConfig = DEFAULT_CONFIG;
  private fetchPromise: null | Promise<void> = null;
  /** P0-1: 远端配置自动刷新定时器 ID，供 resetAutoRefresh 清理 */
  private refreshTimerId: null | ReturnType<typeof setInterval> = null;
  /** P3-5: 分流决策回调列表（遥测/分析用） */
  private resolutionCallbacks: CanaryResolutionCallback[] = [];

  /**
   * 获取当前生效的配置（调试用）
   */
  getConfig(): Readonly<CanaryGlobalConfig> {
    return this.config;
  }

  /**
   * 当前分流模式（P3-2）。
   *
   * 从 config.mode 读取，未配置时回退到 advanced（保持向后兼容）。
   */
  getMode(): CanaryMode {
    return this.config.mode ?? "advanced";
  }

  /**
   * P3-5: 注册分流决策回调。
   *
   * 每次 resolveVersion 决策后触发回调，供分析平台订阅灰度效果。
   * 返回取消注册函数（直接调用即可移除监听）。
   *
   * @param callback - 决策事件回调
   * @returns 取消注册函数
   *
   * @example
   * const unregister = getCanaryManager().onResolution((event) => {
   *   analytics.track('canary_resolution', event);
   * });
   */
  onResolution(callback: CanaryResolutionCallback): () => void {
    this.resolutionCallbacks.push(callback);
    return () => {
      this.offResolution(callback);
    };
  }

  /**
   * P3-5: 移除分流决策回调（onResolution 返回的函数的等价方法）。
   *
   * @param callback - 需移除的回调引用
   */
  offResolution(callback: CanaryResolutionCallback): void {
    this.resolutionCallbacks = this.resolutionCallbacks.filter((cb) => cb !== callback);
  }

  /**
   * 初始化灰度管理器（拉取远端配置或注入本地配置）。
   *
   * @param options - 初始化选项
   */
  async init(options?: {
    fallbackConfig?: Partial<CanaryGlobalConfig>;
    remoteUrl?: string;
  }): Promise<void> {
    const localKey = STORAGE_KEYS.CANARY_CONFIG;
    // P0-4: 先从本地缓存恢复（使用统一存储层）
    const cached = getStorage<null | Partial<CanaryGlobalConfig>>(
      localKey,
      null,
    );
    if (cached) {
      this.config = { ...DEFAULT_CONFIG, ...cached };
      logger.info("Canary config loaded from localStorage cache");
    }

    // 注入 fallback
    if (options?.fallbackConfig) {
      this.config = {
        ...this.config,
        ...options.fallbackConfig,
        apps: options.fallbackConfig.apps ?? this.config.apps,
      };
    }

    // 拉取远端
    if (options?.remoteUrl || this.config.remoteUrl) {
      await this.refreshFromRemote();
      this.startAutoRefresh();
    }

    logger.info(
      `Canary manager init done, enabled=${this.config.enabled}, apps=${this.config.apps.length}`,
    );
  }

  /**
   * 判断版本兼容性（minKernelVersion）
   */
  isKernelCompatible(resolved: CanaryVersion, kernelVersion: string): boolean {
    if (!resolved.minKernelVersion) return true;
    return satisfiesVersion(kernelVersion, `>=${resolved.minKernelVersion}`);
  }

  /**
   * 刷新远端配置
   */
  async refreshFromRemote(): Promise<void> {
    const url = this.config.remoteUrl;
    if (!url) return;

    if (this.fetchPromise) return this.fetchPromise;
    this.fetchPromise = (async () => {
      try {
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.config = { ...DEFAULT_CONFIG, ...data };
        this.cacheTimestamp = Date.now();
        // P0-4: 使用统一存储层缓存
        setStorage(STORAGE_KEYS.CANARY_CONFIG, this.config);
        logger.info("Canary config refreshed from remote");
      } catch (error) {
        logger.warn(`Canary refresh failed, using cached: ${error}`);
      } finally {
        this.fetchPromise = null;
      }
    })();
    return this.fetchPromise;
  }

  /**
   * P0-1: 停止远端配置自动刷新定时器。
   *
   * 供 kernel._stop() 在 HMR / 测试场景调用，
   * 防止旧内核的定时器在新内核创建后继续运行造成状态串扰。
   */
  resetAutoRefresh(): void {
    if (this.refreshTimerId !== null) {
      clearInterval(this.refreshTimerId);
      this.refreshTimerId = null;
    }
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
   * @param appName - 子应用名
   * @param user - 用户上下文
   * @returns 分流决策结果
   */
  resolveVersion(appName: string, user?: CanaryUserContext): CanaryResolution {
    const appConfig = this.config.apps.find((a) => a.appName === appName);
    // 无灰度配置 → 稳定版
    if (!appConfig || !this.config.enabled) {
      const resolution = this.defaultStableResolution(appName, appConfig);
      this.emitResolutionEvent({
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
      !!user?.userId && this.config.whitelistUserIds.includes(user.userId);
    const mode = this.getMode();

    // ===== simple 模式：轻量 forceTag 分流（forceTag 对全体用户全局生效） =====
    if (mode === "simple") {
      if (this.config.forceTag) {
        const forced = allVersions.find((v) => v.tag === this.config.forceTag);
        if (forced) {
          const resolution: CanaryResolution = {
            appName,
            resolved: forced,
            tag: forced.tag,
            whitelisted: userIdWhitelisted,
          };
          this.emitResolutionEvent({
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
      this.emitResolutionEvent({
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
    if (userIdWhitelisted && this.config.forceTag) {
      const forced = allVersions.find((v) => v.tag === this.config.forceTag);
      if (forced) {
        const resolution: CanaryResolution = {
          appName,
          resolved: forced,
          tag: forced.tag,
          whitelisted: true,
        };
        this.emitResolutionEvent({
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
      (this.config.whitelistOrgIds?.length ?? 0) > 0 &&
      this.config.whitelistOrgIds!.includes(user.orgId);
    if (orgWhitelisted && this.config.forceTag) {
      const forced = allVersions.find((v) => v.tag === this.config.forceTag);
      if (forced) {
        const resolution: CanaryResolution = {
          appName,
          resolved: forced,
          tag: forced.tag,
          whitelisted: true,
        };
        this.emitResolutionEvent({
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

    // P3-5: 标签路由匹配（用户 tags 与 routeTags 任意交集即命中）
    const routeTags = this.config.routeTags ?? [];
    const userTags = user?.tags ?? [];
    const tagMatched =
      routeTags.length > 0 &&
      userTags.length > 0 &&
      routeTags.some((rt) => userTags.includes(rt));
    if (tagMatched && this.config.forceTag) {
      const forced = allVersions.find((v) => v.tag === this.config.forceTag);
      if (forced) {
        const resolution: CanaryResolution = {
          appName,
          resolved: forced,
          tag: forced.tag,
          whitelisted: false,
        };
        this.emitResolutionEvent({
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
      this.emitResolutionEvent({
        appName,
        resolvedTag: "stable",
        resolvedVersion: appConfig.stable.version,
        whitelisted: false,
        reason: "stable_fallback",
        timestamp: Date.now(),
      });
      return resolution;
    }

    // 按递减百分比依次尝试命中（保证 canary 叠加 stable 总和 = 100%）
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
        this.emitResolutionEvent({
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
    this.emitResolutionEvent({
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
   * P3-5: 触发所有分流决策回调。
   *
   * 异步触发（setTimeout 0）避免回调耗时阻塞 resolveVersion 热路径。
   * 回调内部抛出异常不影响分流结果（捕获并 log.warn）。
   */
  private emitResolutionEvent(event: CanaryResolutionEvent): void {
    if (this.resolutionCallbacks.length === 0) return;
    const callbacks = [...this.resolutionCallbacks];
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
   * 运行时切换分流模式（P3-2）。
   *
   * 允许在 simple / advanced 之间切换，无需重新 init。
   *
   * @param mode - 目标模式
   */
  setMode(mode: CanaryMode): void {
    this.config = { ...this.config, mode };
    logger.info(`Canary mode set to "${mode}"`);
  }

  /**
   * 启动自动刷新（按 cacheTtl 间隔）。
   *
   * P0-1: 先清理已有定时器避免重复启动导致多定时器并发。
   */
  startAutoRefresh(): void {
    // 先清理已有定时器，防止重复调用产生多个并发定时器
    this.resetAutoRefresh();
    const ttl = this.config.cacheTtl ?? 60_000;
    this.refreshTimerId = setInterval(() => void this.refreshFromRemote(), ttl);
  }

  private defaultStableResolution(
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
}

// ==================== 单例导出 ====================

let instance: CanaryManager | null = null;

/**
 * 获取灰度管理器单例。
 */
export function getCanaryManager(): CanaryManager {
  if (!instance) {
    instance = new CanaryManager();
  }
  return instance;
}

/**
 * 重置单例（测试用）。
 * P0-1: 清定时器后再置 null，避免定时器回调访问已销毁实例。
 * P3-5: 清空分辨率回调列表，防止测试间串扰。
 */
export function resetCanaryManager(): void {
  instance?.resetAutoRefresh();
  instance = null;
}

/**
 * P0-A1: 创建 canary-manager 生命周期管理器。
 *
 * 停止 canary 定时刷新 + 清理分流缓存。
 *
 * @since 4.1.0
 */
export function createCanaryManager(): import("./manager-registry").DisposableManager {
  return {
    name: "canary-manager",
    dispose(): void {
      instance?.resetAutoRefresh();
      instance = null;
    },
  };
}
