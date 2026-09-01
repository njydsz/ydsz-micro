<!--
 * 面包屑的层级列表：渲染为 ol 而非 ul，因为面包屑的先后顺序代表层级由浅到深。
 *
 * 允许换行（flex-wrap + break-words）是必要的 ——
 * 深层级路径在窄屏下会横向溢出，截断比换行更容易让用户丢失当前位置。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\breadcrumb\BreadcrumbList.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { cn } from '@YDSZ-core/shared/utils';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<{
  class?: ClassValue;
}>();
</script>

<template>
  <ol
    :class="
      cn(
        'text-muted-foreground flex flex-wrap items-center gap-1.5 break-words text-sm sm:gap-2.5',
        props.class,
      )
    "
  >
    <slot></slot>
  </ol>
</template>
