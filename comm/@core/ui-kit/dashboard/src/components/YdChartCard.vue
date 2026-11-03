<script lang="ts" setup>
/**
* YdChartCard — ECharts 图表卡片。
*
* <p>封装 ECharts 图表的看板卡片，自动处理 resize、dark 主题、loading 态。
*
* @path comm\@core\ui-kit\dashboard\src\components\YdChartCard.vue
* @author ydsz-team
* @since 1.0.0
*/
import { ref } from 'vue';

import type { ChartCard } from '../types';
import { useChartCardCore } from '../composables/use-chart-card-core';
import { useLocale } from '@ydsz-core/ydsz-ui/locale';

defineOptions({ name: 'YdChartCard' });

const { t } = useLocale();

const props = defineProps<{
  card: ChartCard;
}>();

/** 图表容器引用 */
const chartContainer = ref<HTMLDivElement | null>(null);

const {
  isEmpty,
  isInitializing,
} = useChartCardCore({
  container: chartContainer,
  option: () => props.card.option,
});
</script>

<template>
  <div class="ds-chart-card flex h-full flex-col rounded-lg border bg-card p-4 shadow-sm">
    <!-- 标题行 -->
    <div class="mb-3 flex items-center justify-between pb-2">
      <div>
        <h4 class="text-sm font-medium text-foreground">{{ card.title }}</h4>
        <p v-if="card.subtitle" class="mt-0.5 text-xs text-muted-foreground">
          {{ card.subtitle }}
        </p>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="relative flex-1">
      <div
        v-if="isInitializing"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
      <div
        v-else-if="isEmpty"
        class="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
      >
        {{ t('dashboard.chartEmpty') }}
      </div>
      <div
        ref="chartContainer"
        class="h-64 w-full"
        :class="isInitializing ? 'invisible' : ''"
      />
    </div>
  </div>
</template>
