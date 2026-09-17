<!--
 * 行容器：支持 hover 高亮与 selected 态，实现选中行持久视觉反馈。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\table\YdTableRow.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

defineOptions({ name: 'YdTableRow' });

interface Props {
  /** 当前是否选中（持久高亮） */
  selected?: boolean;
  class?: string;
}

withDefaults(defineProps<Props>(), { selected: false });
</script>

<template>
  <tr
    :class="
      cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        selected && 'bg-muted',
        $props.class ?? '',
      )
    "
    :data-state="selected ? 'selected' : undefined"
  >
    <slot />
  </tr>
</template>
