<!--
 * 数据分析仪表盘页面 — 展示概览指标、流量趋势、月访问量、访问来源等统计图表
 *
 * @path main\src\views\dashboard\analytics\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@ydsz/common-ui';
import type { TabOption } from '@ydsz/types';

import { onMounted } from 'vue';
import { $t } from '@ydsz/locales';

import {
  AnalysisChartCard,
  AnalysisChartsTabs,
  AnalysisOverview,
} from '@ydsz/common-ui';
import {
  SvgBellIcon,
  SvgCakeIcon,
  SvgCardIcon,
  SvgDownloadIcon,
} from '@ydsz/icons';

import { useOverviewStats } from '#/hooks/use-dashboard-data';

import AnalyticsTrends from './analytics-trends.vue';
import AnalyticsVisitsData from './analytics-visits-data.vue';
import AnalyticsVisitsSales from './analytics-visits-sales.vue';
import AnalyticsVisitsSource from './analytics-visits-source.vue';
import AnalyticsVisits from './analytics-visits.vue';

// 本地默认数据（后端统计接口就绪前兜底展示，接口可用后自动切换为真实数据）
const defaultOverview = (): AnalysisOverviewItem[] => [
  {
    icon: SvgCardIcon,
    title: $t('page.analytics.users'),
    totalTitle: $t('page.analytics.totalUsers'),
    totalValue: 120_000,
    value: 2000,
  },
  {
    icon: SvgCakeIcon,
    title: $t('page.analytics.visits'),
    totalTitle: $t('page.analytics.totalVisits'),
    totalValue: 500_000,
    value: 20_000,
  },
  {
    icon: SvgDownloadIcon,
    title: $t('page.analytics.downloads'),
    totalTitle: $t('page.analytics.totalDownloads'),
    totalValue: 120_000,
    value: 8000,
  },
  {
    icon: SvgBellIcon,
    title: $t('page.analytics.usage'),
    totalTitle: $t('page.analytics.totalUsage'),
    totalValue: 50_000,
    value: 5000,
  },
];

const { items: overviewItems, load: loadOverview } = useOverviewStats(
  defaultOverview(),
);

const chartTabs = computed<TabOption[]>(() => [
  {
    label: $t('page.analytics.trafficTrend'),
    value: 'trends',
  },
  {
    label: $t('page.analytics.monthlyVisits'),
    value: 'visits',
  },
]);

onMounted(() => {
  // API 优先：后端就绪时自动替换为真实统计数据
  void loadOverview();
});
</script>

<template>
  <div class="p-5">
    <AnalysisOverview :items="overviewItems" />
    <AnalysisChartsTabs :tabs="chartTabs" class="mt-5">
      <template #trends>
        <AnalyticsTrends />
      </template>
      <template #visits>
        <AnalyticsVisits />
      </template>
    </AnalysisChartsTabs>

    <div class="mt-5 w-full md:flex">
      <AnalysisChartCard class="mt-5 md:mr-4 md:mt-0 md:w-1/3" :title="$t('page.analytics.visitCount')">
        <AnalyticsVisitsData />
      </AnalysisChartCard>
      <AnalysisChartCard class="mt-5 md:mr-4 md:mt-0 md:w-1/3" :title="$t('page.analytics.visitSource')">
        <AnalyticsVisitsSource />
      </AnalysisChartCard>
      <AnalysisChartCard class="mt-5 md:mt-0 md:w-1/3" :title="$t('page.analytics.visitSource')">
        <AnalyticsVisitsSales />
      </AnalysisChartCard>
    </div>
  </div>
</template>
