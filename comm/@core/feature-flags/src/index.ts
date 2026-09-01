/**
 * 功能开关系统对外入口：声明开关清单、驱动初始化、并透出类型契约。
 *
 * 标准接入顺序是启动时 defineFeatureFlags(...) 声明开关，再 await
 * initFeatureFlags() 完成远程拉取与本地覆盖合并，之后组件侧用 useFeatureFlag 读取。
 * FeatureFlagsManager 一并导出，供测试等需要多实例隔离的场景构造独立开关容器。
 *
 * @path comm\@core\feature-flags\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { FeatureFlagDef, FeatureFlagsOptions } from './types';

import { createApiFeatureLoader } from './remote-loader';
import { featureFlagsManager } from './feature-flags';
import { useAllFeatureFlags, useFeatureFlag } from './use-feature-flag';

/**
 * 注册开关定义。
 *
 * 应在 initFeatureFlags 之前调用，使默认值在初始化时即生效；
 * 若需运行时动态新增，也可在任意时刻调用（增量合并，不覆盖已存在的远程 / 本地值）。
 */
function defineFeatureFlags(defs: FeatureFlagDef[]): void {
  featureFlagsManager.register(defs);
}

/**
 * 初始化功能开关系统。
 *
 * 必须在应用 bootstrap 中调用一次（Pinia / preferences 之后即可）。
 */
async function initFeatureFlags(options: FeatureFlagsOptions = {}): Promise<void> {
  await featureFlagsManager.init(options);
}

export {
  createApiFeatureLoader,
  defineFeatureFlags,
  featureFlagsManager,
  initFeatureFlags,
  useAllFeatureFlags,
  useFeatureFlag,
};
export type {
  CreateApiFeatureLoaderOptions,
  FeatureFlagApiResponse,
  FeatureFlagRemoteConfig,
} from './remote-loader';
export type {
  FeatureFlagDef,
  FeatureFlagsChangeListener,
  FeatureFlagsOptions,
  FeatureFlagValue,
} from './types';
export { FeatureFlagsManager } from './feature-flags';

