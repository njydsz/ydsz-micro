/**
 * 微应用运行时 — 生命周期与注册表类型
 *
 * 从 types.ts 提取，避免单文件超过 300 行。
 *
 * @path comm/effects/micro-runtime/src/types-lifecycle.ts
 * @author ydsz-team
 * @since 3.0.0
 */

import type { MicroAppConfig, MountProps } from "./types-app-config";

/** 子应用生命周期导出（ESM entry 必须导出 mount/unmount） */
export interface LifecycleExports {
  bootstrap?: (props: MountProps) => Promise<void>;
  mount: (props: MountProps) => Promise<void>;
  unmount: (props: MountProps) => Promise<void>;
  update?: (props: MountProps) => Promise<void>;
  /** keep-alive 激活时调用（可选） */
  activate?: () => Promise<void> | void;
  /** keep-alive 停用时调用（可选） */
  deactivate?: () => Promise<void> | void;
  /**
   * keep-alive 停用时序列化应用状态（可选，v4.2.1 N6）。
   *
   * 返回的状态快照在下次激活时通过 hydrate 恢复。
   * 适用于列表滚动位置、表单输入、展开/收起等组件状态记忆。
   *
   * @returns 可序列化的状态快照
   * @since 4.2.1
   */
  serialize?: () => unknown | Promise<unknown>;
  /**
   * keep-alive 恢复时用快照还原应用状态（可选，v4.2.1 N6）。
   *
   * 与 serialize 配对；未实现 hydrate 时快照被忽略。
   *
   * @param state - 上次 deactivate 时 serialize 返回的快照
   * @param props - 本次激活的 mountProps（含容器等上下文）
   * @since 4.2.1
   */
  hydrate?: (
    state: unknown,
    props: MountProps,
  ) => Promise<void> | void;
}

/** 内核生命周期钩子 */
export type LifecycleHook = (app: MicroAppConfig) => Promise<void> | void;

/** 内核错误钩子（接收错误对象） */
export type ErrorLifecycleHook = (
  app: MicroAppConfig,
  error: unknown,
) => Promise<void> | void;

/**
 * 内核支持的生命周期钩子名。
 *
 * 细化阶段（v3.3）：
 *   beforeLoad  → 子应用开始加载 ESM 模块（manifest fetch + dynamic import）
 *   afterLoad   → 子应用 ESM 模块加载完成、LifecycleExports 已就绪
 *   beforeMount → 子应用 mount() 调用之前（沙箱已进入）
 *   afterMount  → 子应用 mount() 完成，DOM 已挂载
 *   afterUnmount → 子应用卸载完成
 *   error       → 加载或挂载失败
 *
 * SubAppContainer 等订阅方可基于细化钩子驱动真实进度条推进，
 * 避免仅有 beforeLoad/afterMount 两个粗粒度节点导致进度跳变。
 */
export type LifecycleHookName =
  | "afterLoad"
  | "afterMount"
  | "afterUnmount"
  | "beforeLoad"
  | "beforeMount"
  | "error";

/** 权限检查函数类型 */
export type PermissionChecker = (codes: string[]) => boolean;

/** 微应用运行时卸载结果 */
export interface UnmountResult {
  name: string;
  success: boolean;
  reason?: string;
}

/**
 * 远程注册表适配器（v3.7.0 新增）。
 *
 * 运行时可传入此接口以动态提供子应用注册信息，
 * 替代传统的静态 MICRO_APPS 数组硬编码方式。
 *
 * @since 3.7.0
 */
export interface RegistryAdapter {
  /** 获取子应用注册表 */
  resolve(): Promise<MicroAppEntry[]>;
  /** 清空缓存 */
  clearCache(): void;
  /** 强制刷新注册表（忽略缓存重新拉取） */
  refresh(): Promise<MicroAppEntry[]>;
}

/** 子应用注册表条目（字段复用 MicroAppEntry，作为运行时契约导出） */
export interface MicroAppEntry {
  /** 子应用唯一标识（如 'workflow-web'） */
  name: string;
  /** Monorepo 内包名（如 @ydsz/workflow-web） */
  packageName: string;
  /** 路由前缀（如 '/YDSZ-proj'），也作为 activeRule */
  activeRule: string;
  /** 菜单默认重定向路径 */
  redirect: string;
  /** 菜单标题 */
  title: string;
  /** 菜单图标（lucide 图标名） */
  icon: string;
  /** 菜单排序权重（越小越靠前） */
  order: number;
  /** 开发服务器端口 */
  devPort: number;
  /** 生产环境部署子路径 */
  prodPath?: string;
  /** 子应用默认骨架屏类型 */
  skeletonType?: "dashboard" | "default" | "detail" | "form" | "list";
  /** 沙箱类型 */
  sandbox?: "iframe" | "proxy" | "snapshot";
  /**
   * 显式入口 URL（v3.7.0 新增）。
   *
   * 设置时将覆盖自动推导逻辑（devPort），直接作为子应用入口。
   * 适用于：远程注册表下发完整 entry、自定义部署路径等场景。
   */
  entry?: string;
}
