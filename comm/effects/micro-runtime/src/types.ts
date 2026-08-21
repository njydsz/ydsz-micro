/**
 * 微应用运行时类型定义
 *
 * 接口层不绑定任何内核实现（qiankun / wujie / 自研 micro-kernel），
 * 主应用与子应用业务代码仅依赖此接口。
 *
 * 为控制单文件行数，类型定义已按职责拆分为：
 * - types-app-config.ts：应用配置（MicroAppConfig / MountProps / SandboxType 等）
 * - types-lifecycle.ts：生命周期与注册表（LifecycleExports / MicroAppEntry 等）
 * - types-runtime.ts：运行时接口与启动选项（MicroRuntime / StartOptions 等）
 *
 * 本文件作为统一 barrel 导出，保持向后兼容。
 *
 * @path comm/effects/micro-runtime/src/types.ts
 * @author ydsz-team
 * @since 3.0.0
 */

// ===== 应用配置 =====
export type {
  ActiveRule,
  MicroAppConfig,
  MountProps,
  SandboxType,
} from "./types-app-config";

// ===== 生命周期与注册表 =====
export type {
  LifecycleExports,
  LifecycleHook,
  ErrorLifecycleHook,
  LifecycleHookName,
  PermissionChecker,
  UnmountResult,
  RegistryAdapter,
  MicroAppEntry,
} from "./types-lifecycle";

// ===== 运行时接口 =====
export type {
  GlobalStateHandle,
  GlobalStateListener,
  RawGlobalStateAPI,
  VersionedState,
} from "./global-state";

export type {
  StartOptions,
  MicroRuntime,
} from "./types-runtime";
