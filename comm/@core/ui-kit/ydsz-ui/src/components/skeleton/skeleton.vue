<script setup lang="ts">
/**
* Skeleton（骨架屏）组件：在内容加载前展示占位图形。
* 
 * <p>支持的变体形态：
 * <ul>
 *   <li><b>text</b>：单行文本占位符。</li>
 *   <li><b>avatar</b>：头像占位（圆形/方形）。</li>
 *   <li><b>title</b>：标题占位符。</li>
 *   <li><b>paragraph</b>：段落占位（多行）。</li>
 *   <li><b>button</b>：按钮占位符。</li>
 *   <li><b>image</b>：图片占位符。</li>
 * </ul>
* 
 * <p>开启 <code>animated</code> 后通过 CSS 渐变 + keyframes 实现从左到右的 shimmer 反光扫过效果。
* 
 * @author ydsz-ai
 * @since 1.0.0
 */
import { computed } from 'vue';

import type { SkeletonProps } from './skeleton-types';
import type { SkeletonSize, SkeletonVariant } from './skeleton-types';

defineOptions({ name: 'YdSkeleton' });

const props = withDefaults(defineProps<SkeletonProps>(), {
  animated: true,
  class: undefined,
  circle: false,
  height: undefined,
  repeat: 3,
  round: false,
  size: 'medium',
  style: () => ({}),
  variant: 'text',
  width: undefined,
});

/** 尺寸预设到高度的映射（像素）。 */
const sizeHeightMap: Record<SkeletonSize, number> = {
  small: 14,
  medium: 18,
  large: 24,
};

/** 尺寸预设到头像宽高的映射（像素）。 */
const sizeAvatarMap: Record<SkeletonSize, number> = {
  small: 28,
  medium: 36,
  large: 48,
};

/** 尺寸预设到标题高度的映射（像素）。 */
const sizeTitleHeightMap: Record<SkeletonSize, number> = {
  small: 16,
  medium: 20,
  large: 26,
};

/** 尺寸预设到按钮高度的映射（像素）。 */
const sizeButtonHeightMap: Record<SkeletonSize, number> = {
  small: 24,
  medium: 32,
  large: 40,
};

/** 尺寸预设到图片高度的映射（像素）。 */
const sizeImageHeightMap: Record<SkeletonSize, number> = {
  small: 64,
  medium: 96,
  large: 128,
};

/**
 * 判断是否为 paragraph 变体。
 *
 * @returns 是否为 paragraph 变体。
 */
function isParagraph(): boolean {
  return props.variant === 'paragraph';
}

/**
 * 获取基础骨架条目的 CSS 类名。
 *
 * @param variant - 变体类型。
 * @returns 对应的 CSS 类名数组。
 */
function getBaseClass(variant: SkeletonVariant): string[] {
  const classes = [`yd-skeleton__${variant}`];
  if (props.animated) {
    classes.push('yd-skeleton--animated');
  }
  if (props.round && (variant === 'text' || variant === 'title')) {
    classes.push('yd-skeleton--round');
  }
  if (props.circle && variant === 'avatar') {
    classes.push('yd-skeleton--circle');
  }
  if (props.class) {
    classes.push(props.class);
  }
  return classes;
}

/**
 * 将宽度或高度值转换为 CSS 字符串。
 *
 * @param value - 数值或 CSS 字符串。
 * @returns CSS 字符串；数值会追加 `px` 后缀。
 */
