/**
 * 统一导出 — @ydsz/micro-runtime
 *
 * @path comm/effects/micro-runtime/src/index.ts
 * @author ydsz-team
 * @since 3.0.0
 */
export * from "./create-runtime";
export * from "./global-state";
export * from "./types";

export {
  provideGlobalState,
  useGlobalState,
  useGlobalStateRef,
} from "./composable";
// v3.7.0: 命名空间 globalState 工厂
export {
  createNamespacedGlobalStateWrapper,
  createNamespacedState,
} from "./namespaced-state";
export type { NamespacedGlobalStateAPI } from "./namespaced-state";
// v4.0 P1-1: semver 版本校验工具
export { satisfiesVersion, parseVersion, compareVersion } from "./semver";
export type { SemVer } from "./semver";

// v4.0 P1-2: 主子应用标准化 Props 契约
export { buildStandardMountProps } from "./standard-props";
export type {
  BuildPropsContext,
  EnhancedGlobalStateAPI,
  MessageBusAPI,
  MicroMessage,
  StandardMicroProps,
  SubAppContext,
} from "./standard-props";

// v4.0 P1-2: 子应用侧标准化 Props 访问器
// 注意：useGlobalState 已从 composable 导出，此处不再重复导出
export {
  MICRO_PROPS_KEY,
  provideMicroProps,
  useMessageBus,
  useMicroProps,
  useNamespace,
  useSubAppContext,
} from "./use-micro-props";

// v3.7: 直接导出 MicroAppEntry 避免外部从 conf/vite-config 反向依赖
export type { MicroAppEntry } from "./types";

// v4.0 P2-1: 子应用双模式入口工厂（已废弃 — 统一迁移至 @ydsz/shared-auth 的 createSubApp，
// 该工厂的微前端 lifecycle 为空壳实现，与 shared-auth 的真实工厂职责重叠，下个大版本移除）
export { defineSubApp, isMicroFrontendEnvironment } from "./define-sub-app";
export type { SubAppLifecycle, DefineSubAppOptions } from "./define-sub-app";

// v5.0: 跨框架 React 子应用适配器 —— 通过 iframe 沙箱桥接 React 子应用
export { createReactSubApp } from "./create-react-sub-app";
export type {
  ReactSubAppHandle,
  ReactSubAppMountContext,
  ReactSubAppMountFn,
  ReactSubAppOptions,
} from "./types-react-sub-app";

// v5.1.0: iframe 沙箱工厂注册桥 — kernel→runtime 依赖倒置点，消除循环依赖
export {
  registerIframeSandboxFactory,
  resolveIframeSandboxFactory,
  resetIframeSandboxFactory,
} from "./iframe-sandbox-bridge";
export type {
  IframeSandboxFactory,
  IframeSandboxLike,
} from "./iframe-sandbox-bridge";
