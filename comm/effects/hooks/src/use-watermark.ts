/**
 * 基于 watermark-js-plus 的水印组合式函数，支持独立实例化管理。
 *
 * 每次调用创建独立的水印实例，通过 updateWatermark 动态修改配置，
 * 组件卸载时自动销毁，避免多组件共享实例导致的冲突。
 *
 * @path comm\effects\hooks\src\use-watermark.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Watermark, WatermarkOptions } from 'watermark-js-plus';

import { nextTick, onUnmounted, readonly, ref } from 'vue';

const DEFAULT_OPTIONS: Partial<WatermarkOptions> = {
  advancedStyle: {
    colorStops: [
      {
        color: 'gray',
        offset: 0,
      },
      {
        color: 'gray',
        offset: 1,
      },
    ],
    type: 'linear',
  },
  content: '',
  contentType: 'multi-line-text',
  globalAlpha: 0.25,
  gridLayoutOptions: {
    cols: 2,
    gap: [20, 20],
    matrix: [
      [1, 0],
      [0, 1],
    ],
    rows: 2,
  },
  height: 200,
  layout: 'grid',
  rotate: 30,
  width: 160,
};

/**
 * 水印组合式函数。
 *
 * @returns
 * - `watermark` —— 只读的水印实例 ref
 * - `updateWatermark` —— 创建或更新水印配置
 * - `destroyWatermark` —— 销毁当前水印实例
 *
 * @example
 * ```ts
 * const { watermark, updateWatermark } = useWatermark();
 * await updateWatermark({ content: '公司名称' });
 * ```
 */
export function useWatermark() {
  const watermark = ref<Watermark>();
  const cachedOptions = ref<Partial<WatermarkOptions>>({ ...DEFAULT_OPTIONS });
  let unmountedHooked = false;

  async function initWatermark(options: Partial<WatermarkOptions>) {
    const { Watermark } = await import('watermark-js-plus');

    cachedOptions.value = {
      ...cachedOptions.value,
      ...options,
    };
    watermark.value = new Watermark(cachedOptions.value);
    await watermark.value?.create();
  }

  async function updateWatermark(options: Partial<WatermarkOptions>) {
    if (watermark.value) {
      await nextTick();
      await watermark.value?.changeOptions({
        ...cachedOptions.value,
        ...options,
      });
    } else {
      await initWatermark(options);
    }
  }

  function destroyWatermark() {
    if (watermark.value) {
      watermark.value.destroy();
      watermark.value = undefined;
    }
  }

  if (!unmountedHooked) {
    unmountedHooked = true;
    onUnmounted(() => {
      destroyWatermark();
    });
  }

  return {
    destroyWatermark,
    updateWatermark,
    watermark: readonly(watermark),
  };
}
