<!--
 * 监控分析仪表盘页面
 *
 * <p>工作流监控分析仪表盘，提供流程运行状态、异常告警、审批人效率、瓶颈分析等可视化数据。
 *
 * <p><b>核心功能：</b>
 * <ul>
 *   <li>概览卡片：实例总数、运行中、已完成、逾期任务
 *   <li>趋势图表：发起/完成/驳回趋势
 *   <li>异常告警：超时、异常流程
 *   <li>审批人效率排行
 *   <li>瓶颈节点分析
 * </ul>
 *
 * @path apps\workflow-web\src\views\monitor\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 监控分析仪表盘页面
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { ElCard, ElEmpty, ElIcon, ElProgress, ElSpace, ElStatistic, ElTable, ElTableColumn, ElTag, ElTimeline, ElTimelineItem } from 'element-plus';
import { computed, onMounted, ref } from 'vue';
import {
  bottleneckRanking,
  healthScore,
  monitorAnomaly,
  monitorApproverEfficiency,
  monitorApproverWorkload,
  monitorInstanceTrend,
  monitorOverview,
  monitorOverdueTasks,
} from '#/api/flowMonitorDashboard';
import type { FlowAnomalyVO, FlowApproverEfficiencyVO, FlowBottleneckVO, FlowMonitorOverviewVO, FlowRunTaskVO, FlowTrendVO } from '#/api/models';
import { $t } from '#/locales';

const loading = ref(false);

/** 概览数据 */
const overview = ref<FlowMonitorOverviewVO>({});

/** 趋势数据 */
const trendData = ref<FlowTrendVO[]>([]);

/** 异常告警 */
const anomalies = ref<FlowAnomalyVO[]>([]);

/** 审批人效率 */
const approverEfficiency = ref<FlowApproverEfficiencyVO[]>([]);

/** 审批人负载 */
const approverWorkload = ref<FlowApproverEfficiencyVO[]>([]);

/** 瓶颈分析 */
const bottlenecks = ref<FlowBottleneckVO[]>([]);

/** 逾期任务 */
const overdueTasks = ref<FlowRunTaskVO[]>([]);

/** 健康评分 */
const health = ref<number>(0);

/** 加载所有监控数据 */
async function loadMonitorData() {
  loading.value = true;
  try {
    const [overviewRes, trendRes, anomalyRes, efficiencyRes, workloadRes, bottleneckRes, overdueRes, healthRes] =
      await Promise.all([
        monitorOverview(),
        monitorInstanceTrend({ days: 30 }),
        monitorAnomaly({}),
        monitorApproverEfficiency({ topN: 10 }),
        monitorApproverWorkload({ limit: 10 }),
        bottleneckRanking({ limit: 10 }),
        monitorOverdueTasks({ limit: 10 }),
        healthScore({}),
      ]);

    overview.value = overviewRes;
    trendData.value = trendRes || [];
    anomalies.value = anomalyRes || [];
    approverEfficiency.value = efficiencyRes || [];
    approverWorkload.value = workloadRes || [];
    bottlenecks.value = bottleneckRes || [];
    overdueTasks.value = overdueRes || [];
    health.value = healthRes?.totalScore || 0;
  } catch {
    // 静默处理
  } finally {
    loading.value = false;
  }
}

/** 健康评分颜色 */
const healthColor = computed(() => {
  if (health.value >= 80) return '#67c23a';
  if (health.value >= 60) return '#e6a23c';
  return '#f56c6c';
});

/** 异常级别标签类型 */
function getAnomalyTagType(level: string): 'danger' | 'warning' | 'info' | 'success' {
  const map: Record<string, 'danger' | 'warning' | 'info' | 'success'> = {
    HIGH: 'danger',
    MEDIUM: 'warning',
    LOW: 'info',
  };
  return map[level] || 'info';
}

onMounted(() => {
  loadMonitorData();
});
</script>

