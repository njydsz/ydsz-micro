/**
 * 主应用功能开关定义与远程加载
 *
 * 设计原则：
 * - 仅保留实验性开关（A/B 测试、灰度发布）
 * - 稳定期功能移除开关，避免运行时分支判断开销
 * - 合规类开关（如水印）保留以便审计
 *
 * 在 bootstrap 中通过 `await initFeatureFlags(featureFlagsOptions())` 初始化。
 * 新增开关只需在 APPLICATION_FLAGS 中追加定义，无需修改 bootstrap。
 *
 * @path main\src\feature-flags.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type {
  FeatureFlagDef,
  FeatureFlagsOptions,
  FeatureFlagValue,
} from "@YDSZ-core/feature-flags";

import { defineFeatureFlags } from "@YDSZ-core/feature-flags";

import { requestClient } from "#/api/request";

/**
 * 主应用已注册的功能开关清单。
 *
 * 命名约定：kebab-case；对应构建期环境变量为 `VITE_FEATURE_<UPPER_SNAKE>`。
 * 新增开关时务必补充 `description`，便于治理面板展示。
 */
export const APPLICATION_FLAGS: FeatureFlagDef[] = [
  {
    name: "new-dashboard",
    defaultValue: false,
    description: "启用新版仪表盘布局（含分析卡片与拖拽配置）— 实验性",
  },
  {
    name: "watermark-directive",
    defaultValue: true,
    description: "敏感页面 v-watermark 指令（合规要求，关闭需评审）",
    allowLocalOverride: false,
  },
];

/** 已注册一次即可，重复调用安全（manager 内部 Map 合并） */
export function registerApplicationFlags(): void {
  defineFeatureFlags(APPLICATION_FLAGS);
}

/**
 * 远程开关配置加载器。
 *
 * 调用 `/api/v1/feature-flags/me`，返回当前用户可见的开关映射。
 * 失败时由 FeatureFlagsManager 内部捕获并降级到默认值，此处不再额外处理。
 */
async function remoteFeatureFlagsLoader(): Promise<
  Record<string, FeatureFlagValue>
> {
  const resp = await requestClient.get<Record<string, FeatureFlagValue>>(
    "/api/v1/feature-flags/me",
  );
  return resp ?? {};
}

/**
 * 构造 FeatureFlagsOptions，供 bootstrap 注入。
 *
 * - 生产环境关闭本地覆盖（合规）；开发环境默认开启便于调试。
 * - env 直接传入 import.meta.env，保证库内读取的是宿主应用同源快照。
 */
export function featureFlagsOptions(): FeatureFlagsOptions {
  return {
    namespace: "YDSZ",
    env: import.meta.env,
    remoteLoader: remoteFeatureFlagsLoader,
    enableLocalOverrideInProd: false,
  };
}
