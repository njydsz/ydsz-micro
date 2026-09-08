<!--
 * 运维监控面板
 *
 * <p>展示网关流量、服务健康、断路器状态、缓存命中率等核心指标。
 * 数据源：后端 Prometheus / Micrometer 指标聚合端点（规划中，当前 mock 兜底）。
 *
 * <p><b>对接方式：</b>后端暴露 {@code /api/monitor/overview} 等结构化指标端点，
 * Nginx 代理到 {@code /api/monitor/**}；端点未上线时自动返回 mock 数据。
 *
 * @path apps/system-web/src/views/monitor/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 运维监控面板
 * <p>汇聚网关流量、服务健康、断路器、缓存命中率四类核心运维指标。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { ElCard, ElProgress, ElTag, ElTimeline, ElTimelineItem, ElButton } from 'element-plus';

import { createLogger } from '@YDSZ-core/shared/utils';

import {
  loadMonitorCacheMetrics,
  loadMonitorCircuitBreakers,
  loadMonitorOverview,
  loadMonitorServices,
} from '#/api/monitor';
import type {
  CacheMetricsVO,
  CircuitBreakerStateVO,
  MonitorOverviewVO,
  ServiceHealthVO,
} from '#/api/monitor-types';

/** 模块级日志器 */
const logger = createLogger('system-monitor');

/** 加载状态 */
const loading = ref(false);

/** 服务健康列表 */
const services = ref<ServiceHealthVO[]>([]);

/** 断路器状态列表 */
const circuitBreakers = ref<CircuitBreakerStateVO[]>([]);

/** 缓存指标列表 */
const cacheMetrics = ref<CacheMetricsVO[]>([]);

/** 监控概览 */
const overview = ref<MonitorOverviewVO>({
  gatewayQps: 0,
  gatewayAvgLatencyMs: 0,
  gatewayP99LatencyMs: 0,
  healthRatio: 0,
  cacheAvgHitRate: 0,
});

/** SkyWalking UI 链接（优先取环境变量，默认 localhost:8080） */
const skywalkingUiUrl = ref<string>(import.meta.env?.VITE_SKYWALKING_UI_URL || 'http://localhost:8080');

/**
 * 加载全部监控数据
 *
 * <p>并行请求概览/服务/断路器/缓存四类指标。
 * 当后端端点不可用时，API 客户端自动返回结构化 mock 数据（字段与真实指标一一对应）。
 */
async function loadMetrics(): Promise<void> {
  loading.value = true;
  try {
    const [overviewData, serviceData, breakerData, cacheData] = await Promise.all([
      loadMonitorOverview(),
      loadMonitorServices(),
      loadMonitorCircuitBreakers(),
      loadMonitorCacheMetrics(),
    ]);
    overview.value = overviewData;
    services.value = serviceData;
    circuitBreakers.value = breakerData;
    cacheMetrics.value = cacheData;
  } catch (error) {
    // API 客户端内部已做兜底；此处仅记录极端异常（如全部端点不可用）
    logger.error('[Monitor] 加载监控数据失败: {}', error);
  } finally {
    loading.value = false;
  }
}

/** 自动刷新定时器 */
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  void loadMetrics();
  timer = setInterval(() => {
    void loadMetrics();
  }, 30_000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

/**
 * 状态标签类型
 *
 * @param status - 服务状态字符串
 * @returns Element Plus Tag 类型
 */
function statusTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'UP': return 'success';
    case 'DEGRADED': return 'warning';
    case 'DOWN': return 'danger';
    default: return 'info';
  }
}

/**
 * 断路器状态颜色
 *
 * @param state - 断路器状态字符串
 * @returns 十六进制颜色值
 */
function circuitBreakerColor(state: string): string {
  switch (state) {
    case 'CLOSED': return '#67C236';
    case 'HALF_OPEN': return '#E6A23C';
    case 'OPEN': return '#F56C6C';
    default: return '#909399';
  }
}

/** 健康服务比例（从概览数据直接取，与后台 Micrometer 健康检查同步） */
const healthRatio = computed(() => overview.value.healthRatio);

/** 缓存平均命中率（从概览数据直接取） */
const avgHitRate = computed(() => overview.value.cacheAvgHitRate);
</script>

