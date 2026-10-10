<!-- YdImageViewer.vue —— 全局图片预览器渲染挂载点。
     通过 useImageViewerState() 订阅模块级共享状态，挂载于 App 根节点。
     特性：缩放（滚轮/按钮，0.5x–5x，步进 0.25x）、旋转（±90°）、翻页（箭头/键盘）、缩略图导航。

     @path comm\@core\ui-kit\popup-ui\src\image-viewer\YdImageViewer.vue
     @author ydsz-team
     @since 26.09.24
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { DURATION_TOKENS, EASING_TOKENS } from '@ydsz-core/design-tokens';

import { useImageViewer, useImageViewerState } from './use-image-viewer';

/** 缩略图最多显示数量 */
const MAX_THUMBNAILS = 10;

/** 共享状态——与 useImageViewer() 命令式 API 写入的是同一份 */
const state = useImageViewerState();

/** 获取模块级命令式 API（供模板调用翻页/关闭） */
const api = useImageViewer();

/** 当前图片 */
const currentImage = computed(() => state.images[state.currentIndex]);

/** 图片 transform 样式：旋转 + 缩放 + 位移 */
const imageTransform = computed(() => {
  const { scale, rotation, offset } = state;
  return `rotate(${rotation}deg) scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`;
});

/** 是否处于拖拽中 */
const isDragging = ref(false);

/**
 * 夹闭缩放倍率到允许范围。
 *
 * @param value 原值
 * @returns 夹闭后的值
 */
function clampScale(value: number): number {
  return Math.min(
    Math.max(value, state.options.minScale),
    state.options.maxScale,
  );
}

/**
 * 处理滚轮缩放。
 *
 * @param event 滚轮事件
 */
function handleWheel(event: WheelEvent): void {
  event.preventDefault();
  const step = state.options.scaleStep;
  const direction = event.deltaY < 0 ? 1 : -1;
  state.scale = clampScale(state.scale + step * direction);
}

/** 放大 */
function zoomIn(): void {
  state.scale = clampScale(state.scale + state.options.scaleStep);
}

/** 缩小 */
function zoomOut(): void {
  state.scale = clampScale(state.scale - state.options.scaleStep);
}

/** 向左旋转 90° */
function rotateLeft(): void {
  state.rotation = (state.rotation - 90 + 360) % 360;
}

/** 向右旋转 90° */
function rotateRight(): void {
  state.rotation = (state.rotation + 90) % 360;
}

/** 重置所有变换（缩放/旋转/位移） */
function resetTransformations(): void {
  state.scale = 1;
  state.rotation = 0;
  state.offset = { x: 0, y: 0 };
}

/** 下一页（通过 API 翻页 + 重置变换） */
function goNext(): void {
  api.next();
}

/** 上一页 */
function goPrev(): void {
  api.prev();
}

/** 关闭预览 */
function closeViewer(): void {
  api.close();
}

/**
 * 缩略图切片：以当前图片为中心取前后若干张，总长度不超过 MAX_THUMBNAILS。
 */
const thumbnailSlice = computed(() => {
  const total = state.images.length;
  const start = Math.max(
    0,
    Math.min(
      state.currentIndex - Math.floor(MAX_THUMBNAILS / 2),
      total - MAX_THUMBNAILS,
    ),
  );
  return state.images.slice(start, start + MAX_THUMBNAILS);
});

/** 缩略图切片起始偏移（用于将切片索引映射回全局索引） */
const thumbnailOffset = computed(() => {
  const total = state.images.length;
  return Math.max(
    0,
    Math.min(
      state.currentIndex - Math.floor(MAX_THUMBNAILS / 2),
      total - MAX_THUMBNAILS,
    ),
  );
});

/**
 * 跳转到指定缩略图索引，并通过 API.open 重置当前索引。
 *
 * @param localIdx 缩略图切片内索引
 */
function jumpToThumbnail(localIdx: number): void {
  const targetIdx = localIdx + thumbnailOffset.value;
  if (targetIdx >= 0 && targetIdx < state.images.length) {
    api.open(state.images, targetIdx);
  }
}

/**
 * 处理键盘事件：← → 翻页、Esc 关闭、+- 缩放。
 */
function handleKeydown(event: KeyboardEvent): void {
  if (!state.isOpen) {
    return;
  }
  switch (event.key) {
    case 'Escape':
      if (state.options.closeOnEsc) {
        closeViewer();
      }
      break;
    case 'ArrowLeft':
      goPrev();
      break;
    case 'ArrowRight':
      goNext();
      break;
    case '+':
    case '=':
      zoomIn();
      break;
    case '-':
      zoomOut();
      break;
  }
}

/**
 * 处理拖拽开始：设置指针捕获以便在元素外继续跟踪拖拽。
 */
