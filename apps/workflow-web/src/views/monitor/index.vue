<!--
 * 流程监控仪表盘（ECharts 可视化）
 *
 * <p>基于 ECharts 的流程监控仪表盘，提供流程实例趋势、审批效率、瓶颈分析等可视化图表。
 *
 * @path apps\workflow-web\src\views\monitor\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 流程监控仪表盘
 * <p>消费后端契约 FlowMonitorDashboardController（apps/workflow-web/src/api/flowMonitorDashboard.ts）。
 * <p>包含：概览卡片、实例趋势图、流程类型分布、审批人效率排行、瓶颈排行、健康评分。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { Page } from '@ydsz/common-ui';
import { ElCard, ElDatePicker, ElMessage, ElOption, ElSelect, ElStatistic, ElTag } from 'element-plus';
import { computed, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import {
  approvalTrend,
  bottleneckRanking,
  healthScore,
  monitorApproverEfficiency,
  monitorFlowTypeDistribution,
  monitorInstanceTrend,
  monitorOverview,
} from '#/api/flowMonitorDashboard';
import type { FlowMonitorOverviewVO } from '#/api/models';

defineOptions({ name: 'WorkflowMonitor' });

/** 概览数据 */
const overview = ref<FlowMonitorOverviewVO>({});
const loading = ref(false);

/** 时间范围 */
const timeRange = ref('30');

/** 趋势数据 */
const trendData = ref<Array<{ date: string; count: number }>>([]);

/** 流程类型分布 */
const flowTypeData = ref<Array<{ name: string; value: number }>>([]);

/** 审批人效率 */
const approverEfficiencyData = ref<Array<{ name: string; avgTime: number; count: number }>>([]);

/** 瓶颈排行 */
const bottleneckData = ref<Array<{ nodeName: string; avgDuration: number }>>([]);

/** 健康评分 */
const healthScoreData = ref<{ score: number; level: string }>({ score: 0, level: 'UNKNOWN' });

/** 时间范围选项 */
const timeRangeOptions = [
  { label: '近7天', value: '7' },
  { label: '近30天', value: '30' },
  { label: '近90天', value: '90' },
];

/** 加载概览数据 */
async function loadOverview(): Promise<void> {
  try {
    overview.value = await monitorOverview();
  } catch {
    ElMessage.error('加载概览数据失败');
  }
}

/** 加载趋势数据 */
async function loadTrend(): Promise<void> {
  try {
    const result = await monitorInstanceTrend({ days: Number(timeRange.value) });
    trendData.value = result.map((item) => ({
      date: (item.date as string) ?? '',
      count: (item.count as number) ?? 0,
    }));
    renderTrendChart();
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 加载流程类型分布 */
async function loadFlowTypeDistribution(): Promise<void> {
  try {
    const result = await monitorFlowTypeDistribution({});
    if (result.distribution) {
      flowTypeData.value = Object.entries(result.distribution).map(([name, value]) => ({
        name,
        value: value as number,
      }));
    }
    renderFlowTypeChart();
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 加载审批人效率 */
async function loadApproverEfficiency(): Promise<void> {
  try {
    const result = await monitorApproverEfficiency({ topN: 10 });
    approverEfficiencyData.value = result.map((item) => ({
      name: (item.approverName as string) ?? '',
      avgTime: (item.avgHandleTime as number) ?? 0,
      count: (item.taskCount as number) ?? 0,
    }));
    renderApproverChart();
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 加载瓶颈排行 */
async function loadBottleneck(): Promise<void> {
  try {
    const result = await bottleneckRanking({ limit: 10 });
    bottleneckData.value = result.map((item) => ({
      nodeName: (item.nodeName as string) ?? '',
      avgDuration: (item.avgDuration as number) ?? 0,
    }));
    renderBottleneckChart();
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 加载健康评分 */
async function loadHealthScore(): Promise<void> {
  try {
    const result = await healthScore({});
    healthScoreData.value = {
      score: (result.score as number) ?? 0,
      level: (result.level as string) ?? 'UNKNOWN',
    };
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 加载所有数据 */
async function loadAllData(): Promise<void> {
  loading.value = true;
  try {
    await Promise.all([
      loadOverview(),
      loadTrend(),
      loadFlowTypeDistribution(),
      loadApproverEfficiency(),
      loadBottleneck(),
      loadHealthScore(),
    ]);
  } finally {
    loading.value = false;
  }
}

// ========== ECharts 渲染 ==========

/** 渲染趋势图 */
function renderTrendChart(): void {
  const chartDom = document.getElementById('trendChart');
  if (!chartDom) return;
  const chart = echarts.init(chartDom);
  chart.setOption({
    title: { text: '流程实例趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: trendData.value.map((d) => d.date),
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '实例数',
        type: 'line',
        smooth: true,
        data: trendData.value.map((d) => d.count),
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#409eff' },
      },
    ],
  });
}

/** 渲染流程类型分布图 */
function renderFlowTypeChart(): void {
  const chartDom = document.getElementById('flowTypeChart');
  if (!chartDom) return;
  const chart = echarts.init(chartDom);
  chart.setOption({
    title: { text: '流程类型分布', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%' },
    series: [
      {
        name: '流程类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false, position: 'center' },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: flowTypeData.value,
      },
    ],
  });
}

/** 渲染审批人效率图 */
function renderApproverChart(): void {
  const chartDom = document.getElementById('approverChart');
  if (!chartDom) return;
  const chart = echarts.init(chartDom);
  chart.setOption({
    title: { text: '审批人效率排行（平均处理时间/小时）', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: approverEfficiencyData.value.map((d) => d.name).reverse(),
    },
    series: [
      {
        name: '平均处理时间',
        type: 'bar',
        data: approverEfficiencyData.value.map((d) => d.avgTime).reverse(),
        itemStyle: { color: '#67c23a' },
      },
    ],
  });
}

/** 渲染瓶颈排行图 */
function renderBottleneckChart(): void {
  const chartDom = document.getElementById('bottleneckChart');
  if (!chartDom) return;
  const chart = echarts.init(chartDom);
  chart.setOption({
    title: { text: '流程瓶颈排行（平均耗时/小时）', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: bottleneckData.value.map((d) => d.nodeName).reverse(),
    },
    series: [
      {
        name: '平均耗时',
        type: 'bar',
        data: bottleneckData.value.map((d) => d.avgDuration).reverse(),
        itemStyle: { color: '#e6a23c' },
      },
    ],
  });
}

/** 健康评分颜色 */
const healthScoreColor = computed(() => {
  const score = healthScoreData.value.score;
  if (score >= 80) return '#67c23a';
  if (score >= 60) return '#e6a23c';
  return '#f56c6c';
});

watch(timeRange, () => {
  loadTrend();
});

onMounted(() => {
  loadAllData();
});
</script>

<template>
  <Page auto-content-height>
    <!-- 顶部控制栏 -->
    <div class="mb-4 flex items-center justify-between px-4 pt-3">
      <h1 class="text-xl font-bold text-gray-800">流程监控仪表盘</h1>
      <div class="flex items-center gap-3">
        <ElSelect v-model="timeRange" placeholder="时间范围" class="w-32">
          <ElOption v-for="opt in timeRangeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
        <ElButton type="primary" :loading="loading" @click="loadAllData">刷新</ElButton>
      </div>
    </div>

    <!-- 概览卡片 -->
    <div class="mb-4 grid grid-cols-4 gap-4 px-4">
      <ElCard shadow="hover">
        <ElStatistic title="运行中实例" :value="overview.runningInstanceCount ?? 0" />
      </ElCard>
      <ElCard shadow="hover">
        <ElStatistic title="今日新增" :value="overview.todayInstanceCount ?? 0" />
      </ElCard>
      <ElCard shadow="hover">
        <ElStatistic title="待办任务" :value="overview.pendingTaskCount ?? 0" />
      </ElCard>
      <ElCard shadow="hover">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500">健康评分</div>
            <div class="text-2xl font-bold" :style="{ color: healthScoreColor }">
              {{ healthScoreData.score }}
            </div>
          </div>
          <ElTag :type="healthScoreData.score >= 80 ? 'success' : healthScoreData.score >= 60 ? 'warning' : 'danger'">
            {{ healthScoreData.level }}
          </ElTag>
        </div>
      </ElCard>
    </div>

    <!-- 图表区域 -->
    <div class="grid grid-cols-2 gap-4 px-4 pb-4">
      <!-- 实例趋势 -->
      <ElCard shadow="hover">
        <div id="trendChart" class="h-80" />
      </ElCard>

      <!-- 流程类型分布 -->
      <ElCard shadow="hover">
        <div id="flowTypeChart" class="h-80" />
      </ElCard>

      <!-- 审批人效率 -->
      <ElCard shadow="hover">
        <div id="approverChart" class="h-80" />
      </ElCard>

      <!-- 瓶颈排行 -->
      <ElCard shadow="hover">
        <div id="bottleneckChart" class="h-80" />
      </ElCard>
    </div>
  </Page>
</template>
