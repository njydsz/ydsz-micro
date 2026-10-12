<script setup lang="ts">
/**
* 可选标签 —— 便利性封装（Convenience Wrapper）。
* 
 * 在 YdTag 基础上叠加可选中（checked）态，对齐 Element Plus ElTag checkable 场景
 * —— 如标签云、筛选标签、状态多选等。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\tag\YdTagCheckable.vue
 * @author ydsz-team
 * @since 1.0.0
 */
/**
 * 可选标签便利性封装。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import type { HTMLAttributes } from 'vue';

import YdTag from './YdTag.vue';

const props = withDefaults(defineProps<{
  /** 是否选中 */
  checked?: boolean;
  /** 标签变体样式 */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  /** 自定义 class */
  class?: HTMLAttributes['class'];
}>(), {
  checked: false,
  variant: 'default',
});

const emit = defineEmits<{
  (e: 'update:checked', value: boolean): void;
  (e: 'change', value: boolean): void;
}>();

function toggle(): void {
  const next = !props.checked;
  emit('update:checked', next);
  emit('change', next);
}
</script>

<template>
  <!--
    可选标签 —— 支持 v-model:checked 双向绑定。

    用法：
    ```html
    <YdTagCheckable
      v-for="tag in tags"
      :key="tag.name"
      v-model:checked="tag.selected"
      :variant="tag.selected ? 'primary' : 'default'"
    >
      {{ tag.label }}
    </YdTagCheckable>
    ```
  -->
  <YdTag
    :variant="variant"
    role="button"
    :aria-pressed="checked"
    tabindex="0"
    :class="[
      'cursor-pointer transition-colors select-none',
      checked ? '' : 'opacity-60 hover:opacity-100',
      props.class,
    ]"
    @click="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle"
  >
    <slot />
  </YdTag>
</template>
