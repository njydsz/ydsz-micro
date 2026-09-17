<!--
 * 语义状态标签：在 Badge 之上封装业务语义状态。
 *
 * 设计目标：
 *  - 统一 ForgeLab forge-admin 状态标签配色：草稿(黄)、已发布(绿)、变更未发布(橙)等；
 *  - 同时显示文字与圆点指示器，确保色觉障碍用户也能区分状态（不依赖颜色唯一载体）；
 *  - 通过 label 替代硬编码中文，满足 i18n 规范。
 *
 * 使用场景：卡片右上角、表格状态列、详情页标题后缀等需要「状态+语义颜色」的位置。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\status-badge\YdStatusBadge.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed } from 'vue';

import { Badge } from '../../ui/badge';
import type { BadgeVariants } from '../../ui/badge';
import { cn } from '@ydsz-core/shared/utils';

defineOptions({
  name: 'YdStatusBadge',
});

type StatusVariant = 'draft' | 'published' | 'dirty' | 'offline' | 'archived' | 'pending' | 'running' | 'success' | 'failed';

interface Props {
  /** 自定义类名 */
  class?: string;
  /** 是否显示圆点指示器 */
  dot?: boolean;
  /** 标签文字，未传入时使用语义默认值 */
  label?: string;
  /** 语义状态，决定配色 */
  status: StatusVariant;
}

const props = withDefaults(defineProps<Props>(), {
  dot: true,
});

/** 状态 → Badge 变体映射 */
const variantMap: Record<StatusVariant, BadgeVariants['variant']> = {
  archived: 'secondary',
  dirty: 'warning',
  draft: 'outline',
  failed: 'destructive',
  offline: 'outline',
  pending: 'info',
  published: 'success',
  running: 'primary',
  success: 'success',
};

/** 默认标签文案（中文兜底，i18n 场景应通过 label prop 覆盖） */
const defaultLabelMap: Record<StatusVariant, string> = {
  archived: '已归档',
  dirty: '有变更',
  draft: '草稿',
  failed: '失败',
  offline: '已下线',
  pending: '待执行',
  published: '已发布',
  running: '运行中',
  success: '成功',
};

const displayLabel = computed<string>(() => props.label ?? defaultLabelMap[props.status]);
const badgeVariant = computed<BadgeVariants['variant']>(() => variantMap[props.status]);

/** 圆点颜色（与 badge 语义色同步） */
const dotColorMap: Record<NonNullable<BadgeVariants['variant']>, string> = {
  default: 'bg-neutral-400',
  destructive: 'bg-destructive',
  info: 'bg-blue-500',
  outline: 'bg-neutral-400',
  primary: 'bg-primary',
  secondary: 'bg-neutral-400',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
};

const dotColor = computed<string>(() => dotColorMap[badgeVariant.value ?? 'default']);
</script>

<template>
  <Badge
    :class="cn('gap-1.5', props.class)"
    :variant="badgeVariant"
  >
    <span
      v-if="dot"
      :class="cn('h-1.5 w-1.5 shrink-0 rounded-full', dotColor)"
      aria-hidden="true"
    />
    <span class="leading-none">{{ displayLabel }}</span>
  </Badge>
</template>
