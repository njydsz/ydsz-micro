<!--
 * Typography.Text：文本 / 代码 / 标记 / 复制等原子组件。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\typography\YdText.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
import { getCurrentInstance } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 是否加粗 */
  bold?: boolean;
  /** 代码高亮 */
  code?: boolean;
  /** 文本可复制 */
  copyable?: boolean;
  /** 删除线 */
  delete?: boolean;
  /** 文字省略 */
  ellipsis?: boolean;
  /** 斜体 */
  italic?: boolean;
  /** 标记高亮 */
  mark?: boolean;
  /** 下划线 */
  underline?: boolean;
  /** 语义类型 */
  type?: 'danger' | 'secondary' | 'success' | 'warning';
}

const props = withDefaults(defineProps<Props>(), {
  bold: false,
  code: false,
  copyable: false,
  delete: false,
  ellipsis: false,
  italic: false,
  mark: false,
  underline: false,
  type: undefined,
});

const emit = defineEmits<{
  copy: [text: string];
}>();

const typeClass: Record<string, string> = {
  danger: 'text-red-600 dark:text-red-400',
  secondary: 'text-muted-foreground',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
};

function handleCopy(): void {
  const el = getCurrentInstance()?.proxy?.$el as HTMLElement | undefined;
  const text = el?.textContent ?? '';
  if (text) {
    navigator.clipboard.writeText(text).then(() => emit('copy', text));
  }
}
</script>

<template>
  <span
    :class="
      cn(
        'inline',
        props.type ? typeClass[props.type] : 'text-foreground',
        props.bold && 'font-semibold',
        props.code && 'rounded bg-muted px-1 py-0.5 font-mono text-sm',
        props.delete && 'line-through',
        props.ellipsis && 'block max-w-full overflow-hidden text-ellipsis whitespace-nowrap',
        props.italic && 'italic',
        props.mark && 'rounded bg-yellow-100 px-0.5 dark:bg-yellow-900/40',
        props.underline && 'underline',
        props.class,
      )
    "
  >
    <slot></slot>
    <button
      v-if="props.copyable"
      :aria-label="'复制文本'"
      class="text-muted-foreground hover:text-foreground ml-1 inline align-baseline text-xs"
      type="button"
      @click="handleCopy"
    >
      <svg aria-hidden="true" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <rect height="13" rx="2" ry="2" width="13" x="9" y="9" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
  </span>
</template>
