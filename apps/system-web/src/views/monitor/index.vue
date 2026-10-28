<!--
 * 运维监控面板
 *
 * <p>展示 Nacos 服务注册状态、Redis 缓存命中率、JVM 运行时内存等核心运维指标。
 * 数据来源：后端 {@code GET /api/system/metrics/dashboard}（Nacos DiscoveryClient
 * + Redis INFO + Environment 聚合），30s 自动刷新。
 *
 * @path apps/system-web/src/views/monitor/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 运维监控面板
 * <p>汇聚服务注册、Redis 缓存、JVM 运行时三大类运维指标。
 *
 * @author ydsz-team
 * @since 26.09.08
 */
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { YdBadge, YdButton, YdCard as ShadcnCard, YdCardContent as ShadcnCardContent, YdTable, YdTableColumn, YdCard, YdEmptyState, YdProgress } from '@ydsz-core/ydsz-ui';

import { requestClient } from '#/api/request';

/** 服务注册信息项 */
interface ServiceInstance {
  serviceId: string;
  status: string;
  instanceCount: number;
  host?: string;
  port?: number;
}

/** Redis 指标 */
interface RedisMetrics {
  totalCommands: number;
  keyspaceHits: number;
  keyspaceMisses: number;
  hitRate: number;
  available: boolean;
  reason?: string;
}

/** JVM 内存指标 */
interface MemoryMetrics {
  usedMb: number;
  totalMb: number;
  maxMb: number;
  usagePercent: number;
}

/** 运行时信息 */
interface RuntimeInfo {
  applicationName: string;
  serverPort: string;
  springBootVersion: string;
  javaVersion: string;
  javaVendor: string;
  osName: string;
  availableCores: number;
  memory: MemoryMetrics;
}

/** 仪表盘聚合数据 */
interface DashboardData {
  services: ServiceInstance[];
  redis: RedisMetrics | null;
  runtime: RuntimeInfo;
  summary: {
    totalServices: number;
    upServices: number;
    downServices: number;
  };
  collectedAt: string;
}

const { t } = useI18n();

const loading = ref(false);
const loadError = ref<string | null>(null);
const dashboardData = ref<DashboardData | null>(null);

/**
 * 加载运维仪表盘数据
 *
 * <p>调用后端 {@code GET /api/system/metrics/dashboard} 获取聚合指标。
 * 请求失败时保留结构空态，前端展示错误提示但页面不崩溃。
 */
async function loadDashboard() {
  loading.value = true;
  loadError.value = null;
  try {
    // 统一请求客户端（规范 §6.1）：路径对齐契约 /api/{service}/**，
    // 业务信封（code === 'A00000'）与鉴权头由拦截器统一处理。
    dashboardData.value = await requestClient.get<DashboardData>(
      '/system/metrics/dashboard',
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : t('monitor.requestFailed');
    loadError.value = msg;
    // 请求失败时清空数据，前端展示错误提示
    dashboardData.value = null;
  } finally {
    loading.value = false;
  }
}

let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  loadDashboard();
  timer = setInterval(loadDashboard, 30000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});

/** 服务列表（空态兜底） */
const services = computed<ServiceInstance[]>(() => {
  return dashboardData.value?.services ?? [];
});

/** 汇总计数 */
const summary = computed(() => {
  return dashboardData.value?.summary ?? { totalServices: 0, upServices: 0, downServices: 0 };
});

/** Redis 指标 */
const redisMetrics = computed<RedisMetrics | null>(() => {
  return dashboardData.value?.redis ?? null;
});

/** 运行时信息 */
const runtimeInfo = computed<RuntimeInfo | null>(() => {
  return dashboardData.value?.runtime ?? null;
});

/** JVM 内存指标（从运行时信息中取出） */
const memory = computed<MemoryMetrics | null>(() => {
  return dashboardData.value?.runtime?.memory ?? null;
});

/** 采集时间 */
const collectedAt = computed<string>(() => {
  return dashboardData.value?.collectedAt ?? '-';
});

/** 健康服务比例 */
const healthRatio = computed(() => {
  if (summary.value.totalServices === 0) return 0;
  return Math.round((summary.value.upServices / summary.value.totalServices) * 100);
});

/** 状态标签类型 */
const statusTagType = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
  switch (status) {
    case 'UP': return 'success';
    case 'DEGRADED': return 'warning';
    case 'DOWN': return 'danger';
    default: return 'info';
  }
};

