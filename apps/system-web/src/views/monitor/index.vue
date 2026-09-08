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

import {
  ElButton,
  ElCard,
  ElEmpty,
  ElProgress,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

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
    const response = await fetch('/system/api/metrics/dashboard');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    if (result && result.code === 'A00000') {
      dashboardData.value = result.data as DashboardData;
    } else {
      throw new Error(result?.msg || '数据加载失败');
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : '运维指标接口请求失败';
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
  <div class="monitor-dashboard p-4 space-y-6">
    <!-- 顶部关键指标卡片 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
      <ElCard shadow="hover">
        <div class="text-center p-2">
          <div class="text-sm text-gray-500">注册服务数</div>
          <div class="text-2xl font-bold mt-1">{{ summary.totalServices }}</div>
          <div class="text-xs text-gray-400 mt-1">Nacos 实时</div>
        </div>
      </ElCard>
      <ElCard shadow="hover">
        <div class="text-center p-2">
          <div class="text-sm text-gray-500">服务健康度</div>
          <ElProgress
            :percentage="healthRatio"
            :status="healthRatio >= 90 ? 'success' : healthRatio >= 70 ? 'warning' : 'exception'"
            class="mt-2"
          />
          <div class="text-xs text-gray-400 mt-1">
            {{ summary.upServices }}/{{ summary.totalServices }} 正常
          </div>
        </div>
      </ElCard>
      <ElCard shadow="hover">
        <div class="text-center p-2">
          <div class="text-sm text-gray-500">Redis 命中率</div>
          <div
            v-if="redisMetrics?.available"
            class="text-2xl font-bold mt-1"
            style="color: #67c23a"
          >
            {{ redisMetrics.hitRate }}%
          </div>
          <ElTag v-else type="info" size="small" class="mt-2">Redis 未装配</ElTag>
          <div v-if="redisMetrics?.available" class="text-xs text-gray-400 mt-1">
            {{ formatNumber(redisMetrics.keyspaceHits) }} 命中 /
            {{ formatNumber(redisMetrics.keyspaceMisses) }} 未命中
          </div>
        </div>
      </ElCard>
      <ElCard shadow="hover">
        <div class="text-center p-2">
          <div class="text-sm text-gray-500">JVM 内存使用</div>
          <ElProgress
            v-if="memory"
            :percentage="Math.round(memory.usagePercent)"
            :status="memory.usagePercent >= 80 ? 'warning' : 'success'"
            class="mt-2"
          />
          <div v-if="memory" class="text-xs text-gray-400 mt-1">
            {{ memory.usedMb }}MB / {{ memory.maxMb }}MB
          </div>
          <ElTag v-else type="info" size="small" class="mt-2">-</ElTag>
        </div>
      </ElCard>
    </div>

    <!-- 服务健康 + 运行时信息 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <!-- 服务注册表 -->
      <ElCard>
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-medium">服务注册状态</span>
            <ElTag
              v-if="services.length > 0"
              size="small"
              :type="summary.downServices === 0 ? 'success' : 'warning'"
            >
              {{ summary.upServices }}/{{ summary.totalServices }} 正常
            </ElTag>
          </div>
        </template>
        <ElTable
          v-if="services.length > 0"
          :data="services"
          size="small"
          stripe
          max-height="400"
        >
          <ElTableColumn prop="serviceId" label="服务 ID" min-width="180" />
          <ElTableColumn label="状态" width="90">
            <template #default="{ row }">
              <ElTag :type="statusTagType(row.status)" size="small">{{ row.status }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="instanceCount" label="实例数" width="80" />
          <ElTableColumn label="地址" min-width="160">
            <template #default="{ row }">
              <span class="text-xs font-mono">
                {{ row.host ?? '-' }}:{{ row.port ?? '-' }}
              </span>
            </template>
          </ElTableColumn>
        </ElTable>
        <ElEmpty
          v-else-if="!loading && loadError"
          :description="'加载失败：' + loadError"
        />
        <ElEmpty v-else-if="!loading" description="暂无注册服务数据" />
      </ElCard>

      <!-- JVM 运行时信息 -->
      <ElCard>
        <template #header>
          <span class="font-medium">运行时信息</span>
        </template>
        <div v-if="runtimeInfo" class="space-y-3">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-gray-500">应用名：</span>
              <span>{{ runtimeInfo.applicationName }}</span>
            </div>
            <div>
              <span class="text-gray-500">端口：</span>
              <span>{{ runtimeInfo.serverPort }}</span>
            </div>
            <div>
              <span class="text-gray-500">Spring Boot：</span>
              <span>{{ runtimeInfo.springBootVersion }}</span>
            </div>
            <div>
              <span class="text-gray-500">Java 版本：</span>
              <span>{{ runtimeInfo.javaVersion }}</span>
            </div>
            <div>
              <span class="text-gray-500">Java 厂商：</span>
              <span>{{ runtimeInfo.javaVendor }}</span>
            </div>
            <div>
              <span class="text-gray-500">操作系统：</span>
              <span>{{ runtimeInfo.osName }}</span>
            </div>
            <div>
              <span class="text-gray-500">可用核心：</span>
              <span>{{ runtimeInfo.availableCores }} 核</span>
            </div>
          </div>
          <!-- JVM 内存详情 -->
          <div class="border-t pt-3">
            <div class="text-xs text-gray-500 mb-2">JVM 堆内存</div>
            <div v-if="memory" class="text-sm">
              <div class="flex justify-between mb-1">
                <span>已用 {{ memory.usedMb }}MB / 提交 {{ memory.totalMb }}MB</span>
                <span class="text-gray-500">最大 {{ memory.maxMb }}MB</span>
              </div>
              <ElProgress
                :percentage="Math.round(memory.usagePercent)"
                :stroke-width="10"
                :status="memory.usagePercent >= 80 ? 'warning' : 'success'"
              />
            </div>
          </div>
        </div>
        <ElEmpty v-else description="运行时信息加载中..." />
      </ElCard>
    </div>

    <!-- Redis 指标详情（仅当 Redis 可用时展示） -->
    <ElCard v-if="redisMetrics?.available">
      <template #header>
        <span class="font-medium">Redis 缓存指标</span>
      </template>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-sm text-gray-500">总命令数</div>
          <div class="text-xl font-bold mt-1">{{ formatNumber(redisMetrics.totalCommands) }}</div>
          <div class="text-xs text-gray-400 mt-1">total_commands_processed</div>
        </div>
        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-sm text-gray-500">命中次数</div>
          <div class="text-xl font-bold mt-1" style="color: #67c23a">
            {{ formatNumber(redisMetrics.keyspaceHits) }}
          </div>
          <div class="text-xs text-gray-400 mt-1">keyspace_hits</div>
        </div>
        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="text-sm text-gray-500">未命中数</div>
          <div class="text-xl font-bold mt-1" style="color: #f56c6c">
            {{ formatNumber(redisMetrics.keyspaceMisses) }}
          </div>
          <div class="text-xs text-gray-400 mt-1">keyspace_misses</div>
        </div>
      </div>
    </ElCard>

    <!-- 底部：采集时间 & 操作 -->
    <div class="flex items-center justify-between text-xs text-gray-400 px-1">
      <div>
        最后采集时间：<span class="font-mono">{{ collectedAt }}</span>
        <span class="ml-4">每 30s 自动刷新</span>
      </div>
      <ElButton size="small" :loading="loading" @click="loadDashboard">
        手动刷新
      </ElButton>
    </div>
  </div>
</template>
