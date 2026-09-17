<!--
 * 表格无障碍 caption 元素。
 *
 * 屏幕阅读器会将 caption 作为表格标题朗读；视觉上可作为表头上方说明。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\table\YdTableCaption.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

defineOptions({ name: 'YdTableCaption' });

interface Props { class?: string; }
defineProps<Props>();
</script>

<template>
  <caption
    :class="cn('mt-4 text-sm text-muted-foreground', $props.class ?? '')"
  >
    <slot />
  </caption>
</template>
