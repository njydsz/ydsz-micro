/**
 * 功能开关的 Vue 组合式封装：把开关值变成组件可直接消费的响应式数据。
 *
 * useFeatureFlag(name) 返回随开关变更而更新的响应式值，模板无需手动订阅与退订；
 * useAllFeatureFlags 供调试面板一次性展示全部开关状态，不用于业务判断。
 *
 * @path comm\@core\feature-flags\src\use-feature-flag.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed } from 'vue';

import { featureFlagsManager } from './feature-flags';

/**
 * 响应式读取单个开关状态。
 *
 * 返回 ComputedRef<boolean>，当 setEnabled / 远程加载 / resetFlag 触发解析时自动更新。
 * 未注册的开关返回 false（与 isEnabled 一致）。
 */
export function useFeatureFlag(name: string) {
  return computed(() => featureFlagsManager.isEnabled(name));
}

/**
 * 响应式读取全部已注册开关的快照。
 *
 * 适合在管理面板 / 调试浮层中批量展示。
 */
export function useAllFeatureFlags() {
  return computed(() => featureFlagsManager.getAll());
}