/** 大数字格式化（千位分隔符） */
const formatNumber = (value: number | undefined): string => {
  if (value == null) return '-';
  return value.toLocaleString();
};
</script>

<template>
  <div class="monitor-dashboard p-5 space-y-6">
    <!-- 顶部关键指标卡片 -->
    <div class="grid grid-cols-1 gap-5 md:grid-cols-4">
      <YdCard shadow="hover">
        <div class="text-center p-2">
          <div class="text-sm text-gray-500">{{ t('monitor.registeredServices') }}</div>
          <div class="text-2xl font-bold mt-1">{{ summary.totalServices }}</div>
          <div class="text-xs text-gray-400 mt-1">{{ t('monitor.nacosRealtime') }}</div>
        </div>
      </YdCard>
      <YdCard shadow="hover">
        <div class="text-center p-2">
          <div class="text-sm text-gray-500">{{ t('monitor.serviceHealth') }}</div>
          <YdProgress
            :percentage="healthRatio"
            :status="healthRatio >= 90 ? 'success' : healthRatio >= 70 ? 'warning' : 'exception'"
            class="mt-2"
          />
          <div class="text-xs text-gray-400 mt-1">
            {{ t('monitor.healthyRatio', { up: summary.upServices, total: summary.totalServices }) }}
          </div>
        </div>
      </YdCard>
      <YdCard shadow="hover">
        <div class="text-center p-2">
          <div class="text-sm text-gray-500">{{ t('monitor.redisHitRate') }}</div>
          <div
            v-if="redisMetrics?.available"
            class="text-2xl font-bold mt-1"
            style="color: #67c23a"
          >
            {{ redisMetrics.hitRate }}%
          </div>
          <YdBadge v-else variant="secondary" class="mt-2">{{ t('monitor.redisNotReady') }}</YdBadge>
          <div v-if="redisMetrics?.available" class="text-xs text-gray-400 mt-1">
            {{ t('monitor.hitsAndMisses', { hits: formatNumber(redisMetrics.keyspaceHits), misses: formatNumber(redisMetrics.keyspaceMisses) }) }}
          </div>
        </div>
      </YdCard>
      <YdCard shadow="hover">
        <div class="text-center p-2">
          <div class="text-sm text-gray-500">{{ t('monitor.jvmMemoryUsage') }}</div>
          <YdProgress
            v-if="memory"
            :percentage="Math.round(memory.usagePercent)"
            :status="memory.usagePercent >= 80 ? 'warning' : 'success'"
            class="mt-2"
          />
          <div v-if="memory" class="text-xs text-gray-400 mt-1">
            {{ memory.usedMb }}MB / {{ memory.maxMb }}MB
          </div>
          <YdBadge v-else variant="secondary" class="mt-2">-</YdBadge>
        </div>
      </YdCard>
    </div>

    <!-- 服务健康 + 运行时信息 -->
    <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
      <!-- 服务注册表 -->
      <YdCard>
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-medium">{{ t('monitor.serviceRegistry') }}</span>
            <YdBadge
              v-if="services.length > 0"
              :variant="summary.downServices === 0 ? undefined : 'destructive'"
            >
              {{ t('monitor.healthyRatio', { up: summary.upServices, total: summary.totalServices }) }}
            </YdBadge>
          </div>
        </template>
        <YdTable
          v-if="services.length > 0"
          :data="services"
          size="small"
          stripe
          max-height="400"
        >
          <YdTableColumn prop="serviceId" :label="t('monitor.colServiceId')" min-width="180" />
          <YdTableColumn :label="t('monitor.colStatus')" width="90">
            <template #default="{ row }">
              <YdBadge :variant="statusTagType(row.status) === 'success' ? undefined : statusTagType(row.status) === 'warning' ? 'destructive' : statusTagType(row.status) === 'danger' ? 'destructive' : 'secondary'">{{ row.status }}</YdBadge>
            </template>
          </YdTableColumn>
          <YdTableColumn prop="instanceCount" :label="t('monitor.colInstanceCount')" width="80" />
          <YdTableColumn :label="t('monitor.colAddress')" min-width="160">
            <template #default="{ row }">
              <span class="text-xs font-mono">
                {{ row.host ?? '-' }}:{{ row.port ?? '-' }}
              </span>
            </template>
          </YdTableColumn>
        </YdTable>
        <YdEmptyState
          v-else-if="!loading && loadError"
          :description="t('monitor.loadFailed', { message: loadError })"
        />
        <YdEmptyState v-else-if="!loading" :description="t('monitor.noServices')" />
      </YdCard>

      <!-- JVM 运行时信息 -->
      <YdCard>
        <template #header>
          <span class="font-medium">{{ t('monitor.runtimeInfo') }}</span>
        </template>
        <div v-if="runtimeInfo" class="space-y-3">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-gray-500">{{ t('monitor.appName') }}</span>
              <span>{{ runtimeInfo.applicationName }}</span>
            </div>
            <div>
              <span class="text-gray-500">{{ t('monitor.port') }}</span>
              <span>{{ runtimeInfo.serverPort }}</span>
            </div>
            <div>
              <span class="text-gray-500">{{ t('monitor.springBootVersion') }}</span>
              <span>{{ runtimeInfo.springBootVersion }}</span>
            </div>
            <div>
              <span class="text-gray-500">{{ t('monitor.javaVersion') }}</span>
              <span>{{ runtimeInfo.javaVersion }}</span>
            </div>
            <div>
              <span class="text-gray-500">{{ t('monitor.javaVendor') }}</span>
              <span>{{ runtimeInfo.javaVendor }}</span>
            </div>
            <div>
              <span class="text-gray-500">{{ t('monitor.osName') }}</span>
              <span>{{ runtimeInfo.osName }}</span>
            </div>
            <div>
              <span class="text-gray-500">{{ t('monitor.availableCores') }}</span>
              <span>{{ t('monitor.coresCount', { count: runtimeInfo.availableCores }) }}</span>
            </div>
          </div>
          <!-- JVM 内存详情 -->
          <div class="border-t pt-3">
            <div class="text-xs text-gray-500 mb-2">{{ t('monitor.jvmHeap') }}</div>
            <div v-if="memory" class="text-sm">
              <div class="flex justify-between mb-1">
                <span>{{ t('monitor.heapUsage', { used: memory.usedMb, total: memory.totalMb }) }}</span>
                <span class="text-gray-500">{{ t('monitor.heapMax', { max: memory.maxMb }) }}</span>
              </div>
              <YdProgress
                :percentage="Math.round(memory.usagePercent)"
                :stroke-width="10"
                :status="memory.usagePercent >= 80 ? 'warning' : 'success'"
              />
            </div>
          </div>
        </div>
        <YdEmptyState v-else :description="t('monitor.runtimeLoading')" />
      </YdCard>
    </div>

    <!-- Redis 指标详情（仅当 Redis 可用时展示） -->
    <YdCard v-if="redisMetrics?.available">
      <template #header>
        <span class="font-medium">{{ t('monitor.redisMetricsTitle') }}</span>
      </template>
      <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div class="p-5 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-sm text-gray-500">{{ t('monitor.totalCommands') }}</div>
          <div class="text-xl font-bold mt-1">{{ formatNumber(redisMetrics.totalCommands) }}</div>
          <div class="text-xs text-gray-400 mt-1">total_commands_processed</div>
        </div>
        <div class="p-5 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-sm text-gray-500">{{ t('monitor.hitCount') }}</div>
          <div class="text-xl font-bold mt-1" style="color: #67c23a">
            {{ formatNumber(redisMetrics.keyspaceHits) }}
          </div>
          <div class="text-xs text-gray-400 mt-1">keyspace_hits</div>
        </div>
        <div class="p-5 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-sm text-gray-500">{{ t('monitor.missCount') }}</div>
          <div class="text-xl font-bold mt-1" style="color: #f56c6c">
            {{ formatNumber(redisMetrics.keyspaceMisses) }}
          </div>
          <div class="text-xs text-gray-400 mt-1">keyspace_misses</div>
        </div>
      </div>
    </YdCard>

    <!-- 底部：采集时间 & 操作 -->
    <div class="flex items-center justify-between text-xs text-gray-400 px-1">
      <div>
        {{ t('monitor.lastCollected') }}<span class="font-mono">{{ collectedAt }}</span>
        <span class="ml-4">{{ t('monitor.autoRefreshInterval') }}</span>
      </div>
      <YdButton size="sm" :loading="loading" @click="loadDashboard">
        {{ t('monitor.manualRefresh') }}
      </YdButton>
    </div>
  </div>
</template>
