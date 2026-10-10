<!--
 * Card（card）组件：基于 design-tokens 语义化变量的卡片容器基元。
 *
 * <p>通过 CSS 变量引用 `variables.css` 中定义的 token，
 * 支持 `data-theme="dark"` 自动切换。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\card\card.vue
 * @author ydsz-team
 * @since 26.09.24
 -->
<script setup lang="ts">
import { computed } from 'vue';

import type { CardEmits, CardProps } from './card-types';

defineOptions({ name: 'YdCard' });

const props = withDefaults(defineProps<CardProps>(), {
  disabled: false,
  open: false,
  padding: 'md',
  shadow: 'low',
});

const emit = defineEmits<CardEmits>();

/** 派生 class */
const cardClass = computed(() => [
  'yd-card',
  `yd-card--padding-${props.padding}`,
  `yd-card--shadow-${props.shadow}`,
  { 'yd-card--disabled': props.disabled },
]);

function handleConfirm() {
  emit('confirm');
  emit('update:open', false);
}

function handleCancel() {
  emit('cancel');
  emit('update:open', false);
}
</script>

<template>
  <section :class="cardClass">
    <header
      v-if="$slots.header"
      class="yd-card__header"
    >
      <slot name="header" />
    </header>
    <div class="yd-card__body">
      <slot />
    </div>
    <footer
      v-if="$slots.footer"
      class="yd-card__footer"
    >
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
/* ==================== 容器 ==================== */
.yd-card {
  display: flex;
  flex-direction: column;

  background-color: hsl(var(--ydsz-surface-1));
  border: 1px solid hsl(var(--ydsz-border-subtle));
  border-radius: var(--ydsz-radius-lg);

  transition:
    box-shadow var(--ydsz-motion-duration-normal) var(--ydsz-motion-easing-standard),
    border-color var(--ydsz-motion-duration-normal) var(--ydsz-motion-easing-standard);
}

/* ==================== 阴影 ==================== */
.yd-card--shadow-flat {
  box-shadow: var(--ydsz-shadow-flat);
}

.yd-card--shadow-low {
  box-shadow: var(--ydsz-shadow-low);
}

.yd-card--shadow-medium {
  box-shadow: var(--ydsz-shadow-medium);
}

.yd-card--shadow-high {
  box-shadow: var(--ydsz-shadow-high);
}

/* ==================== 内边距 ==================== */
.yd-card--padding-sm .yd-card__body,
.yd-card--padding-sm .yd-card__header,
.yd-card--padding-sm .yd-card__footer {
  padding: var(--ydsz-spacing-sm);
}

.yd-card--padding-md .yd-card__body,
.yd-card--padding-md .yd-card__header,
.yd-card--padding-md .yd-card__footer {
  padding: var(--ydsz-spacing-md);
}

.yd-card--padding-lg .yd-card__body,
.yd-card--padding-lg .yd-card__header,
.yd-card--padding-lg .yd-card__footer {
  padding: var(--ydsz-spacing-lg);
}

/* ==================== Header / Footer ==================== */
.yd-card__header {
  border-bottom: 1px solid hsl(var(--ydsz-border-subtle));
  font-size: var(--ydsz-font-size-base);
  font-weight: var(--ydsz-font-weight-semibold);
  color: hsl(var(--ydsz-text-primary));
}

.yd-card__footer {
  border-top: 1px solid hsl(var(--ydsz-border-subtle));
  font-size: var(--ydsz-font-size-sm);
  color: hsl(var(--ydsz-text-secondary));
}

/* ==================== Body ==================== */
.yd-card__body {
  flex: 1;
  font-size: var(--ydsz-font-size-sm);
  color: hsl(var(--ydsz-text-secondary));
  line-height: var(--ydsz-line-height-relaxed);
}

/* ==================== 禁用态 ==================== */
.yd-card--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
