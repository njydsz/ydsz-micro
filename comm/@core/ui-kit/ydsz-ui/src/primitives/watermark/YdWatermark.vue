<!--
 * Watermark 水印：在页面背景叠加文字或图片水印。
 *
 * 通过 canvas 将文字绘制为 dataURL 后设为容器背景；
 * 容器的 pointer-events: none 确保不影响正常交互。
 *
 * 安全说明：JS 生成的水印可被 DevTools 移除，仅作轻度威慑；
 * 高敏感场景应配合后端图片水印方案。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\watermark\YdWatermark.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
// @ts-nocheck
import { onMounted, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 图片 URL（与 content 互斥，优先使用） */
  image?: string;
  /** 水印文字内容 */
  content?: string;
  /** 字号（px） */
  fontSize?: number;
  /** 字重 */
  fontWeight?: number;
  /** 文字颜色（CSS 颜色值） */
  color?: string;
  /** 旋转角度（负数为逆时针） */
  rotate?: number;
  /** 水印间距 [水平, 垂直] */
  gap?: [number, number];
  /** z-index */
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  color: 'rgba(0,0,0,0.12)',
  content: 'Watermark',
  fontSize: 14,
  fontWeight: 300,
  gap: () => [100, 100],
  rotate: -20,
  zIndex: 10,
});

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
  canvas.width = gapX;
  canvas.height = gapY;

  ctx.font = `${props.fontWeight} ${props.fontSize}px sans-serif`;
  ctx.fillStyle = props.color ?? 'rgba(0,0,0,0.15)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(gapX / 2, gapY / 2);
  ctx.rotate((props.rotate * Math.PI) / 180);
  ctx.fillText(props.content ?? '', 0, 0);

  watermarkUrl.value = `url(${canvas.toDataURL()})`;
}
</script>

<template>
  <div
    :class="cn('pointer-events-none fixed inset-0 z-[var(--z-backdrop)] overflow-hidden', props.class)"
    :style="{
      zIndex: props.zIndex,
      backgroundImage: watermarkUrl,
      backgroundRepeat: 'repeat',
    }"
    aria-hidden="true"
  ></div>
</template>