function toCssSize(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

/**
 * 根据变体类型和尺寸预设计算默认高度。
 *
 * @param variant - 变体类型。
 * @param sizePreset - 尺寸预设。
 * @returns 高度 CSS 字符串或 undefined。
 */
function getDefaultHeight(
  variant: SkeletonVariant,
  sizePreset: SkeletonSize,
): string | undefined {
  if (variant === 'avatar') return `${sizeAvatarMap[sizePreset]}px`;
  if (variant === 'title') return `${sizeTitleHeightMap[sizePreset]}px`;
  if (variant === 'button') return `${sizeButtonHeightMap[sizePreset]}px`;
  if (variant === 'image') return `${sizeImageHeightMap[sizePreset]}px`;
  // text 和 paragraph 行
  return `${sizeHeightMap[sizePreset]}px`;
}

/**
 * 根据变体类型和尺寸预设计算默认宽度。
 *
 * @param variant - 变体类型。
 * @param sizePreset - 尺寸预设。
 * @returns 宽度 CSS 字符串或 undefined。
 */
function getDefaultWidth(
  variant: SkeletonVariant,
  sizePreset: SkeletonSize,
): string | undefined {
  if (variant === 'avatar') return `${sizeAvatarMap[sizePreset]}px`;
  if (variant === 'button') {
    const widths: Record<SkeletonSize, string> = {
      small: '48px',
      medium: '64px',
      large: '80px',
    };
    return widths[sizePreset];
  }
  if (variant === 'title') return '40%';
  return undefined;
}

/** 合并后的行内样式（尺寸预设 + 自定义 width/height + 自定义 style）。 */
const mergedStyle = computed<Record<string, string>>(() => {
  const base: Record<string, string> = {};

  // 应用 size 预设值作为默认值
  const defaultH = getDefaultHeight(props.variant, props.size);
  const defaultW = getDefaultWidth(props.variant, props.size);
  if (defaultH !== undefined) base.height = defaultH;
  if (defaultW !== undefined) base.width = defaultW;

  // width/height 显式传入时覆盖预设
  const w = toCssSize(props.width);
  const h = toCssSize(props.height);
  if (w !== undefined) base.width = w;
  if (h !== undefined) base.height = h;

  return { ...base, ...props.style };
});

/** avatar 的 CSS 类名。 */
const avatarClass = computed<string[]>(() => getBaseClass('avatar'));

/** paragraph 每行的宽度百分比：最后一行缩减为 60%。 */
const paragraphLineWidths = computed<string[]>(() => {
  const total = props.repeat;
  return Array.from({ length: total }, (_, i) =>
    i === total - 1 ? '60%' : '100%',
  );
});

/** paragraph 每行的高度（基于 size 预设）。 */
const paragraphRowHeight = computed<string>(
  () => `${sizeHeightMap[props.size]}px`,
);
</script>

<template>
  <div
    role="status"
    aria-busy="true"
    aria-label="加载中"
    class="yd-skeleton"
  >
    <!-- avatar 占位 -->
    <div
      v-if="variant === 'avatar'"
      :class="avatarClass"
      :style="mergedStyle"
    />

    <!-- title 占位 -->
    <div
      v-else-if="variant === 'title'"
      :class="getBaseClass('title')"
      :style="mergedStyle"
    />

    <!-- button 占位 -->
    <div
      v-else-if="variant === 'button'"
      :class="getBaseClass('button')"
      :style="mergedStyle"
    />

    <!-- image 占位 -->
    <div
      v-else-if="variant === 'image'"
      :class="getBaseClass('image')"
      :style="mergedStyle"
    />

    <!-- paragraph 占位（多行） -->
    <div
      v-else-if="isParagraph()"
      class="yd-skeleton__paragraph-wrapper"
      :style="mergedStyle"
    >
      <div
        v-for="(_, idx) in repeat"
        :key="idx"
        :class="[
          'yd-skeleton__paragraph-row',
          { 'yd-skeleton--animated': animated },
          { 'yd-skeleton--round': round },
        ]"
        :style="{ width: paragraphLineWidths[idx], height: paragraphRowHeight }"
      />
    </div>

    <!-- text 占位（默认） -->
    <div
      v-else
      :class="getBaseClass('text')"
      :style="mergedStyle"
    />
  </div>
</template>

<style scoped>
/* ============================================================
 * CSS 变量定义（亮色模式 / 暗色模式）
 * ============================================================ */
.yd-skeleton {
  --yd-skeleton-color: rgba(0, 0, 0, 0.08);
  --yd-skeleton-color-alt: rgba(0, 0, 0, 0.04);
  --yd-skeleton-shimmer-from: rgba(255, 255, 255, 0);
  --yd-skeleton-shimmer-via: rgba(255, 255, 255, 0.4);
  --yd-skeleton-shimmer-to: rgba(255, 255, 255, 0);

  display: inline-flex;
  flex-direction: column;
  width: 100%;
}

/* 暗色模式覆盖 */
:deep(.dark) .yd-skeleton,
.dark .yd-skeleton {
  --yd-skeleton-color: rgba(255, 255, 255, 0.1);
  --yd-skeleton-color-alt: rgba(255, 255, 255, 0.06);
  --yd-skeleton-shimmer-via: rgba(255, 255, 255, 0.15);
}

/* ============================================================
 * 基础骨架样式
 * ============================================================ */
.yd-skeleton__text,
.yd-skeleton__title,
.yd-skeleton__button,
.yd-skeleton__avatar,
.yd-skeleton__image,
.yd-skeleton__paragraph-row {
  position: relative;
  overflow: hidden;
  background-color: var(--yd-skeleton-color);
}

/* ============================================================
 * text 变体
 * ============================================================ */
.yd-skeleton__text {
  width: 100%;
  border-radius: 2px;
}

.yd-skeleton__text.yd-skeleton--round {
  border-radius: 999px;
}

/* ============================================================
 * avatar 变体
 * ============================================================ */
.yd-skeleton__avatar {
  border-radius: 4px;
}

.yd-skeleton__avatar.yd-skeleton--circle {
  border-radius: 50%;
}

/* ============================================================
 * title 变体
 * ============================================================ */
.yd-skeleton__title {
  border-radius: 2px;
}

.yd-skeleton__title.yd-skeleton--round {
  border-radius: 999px;
}

/* ============================================================
 * button 变体
 * ============================================================ */
.yd-skeleton__button {
  border-radius: 6px;
}

/* ============================================================
 * image 变体
 * ============================================================ */
.yd-skeleton__image {
  width: 100%;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ============================================================
 * paragraph 变体
 * ============================================================ */
.yd-skeleton__paragraph-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.yd-skeleton__paragraph-row {
  width: 100%;
  border-radius: 2px;
}

.yd-skeleton__paragraph-row.yd-skeleton--round {
  border-radius: 999px;
}

/* ============================================================
 * Shimmer 动画
 * ============================================================ */
@keyframes yd-skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.yd-skeleton--animated {
  background: linear-gradient(
    90deg,
    var(--yd-skeleton-color) 25%,
    var(--yd-skeleton-shimmer-via) 37%,
    var(--yd-skeleton-color) 63%
  );
  background-size: 200% 100%;
  animation: yd-skeleton-shimmer 1.4s ease infinite;
}

.yd-skeleton__image.yd-skeleton--animated {
  animation-duration: 2s;
}
</style>
