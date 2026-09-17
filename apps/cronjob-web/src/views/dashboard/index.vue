<!--
 * 运行看板（统计概览）
 *
 * @path apps\cronjob-web\src\views\dashboard\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 运行看板（P1-统计闭环）
 * <p>消费后端契约 jobStats.ts（auto-generated）：dashboard 总览、recentFailures 最近失败、heatmap 24h 热力。
 * 布局：顶部统计卡片（任务状态分布 + 今日执行）+ 最近失败列表 + 24h 执行分布柱状图（纯 CSS，零新增依赖）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page } from '@ydsz/common-ui';

import { YdBadge, YdCard, YdCardContent, YdCardHeader, YdCardTitle } from '@ydsz-core/ydsz-ui';
// TODO: ElTable/ElTableColumn/ElEmpty 暂无 shadcn 对应;保留 element-plus SKIP
import { YdEmptyState } from '@ydsz-core/ydsz-ui';
import { ElTable, ElTableColumn } from 'element-plus';
import { computed, onMounted, ref } from 'vue';

import { getOverview } from '#/api/dashboard';
import { dashboard, heatmap, recentFailures } from '#/api/jobStats';
import type { JobLogVO } from '#/api/models';

defineOptions({ name: 'CronjobDashboard' });

// ==================== 数据 ====================

interface TaskStats {
  total?: number;
  normal?: number;
  paused?: number;
  error?: number;
  autoPaused?: number;
}

interface TodayExec {
  total?: number;
  success?: number;
  failed?: number;
  running?: number;
  successRate?: string;
}

const taskStats = ref<TaskStats>({});
const todayExec = ref<TodayExec>({});
const failures = ref<JobLogVO[]>([]);
/** 24h 热力数据 [{hour, count}] */
const heatData = ref<{ hour: number; count: number }[]>([]);
/** DashboardController 总览数据 */
const overviewData = ref<Record<string, unknown>>({});

/** 热力图最大执行数（用于柱高归一化） */
const heatMax = computed(() => Math.max(1, ...heatData.value.map((item) => item.count ?? 0)));

/** 统计卡片数据（总览） */
const cards = computed(() => [
  { label: '任务总数', value: taskStats.value.total ?? 0, color: 'text-blue-500' },
  { label: '运行中', value: taskStats.value.normal ?? 0, color: 'text-green-500' },
  { label: '已暂停', value: taskStats.value.paused ?? 0, color: 'text-orange-500' },
  { label: '异常', value: taskStats.value.error ?? 0, color: 'text-red-500' },
]);

async function loadData() {
  try {
    const [dash, fails, heat, overview] = await Promise.all([
      dashboard(),
      recentFailures({ limit: 10 }),
      heatmap({}),
      getOverview().catch(() => ({})),
    ]);
    const dashData = (dash ?? {}) as { taskStats?: TaskStats; todayExec?: TodayExec };
    taskStats.value = dashData.taskStats ?? {};
    todayExec.value = dashData.todayExec ?? {};
    failures.value = fails ?? [];
    const heatList = (heat ?? []) as unknown as { hour: number; count: number }[];
    heatData.value =
      heatList.length === 24
        ? heatList
        : Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    overviewData.value = (overview ?? {}) as Record<string, unknown>;
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

onMounted(loadData);
</script>

<template>
  <Page auto-content-height>
    <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <YdCard v-for="card in cards" :key="card.label">
        <YdCardContent class="pt-4">
          <div class="text-sm text-muted-foreground">{{ card.label }}</div>
          <div class="mt-1 text-2xl font-semibold" :class="card.color">{{ card.value }}</div>
        </YdCardContent>
      </YdCard>
    </div>

    <div class="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
      <YdCard class="lg:col-span-2">
        <YdCardHeader>
          <YdCardTitle>今日执行</YdCardTitle>
        </YdCardHeader>
        <YdCardContent>
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <div class="text-xs text-gray-500">执行总数</div>
            <div class="text-xl font-semibold">{{ todayExec.total ?? 0 }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">成功</div>
            <div class="text-xl font-semibold text-green-500">{{ todayExec.success ?? 0 }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">失败</div>
            <div class="text-xl font-semibold text-red-500">{{ todayExec.failed ?? 0 }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">成功率</div>
            <div class="text-xl font-semibold">{{ todayExec.successRate ?? 'N/A' }}</div>
          </div>
          </div>
        </YdCardContent>
      </YdCard>

      <YdCard>
        <YdCardHeader>
          <YdCardTitle>运行中</YdCardTitle>
        </YdCardHeader>
        <YdCardContent>
          <div class="flex h-28 items-center justify-center">
            <span class="text-4xl font-semibold text-blue-500">{{ todayExec.running ?? 0 }}</span>
          </div>
        </YdCardContent>
      </YdCard>
    </div>

    <div class="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-5">
      <YdCard class="lg:col-span-3">
        <YdCardHeader>
          <YdCardTitle>最近失败（快速定位）</YdCardTitle>
        </YdCardHeader>
        <YdCardContent>
          <ElTable v-if="failures.length" :data="failures" border size="small" max-height="300">
          <ElTableColumn prop="jobKey" label="任务标识" min-width="120" show-overflow-tooltip />
          <ElTableColumn label="状态" width="90">
            <template #default="{ row }">
              <YdBadge variant="destructive" size="sm">{{ row.status ?? '-' }}</YdBadge>
            </template>
          </ElTableColumn>
          <ElTableColumn
            prop="errorMessage"
            label="错误信息"
            min-width="200"
            show-overflow-tooltip
          />
          <ElTableColumn prop="startTime" label="时间" width="170" />
          </ElTable>
          <YdEmptyState v-else description="暂无失败记录" :image-size="60" />
        </YdCardContent>
      </YdCard>

      <YdCard class="lg:col-span-2">
        <YdCardHeader>
          <YdCardTitle>24 小时执行分布</YdCardTitle>
        </YdCardHeader>
        <YdCardContent>
          <div class="flex h-72 items-end gap-1 px-1">
          <div
            v-for="item in heatData"
            :key="item.hour"
            class="group relative flex-1 rounded-t bg-blue-100 transition-colors hover:bg-blue-300"
            :style="{ height: `${Math.max(3, ((item.count ?? 0) / heatMax) * 100)}%` }"
            :title="`${item.hour}:00 - ${item.count ?? 0} 次`"
          >
            <span
              class="pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-1 text-[10px] text-white group-hover:block"
              >{{ item.hour }}:00 · {{ item.count ?? 0 }}</span
            >
          </div>
        </div>
        <div class="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
        </YdCardContent>
      </YdCard>
    </div>
  </Page>
</template>
