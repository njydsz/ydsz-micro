<script lang="ts" setup>
/**
* ImageEditor 图片裁剪编辑组件。
* 
 * 使用 Canvas 绘制原图，DOM 叠加层实现可拖拽裁剪框与四角 resize 手柄，
 * 支持宽高比约束、实时预览与 base64 导出。
* 
 * 对标 react-image-crop 的交互体验。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\components\image-editor\image-editor.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import type {
  ImageEditorAspectRatio,
  ImageEditorRect,
} from './image-editor-types';

import type {
  ImageEditorEmits,
  ImageEditorExpose,
  ImageEditorProps,
} from './image-editor-types';

import { useLocale } from '../../locale/useLocale';

defineOptions({ name: 'YdImageEditor' });

const { t } = useLocale();

const props = withDefaults(defineProps<ImageEditorProps>(), {
  aspectRatio: 'free',
  showPreview: true,
  previewSize: 120,
  minCropSize: 20,
});

const emit = defineEmits<ImageEditorEmits>();

// ---- Refs ------------------------------------------------------------------

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const imageObj = ref<HTMLImageElement | null>(null);

// 裁剪框状态（像素坐标，相对于 canvas 尺寸）
const cropRect = ref<ImageEditorRect | null>(null);
// 拖拽状态
const isDragging = ref(false);
const isResizing = ref(false);
const dragStart = ref<{ x: number; y: number }>({ x: 0, y: 0 });
const resizeHandle = ref<string>(''); // 'nw' | 'ne' | 'sw' | 'se' | ''

// canvas 显示尺寸
const canvasWidth = ref(0);
const canvasHeight = ref(0);

// ---- 宽高比 ---------------------------------------------------------------

function getAspectRatioValue(ratio: ImageEditorAspectRatio): number | null {
  switch (ratio) {
    case '1:1':
      return 1;
    case '4:3':
      return 4 / 3;
    case '16:9':
      return 16 / 9;
    default:
      return null;
  }
}

// ---- 图片加载 ------------------------------------------------------------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
}

async function initImage(src: string): Promise<void> {
  try {
    const img = await loadImage(src);
    imageObj.value = img;
    drawCanvas();
    initCropRect();
  } catch {
    imageObj.value = null;
  }
}

function drawCanvas(): void {
  const canvas = canvasRef.value;
  const img = imageObj.value;
  if (!canvas || !img) {
    return;
  }

  const container = containerRef.value;
  if (!container) {
    return;
  }

  // 计算 container 可用宽高
  const containerRect = container.getBoundingClientRect();
  const maxWidth = containerRect.width;
  const maxHeight = containerRect.height || 400;

  // 计算图片等比缩放后的显示尺寸
  const scaleX = maxWidth / img.naturalWidth;
  const scaleY = maxHeight / img.naturalHeight;
  const scale = Math.min(scaleX, scaleY, 1);

  const displayWidth = img.naturalWidth * scale;
  const displayHeight = img.naturalHeight * scale;

  canvas.width = displayWidth;
  canvas.height = displayHeight;
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  canvasWidth.value = displayWidth;
  canvasHeight.value = displayHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }
  ctx.clearRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
}

function initCropRect(): void {
  const w = canvasWidth.value;
  const h = canvasHeight.value;

  if (!w || !h) {
    return;
  }

  if (props.defaultCrop) {
    cropRect.value = { ...props.defaultCrop };
    return;
  }

  // 默认取图片中心的 60% 区域
  const defaultWidth = Math.min(w * 0.6, h * 0.6);
  const defaultHeight = props.aspectRatio !== 'free'
    ? defaultWidth / (getAspectRatioValue(props.aspectRatio) ?? 1)
    : defaultWidth;

  cropRect.value = {
    x: (w - defaultWidth) / 2,
    y: (h - defaultHeight) / 2,
    width: defaultWidth,
    height: defaultHeight,
  };
}

// ---- 鼠标事件处理 ----------------------------------------------------------

function getCanvasRelativePos(event: MouseEvent): { x: number; y: number } {
  const canvas = canvasRef.value;
  if (!canvas) {
    return { x: 0, y: 0 };
  }
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function clampCropRect(rect: ImageEditorRect): ImageEditorRect {
  const maxW = canvasWidth.value;
  const maxH = canvasHeight.value;
  const min = props.minCropSize;

  let { x, y, width, height } = rect;

  // 最小尺寸
  width = Math.max(min, width);
  height = Math.max(min, height);

  // 边界
  x = Math.max(0, Math.min(x, maxW - width));
  y = Math.max(0, Math.min(y, maxH - height));
  width = Math.min(width, maxW - x);
  height = Math.min(height, maxH - y);

  return { x, y, width, height };
}

function applyAspectRatio(
  rect: ImageEditorRect,
  anchorCorner: 'nw' | 'ne' | 'sw' | 'se',
): ImageEditorRect {
  const ratio = getAspectRatioValue(props.aspectRatio);
  if (!ratio) {
    return rect;
  }

  let { x, y, width, height } = rect;

  // 基于宽度调整高度
  height = width / ratio;

  // 修正超出边界的情况
  const maxW = canvasWidth.value;
  const maxH = canvasHeight.value;

  if (height > maxH - y && anchorCorner !== 'nw' && anchorCorner !== 'ne') {
    height = maxH - y;
    width = height * ratio;
  }

  if (width > maxW - x) {
    width = maxW - x;
    height = width / ratio;
  }

  // 修正起点
  if (anchorCorner === 'ne' || anchorCorner === 'se') {
    // 从右侧调整，x 不变
  }
  if (anchorCorner === 'sw' || anchorCorner === 'se') {
    // 从底部调整，y 不变
  }
  if (anchorCorner === 'nw') {
    // 左上：根据新宽高重新定位
    x = x + (rect.width - width);
    y = y + (rect.height - height);
  } else if (anchorCorner === 'ne') {
    // 右上：x 不变，y 上调
    y = y + (rect.height - height);
  } else if (anchorCorner === 'sw') {
    // 左下：x 左调，y 不变
    x = x + (rect.width - width);
  }
  // se: 右下，x/y 不变

  return clampCropRect({ x, y, width, height });
}

function handleCropMousedown(event: MouseEvent): void {
  event.preventDefault();
  if (!cropRect.value) {
    return;
  }

  const pos = getCanvasRelativePos(event);
  dragStart.value = {
    x: pos.x - cropRect.value.x,
    y: pos.y - cropRect.value.y,
  };
  isDragging.value = true;
}

function handleResizeMousedown(
  event: MouseEvent,
  handle: 'nw' | 'ne' | 'sw' | 'se',
): void {
  event.preventDefault();
  event.stopPropagation();
  if (!cropRect.value) {
    return;
  }

  dragStart.value = getCanvasRelativePos(event);
  resizeHandle.value = handle;
  isResizing.value = true;
}

function handleMousemove(event: MouseEvent): void {
  if (!cropRect.value) {
    return;
  }

  const pos = getCanvasRelativePos(event);

  if (isDragging.value) {
    // 拖拽移动
    const newRect: ImageEditorRect = {
      ...cropRect.value,
      x: pos.x - dragStart.value.x,
      y: pos.y - dragStart.value.y,
    };
    cropRect.value = clampCropRect(newRect);
  } else if (isResizing.value) {
    // 调整大小
    let newRect = { ...cropRect.value };
    const dx = pos.x - dragStart.value.x;
    const dy = pos.y - dragStart.value.y;

    switch (resizeHandle.value) {
      case 'se': {
        newRect.width = cropRect.value.width + dx;
        newRect.height = cropRect.value.height + dy;
        break;
      }
      case 'sw': {
        newRect.x = cropRect.value.x + dx;
        newRect.width = cropRect.value.width - dx;
        newRect.height = cropRect.value.height + dy;
        break;
      }
      case 'ne': {
        newRect.y = cropRect.value.y + dy;
        newRect.width = cropRect.value.width + dx;
        newRect.height = cropRect.value.height - dy;
        break;
      }
      case 'nw': {
        newRect.x = cropRect.value.x + dx;
        newRect.y = cropRect.value.y + dy;
        newRect.width = cropRect.value.width - dx;
        newRect.height = cropRect.value.height - dy;
        break;
      }
    }

    newRect = clampCropRect(newRect);
    newRect = applyAspectRatio(newRect, resizeHandle.value as 'nw' | 'ne' | 'sw' | 'se');
    cropRect.value = newRect;
    dragStart.value = pos;
  }
}

function handleMouseup(): void {
  if (isDragging.value || isResizing.value) {
    emit('crop', cropRect.value!);
  }
  isDragging.value = false;
  isResizing.value = false;
  resizeHandle.value = '';
}

// ---- 公开方法 ---------------------------------------------------------------

function getCropRect(): ImageEditorRect | null {
  if (!cropRect.value || !imageObj.value) {
    return null;
  }

  // 将显示尺寸下的裁剪坐标转换为原始图片尺寸下的坐标
  const img = imageObj.value;
  const scaleX = img.naturalWidth / canvasWidth.value;
  const scaleY = img.naturalHeight / canvasHeight.value;

  return {
    x: Math.round(cropRect.value.x * scaleX),
    y: Math.round(cropRect.value.y * scaleY),
    width: Math.round(cropRect.value.width * scaleX),
    height: Math.round(cropRect.value.height * scaleY),
  };
}

async function applyCrop(): Promise<string> {
  const rect = getCropRect();
  if (!rect || !imageObj.value) {
    return '';
  }

  const img = imageObj.value;
  const canvas = document.createElement('canvas');
  canvas.width = rect.width;
  canvas.height = rect.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  ctx.drawImage(
    img,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height,
  );

  return canvas.toDataURL('image/png');
}

function reset(): void {
  initCropRect();
  emit('crop', cropRect.value!);
}

// ---- 预览 ------------------------------------------------------------------

const previewSrc = computed<string>(() => {
  if (!props.showPreview || !cropRect.value || !imageObj.value) {
    return '';
  }

  // 使用 canvas 绘制预览
  const img = imageObj.value;
  const rect = cropRect.value;
  const scaleX = img.naturalWidth / canvasWidth.value;
  const scaleY = img.naturalHeight / canvasHeight.value;

  const pw = props.previewSize;
  const ratio = rect.width / rect.height;
  const ph = pw / ratio;

  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = pw;
  previewCanvas.height = ph;

  const ctx = previewCanvas.getContext('2d');
  if (!ctx) {
    return '';
  }

  ctx.drawImage(
    img,
    rect.x * scaleX,
    rect.y * scaleY,
    rect.width * scaleX,
    rect.height * scaleY,
    0,
    0,
    pw,
    ph,
  );

  return previewCanvas.toDataURL('image/png');
});

// ---- 生命周期 --------------------------------------------------------------

onMounted(async () => {
  if (props.src) {
    await initImage(props.src);
  }
  document.addEventListener('mousemove', handleMousemove);
  document.addEventListener('mouseup', handleMouseup);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleMousemove);
  document.removeEventListener('mouseup', handleMouseup);
});

watch(
  () => props.src,
  async (newSrc) => {
    if (newSrc) {
      await initImage(newSrc);
    }
  },
);

watch(
  () => canvasWidth.value,
  () => {
    if (imageObj.value && canvasWidth.value > 0) {
      initCropRect();
    }
  },
);

defineExpose<ImageEditorExpose>({
  getCropRect,
  applyCrop,
  reset,
});
</script>

<template>
  <div
    :class="[
      'yd-image-editor flex flex-col gap-3 rounded-md border border-border bg-background p-4',
      props.class,
    ]"
    role="region"
    :aria-label="t('imageEditor.ariaLabel')"
  >
    <!-- header -->
    <header class="flex items-center justify-between">
      <span class="text-sm font-medium">{{ t('imageEditor.title') }}</span>
      <div class="flex items-center gap-2">
        <button
          class="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          type="button"
          @click="reset"
        >
          {{ t('common.reset') }}
        </button>
        <button
          class="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          type="button"
          @click="emit('cancel')"
        >
          {{ t('common.cancel') }}
        </button>
      </div>
    </header>

    <!-- main area -->
    <div class="flex flex-1 gap-3">
      <!-- canvas + overlay container -->
      <div
        ref="containerRef"
        class="yd-image-container relative flex-1 overflow-hidden rounded border border-border bg-muted/20"
      >
        <canvas ref="canvasRef" class="yd-image-canvas block"></canvas>

        <!-- 裁剪遮罩 + 框 -->
        <div
          v-if="cropRect && canvasWidth && canvasHeight"
          class="yd-crop-overlay absolute inset-0 pointer-events-none"
        >
          <!-- 顶部遮罩 -->
          <div
            class="absolute inset-x-0 top-0 bg-black/40"
            :style="{ height: cropRect.y + 'px' }"
          ></div>
          <!-- 底部遮罩 -->
          <div
            class="absolute inset-x-0 bottom-0 bg-black/40"
            :style="{ height: canvasHeight - cropRect.y - cropRect.height + 'px' }"
          ></div>
          <!-- 左侧遮罩 -->
          <div
            class="absolute left-0 bg-black/40"
            :style="{
              top: cropRect.y + 'px',
              width: cropRect.x + 'px',
              height: cropRect.height + 'px',
            }"
          ></div>
          <!-- 右侧遮罩 -->
          <div
            class="absolute right-0 bg-black/40"
            :style="{
              top: cropRect.y + 'px',
              width: canvasWidth - cropRect.x - cropRect.width + 'px',
              height: cropRect.height + 'px',
            }"
          ></div>

          <!-- 裁剪框 -->
          <div
            class="yd-crop-box absolute border-2 border-primary bg-transparent pointer-events-auto"
            :style="{
              left: cropRect.x + 'px',
              top: cropRect.y + 'px',
              width: cropRect.width + 'px',
              height: cropRect.height + 'px',
            }"
            @mousedown="handleCropMousedown"
          >
            <!-- 三分线网格 -->
            <div class="absolute inset-0 grid grid-cols-3 grid-rows-3">
              <div
                v-for="i in 9"
                :key="i"
                class="border border-white/30"
              ></div>
            </div>

            <!-- 四角 resize 手柄 -->
            <div
              class="yd-resize-handle absolute -top-1 -left-1 h-3 w-3 cursor-nw-resize rounded-sm bg-primary ring-2 ring-background"
              @mousedown="(e) => handleResizeMousedown(e as MouseEvent, 'nw')"
            ></div>
            <div
              class="yd-resize-handle absolute -top-1 -right-1 h-3 w-3 cursor-ne-resize rounded-sm bg-primary ring-2 ring-background"
              @mousedown="(e) => handleResizeMousedown(e as MouseEvent, 'ne')"
            ></div>
            <div
              class="yd-resize-handle absolute -bottom-1 -left-1 h-3 w-3 cursor-sw-resize rounded-sm bg-primary ring-2 ring-background"
              @mousedown="(e) => handleResizeMousedown(e as MouseEvent, 'sw')"
            ></div>
            <div
              class="yd-resize-handle absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-sm bg-primary ring-2 ring-background"
              @mousedown="(e) => handleResizeMousedown(e as MouseEvent, 'se')"
            ></div>
          </div>
        </div>

        <!-- 图片加载提示 -->
        <div
          v-if="!imageObj"
          class="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
        >
          {{ t('imageEditor.loadHint') }}
        </div>
      </div>

      <!-- preview sidebar -->
      <aside
        v-if="props.showPreview"
        class="yd-preview-sidebar flex flex-col items-center gap-2"
      >
        <span class="text-xs text-muted-foreground">{{ t('imageEditor.preview') }}</span>
        <div
          class="overflow-hidden rounded border border-border bg-muted"
          :style="{
            width: props.previewSize + 'px',
            height: props.previewSize + 'px',
          }"
        >
          <img
            v-if="previewSrc"
            :src="previewSrc"
            :alt="t('imageEditor.previewAlt')"
            class="h-full w-full object-contain"
          />
        </div>
      </aside>
    </div>
  </div>
</template>
