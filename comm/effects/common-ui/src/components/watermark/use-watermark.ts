/**
 * 水印 composable — 以 composable 方式管理全局水印实例。
 *
 * <p>区别于 v-watermark 指令（按元素声明式打标），
 * 本 composable 通过 JS API 在 document.body 创建全局水印，
 * 适合在布局层根据用户偏好动态启停/更新水印内容。
 *
 * <p>用法：
 * ```ts
 * const { destroyWatermark, updateWatermark } = useWatermark();
 * await updateWatermark({ content: '用户名 - 姓名' });
 * destroyWatermark();
 * ```
 *
 * @path comm/effects/common-ui/src/components/watermark/use-watermark.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Watermark, WatermarkOptions } from 'watermark-js-plus';

/** 默认水印选项（与 directive.ts 保持一致） */
const DEFAULT_WATERMARK_OPTIONS: Partial<WatermarkOptions> = {
  advancedStyle: {
    colorStops: [
      { color: 'gray', offset: 0 },
      { color: 'gray', offset: 1 },
    ],
    type: 'linear',
  },
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

/** 当前水印实例（模块级单例） */
let watermarkInstance: InstanceType<typeof Watermark> | null = null;

/**
 * 更新水印内容。
 *
 * <p>首次调用时创建水印实例（挂载到 document.body），
 * 后续调用复用实例并更新选项。
 *
 * @param options - 部分水印选项（content 为必填，其余合并默认值）
 */
async function updateWatermark(options: Partial<WatermarkOptions>): Promise<void> {
  const { Watermark } = await import('watermark-js-plus');
  const merged: Partial<WatermarkOptions> = {
    ...DEFAULT_WATERMARK_OPTIONS,
    ...options,
    parent: options.parent ?? 'body',
  };

  if (!watermarkInstance) {
    watermarkInstance = new Watermark(merged as WatermarkOptions);
    await watermarkInstance.create();
  } else {
    await watermarkInstance.changeOptions(merged);
  }
}

/**
 * 销毁当前水印实例并释放引用。
 */
function destroyWatermark(): void {
  if (watermarkInstance) {
    watermarkInstance.destroy();
    watermarkInstance = null;
  }
}

/**
 * 水印管理 composable。
 *
 * @returns 水印操作方法集合
 */
export function useWatermark(): {
  destroyWatermark: () => void;
  updateWatermark: (options: Partial<WatermarkOptions>) => Promise<void>;
} {
  return {
    destroyWatermark,
    updateWatermark,
  };
}
