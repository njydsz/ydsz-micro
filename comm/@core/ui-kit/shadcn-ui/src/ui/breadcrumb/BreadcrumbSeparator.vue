<!--
 * 面包屑的分隔符：渲染为 li 并标记 aria-hidden，默认图标为 ChevronRight。
 *
 * 对辅助技术隐藏是因为分隔符纯属视觉装饰，若参与播报，
 * 读屏会在每一级之间插入无意义的内容，让路径变得难以听懂。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\breadcrumb\BreadcrumbSeparator.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { cn } from '@YDSZ-core/shared/utils';

import { ChevronRight } from 'lucide-vue-next';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<{
  class?: ClassValue;
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
