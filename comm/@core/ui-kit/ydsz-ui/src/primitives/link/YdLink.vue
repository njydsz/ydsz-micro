<!--
 * Link 链接：带下划线与 hover 状态的可点击文本。
 *
 * 之所以不直接用 <a> 是为了统一下划线/颜色/禁用态的交互语义：
 * - href 有值时渲染 <a>，支持 cmd+click 新标签等原生习惯
 * - 无 href 时渲染 <button>（由 disabled 状态决定）
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\link\YdLink.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 是否禁用 */
  disabled?: boolean;
  /** 跳转 href */
  href?: string;
  /** 是否显示下划线 */
  underline?: boolean;
  /** 链接目标 */
  target?: '_blank' | '_self' | '_parent' | '_top';
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  underline: 'hover',
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

function handleClick(event: MouseEvent): void {
  if (props.disabled) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  emit('click', event);
}
</script>

<template>
  <a
    v-if="props.href && !props.disabled"
    :class="
      cn(
        'inline-flex items-center gap-0.5 text-brand-500 transition-colors dark:text-brand-400',
        props.underline === true ? 'underline' : props.underline === 'hover' ? 'hover:underline' : '',
        'hover:text-brand-600 dark:hover:text-brand-300',
        props.class,
      )
    "
    :href="props.href"
    :target="props.target"
    rel="noopener noreferrer"
    @click="handleClick"
  >
    <slot></slot>
  </a>
  <button
    v-else
    :aria-disabled="props.disabled"
    :class="
      cn(
        'inline-flex items-center gap-0.5 text-brand-500 transition-colors dark:text-brand-400',
        props.underline === true ? 'underline' : props.underline === 'hover' ? 'hover:underline' : '',
        !props.disabled && 'hover:text-brand-600 dark:hover:text-brand-300',
        props.disabled && 'cursor-not-allowed opacity-50',
        props.class,
      )
    "
    :disabled="props.disabled"
    type="button"
    @click="handleClick"
  >
    <slot></slot>
  </button>
</template>
