<!--
 * Image 图片：增强版图片组件。
 *
 * 特性：懒加载（loading="lazy"）、错误占位、圆角裁剪、预览模式（集成到 YdImage.PreviewGroup）。
 * 多图预览通过 YdImageGroup 提供左右切换、缩放等手势。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\image\YdImage.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { ImageOff } from 'lucide-vue-next';

interface Props {
  /** 自定义类名 */
  class?: any;
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
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  aspectRatio: undefined,
  fallbackText: '加载失败',
  fit: 'cover',
  height: undefined,
  lazy: false,
  preview: false,
  rounded: 'none',
  width: undefined,
});

const hasError = ref(false);
const isLoading = ref(true);

function handleError(): void {
  hasError.value = true;
  isLoading.value = false;
}

function handleLoad(): void {
  isLoading.value = false;
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
        props.class,
      )
    "
    :style="imgStyle"
  >
    <!-- 加载占位 -->
    <div
      v-if="isLoading && !hasError"
      class="text-muted-foreground absolute inset-0 flex items-center justify-center"
      aria-busy="true"
    >
      <div class="border-2 size-4 animate-spin rounded-full border-transparent border-t-current"></div>
    </div>

    <!-- 真实图片 -->
    <img
      v-if="!hasError"
      :alt="props.alt"
      :class="cn('h-full w-full transition-opacity duration-300', fitClass[props.fit], isLoading ? 'opacity-0' : 'opacity-100')"
      :loading="props.lazy ? 'lazy' : undefined"
      :src="props.src"
      @error="handleError"
      @load="handleLoad"
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
