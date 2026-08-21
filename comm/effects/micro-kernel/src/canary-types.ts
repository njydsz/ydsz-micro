/**
 * 灰度版本分流管理器类型定义
 *
 * 从 canary-manager.ts 提取，避免单文件超过 300 行。
 *
 * @path comm/effects/micro-kernel/src/canary-types.ts
 * @author ydsz-team
 * @since 4.0.0
 */

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

/** 默认灰度配置 */
export const DEFAULT_CONFIG: CanaryGlobalConfig = {
  enabled: false,
  whitelistUserIds: [],
  whitelistOrgIds: [],
  routeTags: [],
  apps: [],
  cacheTtl: 60_000,
};