function handlePointerDown(event: PointerEvent): void {
  isDragging.value = true;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

/**
 * 处理拖拽移动：累积位移偏移（仅在拖拽态下生效）。
 */
function handlePointerMove(event: PointerEvent): void {
  if (!isDragging.value) {
    return;
  }
  state.offset.x += event.movementX;
  state.offset.y += event.movementY;
}

/**
 * 处理拖拽结束：释放指针捕获。
 */
function handlePointerUp(event: PointerEvent): void {
  isDragging.value = false;
  (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

// 状态关闭后确保变换已重置
watch(
  () => state.isOpen,
  (open) => {
    if (!open) {
      resetTransformations();
    }
  },
);

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity"
      leave-active-class="transition-opacity"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
      :style="{ transitionDuration: `${DURATION_TOKENS.normal}ms`, transitionTimingFunction: EASING_TOKENS.standard }"
    >
      <div
        v-if="state.isOpen"
        class="fixed inset-0 z-[1000] flex flex-col bg-black/85"
        role="dialog"
        aria-modal="true"
        :aria-label="currentImage?.alt || `预览图 ${state.currentIndex + 1}`"
        aria-keyshortcuts="ArrowLeft ArrowRight Escape +-"
      >
        <!-- 顶部工具栏 -->
        <div class="absolute top-0 start-0 end-0 z-10 flex items-center justify-between p-4">
          <span class="text-sm font-medium text-white/70">
            {{ state.currentIndex + 1 }} / {{ state.images.length }}
          </span>

          <div class="flex items-center gap-1">
            <button
              type="button"
              aria-label="放大"
              class="rounded-full p-2 text-white/90 transition-colors hover:bg-white/15"
              @click="zoomIn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
                <path d="M11 8V14M8 11H14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path d="M16 16L20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="缩小"
              class="rounded-full p-2 text-white/90 transition-colors hover:bg-white/15"
              @click="zoomOut"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
                <path d="M8 11H14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path d="M16 16L20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="向左旋转"
              class="rounded-full p-2 text-white/90 transition-colors hover:bg-white/15"
              @click="rotateLeft"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M3 3V8H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="向右旋转"
              class="rounded-full p-2 text-white/90 transition-colors hover:bg-white/15"
              @click="rotateRight"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-3-6.7L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M21 3V8H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="重置变换"
              class="rounded-full p-2 text-white/90 transition-colors hover:bg-white/15"
              @click="resetTransformations"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 3H19V7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M5 15L9.5 19.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M3 7V11H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="关闭预览"
              class="rounded-full p-2 text-white/90 transition-colors hover:bg-white/15"
              @click="closeViewer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 主内容区 -->
        <div class="relative flex flex-1 items-center justify-center overflow-hidden" @wheel="handleWheel">
          <!-- 上一张 -->
          <button
            v-show="state.currentIndex > 0"
            type="button"
            aria-label="上一张"
            class="absolute start-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white transition-transform hover:scale-110 hover:bg-black/60"
            @click="goPrev"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6L9 12L15 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <!-- 当前图片 -->
          <img
            v-if="currentImage"
            :key="currentImage.src + state.currentIndex"
            :src="currentImage.src"
            :alt="currentImage.alt || `预览图 ${state.currentIndex + 1}`"
            role="img"
            class="max-h-[80vh] max-w-[90vw] select-none object-contain transition-transform"
            :style="{
              transform: imageTransform,
              cursor: state.scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              transitionDuration: `${DURATION_TOKENS.fast}ms`,
              transitionTimingFunction: EASING_TOKENS.standard,
            }"
            draggable="false"
            @pointerdown="handlePointerDown"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerUp"
          />

          <!-- 下一张 -->
          <button
            v-show="state.currentIndex < state.images.length - 1"
            type="button"
            aria-label="下一张"
            class="absolute end-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white transition-transform hover:scale-110 hover:bg-black/60"
            @click="goNext"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <!-- 底部缩略图导航条 -->
        <div
          v-if="state.images.length > 1"
          class="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-lg bg-black/50 p-2"
          role="tablist"
          aria-label="图片切换"
        >
          <button
            v-for="(img, idx) in thumbnailSlice"
            :key="img.src + idx"
            type="button"
            role="tab"
            :aria-selected="(idx + thumbnailOffset) === state.currentIndex"
            :aria-label="`第 ${idx + thumbnailOffset + 1} 张`"
            :class="cn(
              'h-14 w-20 shrink-0 overflow-hidden rounded border-2 transition-all duration-200',
              (idx + thumbnailOffset) === state.currentIndex
                ? 'border-white opacity-100 scale-105'
                : 'border-transparent opacity-50 hover:opacity-80',
            )"
            @click="jumpToThumbnail(idx)"
          >
            <img
              :src="img.thumbnail || img.src"
              alt=""
              class="h-full w-full object-cover"
              draggable="false"
            />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
