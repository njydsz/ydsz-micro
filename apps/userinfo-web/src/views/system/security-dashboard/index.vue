<!--
 * 安全仪表盘
 *
 * <p>展示系统安全态势总览，包括用户统计、登录趋势、风险分布、异常会话等。
 *
 * @path apps\userinfo-web\src\views\system\security-dashboard\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 安全仪表盘
 * <p>消费后端契约 SecurityDashboardController（apps/userinfo-web/src/api/securityDashboard.ts）：
 * getDashboard() 仪表盘总览，getLoginSuccessRate() 登录成功率趋势，
 * getRiskLevelDistribution() 风险等级分布，getRecentSecurityEvents() 最近安全事件，
 * getSessionActivity() 会话活跃度，getActiveUserRanking() 活跃用户排行，
 * getSessionTrend() 会话趋势，getDeviceDistribution() 设备分布，
 * detectAnomalySessions() 异常会话检测，getMfaCoverage() MFA覆盖率，
 * getLoginFailDistribution() 登录失败分布。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { Page } from '@ydsz/common-ui';
import { ElCard, ElEmpty, ElProgress, ElTable, ElTableColumn, ElTag } from 'element-plus';
import { onMounted, ref } from 'vue';
import {
  type ActiveUserVO,
  type AnomalySessionVO,
  type DeviceDistributionVO,
  type LoginFailDistributionVO,
  type LoginSuccessRateVO,
  type MfaCoverageVO,
  type RiskLevelDistributionVO,
  type SecurityDashboardVO,
  type SecurityEventVO,
  type SessionActivityVO,
  type SessionTrendVO,
  detectAnomalySessions,
  getActiveUserRanking,
  getDashboard,
  getDeviceDistribution,
  getLoginFailDistribution,
  getLoginSuccessRate,
  getMfaCoverage,
  getRecentSecurityEvents,
  getRiskLevelDistribution,
  getSessionActivity,
  getSessionTrend,
} from '#/api/securityDashboard';

defineOptions({ name: 'SecurityDashboard' });

/** 仪表盘总览数据 */
const dashboardData = ref<SecurityDashboardVO>({});

/** 登录成功率趋势 */
const loginSuccessRateData = ref<LoginSuccessRateVO[]>([]);

/** 风险等级分布 */
const riskDistribution = ref<RiskLevelDistributionVO>({});

/** 最近安全事件 */
const recentEvents = ref<SecurityEventVO[]>([]);

/** 会话活跃度 */
const sessionActivity = ref<SessionActivityVO>({});

/** 活跃用户排行 */
const activeUserRanking = ref<ActiveUserVO[]>([]);

/** 会话趋势 */
const sessionTrendData = ref<SessionTrendVO[]>([]);

/** 设备分布 */
const deviceDistribution = ref<DeviceDistributionVO[]>([]);

/** 异常会话 */
const anomalySessions = ref<AnomalySessionVO[]>([]);

/** MFA覆盖率 */
const mfaCoverage = ref<MfaCoverageVO>({});

/** 登录失败分布 */
const loginFailDistribution = ref<LoginFailDistributionVO[]>([]);

/** 加载状态 */
const loading = ref(false);

/** 加载仪表盘数据 */
async function loadDashboardData(): Promise<void> {
  loading.value = true;
  try {
    const [
      dashboard,
      loginRate,
      riskDist,
      events,
      activity,
      userRanking,
      trend,
      devices,
      anomalies,
      mfa,
      failDist,
    ] = await Promise.all([
      getDashboard(),
      getLoginSuccessRate({}),
      getRiskLevelDistribution(),
      getRecentSecurityEvents({ limit: 10 }),
      getSessionActivity(),
      getActiveUserRanking({ limit: 10 }),
      getSessionTrend({}),
      getDeviceDistribution(),
      detectAnomalySessions(),
      getMfaCoverage(),
      getLoginFailDistribution({}),
    ]);

    dashboardData.value = dashboard;
    loginSuccessRateData.value = loginRate;
    riskDistribution.value = riskDist;
    recentEvents.value = events;
    sessionActivity.value = activity;
    activeUserRanking.value = userRanking;
    sessionTrendData.value = trend;
    deviceDistribution.value = devices;
    anomalySessions.value = anomalies;
    mfaCoverage.value = mfa;
    loginFailDistribution.value = failDist;
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    loading.value = false;
  }
}

