/**
 * 密度切换 composable：管理 compact / standard / loose 三档密度偏好。
 *
 * 通过修改 <html data-density> 属性驱动 CSS 变量切换，
 * 同时持久化到 localStorage('ydsz-density')，便于跨会话保持一致。
 *
 * @path comm\@core\ui-kit\design-tokens\src\composables\use-density.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { ComputedRef, Ref } from 'vue';

import { computed, ref, watch } from 'vue';

import type { DensityMode } from '../tokens/density';
import { DENSITY_MODES } from '../tokens/density';

/** localStorage 键名 */
const DENSITY_STORAGE_KEY = 'ydsz-density';

/** 宽作用域单例 */
let sharedDensity: {
  density: Ref<DensityMode>;
} | null = null;

/**
 * 校验字符串是否为合法密度模式。
 *
 * @param value - 待校验字符串
 * @returns 合法时返回对应 DensityMode，否则 null
 */
function parseDensity(value: string | null): DensityMode | null {
  if (value && (DENSITY_MODES as readonly string[]).includes(value)) {
    return value as DensityMode;
  }
  return null;
}

/**
 * 将密度模式持久化并同步到 DOM。
 *
 * @param mode - 密度模式
 */
function applyDensity(mode: DensityMode): void {
  document.documentElement.dataset.density = mode;
  try {
    localStorage.setItem(DENSITY_STORAGE_KEY, mode);
  } catch {
    // 隐私模式下静默降级
  }
}

/**
 * 初始化密度单例并应用至 DOM，供 ConfigProvider 启动阶段调用一次。
 *
 * 首次调用时读取 localStorage（回退 standard）并写入 dataset；
 * 后续调用返回同一组 ref，保持全局唯一。
 *
 * @returns 含 density / setDensity / isCompact 的密度句柄
 */
export function initDensity(): {
  density: Ref<DensityMode>;
  setDensity: (mode: DensityMode) => void;
  isCompact: ComputedRef<boolean>;
} {
  if (sharedDensity) {
    return {
      density: sharedDensity.density,
      setDensity: setDensityFn,
      isCompact: computed(() => sharedDensity!.density.value === 'compact'),
    };
  }

  let initial: DensityMode = 'standard';
  try {
    const stored = parseDensity(localStorage.getItem(DENSITY_STORAGE_KEY));
    if (stored) {
      initial = stored;
    }
  } catch {
    // localStorage 不可用时使用默认值
  }

  const density = ref<DensityMode>(initial);
  sharedDensity = { density };

  // 同步到 DOM
  applyDensity(initial);

  watch(
    density,
    (mode) => {
      applyDensity(mode);
    },
    { flush: 'sync' },
  );

  return {
    density,
    setDensity: setDensityFn,
    isCompact: computed(() => density.value === 'compact'),
  };
}

/**
 * 设置密度模式（响应式 + 持久化 + DOM 同步）。
 *
 * @param mode - 目标密度模式
 */
function setDensityFn(mode: DensityMode): void {
  if (!sharedDensity) {
    initDensity();
  }
  sharedDensity!.density.value = mode;
}

/**
 * 面向组件实例的 composable，内部复用 initDensity 单例。
 *
 * 在组件 setup 阶段调用即可获得响应式的密度状态与控制方法；
 * 多次调用不会重复操作 localStorage / dataset。
 *
 * @returns 含 density / setDensity / isCompact 的密度句柄
 *
 * @example
 * ```vue
 * <script setup>
 * const { density, setDensity } = useDensity();
 * </script>
 * <template>
 *   <select :value="density" @change="setDensity($event.target.value)">
 *     <option value="compact">紧凑</option>
 *     <option value="standard">标准</option>
 *     <option value="loose">宽松</option>
 *   </select>
 * </template>
 * ```
 */
export function useDensity(): {
  density: Ref<DensityMode>;
  setDensity: (mode: DensityMode) => void;
  isCompact: ComputedRef<boolean>;
} {
  return initDensity();
}
