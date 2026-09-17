<!--
 * 表头容器：语义分组 thead，提供 bg-muted/50 背景。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\table\TableHeader.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

defineOptions({ name: 'TableHeader' });

interface Props { class?: string; }
defineProps<Props>();
</script>

<template>
  <thead :class="cn('[&_tr]:border-b', $props.class ?? '')">
    <slot />
  </thead>
</template>
