<!--
 * 消息统计看板
 *
 * <p>基于 ECharts 的消息统计看板，提供消息发送趋势、渠道分布、漏斗分析等可视化图表。
 *
 * @path apps\message-web\src\views\stats\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 消息统计看板
 * <p>消费后端契约 MessageStatsController（apps/message-web/src/api/messageStats.ts）。
 * <p>包含：概览卡片、发送趋势图、渠道分布、漏斗分析、成本统计。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page } from '@ydsz/common-ui';
import { ElCard, ElMessage, ElOption, ElSelect, ElStatistic } from 'element-plus';
import { computed, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { channelStats, cost, funnel, overview } from '#/api/messageStats';
import type { MessageStatsVO } from '#/api/models';

defineOptions({ name: 'MessageStats' });

/** 概览数据 */
const overviewData = ref<MessageStatsVO>({});
const loading = ref(false);

/** 时间范围 */
const timeRange = ref('30');

/** 渠道统计数据 */
const channelData = ref<Array<{ channel: string; sent: number; success: number; fail: number }>>(
  [],
);

/** 漏斗数据 */
const funnelData = ref<{ sent: number; delivered: number; read: number; clicked: number }>({
  sent: 0,
  delivered: 0,
  read: 0,
  clicked: 0,
});

/** 成本数据 */
const costData = ref<{ totalCost: number; costPerMsg: number }>({ totalCost: 0, costPerMsg: 0 });

/** 时间范围选项 */
const timeRangeOptions = [
  { label: '近7天', value: '7' },
  { label: '近30天', value: '30' },
  { label: '近90天', value: '90' },
];

/** 计算日期范围 */
function getDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - Number(timeRange.value));
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/** 加载概览数据 */
async function loadOverview(): Promise<void> {
  try {
    const { start, end } = getDateRange();
    overviewData.value = await overview({ start, end });
  } catch {
    ElMessage.error('加载概览数据失败');
  }
}

