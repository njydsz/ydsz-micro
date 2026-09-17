<!--
 * 表尾容器：可选分组，通常用于汇总行。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\table\TableFooter.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

defineOptions({ name: 'TableFooter' });

interface Props { class?: string; }
defineProps<Props>();
</script>

<template>
  <tfoot
    :class="cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', $props.class ?? '')"
  >
    <slot />
  </tfoot>
</template>
