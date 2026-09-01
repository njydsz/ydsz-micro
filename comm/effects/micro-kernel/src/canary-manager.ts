/**
 * 灰度版本分流管理器（v4.0 Canary）
 *
 * 在 VersionManager 基础上扩展灰度能力：
 * - 按用户 ID / 组织 / 自定义标签分流
 * - 多版本并发（stable + canary 同时运行）
 * - 版本回滚与一键禁用
 * - 本地缓存 + Nacos 远端拉取灰度配置
 *
 * 为控制单文件行数，以下内容已拆分为独立模块：
 * - canary-types.ts：类型定义（CanaryAppConfig / CanaryGlobalConfig / CanaryMode 等）
 * - canary-hash.ts：哈希工具（hashToPercentage）
 * - canary-manager-core.ts：核心分流逻辑（resolveVersion / emitResolutionEvent / defaultStableResolution / 单例管理）
 *
 * 本文件保留 CanaryManager 类定义与公开 API，并重新导出类型以保持向后兼容。
 *
 * @path comm/effects/micro-kernel/src/canary-manager.ts
 * @since 4.0.0
 */

import { satisfiesVersion } from "@YDSZ-core/shared/semver";
import { createLogger } from "@YDSZ-core/shared/utils";

import { getStorage, STORAGE_KEYS } from "./storage-utils";
import type {
  CanaryGlobalConfig,
  CanaryMode,
  CanaryResolution,
  CanaryResolutionCallback,
  CanaryUserContext,
  CanaryVersion,
} from "./canary-types";
import { DEFAULT_CONFIG } from "./canary-types";

import {
  resolveVersionCore,
  refreshFromRemoteCore,
  resetAutoRefreshCore,
  __registerCanaryManager,
  createCanaryManagerLifecycle,
} from "./canary-manager-core";
import type { CanaryManagerLike } from "./canary-manager-core";
import type { DisposableManager } from "./manager-registry";

// 重新导出类型，保持向后兼容
export type {
  CanaryAppConfig,
  CanaryGlobalConfig,
  CanaryMode,
  CanaryResolution,
  CanaryResolutionCallback,
  CanaryResolutionEvent,
  CanaryTag,
  CanaryUserContext,
  CanaryVersion,
} from "./canary-types";

// 重新导出单例管理函数，保持向后兼容
export {
  getCanaryManager,
  resetCanaryManager,
} from "./canary-manager-core";

const logger = createLogger("Canary");

/**
 * 灰度管理器单例
 */
export class CanaryManager {
  // 以下字段经 canary-manager-core 的 CanaryManagerLike 接口跨模块读写，
  // 故声明为公开字段（单例包内部协作约定，非对外 API 承诺）。
  cacheTimestamp = 0;
  private config: CanaryGlobalConfig = DEFAULT_CONFIG;
  fetchPromise: null | Promise<void> = null;
  /** P0-1: 远端配置自动刷新定时器 ID，供 resetAutoRefresh 清理 */
  refreshTimerId: null | ReturnType<typeof setInterval> = null;
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
   * @param callback - 决策事件回调
   * @returns 取消注册函数
   */
  onResolution(callback: CanaryResolutionCallback): () => void {
    this.resolutionCallbacks.push(callback);
    return () => {
      this.offResolution(callback);
    };
  }

  /**
   * P3-5: 移除分流决策回调。
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
    const cached = getStorage<null | Partial<CanaryGlobalConfig>>(
      localKey,
      null,
    );
    if (cached) {
      this.config = { ...DEFAULT_CONFIG, ...cached };
      logger.info("Canary config loaded from localStorage cache");
    }

    if (options?.fallbackConfig) {
      this.config = {
        ...this.config,
        ...options.fallbackConfig,
        apps: options.fallbackConfig.apps ?? this.config.apps,
      };
    }

    if (options?.remoteUrl || this.config.remoteUrl) {
      await refreshFromRemoteCore(this as unknown as CanaryManagerLike);
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
    await refreshFromRemoteCore(this as unknown as CanaryManagerLike);
  }

  /**
   * P0-1: 停止远端配置自动刷新定时器。
   */
  resetAutoRefresh(): void {
    resetAutoRefreshCore(this as unknown as CanaryManagerLike);
  }

  /**
   * 核心分流决策。
   *
   * @param appName - 子应用名
   * @param user - 用户上下文
   * @returns 分流决策结果
   */
  resolveVersion(appName: string, user?: CanaryUserContext): CanaryResolution {
    return resolveVersionCore(this as unknown as CanaryManagerLike, appName, user);
  }

  /**
   * 运行时切换分流模式（P3-2）。
   *
   * @param mode - 目标模式
   */
  setMode(mode: CanaryMode): void {
    this.config = { ...this.config, mode };
    logger.info(`Canary mode set to "${mode}"`);
  }

  /**
   * 启动自动刷新（按 cacheTtl 间隔）。
   */
  startAutoRefresh(): void {
    this.resetAutoRefresh();
    const ttl = this.config.cacheTtl ?? 60_000;
    this.refreshTimerId = setInterval(() => void this.refreshFromRemote(), ttl);
  }
}

// ==================== 单例注册 ====================

let instance: CanaryManager | null = null;

__registerCanaryManager(
  () => {
    if (!instance) {
      instance = new CanaryManager();
    }
    return instance;
  },
  () => {
    instance?.resetAutoRefresh();
    instance = null;
  },
);

/**
 * P0-A1: 创建 canary-manager 生命周期管理器。
 *
 * @since 4.1.0
 */
export function createCanaryManager(): DisposableManager {
  return createCanaryManagerLifecycle();
}
