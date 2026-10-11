<!--
 * Watermark（水印）组件
 *
 * 通过 canvas 将文字/图片绘制为 base64 dataURL，再作为 background-image
 * 平铺覆盖整个容器。可选择性开启 MutationObserver 防篡改监听。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\watermark\watermark.vue
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';

import type { WatermarkProps } from './watermark-types';

defineOptions({ name: 'YdWatermark' });

const props = withDefaults(defineProps<WatermarkProps>(), {
  width: 120,
  height: 64,
  rotate: -22,
  fontSize: 14,
  fontColor: 'rgba(0,0,0,0.1)',
  fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
  gap: () => [100, 100] as [number, number],
  offset: () => [0, 0] as [number, number],
  zIndex: 10,
  antiTamper: true,
});

const watermarkRef = ref<HTMLDivElement | null>(null);

/** 当前生成的水印 dataURL，供防篡改恢复使用 */
const currentDataUrl = ref<string>('');

/** MutationObserver 实例 */
let observer: MutationObserver | null = null;

/**
 * 生成文字水印的 Canvas dataURL。
 *
 * 在指定宽高的画布中央绘制旋转后的文字，适用于文本型水印场景。
 *
 * @returns base64 dataURL 字符串
 */
function drawTextWatermark(): string {
  const canvas = document.createElement('canvas');
  const { width, height, fontSize, fontColor, fontFamily, rotate } = props;
  const [gapX, gapY] = props.gap ?? [100, 100];
  const [offsetX, offsetY] = props.offset ?? [0, 0];

  canvas.width = width + gapX;
  canvas.height = height + gapY;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = fontColor;
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 移动到画布中心并旋转
  ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.fillText(props.content ?? '', 0, 0);

  return canvas.toDataURL();
}

/**
 * 生成图片水印的 Canvas dataURL。
 *
 * 在指定宽高的画布中央绘制旋转后的图片，适用于图片型水印场景。
 *
 * @param img - 已加载完成的 HTMLImageElement
 * @returns base64 dataURL 字符串
 */
function drawImageWatermark(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const { width, height, rotate } = props;
  const [gapX, gapY] = props.gap ?? [100, 100];
  const [offsetX, offsetY] = props.offset ?? [0, 0];

  canvas.width = width + gapX;
  canvas.height = height + gapY;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 移动到画布中心并旋转
  ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.drawImage(img, -width / 2, -height / 2, width, height);

  return canvas.toDataURL();
}

/**
 * 生成水印 dataURL（文字或图片）。
 *
 * 若存在 image 则走图片路径（异步），否则走文字路径（同步）。
 *
 * @param callback - 生成完成后的回调，接收 dataURL
 */
function generateWatermark(callback: (dataUrl: string) => void): void {
  if (props.image) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      callback(drawImageWatermark(img));
    };
    img.onerror = () => {
      // 图片加载失败时回退到文字
      callback(drawTextWatermark());
    };
    img.src = props.image;
  } else {
    callback(drawTextWatermark());
  }
}

/**
 * 将生成的 dataURL 应用为容器的背景图。
 */
function applyWatermark(): void {
  generateWatermark((dataUrl: string) => {
    currentDataUrl.value = dataUrl;
    const el = watermarkRef.value;
    if (!el) return;
    el.style.backgroundImage = `url(${dataUrl})`;
    el.style.backgroundRepeat = 'repeat';
  });
}

/**
 * 启动 MutationObserver 防篡改监听。
 *
 * 监控容器的 style 与 onload/onerror 属性变化，当检测到
 * background-image 被移除、display:none 或 visibility:hidden 时
 * 自动恢复水印；当节点被移除时重新创建。
 */
function startObserver(): void {
  const el = watermarkRef.value;
  if (!el) return;

  observer = new MutationObserver((mutations: MutationRecord[]) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        const target = mutation.target as HTMLElement;
        const style = target.style;

        // background-image 被移除 → 恢复
        if (
          mutation.attributeName === 'style' &&
          !style.backgroundImage &&
          currentDataUrl.value
        ) {
          target.style.backgroundImage = `url(${currentDataUrl.value})`;
          target.style.backgroundRepeat = 'repeat';
        }

        // display:none → 恢复
        if (
          mutation.attributeName === 'style' &&
          style.display === 'none'
        ) {
          target.style.display = '';
        }

        // visibility:hidden → 恢复
        if (
          mutation.attributeName === 'style' &&
          style.visibility === 'hidden'
        ) {
          target.style.visibility = '';
        }
      }
    }
  });

  observer.observe(el, {
    attributeFilter: ['style', 'onload', 'onerror'],
    attributes: true,
    childList: false,
    subtree: false,
  });
}

/**
 * 停止 MutationObserver 并释放引用。
 */
function stopObserver(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

/** 暴露给父组件的方法 */
defineExpose({
  /** 重新生成水印 */
  regenerate: applyWatermark,
});

onMounted(() => {
  applyWatermark();
  if (props.antiTamper) {
    nextTick(() => {
      startObserver();
    });
  }
});

onBeforeUnmount(() => {
  stopObserver();
});

// 响应式重新生成：当关键 prop 变化时
watch(
  () => [
    props.content,
    props.image,
    props.width,
    props.height,
    props.rotate,
    props.fontSize,
    props.fontColor,
    props.fontFamily,
    props.gap,
    props.offset,
  ],
  () => {
    applyWatermark();
  },
);
</script>

<template>
  <div
    ref="watermarkRef"
    :class="[`yd-watermark`, props.class]"
    :style="{ zIndex }"
  >
    <slot />
  </div>
</template>

<style scoped>
.yd-watermark {
  position: relative;
  display: block;
}
</style>
