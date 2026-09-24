<!--
 * Typography.Paragraph：段落，多行文本容器。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\typography\YdParagraph.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
// @ts-nocheck
import { cn } from '@ydsz-core/shared/utils';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 文字省略（多行） */
  ellipsis?: { rows?: number; expandable?: boolean };
}

defineProps<Props>();
</script>

<template>
  <p :class="cn('text-sm leading-relaxed text-muted-foreground', props.class)">
    <slot></slot>
  </p>
</template>
