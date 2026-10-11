<!--
 * QRCode（qr-code）组件：基于 Canvas 的二维码生成与渲染。
 *
 * 伪算法：使用确定性哈希生成 NxN 二值矩阵，支持三角落 finder pattern，
 * Canvas 绘制为方格样式，暴露 download() 方法供父组件调用。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';

import type { QRCodeEmits, QRCodeProps } from './qr-code-types';

import { generateQRMatrix } from './qr-code-utils';

defineOptions({ name: 'YdQrCode' });

const props = withDefaults(defineProps<QRCodeProps>(), {
  value: '',
  size: 160,
  level: 'M',
  color: '#000000',
  bgColor: '#ffffff',
  margin: 2,
});

const emit = defineEmits<QRCodeEmits>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

/**
 * 在 Canvas 上绘制二维码矩阵。
 *
 * 计算每个模块的有效绘制尺寸，留出静默区（margin），
 * 然后遍历矩阵数组分别用前景/背景色填充每个格子。
 */
function draw(): void {
  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const text = props.value ?? '';
  const matrix = generateQRMatrix(text, props.level!);
  const moduleCount = matrix.length;

  // 设备的像素比，保证高清渲染
  const dpr = window.devicePixelRatio || 1;

  // 计算可用的绘图区域（减去静默区）
  const totalMargin = props.margin! * 2;
  const availableSize = Math.max(props.size! - totalMargin, moduleCount);
  const cellSize = Math.floor(availableSize / moduleCount);

  // 实际画布像素尺寸（按 cellSize 对齐后 + 静默区）
  const canvasSize = cellSize * moduleCount + totalMargin;

  // 设置画布逻辑尺寸与物理尺寸
  canvas.width = canvasSize * dpr;
  canvas.height = canvasSize * dpr;
  canvas.style.width = `${canvasSize}px`;
  canvas.style.height = `${canvasSize}px`;

  // 缩放上下文以匹配 DPR
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 绘制背景
  ctx.fillStyle = props.bgColor!;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // 绘制前景模块
  ctx.fillStyle = props.color!;
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (matrix[row]![col]) {
        const x = props.margin! + col * cellSize;
        const y = props.margin! + row * cellSize;
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
  }

  // 触发 rendered 事件
  emit('rendered');
}

/**
 * 将当前 Canvas 内容下载为 PNG 图片。
 *
 * @param filename - 下载文件名（不含扩展名），默认 'qrcode'
 */
function download(filename?: string): void {
  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${filename ?? 'qrcode'}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

onMounted(() => {
  nextTick(() => {
    draw();
  });
});

watch(
  () => [props.value, props.size, props.level, props.color, props.bgColor, props.margin],
  () => {
    nextTick(() => {
      draw();
    });
  },
);

defineExpose({
  download,
});
</script>

<template>
  <div :class="[`yd-qr-code`, props.class]">
    <canvas ref="canvasRef" :class="`yd-qr-code__canvas`"></canvas>
    <div :class="`yd-qr-code__overlay`">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.yd-qr-code {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.yd-qr-code__canvas {
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.yd-qr-code__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
</style>
