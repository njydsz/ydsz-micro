<!--
 * YdDashboard — BI 看板的完整布局。
 *
 * <p>以 CSS Grid 布局渲染仪表盘卡片，支持编辑模式和预览模式。
 * 编辑模式下可添加/删除/拖拽排序卡片；预览模式下仅展示。
 *
 * @path comm\@core\ui-kit\dashboard\src\components\YdDashboard.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed } from 'vue';

import type { DashboardCard, DashboardConfig } from '../types';

import { createDefaultConfig } from '../types';
import { YdChartCard } from './YdChartCard.vue';
import { YdDashboardEditOverlay } from './YdDashboardEditOverlay.vue';
import { YdStatCard } from './YdStatCard.vue';

const props = withDefaults(defineProps<{
  config?: DashboardConfig;
}>(), {
  config: () => createDefaultConfig('新仪表盘'),
});

const emit = defineEmits<{
  'config-change': [config: DashboardConfig];
  'card-click': [card: DashboardCard];
}>();

/** 栅格列数样式类 */
const gridClass = computed<string>(() => {
  const map: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  };
  return map[props.config.columns] ?? 'grid-cols-4';
});

/**
 * 栅格列 span 映射。
 */
function spanClass(span: number): string {
  const map: Record<number, string> = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    6: 'col-span-6',
    12: 'col-span-12',
  };
  return map[span] ?? `col-span-${Math.min(span, 12)}`;
}

/**
 * 删除卡片。
 */
function handleRemoveCard(id: string): void {
  const items = props.config.cards.filter((c) => c.id !== id);
  emit('config-change', { ...props.config, cards: items });
}
</script>

<template>
  <div class="ds-dashboard flex flex-col gap-3">
    <!-- 仪表盘标题 -->
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold">{{ config.title }}</h2>
      <div v-if="config.isEditable" class="text-xs text-muted-foreground">
        {{ config.cards.length }} 张卡片
      </div>
    </div>

    <!-- 卡片栅格 -->
    <div :class="['grid gap-3', gridClass]">
      <div
        v-for="card in config.cards"
        :key="card.id"
        :class="['relative', spanClass(card.span)]"
      >
        <YdStatCard
          v-if="card.type === 'simple-stat' || card.type === 'chart-stat'"
          :card="card"
          @click="emit('card-click', card)"
        />
        <YdChartCard
          v-else-if="card.type.startsWith('chart-')"
          :card="card as import('../types').ChartCard"
          @click="emit('card-click', card)"
        />
        <YdDashboardEditOverlay
          v-if="config.isEditable"
          :card-id="card.id"
          @remove="handleRemoveCard"
        />
      </div>
    </div>

    <!-- 空状态提示 -->
    <div
      v-if="config.cards.length === 0"
      class="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
    >
      <span v-if="config.isEditable">点击「添加卡片」开始构建仪表盘</span>
      <span v-else>暂无卡片数据</span>
    </div>
  </div>
</template>
