/**
 * YdFloatLabel —— 浮动标签组件。
 *
 * 包裹输入框的 label，聚焦或有内容时浮到左上角。三种模式：
 * - 'on' : label 永远在左上角
 * - 'in' : label 在占位符位置，focus/有值时浮到左上角
 * - 'over': label 盖在输入框上（吞占位符），focus/有值时浮到左上角
 *
 * 通过 CSS :has(input:focus) 选择器实现，无需 JS 监听 focus/blur。
 * 消费方必须在 default 插槽内放置一个 input / textarea / select 元素。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\float-label\YdFloatLabel.vue
 * @author ydsz-team
 * @since 1.0.0
 */
<script setup lang="ts">
import { computed } from 'vue';

import type { YdFloatLabelProps } from './types';

defineOptions({ name: 'YdFloatLabel' });

const props = withDefaults(defineProps<YdFloatLabelProps>(), {
  variant: 'on',
  disabled: false,
});

const variantClass = computed(() => `yd-float-label--variant-${props.variant}`);
</script>

<template>
  <label
    class="yd-float-label"
    :class="[variantClass, { 'yd-float-label--disabled': disabled }]"
    :aria-disabled="disabled || undefined"
  >
    <div class="yd-float-label__input-wrap">
      <slot />

      <span class="yd-float-label__text">
        <slot name="label">
          Label
        </slot>
      </span>
    </div>
  </label>
</template>

<style scoped>
.yd-float-label {
  display: inline-flex;
  flex-direction: column;
  width: 100%;
  cursor: text;
}

.yd-float-label--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.yd-float-label__input-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
}

/* —— 全局 input 样式覆盖 —— */
.yd-float-label__input-wrap :deep(input),
.yd-float-label__input-wrap :deep(textarea),
.yd-float-label__input-wrap :deep(select) {
  width: 100%;
  padding: 1.25rem 0.75rem 0.5rem;
  font-size: var(--ydsz-font-size-base);
  color: hsl(var(--ydsz-text-primary));
  background: hsl(var(--ydsz-surface-1));
  border: 1px solid hsl(var(--ydsz-border-default));
  border-radius: var(--ydsz-radius-md);
  outline: none;
  transition: border-color 0.15s ease;
  box-sizing: border-box;
}

.yd-float-label__input-wrap :deep(input:focus),
.yd-float-label__input-wrap :deep(textarea:focus),
.yd-float-label__input-wrap :deep(select:focus) {
  border-color: hsl(var(--ydsz-comp-bg));
}

/* —— 浮动 label 文本 —— */
.yd-float-label__text {
  position: absolute;
  left: 0.75rem;
  font-size: var(--ydsz-font-size-base);
  color: hsl(var(--ydsz-text-tertiary));
  pointer-events: none;
  transition: transform 0.15s ease, font-size 0.15s ease, color 0.15s ease;
  background: hsl(var(--ydsz-surface-1));
  padding: 0 0.125rem;
  line-height: 1;
  white-space: nowrap;
}

/* —— variant='on' : label 永远在左上角 —— */
.yd-float-label--variant-on .yd-float-label__text {
  transform: translateY(0.4rem);
  font-size: var(--ydsz-font-size-xs);
}

/* —— variant='in' : label 在占位符位置，focus/有值时浮到左上角 —— */
.yd-float-label--variant-in .yd-float-label__text {
  transform: translateY(0.95rem);
  font-size: var(--ydsz-font-size-base);
}

.yd-float-label--variant-in:focus-within .yd-float-label__text {
  transform: translateY(0.4rem);
  font-size: var(--ydsz-font-size-xs);
  color: hsl(var(--ydsz-comp-bg));
}

.yd-float-label--variant-in .yd-float-label__input-wrap:has(input:not(:placeholder-shown)) .yd-float-label__text,
.yd-float-label--variant-in .yd-float-label__input-wrap:has(textarea:not(:placeholder-shown)) .yd-float-label__text {
  transform: translateY(0.4rem);
  font-size: var(--ydsz-font-size-xs);
}

/* —— variant='over' : label 盖在输入框上（充当占位符）—— */
.yd-float-label--variant-over .yd-float-label__text {
  transform: translateY(0.95rem);
  font-size: var(--ydsz-font-size-base);
  color: hsl(var(--ydsz-text-tertiary));
}

/* focus 时浮到左上角 */
.yd-float-label--variant-over:focus-within .yd-float-label__text {
  transform: translateY(0.4rem);
  font-size: var(--ydsz-font-size-xs);
  color: hsl(var(--ydsz-comp-bg));
}

/* 有值时浮到左上角（:has 选择器） */
.yd-float-label--variant-over:has(input:not([value=""])) .yd-float-label__text,
.yd-float-label--variant-over:has(input[value=""]:not([value])) .yd-float-label__text,
.yd-float-label--variant-over:has(textarea:not(:empty)) .yd-float-label__text {
  transform: translateY(0.4rem);
  font-size: var(--ydsz-font-size-xs);
}

/* over 模式下隐藏原生 placeholder（因为 label 已充当占位） */
.yd-float-label--variant-over .yd-float-label__input-wrap :deep(input)::placeholder,
.yd-float-label--variant-over .yd-float-label__input-wrap :deep(textarea)::placeholder {
  color: transparent;
}
</style>