/** 加载渠道统计 */
async function loadChannelStats(): Promise<void> {
  try {
    const { start, end } = getDateRange();
    const result = await channelStats({ start, end });
    channelData.value = result.map((item) => ({
      channel: (item.channel as string) ?? '',
      sent: (item.sent as number) ?? 0,
      success: (item.success as number) ?? 0,
      fail: (item.fail as number) ?? 0,
    }));
    renderChannelChart();
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 加载漏斗数据 */
async function loadFunnel(): Promise<void> {
  try {
    const { start, end } = getDateRange();
    const result = await funnel({ start, end });
    funnelData.value = {
      sent: (result.sent as number) ?? 0,
      delivered: (result.delivered as number) ?? 0,
      read: (result.read as number) ?? 0,
      clicked: (result.clicked as number) ?? 0,
    };
    renderFunnelChart();
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 加载成本数据 */
async function loadCost(): Promise<void> {
  try {
    const { start, end } = getDateRange();
    const result = await cost({ start, end });
    costData.value = {
      totalCost: (result.totalCost as number) ?? 0,
      costPerMsg: (result.costPerMsg as number) ?? 0,
    };
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 加载所有数据 */
async function loadAllData(): Promise<void> {
  loading.value = true;
  try {
    await Promise.all([loadOverview(), loadChannelStats(), loadFunnel(), loadCost()]);
  } finally {
    loading.value = false;
  }
}

// ========== ECharts 渲染 ==========

/** 渲染渠道分布图 */
function renderChannelChart(): void {
  const chartDom = document.getElementById('channelChart');
  if (!chartDom) return;
  const chart = echarts.init(chartDom);
  chart.setOption({
    title: { text: '渠道发送分布', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: '0%' },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: channelData.value.map((d) => d.channel),
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '发送数',
        type: 'bar',
        data: channelData.value.map((d) => d.sent),
        itemStyle: { color: '#409eff' },
      },
      {
        name: '成功数',
        type: 'bar',
        data: channelData.value.map((d) => d.success),
        itemStyle: { color: '#67c23a' },
      },
      {
        name: '失败数',
        type: 'bar',
        data: channelData.value.map((d) => d.fail),
        itemStyle: { color: '#f56c6c' },
      },
    ],
  });
}

/** 渲染漏斗图 */
function renderFunnelChart(): void {
  const chartDom = document.getElementById('funnelChart');
  if (!chartDom) return;
  const chart = echarts.init(chartDom);
  chart.setOption({
    title: { text: '消息转化漏斗', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    series: [
      {
        name: '转化漏斗',
        type: 'funnel',
        left: '10%',
        top: 60,
        bottom: 60,
        width: '80%',
        min: 0,
        max: funnelData.value.sent || 100,
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: { show: true, position: 'inside' },
        labelLine: { length: 10, lineWidth: 1, type: 'solid' },
        itemStyle: { borderColor: '#fff', borderWidth: 1 },
        emphasis: { label: { fontSize: 20 } },
        data: [
          { value: funnelData.value.sent, name: '发送' },
          { value: funnelData.value.delivered, name: '送达' },
          { value: funnelData.value.read, name: '已读' },
          { value: funnelData.value.clicked, name: '点击' },
        ],
      },
    ],
  });
}

/** 送达率 */
const deliveryRate = computed(() => {
  if (!overviewData.value.totalSent) return '0';
  return (((overviewData.value.totalDelivered ?? 0) / overviewData.value.totalSent) * 100).toFixed(
    1,
  );
});

/** 已读率 */
const readRate = computed(() => {
  if (!overviewData.value.totalDelivered) return '0';
  return (((overviewData.value.totalRead ?? 0) / overviewData.value.totalDelivered) * 100).toFixed(
    1,
  );
});

watch(timeRange, () => {
  loadAllData();
});

onMounted(() => {
  loadAllData();
});
</script>

<template>
  <Page auto-content-height>
    <!-- 顶部控制栏 -->
    <div class="mb-4 flex items-center justify-between px-4 pt-3">
      <h1 class="text-xl font-bold text-gray-800">消息统计看板</h1>
      <div class="flex items-center gap-3">
        <ElSelect v-model="timeRange" placeholder="时间范围" class="w-32">
          <ElOption
            v-for="opt in timeRangeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
        <ElButton type="primary" :loading="loading" @click="loadAllData">刷新</ElButton>
      </div>
    </div>

    <!-- 概览卡片 -->
    <div class="mb-4 grid grid-cols-5 gap-4 px-4">
      <ElCard shadow="hover">
        <ElStatistic title="总发送量" :value="overviewData.totalSent ?? 0" />
      </ElCard>
      <ElCard shadow="hover">
        <ElStatistic title="总送达量" :value="overviewData.totalDelivered ?? 0" />
      </ElCard>
      <ElCard shadow="hover">
        <ElStatistic title="总已读量" :value="overviewData.totalRead ?? 0" />
      </ElCard>
      <ElCard shadow="hover">
        <ElStatistic title="送达率" :value="deliveryRate" suffix="%" />
      </ElCard>
      <ElCard shadow="hover">
        <ElStatistic title="已读率" :value="readRate" suffix="%" />
      </ElCard>
    </div>

    <!-- 成本卡片 -->
    <div class="mb-4 grid grid-cols-2 gap-4 px-4">
      <ElCard shadow="hover">
        <ElStatistic title="总成本" :value="costData.totalCost" prefix="¥" :precision="2" />
      </ElCard>
      <ElCard shadow="hover">
        <ElStatistic title="单条成本" :value="costData.costPerMsg" prefix="¥" :precision="4" />
      </ElCard>
    </div>

    <!-- 图表区域 -->
    <div class="grid grid-cols-2 gap-4 px-4 pb-4">
      <!-- 渠道分布 -->
      <ElCard shadow="hover">
        <div id="channelChart" class="h-80" />
      </ElCard>

      <!-- 转化漏斗 -->
      <ElCard shadow="hover">
        <div id="funnelChart" class="h-80" />
      </ElCard>
    </div>
  </Page>
</template>