<template>
  <div class="monitor-dashboard">
    <!-- 概览卡片 -->
    <ElSpace :size="16" wrap>
      <ElCard class="stat-card" shadow="hover">
        <ElStatistic :value="overview.totalInstances || 0" title="实例总数" />
      </ElCard>
      <ElCard class="stat-card" shadow="hover">
        <ElStatistic :value="overview.runningInstances || 0" title="运行中" />
      </ElCard>
      <ElCard class="stat-card" shadow="hover">
        <ElStatistic :value="overview.completedInstances || 0" title="已完成" />
      </ElCard>
      <ElCard class="stat-card" shadow="hover">
        <ElStatistic :value="overview.overdueTasks || 0" title="逾期任务" />
      </ElCard>
    </ElSpace>

    <!-- 健康评分 + 趋势 -->
    <div class="dashboard-row">
      <ElCard class="health-card" shadow="never">
        <template #header>
          <span>健康评分</span>
        </template>
        <div class="health-content">
          <ElProgress
            type="dashboard"
            :percentage="health"
            :color="healthColor"
            :stroke-width="12"
          />
          <div class="health-label">{{ health }}分</div>
        </div>
      </ElCard>

      <ElCard class="trend-card" shadow="never">
        <template #header>
          <span>30天趋势</span>
        </template>
        <ElEmpty v-if="!trendData.length" description="暂无趋势数据" />
        <div v-else class="trend-summary">
          <ElSpace :size="24">
            <div class="trend-item">
              <span class="trend-label">发起</span>
              <span class="trend-value">{{ trendData.reduce((s, t) => s + (t.startCount || 0), 0) }}</span>
            </div>
            <div class="trend-item">
              <span class="trend-label">完成</span>
              <span class="trend-value">{{ trendData.reduce((s, t) => s + (t.completeCount || 0), 0) }}</span>
            </div>
            <div class="trend-item">
              <span class="trend-label">驳回</span>
              <span class="trend-value">{{ trendData.reduce((s, t) => s + (t.rejectCount || 0), 0) }}</span>
            </div>
          </ElSpace>
        </div>
      </ElCard>
    </div>

    <!-- 异常告警 -->
    <ElCard shadow="never" class="section-card">
      <template #header>
        <span>异常告警</span>
      </template>
      <ElEmpty v-if="!anomalies.length" description="暂无异常" />
      <ElTimeline v-else>
        <ElTimelineItem
          v-for="item in anomalies"
          :key="item.id"
          :timestamp="item.triggeredAt"
          placement="top"
        >
          <div class="anomaly-item">
            <ElTag :type="getAnomalyTagType(item.warnLevel || '')" size="small">
              {{ item.warnLevel }}
            </ElTag>
            <span class="anomaly-desc">{{ item.description }}</span>
          </div>
        </ElTimelineItem>
      </ElTimeline>
    </ElCard>

    <!-- 审批人效率 + 瓶颈分析 -->
    <div class="dashboard-row">
      <ElCard shadow="never" class="section-card">
        <template #header>
          <span>审批人效率 TOP10</span>
        </template>
        <ElTable :data="approverEfficiency" size="small" stripe>
          <ElTableColumn prop="userName" label="审批人" />
          <ElTableColumn prop="avgHandleTime" label="平均处理时长(h)" width="120" />
          <ElTableColumn prop="taskCount" label="处理数" width="80" />
        </ElTable>
      </ElCard>

      <ElCard shadow="never" class="section-card">
        <template #header>
          <span>瓶颈节点 TOP10</span>
        </template>
        <ElTable :data="bottlenecks" size="small" stripe>
          <ElTableColumn prop="nodeName" label="节点" />
          <ElTableColumn prop="avgDuration" label="平均停留(h)" width="110" />
          <ElTableColumn prop="taskCount" label="任务数" width="80" />
        </ElTable>
      </ElCard>
    </div>
  </div>
</template>

<style scoped>
.monitor-dashboard {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-card {
  min-width: 180px;
}

.dashboard-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.health-card {
  width: 240px;
  flex-shrink: 0;
}

.health-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.health-label {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.trend-card {
  flex: 1;
  min-width: 300px;
}

.trend-summary {
  padding: 16px 0;
}

.trend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.trend-label {
  font-size: 13px;
  color: #909399;
}

.trend-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.section-card {
  flex: 1;
  min-width: 400px;
}

.anomaly-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.anomaly-desc {
  font-size: 14px;
  color: #606266;
}
</style>
