<!--
 * Watermark 水印：在页面背景叠加文字或图片水印。
 *
 * 通过 canvas 将文字或 base64 图案绘制为 dataURL 后设为容器背景；
 * 容器的 pointer-events: none 确保不影响正常交互。
 *
 * 安全说明：JS 生成的水印可被 DevTools 移除，仅作轻度威慑；
 * 高敏感场景应配合后端图片水印方案。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\watermark\YdWatermark.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 图片 URL（文字与图片互斥） */
  image?: string;
  /** 文本行间距 */
  lineHeight?: number;
  /** 水印内容的旋转角度 */
  rotate?: number;
  /** 文字是否跨越容器铺满 */
  warp?: boolean;
  /** 文字内容 */
  content?: string;
  /** 字号 */
  fontSize?: number;
  /** 字重 */
  fontWeight?: number;
  /** 字间距 */
  gap?: [number, number];
  /** 文字颜色 */
  color?: string;
  /** z-index */
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  color: 'var(--watermark-color)',
  content: 'Watermark',
  fontSize: 14,
  fontWeight: 300,
  gap: () => [100, 100],
  lineHeight: 20,
  rotate: -20,
  warp: false,
  zIndex: 100,
});

const containerRef = ref<HTMLElement>();
const watermarkUrl = ref<string>('');

onMounted(() => {
  generateWatermark();
});

function generateWatermark(): void {
  if (props.image) {
    watermarkUrl.value = `url(${props.image})`;
    return;
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const [gapX, gapY] = props.gap ?? [100, 100];
  const text = props.content ?? '';
  ctx.font = `${props.fontWeight} ${props.fontSize}px sans-serif`;
  ctx.fillStyle = props.color ?? 'rgba(0,0,0,0.15)';
  ctx.rotate((props.rotate * Math.PI) / 180);

  canvas.width = gapX;
  canvas.height = gapY;

  ctx.fillText(text, 0, gapY / 2);
  watermarkUrl.value = `url(${canvas.toDataURL()})`;
}
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn(
        'pointer-events-none fixed inset-0 z-[var(--z-backdrop)] overflow-hidden',
        props.class,
      )
    "
    :style="{
      zIndex: props.zIndex,
      backgroundImage: watermarkUrl,
      backgroundRepeat: 'repeat',
      backgroundPosition: '0 0',
    }"
    aria-hidden="true"
  ></div>
</template>
