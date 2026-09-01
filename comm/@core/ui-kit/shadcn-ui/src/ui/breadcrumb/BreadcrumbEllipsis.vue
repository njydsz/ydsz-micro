<!--
 * 面包屑的折叠占位：层级过深时代表被省略的中间层。
 *
 * 整体标记 aria-hidden 与 role=presentation，因为省略号本身不携带信息；
 * 同时用 sr-only 文本补一个「More」供读屏播报，避免路径在听觉上突然断掉。
 * 默认图标为 MoreHorizontal，可用默认插槽替换（例如改成「…共 5 级」）。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\breadcrumb\BreadcrumbEllipsis.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { cn } from '@YDSZ-core/shared/utils';

import { MoreHorizontal } from 'lucide-vue-next';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<{
  class?: ClassValue;
}>();
</script>

<template>
  <span
    :class="cn('flex h-9 w-9 items-center justify-center', props.class)"
    aria-hidden="true"
    role="presentation"
  >
    <slot>
      <MoreHorizontal class="h-4 w-4" />
    </slot>
    <span class="sr-only">More</span>
  </span>
</template>
