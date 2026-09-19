/**
 * 密度模式 Store —— 管理 compact / standard / loose 三档密度切换。
 *
 * <p>通过 Pinia + watch 同步到 <html data-density> 属性，
 * 组件/CSS 变量自动响应。
 *
 * @path comm/src/density-store.ts
 * @author ydsz-ai
 * @since 26.09.19
 */

import type { DensityMode } from '@ydsz-core/design-tokens/density';

import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import { DENSITY_MODES } from '@ydsz-core/design-tokens/density';

/**
 * 密度模式 Pinia store。
 */
export const useDensityStore = defineStore('density', () => {
  const mode = ref<DensityMode>('standard');

  /** 是否为紧凑模式 */
  const isCompact = computed<boolean>(() => mode.value === 'compact');
  /** 是否为宽松模式 */
  const isLoose = computed<boolean>(() => mode.value === 'loose');
  /** 是否标准模式 */
  const isStandard = computed<boolean>(() => mode.value === 'standard');

  /**
   * 设置密度模式。
   */
  function setMode(newMode: DensityMode): void {
    if (!DENSITY_MODES.includes(newMode)) {
      console.warn(`[DensityStore] 无效密度模式: ${newMode}`);
      return;
    }
    mode.value = newMode;
  }

  /**
   * 循环切换密度。
   */
  function cycleMode(): void {
    const idx = DENSITY_MODES.indexOf(mode.value);
    const next = DENSITY_MODES[(idx + 1) % DENSITY_MODES.length] as DensityMode;
    setMode(next);
  }

  // 同步到 document
  watch(
    mode,
    (newMode) => {
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.density = newMode;
      }
    },
    { immediate: true, flush: 'post' },
  );

  return {
    mode,
    isCompact,
    isLoose,
    isStandard,
    setMode,
    cycleMode,
  };
});
