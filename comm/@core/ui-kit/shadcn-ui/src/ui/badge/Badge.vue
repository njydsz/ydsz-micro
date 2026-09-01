<!--
 * 状态标签：按语义 variant 取 cva 变体类名，用于标注状态、计数与分类。
 *
 * 刻意不提供 size 维度 —— 标签需要跟随所在文本的行高，
 * 一旦内置尺寸就在表格、卡片标题等不同语境里反复被覆盖，反而更麻烦。
 * 外部覆盖类名必须走 cn()：默认变体已带完整配色，直接拼字符串会被 tailwind-merge 判冲突而丢失其一。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\badge\Badge.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { BadgeVariants } from './badge';

import { cn } from '@YDSZ-core/shared/utils';

import { badgeVariants } from './badge';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<{
  class?: ClassValue;
  variant?: BadgeVariants['variant'];
}>();
</script>

<template>
  <div :class="cn(badgeVariants({ variant }), props.class)">
    <slot></slot>
  </div>
</template>
