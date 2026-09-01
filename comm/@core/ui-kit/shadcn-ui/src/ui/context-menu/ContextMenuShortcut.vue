<!--
 * 右键菜单快捷键提示：右对齐展示组合键文案。
 *
 * 只做展示，不绑定键盘事件 —— 实际快捷键需由调用方自行注册，
 * 否则会出现「显示了快捷键但按下去没反应」。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\context-menu\ContextMenuShortcut.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@YDSZ-core/shared/utils';

const props = defineProps<{
  class?: any;
}>();
</script>

<template>
  <span
    :class="
      cn('text-muted-foreground ml-auto text-xs tracking-widest', props.class)
    "
  >
    <slot></slot>
  </span>
</template>
