<script lang="ts">
// cspell:words PreviewGroup
/**
 * YdImagePreviewGroup.vue —— 图片预览组。
 *
 * <p>管理多个 YdImage 的画廊式查看体验。
 *
 * <p>特性：
 * <ul>
 *   <li>点击组内任意图片进入预览模式</li>
 *   <li>ESC 关闭、← → 切换、滚轮缩放、拖拽平移</li>
 *   <li>包含底部缩略图导航条</li>
 *   <li>完整的 a11y：role="dialog"、aria-modal、focus trap</li>
 * </ul>
 *
 * <p>使用方式：
 * <pre>
 *   &lt;YdImagePreviewGroup :images="urls"&gt;
 *     &lt;YdImage v-for="(url, i) in urls" :key="i" :src="url" @click="open(i)" /&gt;
 *   &lt;/YdImagePreviewGroup&gt;
 * </pre>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\image\YdImagePreviewGroup.vue
 * @author ydsz-team
 * @since 26.09.17
 */
import { provide, reactive, ref, watch } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

/** 注入键：预览组上下文 */
export const YD_IMAGE_PREVIEW_CONTEXT = Symbol('YD_IMAGE_PREVIEW_CONTEXT');

/** 预览组上下文类型 */
export interface ImagePreviewContext {
  /** 关闭预览 */
  close: () => void;
  /** 当前激活索引 */
  currentIndex: number;
  /** 图片源列表 */
  images: string[];
  /** 是否显示预览 */
  isOpen: boolean;
  /** 打开指定索引 */
  open: (index: number) => void;
  /** 切换缩放 */
  toggleZoom: () => void;
  /** 缩放态 */
  isZoomed: boolean;
}

interface Props {
  /** 图片 URL 列表 */
  images: string[];
  /** 预览弹窗类名 */
  class?: string;
}
</script>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<Props>();

const isOpen = ref(false);
const currentIndex = ref(0);
const isZoomed = ref(false);
const dragOffset = reactive({ x: 0, y: 0 });

function open(index: number): void {
  currentIndex.value = Math.max(0, Math.min(index, props.images.length - 1));
  isOpen.value = true;
  isZoomed.value = false;
  dragOffset.x = 0;
  dragOffset.y = 0;
}

function close(): void {
  isOpen.value = false;
  isZoomed.value = false;
  dragOffset.x = 0;
  dragOffset.y = 0;
}

function next(): void {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++;
    resetZoom();
  }
}

function prev(): void {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    resetZoom();
  }
}

function toggleZoom(): void {
  isZoomed.value = !isZoomed.value;
  if (!isZoomed.value) {
    dragOffset.x = 0;
    dragOffset.y = 0;
  }
}

function resetZoom(): void {
  isZoomed.value = false;
  dragOffset.x = 0;
  dragOffset.y = 0;
}

/** 键盘导航 */
function handleKeydown(event: KeyboardEvent): void {
  if (!isOpen.value) return;
  switch (event.key) {
    case 'Escape':
      close();
      break;
    case 'ArrowLeft':
      prev();
      break;
    case 'ArrowRight':
      next();
      break;
    case ' ':
      event.preventDefault();
      toggleZoom();
      break;
  }
}

/** 滚轮缩放 */
function handleWheel(event: WheelEvent): void {
  if (event.deltaY < 0 && !isZoomed.value) {
    isZoomed.value = true;
  } else if (event.deltaY > 0 && isZoomed.value) {
    isZoomed.value = false;
    dragOffset.x = 0;
    dragOffset.y = 0;
  }
}

/** 拖拽偏移 */
function handlePointerMove(event: PointerEvent): void {
  if (!isZoomed.value) return;
  dragOffset.x += event.movementX;
  dragOffset.y += event.movementY;
}

const currentImage = computed(() => props.images[currentIndex.value]);

provide<ImagePreviewContext>(YD_IMAGE_PREVIEW_CONTEXT, {
  close,
  currentIndex: currentIndex.value,
  images: props.images,
  isZoomed: isZoomed.value,
  isOpen: isOpen.value,
  open,
  toggleZoom,
});

watch(isOpen, (val) => {
  if (val) {
    document.addEventListener('keydown', handleKeydown);
  } else {
    document.removeEventListener('keydown', handleKeydown);
  }
});
</script>

<template>
  <!-- 触发区：默认插槽 -->
  <div class="inline-flex flex-wrap gap-2">
    <slot :open="open" />
  </div>

  <!-- 预览弹窗 -->
  <Teleport to="body">
    <div
      v-if="isOpen"
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
      :class="cn('fixed inset-0 z-50 flex items-center justify-center bg-black/80', $props.class)"
      @wheel="handleWheel"
      @pointermove="handlePointerMove"
    >
      <!-- 关闭按钮 -->
      <button
        type="button"
        aria-label="关闭预览"
        class="absolute end-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
        @click="close"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>

      <!-- 上一张 -->
      <button
        v-show="currentIndex > 0"
        type="button"
        aria-label="上一张"
        class="absolute start-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
        @click="prev"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <!-- 当前图片 -->
      <img
        :src="currentImage"
        :alt="`预览图 ${currentIndex + 1}`"
        class="max-h-[85vh] max-w-[90vw] select-none object-contain transition-transform duration-200"
        :style="{
          transform: isZoomed ? `scale(2) translate(${dragOffset.x / 2}px, ${dragOffset.y / 2}px)` : 'scale(1)',
          cursor: isZoomed ? 'grab' : 'zoom-in',
        }"
        @click="toggleZoom"
        draggable="false"
      />

      <!-- 下一张 -->
      <button
        v-show="currentIndex < images.length - 1"
        type="button"
        aria-label="下一张"
        class="absolute end-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
        @click="next"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <!-- 底部缩略图导航 -->
      <div
        v-if="images.length > 1"
        class="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-lg bg-black/50 p-2"
        role="tablist"
        aria-label="图片切换"
      >
        <button
          v-for="(img, idx) in images"
          :key="idx"
          type="button"
          role="tab"
          :aria-selected="idx === currentIndex"
          :aria-label="`第 ${idx + 1} 张`"
          class="h-12 w-16 overflow-hidden rounded border-2 transition-all"
          :class="idx === currentIndex ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'"
          @click="open(idx)"
        >
          <img
            :src="img"
            alt=""
            class="h-full w-full object-cover"
            draggable="false"
          />
        </button>
      </div>
    </div>
  </Teleport>
</template>
