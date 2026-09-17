<!--
 * 表体容器：语义分组 tbody，隔行剔除最后一行 border-b。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\YdTableBody.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

defineOptions({ name: 'YdTableBody' });

interface Props { class?: string; }
defineProps<Props>();
</script>

<template>
  <tbody :class="cn('[&_tr:last-child]:border-0', $props.class ?? '')">
    <slot />
  </tbody>
</template>
