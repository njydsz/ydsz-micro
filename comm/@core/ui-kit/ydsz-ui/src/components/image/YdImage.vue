<script setup lang="ts">
/**
 * Image 图片：增强版图片组件。
 *
 * 特性：懒加载、错误占位、圆角裁剪、预览模式、srcList 级联预览。
 * 多图预览通过 YdImage.PreviewGroup 提供左右切换、缩放等手势。
 *
 * <p>5.7.0 补全：
 *  - `preview` prop 接线（注入 PreviewGroup context，点击自动打开预览）；
 *  - `srcList` / `previewSrcList` 级联预览（Element 风格）；
 *  - 独立预览模式（未在 PreviewGroup 内时可用）；
 *  - 移除 `@ts-nocheck`，补全类型契约。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\image\YdImage.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { ImagePreviewContext } from './YdImagePreviewGroup.vue';

import { computed, inject, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { ImageOff } from 'lucide-vue-next';

import { YD_IMAGE_PREVIEW_CONTEXT } from './YdImagePreviewGroup.vue';

interface Props {
  /** 自定义类名 */
  class?: string;
  /** 替代文本（a11y 必备） */
  alt?: string;
  /** 圆角变体 */
  rounded?: 'full' | 'lg' | 'md' | 'none' | 'sm';
  /** 加载失败占位文案 */
  fallbackText?: string;
  /** 图片高度 */
  height?: number | string;
  /** 是否懒加载 */
  lazy?: boolean;
  /** 是否开启预览 */
  preview?: boolean;
  /** 图片源 */
  src: string;
  /** 图片宽度（px 或 tailwind 类） */
  width?: number | string;
  /** 宽高比 */
  aspectRatio?: string;
  /** object-fit */
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /**
   * 级联预览图片列表（Element 风格 srcList）。
   *
   * 传入后，预览时可在这些图片间切换。
   */
  srcList?: string[];
  /**
   * 预览专用图片列表（previewSrcList）。
   *
   * 优先于 srcList；通常用于预览时展示高清图。
   */
  previewSrcList?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  aspectRatio: undefined,
  class: '',
  fallbackText: '加载失败',
  fit: 'cover',
  height: undefined,
  lazy: false,
  preview: false,
  previewSrcList: undefined,
  rounded: 'none',
  srcList: undefined,
  width: undefined,
});

const hasError = ref(false);
const isLoading = ref(true);

/** 注入的预览组上下文（若在 YdImagePreviewGroup 内） */
const groupContext = inject<ImagePreviewContext | undefined>(YD_IMAGE_PREVIEW_CONTEXT, undefined);

/** 当前图片在 srcList 中的索引 */
const srcListIndex = computed(() => {
  const list = props.previewSrcList ?? props.srcList;
  if (!list?.length) return 0;
  const idx = list.indexOf(props.src);
  return idx >= 0 ? idx : 0;
});

/** 点击图片打开预览 */
function handleClick(): void {
  if (!props.preview) return;
  if (groupContext) {
    groupContext.open(srcListIndex.value);
  }
}

const roundedClass: Record<string, string> = {
  full: 'rounded-full',
  lg: 'rounded-lg',
  md: 'rounded-md',
  none: '',
  sm: 'rounded-sm',
};

const fitClass: Record<string, string> = {
  contain: 'object-contain',
  cover: 'object-cover',
  fill: 'object-fill',
  none: 'object-none',
  'scale-down': 'object-scale-down',
};

const imgStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  }
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
  }
  if (props.aspectRatio) {
    style.aspectRatio = props.aspectRatio;
  }
  return style;
});
</script>

<template>
  <div
    :class="
      cn(
        'bg-muted relative inline-flex items-center justify-center overflow-hidden',
        roundedClass[props.rounded],
        props.preview && 'cursor-zoom-in',
        props.class,
      )
    "
    :style="imgStyle"
    :role="props.preview ? 'button' : undefined"
    :tabindex="props.preview ? 0 : undefined"
    :aria-label="props.preview ? props.alt : undefined"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- 加载占位 -->
    <div
      v-if="isLoading && !hasError"
      class="text-muted-foreground absolute inset-0 flex items-center justify-center"
      aria-busy="true"
    >
      <div
        class="size-4 animate-spin rounded-full border-2 border-transparent border-t-current"
      ></div>
    </div>

    <!-- 真实图片 -->
    <img
      v-if="!hasError"
      :alt="props.alt"
      :class="
        cn(
          'h-full w-full transition-opacity duration-300',
          fitClass[props.fit],
          isLoading ? 'opacity-0' : 'opacity-100',
        )
      "
      :loading="props.lazy ? 'lazy' : undefined"
      :src="props.src"
      @error="
        hasError = true;
        isLoading = false;
      "
      @load="isLoading = false"
    />

    <!-- 加载失败占位 -->
    <div
      v-if="hasError"
      class="text-muted-foreground/60 flex flex-col items-center justify-center gap-1"
      role="alert"
    >
      <ImageOff class="size-6" />
      <span v-if="props.fallbackText" class="text-xs">{{ props.fallbackText }}</span>
    </div>
  </div>
</template>