/** 风险等级标签类型 */
function getRiskLevelTagType(level: string): 'danger' | 'warning' | 'success' | 'info' {
  const upper = (level ?? '').toUpperCase();
  if (upper === 'HIGH' || upper === 'CRITICAL') return 'danger';
  if (upper === 'MEDIUM' || upper === 'MODERATE') return 'warning';
  if (upper === 'LOW') return 'success';
  return 'info';
}

/** 格式化百分比 */
function formatPercent(value: number | undefined): string {
  if (value === undefined || value === null) return '0%';
  return `${(value * 100).toFixed(1)}%`;
}

onMounted(() => {
  loadDashboardData();
});
</script>

<template>
  <Page auto-content-height>
    <div v-loading="loading" class="space-y-4">
      <!-- 总览卡片 -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ElCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">总用户数</p>
              <p class="mt-1 text-2xl font-bold">{{ dashboardData.totalUsers ?? 0 }}</p>
            </div>
            <div class="rounded-full bg-blue-50 p-3">
              <span class="text-2xl text-blue-500">👥</span>
            </div>
          </div>
        </ElCard>

        <ElCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">在线用户</p>
              <p class="mt-1 text-2xl font-bold text-green-600">{{ dashboardData.onlineUsers ?? 0 }}</p>
            </div>
            <div class="rounded-full bg-green-50 p-3">
              <span class="text-2xl text-green-500">🟢</span>
            </div>
          </div>
        </ElCard>

        <ElCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">今日登录</p>
              <p class="mt-1 text-2xl font-bold">{{ dashboardData.todayLoginCount ?? 0 }}</p>
            </div>
            <div class="rounded-full bg-purple-50 p-3">
              <span class="text-2xl text-purple-500">📊</span>
            </div>
          </div>
        </ElCard>

        <ElCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">登录成功率</p>
              <p class="mt-1 text-2xl font-bold text-blue-600">
                {{ formatPercent(dashboardData.todayLoginSuccessRate) }}
              </p>
            </div>
            <div class="rounded-full bg-blue-50 p-3">
              <span class="text-2xl text-blue-500">✅</span>
            </div>
          </div>
        </ElCard>

        <ElCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">MFA覆盖率</p>
              <p class="mt-1 text-2xl font-bold">{{ formatPercent(mfaCoverage.coverageRate) }}</p>
            </div>
            <div class="rounded-full bg-cyan-50 p-3">
              <span class="text-2xl text-cyan-500">🔐</span>
            </div>
          </div>
          <ElProgress
            :percentage="Number(((mfaCoverage.coverageRate ?? 0) * 100).toFixed(0))"
            :stroke-width="6"
            class="mt-2"
          />
        </ElCard>

        <ElCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">锁定用户</p>
              <p class="mt-1 text-2xl font-bold text-orange-600">{{ dashboardData.lockedUsers ?? 0 }}</p>
            </div>
            <div class="rounded-full bg-orange-50 p-3">
              <span class="text-2xl text-orange-500">🔒</span>
            </div>
          </div>
        </ElCard>

        <ElCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">封禁用户</p>
              <p class="mt-1 text-2xl font-bold text-red-600">{{ dashboardData.bannedUsers ?? 0 }}</p>
            </div>
            <div class="rounded-full bg-red-50 p-3">
              <span class="text-2xl text-red-500">🚫</span>
            </div>
          </div>
        </ElCard>

        <ElCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">平均风险分</p>
              <p class="mt-1 text-2xl font-bold" :class="(dashboardData.riskScoreAverage ?? 0) > 70 ? 'text-red-600' : 'text-green-600'">
                {{ (dashboardData.riskScoreAverage ?? 0).toFixed(1) }}
              </p>
            </div>
            <div class="rounded-full bg-yellow-50 p-3">
              <span class="text-2xl text-yellow-500">⚠️</span>
            </div>
          </div>
        </ElCard>
      </div>

      <!-- 风险分布与会话信息 -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <!-- 风险等级分布 -->
        <ElCard>
          <template #header>
            <span class="font-medium">风险等级分布</span>
          </template>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">高风险</span>
              <div class="flex items-center gap-2">
                <ElProgress
                  :percentage="((riskDistribution.highRisk ?? 0) / ((riskDistribution.highRisk ?? 0) + (riskDistribution.mediumRisk ?? 0) + (riskDistribution.lowRisk ?? 0) || 1)) * 100"
                  :stroke-width="10"
                  class="w-32"
                  color="#f56c6c"
                />
                <span class="w-8 text-right text-sm font-medium text-red-600">{{ riskDistribution.highRisk ?? 0 }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">中风险</span>
              <div class="flex items-center gap-2">
                <ElProgress
                  :percentage="((riskDistribution.mediumRisk ?? 0) / ((riskDistribution.highRisk ?? 0) + (riskDistribution.mediumRisk ?? 0) + (riskDistribution.lowRisk ?? 0) || 1)) * 100"
                  :stroke-width="10"
                  class="w-32"
                  color="#e6a23c"
                />
                <span class="w-8 text-right text-sm font-medium text-yellow-600">{{ riskDistribution.mediumRisk ?? 0 }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">低风险</span>
              <div class="flex items-center gap-2">
                <ElProgress
                  :percentage="((riskDistribution.lowRisk ?? 0) / ((riskDistribution.highRisk ?? 0) + (riskDistribution.mediumRisk ?? 0) + (riskDistribution.lowRisk ?? 0) || 1)) * 100"
                  :stroke-width="10"
                  class="w-32"
                  color="#67c23a"
                />
                <span class="w-8 text-right text-sm font-medium text-green-600">{{ riskDistribution.lowRisk ?? 0 }}</span>
              </div>
            </div>
          </div>
        </ElCard>

        <!-- 会话活跃度 -->
        <ElCard>
          <template #header>
            <span class="font-medium">会话活跃度</span>
          </template>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-2xl font-bold text-blue-600">{{ sessionActivity.totalActiveSessions ?? 0 }}</p>
              <p class="mt-1 text-xs text-gray-500">活跃会话</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-green-600">{{ sessionActivity.activeUserCount ?? 0 }}</p>
              <p class="mt-1 text-xs text-gray-500">活跃用户</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-purple-600">{{ sessionActivity.avgSessionDuration ?? 0 }}m</p>
              <p class="mt-1 text-xs text-gray-500">平均时长</p>
            </div>
          </div>
        </ElCard>
      </div>

      <!-- 异常会话与安全事件 -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <!-- 异常会话 -->
        <ElCard>
          <template #header>
            <span class="font-medium">异常会话检测</span>
          </template>
          <ElTable :data="anomalySessions" border max-height="300">
            <ElTableColumn prop="username" label="用户" width="120" />
            <ElTableColumn prop="anomalyType" label="异常类型" width="120" />
            <ElTableColumn prop="description" label="描述" min-width="150" />
            <ElTableColumn prop="riskLevel" label="风险" width="80">
              <template #default="{ row }">
                <ElTag :type="getRiskLevelTagType(row.riskLevel ?? '')">
                  {{ row.riskLevel ?? '-' }}
                </ElTag>
              </template>
            </ElTableColumn>
          </ElTable>
          <ElEmpty v-if="anomalySessions.length === 0" description="暂无异常会话" :image-size="60" />
        </ElCard>

        <!-- 最近安全事件 -->
        <ElCard>
          <template #header>
            <span class="font-medium">最近安全事件</span>
          </template>
          <ElTable :data="recentEvents" border max-height="300">
            <ElTableColumn prop="eventType" label="事件类型" width="120" />
            <ElTableColumn prop="username" label="用户" width="100" />
            <ElTableColumn prop="ip" label="IP" width="130" />
            <ElTableColumn prop="description" label="描述" min-width="150" />
            <ElTableColumn prop="timestamp" label="时间" width="160" />
          </ElTable>
          <ElEmpty v-if="recentEvents.length === 0" description="暂无安全事件" :image-size="60" />
        </ElCard>
      </div>

      <!-- 活跃用户排行 -->
      <ElCard>
        <template #header>
          <span class="font-medium">活跃用户排行（Top 10）</span>
        </template>
        <ElTable :data="activeUserRanking" border>
          <ElTableColumn type="index" label="排名" width="80" />
          <ElTableColumn prop="username" label="用户名" width="150" />
          <ElTableColumn prop="loginCount" label="登录次数" width="120" />
          <ElTableColumn prop="lastLoginTime" label="最后登录" width="180" />
        </ElTable>
        <ElEmpty v-if="activeUserRanking.length === 0" description="暂无数据" :image-size="60" />
      </ElCard>
    </div>
  </Page>
</template>
