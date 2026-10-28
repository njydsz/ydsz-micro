<script lang="ts" setup>
/**
* YdDashboard — BI 看板的完整布局。
* 
 * <p>以 CSS Grid 布局渲染仪表盘卡片，支持编辑模式和预览模式。
 * 编辑模式下可添加/删除/拖拽排序卡片；预览模式下仅展示。
* 
 * @path comm\@core\ui-kit\dashboard\src\components\YdDashboard.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed } from 'vue';

import type { DashboardCard, DashboardConfig } from '../types';

import { createDefaultConfig } from '../types';
import YdChartCard from './YdChartCard.vue';
import YdDashboardEditOverlay from './YdDashboardEditOverlay.vue';
import YdStatCard from './YdStatCard.vue';

import { useLocale } from '@ydsz-core/ydsz-ui/locale';

const { t } = useLocale();

const props = withDefaults(defineProps<{
  config?: DashboardConfig;
}>(), {
  config: undefined,
});

/**
 * 实际渲染用的看板配置。
 *
 * <p>默认配置不能写在 prop 默认值里：那里只能拿到静态字符串（原为中文「新仪表盘」），
 * 切语种不会跟着变，故留 undefined 在此按当前语种兜底。
 */
const resolvedConfig = computed<DashboardConfig>(
  () => props.config ?? createDefaultConfig(t('dashboard.defaultTitle')),
);

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
  return map[resolvedConfig.value.columns] ?? 'grid-cols-4';
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
  const items = resolvedConfig.value.cards.filter((c) => c.id !== id);
  emit('config-change', { ...resolvedConfig.value, cards: items });
}
</script>

<template>
  <div class="ds-dashboard flex flex-col gap-3">
    <!-- 仪表盘标题 -->
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold">{{ resolvedConfig.title }}</h2>
      <div v-if="resolvedConfig.isEditable" class="text-xs text-muted-foreground">
        {{ t('dashboard.cardCount', { count: resolvedConfig.cards.length }) }}
      </div>
    </div>

    <!-- 卡片栅格 -->
    <div :class="['grid gap-3', gridClass]">
      <div
        v-for="card in resolvedConfig.cards"
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
          v-if="resolvedConfig.isEditable"
          :card-id="card.id"
          @remove="handleRemoveCard"
        />
      </div>
    </div>

    <!-- 空状态提示 -->
    <div
      v-if="resolvedConfig.cards.length === 0"
      class="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
    >
      <span v-if="resolvedConfig.isEditable">{{ t('dashboard.emptyEditable') }}</span>
      <span v-else>{{ t('dashboard.empty') }}</span>
    </div>
  </div>
</template>
