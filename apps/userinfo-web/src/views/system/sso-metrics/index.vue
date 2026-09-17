<!--
 * SSO 监控面板页面
 *
 * <p>展示 SSO 指标概览，包括登录统计、活跃会话、应用接入情况等。
 *
 * @path apps\userinfo-web\src\views\system\sso-metrics\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts">
/** SSO 指标概览视图模型（对应后端 SsoMetricsOverviewVO） */
export interface SsoMetricsOverviewVo {
  totalLoginCount?: number;
  todayLoginCount?: number;
  activeSessionCount?: number;
  totalApplicationCount?: number;
  todaySuccessRate?: number;
  activeUserCount?: number;
  loginTrend?: string[];
  applicationNames?: string[];
}

/** 类型守卫：判定 unknown 是否为 SsoMetricsOverviewVo */
export function isSsoMetricsOverviewVo(value: unknown): value is SsoMetricsOverviewVo {
  return typeof value === 'object' && value !== null;
}
</script>

<script lang="ts" setup>
/**
 * SSO 监控面板
 * <p>消费后端契约 SsoMetricsController（apps/userinfo-web/src/api/ssoMetrics.ts）：
 * getOverview() SSO 指标概览。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { Page } from '@ydsz/common-ui';
import { YdBadge } from '@ydsz-core/ydsz-ui';
import { ElCard, ElEmpty, ElProgress, ElTable, ElTableColumn } from 'element-plus';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { createLogger } from '@ydsz-core/shared/utils';

import { getOverview } from '#/api/ssoMetrics';

defineOptions({ name: 'SsoMetricsDashboard' });

const logger = createLogger('userinfo-sso-metrics');
const { t } = useI18n();

/** SSO 指标概览数据 */
const overview = ref<SsoMetricsOverviewVo>({});

/** 加载状态 */
const isLoading = ref(false);

/** 登录成功率百分比 */
const successRatePercent = computed(() => {
  const rate = overview.value.todaySuccessRate ?? 0;
  return Math.round((typeof rate === 'number' ? rate : 0) * 100);
});

/** 加载概览数据 */
async function loadOverview(): Promise<void> {
  isLoading.value = true;
  try {
    const result = await getOverview();
    if (isSsoMetricsOverviewVo(result)) {
      overview.value = result;
    }
  } catch (error) {
    logger.warn('加载 SSO 指标概览失败: {}', error);
  } finally {
    isLoading.value = false;
  }
}

/** 格式化百分比 */
function formatPercent(value: number | undefined): string {
  if (value === undefined || value === null) return '0%';
  return `${(value * 100).toFixed(1)}%`;
}

onMounted(() => {
  loadOverview();
});
</script>

<template>
  <Page v-loading="isLoading" auto-content-height>
    <!-- 指标概览卡片 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <ElCard shadow="hover">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">总登录次数</p>
            <p class="mt-1 text-2xl font-bold text-blue-600">
              {{ overview.totalLoginCount ?? 0 }}
            </p>
          </div>
          <div class="rounded-full bg-blue-50 p-3">
            <span class="text-2xl text-blue-500">🔑</span>
          </div>
        </div>
      </ElCard>

      <ElCard shadow="hover">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">今日登录</p>
            <p class="mt-1 text-2xl font-bold text-green-600">
              {{ overview.todayLoginCount ?? 0 }}
            </p>
          </div>
          <div class="rounded-full bg-green-50 p-3">
            <span class="text-2xl text-green-500">📊</span>
          </div>
        </div>
      </ElCard>

      <ElCard shadow="hover">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">活跃会话</p>
            <p class="mt-1 text-2xl font-bold text-purple-600">
              {{ overview.activeSessionCount ?? 0 }}
            </p>
          </div>
          <div class="rounded-full bg-purple-50 p-3">
            <span class="text-2xl text-purple-500">💻</span>
          </div>
        </div>
      </ElCard>

      <ElCard shadow="hover">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">活跃用户</p>
            <p class="mt-1 text-2xl font-bold text-cyan-600">
              {{ overview.activeUserCount ?? 0 }}
            </p>
          </div>
          <div class="rounded-full bg-cyan-50 p-3">
            <span class="text-2xl text-cyan-500">👥</span>
          </div>
        </div>
      </ElCard>
    </div>

    <!-- 登录成功率 + 接入应用 -->
    <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <!-- 今日登录成功率 -->
      <ElCard>
        <template #header>
          <span class="font-medium">今日登录成功率</span>
        </template>
        <div class="flex flex-col items-center gap-4 py-4">
          <ElProgress
            type="dashboard"
            :percentage="successRatePercent"
            :stroke-width="12"
            :color="successRatePercent >= 90 ? '#67c23a' : successRatePercent >= 70 ? '#e6a23c' : '#f56c6c'"
          />
          <div class="text-center">
            <p class="text-lg font-semibold">
              {{ formatPercent(overview.todaySuccessRate) }}
            </p>
            <p class="mt-1 text-sm text-gray-500">
              {{ overview.todayLoginCount ?? 0 }} 次登录
            </p>
          </div>
        </div>
      </ElCard>

      <!-- 接入应用统计 -->
      <ElCard>
        <template #header>
          <span class="font-medium">接入应用</span>
        </template>
        <div class="flex items-center justify-center gap-2 py-4">
          <div class="text-center">
            <p class="text-3xl font-bold text-blue-600">
              {{ overview.totalApplicationCount ?? 0 }}
            </p>
            <p class="mt-1 text-sm text-gray-500">接入应用总数</p>
          </div>
        </div>
        <div
          v-if="overview.applicationNames && overview.applicationNames.length > 0"
          class="flex flex-wrap justify-center gap-2 border-t pt-4"
        >
          <YdBadge
            v-for="appName in overview.applicationNames"
            :key="appName"
            variant="secondary"
            class="text-xs"
          >
            {{ appName }}
          </YdBadge>
        </div>
        <ElEmpty
          v-else
          :description="'暂无应用数据'"
          :image-size="40"
        />
      </ElCard>
    </div>

    <!-- 登录趋势 -->
    <div class="mt-4">
      <ElCard>
        <template #header>
          <span class="font-medium">登录趋势</span>
        </template>
        <ElTable
          v-if="overview.loginTrend && overview.loginTrend.length > 0"
          :data="overview.loginTrend.map((value, index) => ({ index: index + 1, value }))"
          border
          max-height="300"
        >
          <ElTableColumn type="index" label="序号" width="80" />
          <ElTableColumn label="标签" prop="index" width="120">
            <template #default="{ row }">
              <span>时段 {{ row.index }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="登录次数" minWidth="120">
            <template #default="{ row }">
              <span>{{ row.value }}</span>
            </template>
          </ElTableColumn>
        </ElTable>
        <ElEmpty v-else description="暂无登录趋势数据" :image-size="60" />
      </ElCard>
    </div>
  </Page>
</template>
