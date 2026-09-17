<!--
 * Tag 标签：用于标记和分类的小型语义色块。
 *
 * 提供 6 档语义色（default / primary / successful / warning / destructive / info）
 * 与 3 档尺寸（sm / md / lg），通过 CVA 变体产出样式类，class 透传用于覆盖。
 *
 * 关闭标签场景（closable）通过 named slot #close 提供关闭图标位置，
 * 父组件监听 click 事件自行决定是否销毁 —— Tag 本身不管理可见状态，
 * 保持为纯受控 / 纯展示组件。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\tag\YdTag.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { type TagVariants, tagVariants } from './tag';

import { cn } from '@ydsz-core/shared/utils';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 是否可关闭（仅显示关闭图标，状态由父组件管理） */
  closable?: boolean;
  /** 尺寸 */
  size?: TagVariants['size'];
  /** 语义变体 */
  variant?: TagVariants['variant'];
}

const props = withDefaults(defineProps<Props>(), {
  closable: false,
  size: 'md',
  variant: 'default',
});

const emit = defineEmits<{
  close: [];
}>();

function handleClose(event: MouseEvent): void {
  event.stopPropagation();
  emit('close');
}
</script>

<template>
  <span :class="cn(tagVariants({ variant, size }), props.class)">
    <slot name="icon"></slot>
    <slot></slot>
    <button
      v-if="props.closable"
      :aria-label="'关闭标签'"
      type="button"
      class="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-black/10 dark:hover:bg-white/20"
      @click="handleClose"
    >
      <svg
        aria-hidden="true"
        class="size-3"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <line x1="18" x2="6" y1="6" y2="18"></line>
        <line x1="6" x2="18" y1="6" y2="18"></line>
      </svg>
    </button>
    <slot name="close"></slot>
  </span>
</template>
