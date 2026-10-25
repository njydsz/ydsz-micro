/**
 * YdFieldset —— 字段集组件，原生 fieldset 封装。
 *
 * 提供带 legend 标题的可折叠/可禁用字段集，语义化 fieldset 元素。
 *
 * WAI-ARIA: 使用原生 fieldset + legend 元素，无障碍语义完整。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\fieldset\YdFieldset.vue
 * @author ydsz-team
 * @since 1.0.0
 */
<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { YdFieldsetEmits, YdFieldsetProps } from './types';

defineOptions({ name: 'YdFieldset' });

const props = withDefaults(defineProps<YdFieldsetProps>(), {
  legend: undefined,
  toggleable: false,
  collapsed: false,
  disabled: false,
  togglePosition: 'start',
});

const emit = defineEmits<YdFieldsetEmits>();

const isExpanded = ref(!props.collapsed);

watch(() => props.collapsed, (val) => {
  isExpanded.value = !val;
});

const isCollapsed = computed(() => props.toggleable && !isExpanded.value);

function toggle() {
  if (!props.toggleable) return;
  isExpanded.value = !isExpanded.value;
  emit('toggle', isExpanded.value);
}
</script>

<template>
  <fieldset
    class="yd-fieldset"
    :class="{
      'yd-fieldset--collapsed': isCollapsed,
      'yd-fieldset--disabled': disabled,
      'yd-fieldset--toggleable': toggleable,
    }"
    :disabled="disabled"
    :aria-disabled="disabled || undefined"
  >
    <legend class="yd-fieldset__legend">
      <button
        v-if="toggleable && togglePosition === 'start'"
        type="button"
        class="yd-fieldset__toggle-btn ydsz-focus-visible"
        :aria-expanded="isExpanded"
        aria-label="Toggle fieldset"
        @click="toggle"
      >
        <svg
          class="yd-fieldset__arrow"
          :class="{ 'yd-fieldset__arrow--expanded': isExpanded }"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <slot name="legend">
        <span
          v-if="legend"
          class="yd-fieldset__legend-text"
        >
          {{ legend }}
        </span>
      </slot>

      <button
        v-if="toggleable && togglePosition === 'end'"
        type="button"
        class="yd-fieldset__toggle-btn ydsz-focus-visible"
        :aria-expanded="isExpanded"
        aria-label="Toggle fieldset"
        @click="toggle"
      >
        <svg
          class="yd-fieldset__arrow"
          :class="{ 'yd-fieldset__arrow--expanded': isExpanded }"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </legend>

    <div
      v-show="isExpanded"
      class="yd-fieldset__content"
      role="group"
    >
      <slot />
    </div>
  </fieldset>
</template>

<style scoped>
.yd-fieldset {
  border: 1px solid hsl(var(--ydsz-border-default));
  border-radius: var(--ydsz-radius-lg);
  padding: var(--ydsz-spacing-md);
  margin: 0 0.5rem 0;
  background: hsl(var(--ydsz-surface-1));
  min-width: 0;
  transition: opacity 0.2s ease;
}

.yd-fieldset--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.yd-fieldset__legend {
  display: flex;
  align-items: center;
  gap: var(--ydsz-spacing-xs);
  padding: 0 var(--ydsz-spacing-xs);
  margin-left: calc(-1 * var(--ydsz-spacing-md));
  font-size: var(--ydsz-font-size-sm);
  line-height: 1.4;
  float: left;
}

.yd-fieldset__legend-text {
  font-weight: 600;
  color: hsl(var(--ydsz-text-primary));
}

.yd-fieldset__toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  border: none;
  background: transparent;
  color: hsl(var(--ydsz-text-secondary));
  cursor: pointer;
  border-radius: var(--ydsz-radius-sm);
  transition: color 0.15s ease;
}

.yd-fieldset__toggle-btn:hover {
  color: hsl(var(--ydsz-text-primary));
  background: hsl(var(--ydsz-surface-2));
}

.yd-fieldset__arrow {
  transform: rotate(0deg);
  transition: transform 0.2s ease;
}

.yd-fieldset__arrow--expanded {
  transform: rotate(0deg);
}

.yd-fieldset__arrow:not(.yd-fieldset__arrow--expanded) {
  transform: rotate(-90deg);
}

.yd-fieldset__content {
  clear: both;
  padding-top: var(--ydsz-spacing-sm);
}

/* Focus visible ring */
.ydsz-focus-visible:focus-visible {
  outline: 2px solid hsl(var(--ydsz-comp-bg));
  outline-offset: 1px;
}
</style>
