<!--
 * 统计数据（日报统计 + 汇总统计）
 *
 * @path apps\cronjob-web\src\views\stats\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 统计数据（P1-统计闭环）
 * <p>消费后端契约 JobStatsController（apps/cronjob-web/src/api/jobStats.ts，auto-generated）：
 * daily 日报统计、summary 汇总统计。
 * 布局：顶部汇总卡片 + 日报趋势（按日期的成功/失败/超时分布条形图）+ 日报明细表格。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page } from '@ydsz/common-ui';

import { Card, CardContent, CardHeader, CardTitle, DatePicker, Input } from '@ydsz-core/ui-kit/shadcn-ui';
// TODO: ElEmpty/ElTable/ElTableColumn 暂无 shadcn 对应;保留 element-plus SKIP
import { ElEmpty, ElTable, ElTableColumn } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';

import { daily, summary } from '#/api/jobStats';
import type { JobDailyStatsVO } from '#/api/models';

defineOptions({ name: 'JobStatsReport' });

// ==================== 数据 ====================

/** 汇总统计数据 */
const summaryData = ref<Record<string, Record<string, unknown>>>({});
/** 日报列表 */
const dailyList = ref<JobDailyStatsVO[]>([]);

/** 查询条件 */
const queryForm = reactive({
  jobId: '',
  startDate: '',
  endDate: '',
});

const isLoading = ref(false);

// ==================== 计算属性 ====================

interface SummaryCard {
  label: string;
  value: string | number;
  color: string;
}

const summaryCards = computed<SummaryCard[]>(() => {
  const data = summaryData.value as unknown as Record<string, number | undefined>;
  return [
    { label: '总触发', value: data.totalFireCount ?? data.fireCount ?? 0, color: 'text-blue-500' },
    { label: '总成功', value: data.totalSuccessCount ?? data.successCount ?? 0, color: 'text-green-500' },
    { label: '总失败', value: data.totalFailCount ?? data.failCount ?? 0, color: 'text-red-500' },
    { label: '总超时', value: data.totalTimeoutCount ?? data.timeoutCount ?? 0, color: 'text-orange-500' },
  ];
});

/** 日报最大触发次数（用于柱高归一化） */
const dailyMaxFire = computed(() => Math.max(1, ...dailyList.value.map((d) => d.fireCount ?? 0)));

// ==================== 方法 ====================

async function loadSummary() {
  try {
    const params: { jobId?: string; startDate?: string; endDate?: string } = {};
    if (queryForm.jobId.trim()) params.jobId = queryForm.jobId.trim();
    if (queryForm.startDate) params.startDate = queryForm.startDate;
    if (queryForm.endDate) params.endDate = queryForm.endDate;
    const data = await summary(params);
    summaryData.value = data ?? {};
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

async function loadDaily() {
  const params: { jobId?: string; startDate?: string; endDate?: string } = {};
  if (queryForm.jobId.trim()) params.jobId = queryForm.jobId.trim();
  if (queryForm.startDate) params.startDate = queryForm.startDate;
  if (queryForm.endDate) params.endDate = queryForm.endDate;
  try {
    const data = await daily(params);
    dailyList.value = data ?? [];
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

async function handleQuery() {
  isLoading.value = true;
  try {
    await Promise.all([loadSummary(), loadDaily()]);
  } finally {
    isLoading.value = false;
  }
}

onMounted(handleQuery);
</script>

<template>
  <Page auto-content-height>
    <!-- 查询条件 -->
    <Card class="mb-3">
      <CardHeader>
        <CardTitle>查询条件</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex flex-wrap items-center gap-3">
        <Input
          v-model="queryForm.jobId"
          placeholder="任务ID（可选）"
          class="!w-56"
        />
        <DatePicker
          v-model="queryForm.startDate"
          placeholder="开始日期"
          class="!w-40"
        />
        <DatePicker
          v-model="queryForm.endDate"
          placeholder="结束日期"
          class="!w-40"
        />
          <button
            class="rounded bg-blue-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            @click="handleQuery"
          >
            查询
          </button>
        </div>
      </CardContent>
    </Card>

    <!-- 汇总统计卡片 -->
    <Card class="mb-3">
      <CardHeader>
        <CardTitle>汇总统计</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div v-for="card in summaryCards" :key="card.label">
          <div class="text-sm text-gray-500">{{ card.label }}</div>
          <div class="mt-1 text-2xl font-semibold" :class="card.color">{{ card.value }}</div>
        </div>
        </div>
      </CardContent>
    </Card>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-5">
      <!-- 日报趋势图 -->
      <Card class="lg:col-span-2">
        <CardHeader>
          <CardTitle>每日触发分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="dailyList.length" class="flex h-64 items-end gap-1 px-1">
          <div
            v-for="item in dailyList"
            :key="item.statsDate"
            class="group relative flex-1 rounded-t transition-colors"
            :class="(item.failCount ?? 0) > 0 ? 'bg-red-200 hover:bg-red-400' : 'bg-green-100 hover:bg-green-300'"
            :style="{ height: `${Math.max(3, ((item.fireCount ?? 0) / dailyMaxFire) * 100)}%` }"
            :title="`${item.statsDate} - 触发${item.fireCount ?? 0}次`"
          >
            <span
              class="pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-1 text-[10px] text-white group-hover:block"
              >{{ item.statsDate }} · {{ item.fireCount ?? 0 }}</span
            >
          </div>
        </div>
          <ElEmpty v-else description="暂无日报数据" :image-size="60" />
        </CardContent>
      </Card>

      <!-- 日报明细表格 -->
      <Card class="lg:col-span-3">
        <CardHeader>
          <CardTitle>日报明细</CardTitle>
        </CardHeader>
        <CardContent>
          <ElTable v-if="dailyList.length" :data="dailyList" border size="small" max-height="380" v-loading="isLoading">
          <ElTableColumn prop="statsDate" label="日期" width="110" />
          <ElTableColumn prop="jobKey" label="任务标识" min-width="120" show-overflow-tooltip />
          <ElTableColumn prop="fireCount" label="触发" width="70" />
          <ElTableColumn prop="successCount" label="成功" width="70" />
          <ElTableColumn prop="failCount" label="失败" width="70" />
          <ElTableColumn prop="timeoutCount" label="超时" width="70" />
          <ElTableColumn prop="avgDurationMs" label="平均耗时(ms)" width="110" />
          <ElTableColumn prop="p95DurationMs" label="P95(ms)" width="90" />
        </ElTable>
          <ElEmpty v-else description="暂无日报明细" :image-size="60" />
        </CardContent>
      </Card>
    </div>
  </Page>
</template>