<template>
  <div class="monitor-dashboard p-4 space-y-6">
    <!-- 顶部关键指标 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
      <ElCard shadow="hover">
        <div class="metric-card">
          <div class="text-sm text-gray-500">网关 QPS</div>
          <div class="text-2xl font-bold mt-1">{{ overview.gatewayQps.toLocaleString() }}</div>
          <div class="text-xs text-gray-400 mt-1">请求 / 秒</div>
        </div>
      </ElCard>
      <ElCard shadow="hover">
        <div class="metric-card">
          <div class="text-sm text-gray-500">平均延迟</div>
          <div class="text-2xl font-bold mt-1">{{ overview.gatewayAvgLatencyMs }}ms</div>
          <div class="text-xs text-gray-400 mt-1">P99: {{ overview.gatewayP99LatencyMs }}ms</div>
        </div>
      </ElCard>
      <ElCard shadow="hover">
        <div class="metric-card">
          <div class="text-sm text-gray-500">服务健康度</div>
          <ElProgress
            :percentage="healthRatio"
            :status="healthRatio >= 90 ? 'success' : healthRatio >= 70 ? 'warning' : 'exception'"
            class="mt-2"
          />
        </div>
      </ElCard>
      <ElCard shadow="hover">
        <div class="metric-card">
          <div class="text-sm text-gray-500">缓存平均命中率</div>
          <div class="text-2xl font-bold mt-1">{{ avgHitRate.toFixed(1) }}%</div>
          <div class="text-xs text-gray-400 mt-1">{{ cacheMetrics.length }} 个缓存池</div>
        </div>
      </ElCard>
    </div>

    <!-- 服务健康 & 断路器 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <ElCard>
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-medium">服务健康状态</span>
            <ElTag size="small" :type="healthRatio >= 90 ? 'success' : 'warning'">
              {{ services.filter(s => s.status === 'UP').length }}/{{ services.length }} 正常
            </ElTag>
          </div>
        </template>
        <div class="space-y-2">
          <div
            v-for="svc in services"
            :key="svc.name"
            class="flex items-center justify-between py-2 border-b border-dashed last:border-b-0"
          >
            <div class="flex items-center gap-2">
              <ElTag :type="statusTagType(svc.status)" size="small">{{ svc.status }}</ElTag>
              <span class="text-sm">{{ svc.name }}</span>
            </div>
            <div class="text-xs text-gray-400">运行 {{ svc.uptime }} | {{ svc.version }}</div>
          </div>
        </div>
      </ElCard>

      <ElCard>
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-medium">断路器状态</span>
            <ElTag
              v-if="circuitBreakers.some(cb => cb.state === 'OPEN')"
              type="danger"
              size="small"
            >
              {{ circuitBreakers.filter(cb => cb.state === 'OPEN').length }} 个断开
            </ElTag>
          </div>
        </template>
        <ElTimeline>
          <ElTimelineItem
            v-for="cb in circuitBreakers"
            :key="cb.name"
            :color="circuitBreakerColor(cb.state)"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">{{ cb.name }}</span>
              <ElTag size="small">{{ cb.state }}</ElTag>
            </div>
            <div class="text-xs text-gray-400 mt-1">
              失败率 {{ (cb.failureRate * 100).toFixed(1) }}% | 慢调用 {{ (cb.slowCallRate * 100).toFixed(1) }}%
            </div>
          </ElTimelineItem>
        </ElTimeline>
      </ElCard>
    </div>

    <!-- 链路追踪入口 -->
    <ElCard>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">链路追踪</span>
          <ElTag size="small" type="info">SkyWalking</ElTag>
        </div>
      </template>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500">SkyWalking UI</div>
            <div class="text-lg font-medium mt-1">{{ skywalkingUiUrl }}</div>
            <div class="text-xs text-gray-400 mt-1">查看拓扑 / 调用链 / 日志关联</div>
          </div>
          <div class="flex gap-2">
            <ElButton
              type="primary"
              size="small"
              tag="a"
              :href="skywalkingUiUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              打开 SkyWalking
            </ElButton>
            <ElButton
              size="small"
              tag="a"
              :href="`${skywalkingUiUrl}/trace`"
              target="_blank"
              rel="noopener noreferrer"
            >
              链路列表
            </ElButton>
          </div>
        </div>
        <div class="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded p-2 font-mono break-all">
          配置：VITE_SKYWALKING_UI_URL={{ skywalkingUiUrl }}
        </div>
      </div>
    </ElCard>

    <!-- 缓存指标 -->
    <ElCard>
      <template #header>
        <span class="font-medium">缓存指标</span>
      </template>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div v-for="cache in cacheMetrics" :key="cache.name" class="cache-metric">
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm">{{ cache.name }}</span>
            <span class="text-xl font-bold" style="color: #67c23a">{{ cache.hitRate }}%</span>
          </div>
          <ElProgress
            :percentage="Math.round(cache.hitRate)"
            :stroke-width="8"
            :status="cache.hitRate >= 90 ? 'success' : 'warning'"
          />
          <div class="text-xs text-gray-400 mt-1">
            条目 {{ cache.size.toLocaleString() }} | 淘汰 {{ cache.evictions.toLocaleString() }}
          </div>
        </div>
      </div>
    </ElCard>
  </div>
</template>

<style scoped>
.metric-card {
  text-align: center;
  padding: 8px 0;
}

.cache-metric {
  padding: 12px;
  border-radius: 6px;
  background-color: hsl(var(--muted) / 0.3);
}
</style>
