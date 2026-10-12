<script lang="ts" setup>
// @ts-nocheck
import { onMounted, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

interface Props {
  /** 二维码值 */
  value: string;
  class?: any;
  /** 尺寸（px） */
  size?: number;
  /** 纠错级别 */
  level?: 'H' | 'L' | 'M' | 'Q';
  /** 背景色 */
  bgColor?: string;
  /** 前景色 */
  fgColor?: string;
  /** 是否显示背景 */
  includeMargin?: boolean;
  /** 渲染方式 */
  renderAs?: 'canvas' | 'svg';
}

const props = withDefaults(defineProps<Props>(), {
  bgColor: '#ffffff',
  fgColor: '#000000',
  includeMargin: false,
  level: 'M',
  renderAs: 'canvas',
  size: 160,
});

const canvasRef = ref<HTMLCanvasElement>();
const error = ref('');

onMounted(() => {
  if (!canvasRef.value || !props.value) return;
  // 基于极简 QR 编码逻辑生成图案
  // 生产环境应使用 qrcode 库；此处提供基础占位能力
  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;

  try {
    const qrMatrix = generateSimpleQR(props.value);
    const moduleCount = qrMatrix.length;
    const cellSize = props.size / moduleCount;

    ctx.fillStyle = props.bgColor;
    ctx.fillRect(0, 0, props.size, props.size);
    ctx.fillStyle = props.fgColor;

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qrMatrix[row]?.[col]) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '二维码生成失败';
  }
});

/** 极简矩阵生成（演示用，生产应替换为专业 qrcode 库） */
function generateSimpleQR(text: string): number[][] {
  const size = 21;
  const matrix: number[][] = Array.from({ length: size }, () => Array(size).fill(0));

  // 定位图案（三个角的回形）
  const drawFinder = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        if (isOuter || isInner) matrix[startR + r]![startC + c] = 1;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 根据字符串哈希填充数据区
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 100000;
  }
  for (let r = 8; r < size - 8; r++) {
    for (let c = 8; c < size; c++) {
      hash = (hash * 31 + r + c) % 100000;
      matrix[r]![c] = hash % 2;
    }
  }

  return matrix;
}
</script>

<template>
  <div :class="cn('inline-flex flex-col items-center gap-2', props.class)">
    <canvas
      v-if="props.renderAs === 'canvas' && !error"
      ref="canvasRef"
      :aria-label="`二维码 ${props.value}`"
      :height="props.size"
      :width="props.size"
      class="rounded bg-white"
      role="img"
    ></canvas>
    <div v-else-if="error" class="text-red-500 text-sm flex items-center justify-center border rounded" :style="{ width: `${props.size}px`, height: `${props.size}px` }">
      {{ error }}
    </div>
  </div>
</template>
