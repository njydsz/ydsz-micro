<!--
 * BreadcrumbSeparator Vue 组件
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\breadcrumb\BreadcrumbSeparator.vue
 * @author remi-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { cn } from '@remi-core/shared/utils';

import { ChevronRight } from 'lucide-vue-next';

const props = defineProps<{
  class?: any;
}>();
</script>

<template>
  <li
    :class="cn('[&>svg]:size-3.5', props.class)"
    aria-hidden="true"
    role="presentation"
  >
    <slot>
      <ChevronRight />
    </slot>
  </li>
</template>
