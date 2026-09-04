<!--
 * 运维监控面板
 *
 * <p>展示网关流量、服务健康、断路器状态、缓存命中率等核心指标。
 * 数据源：后端 Prometheus / Actuator /metrics（Micrometer 格式）。
 *
 * <p><b>对接方式：</b>后端暴露 {@code /actuator/prometheus} 端点，
 * Nginx 代理到 {@code /api/metrics}，前端请求该端点解析关键指标。
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

import { ElCard, ElProgress, ElTag, ElTimeline, ElTimelineItem } from 'element-plus';

/** 服务健康项 */
interface ServiceHealth {
  name: string;
  status: 'UP' | 'DOWN' | 'DEGRADED';
  uptime: string;
  version: string;
}

/** 断路器状态 */
interface CircuitBreakerState {
  name: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureRate: number;
  slowCallRate: number;
}

/** 缓存指标 */
interface CacheMetrics {
  name: string;
  hitRate: number;
  size: number;
  evictions: number;
}

const loading = ref(false);
const services = ref<ServiceHealth[]>([]);
const circuitBreakers = ref<CircuitBreakerState[]>([]);
const cacheMetrics = ref<CacheMetrics[]>([]);

/** 网关流量 QPS（当前为 mock 数据，对接 Prometheus 后替换） */
const gatewayQps = ref(0);
const gatewayAvgLatency = ref(0);

/**
 * 加载监控数据
 *
 * <p>实际部署时替换为真实 Prometheus API 调用：
 * {@code requestClient.get('/api/metrics/gateway')}，返回结构化指标。
 */
async function loadMetrics() {
  loading.value = true;
  try {
    // TODO: 对接真实 Prometheus/Actuator 端点后替换为 requestClient.get('/api/metrics/gateway')
    // 当前展示结构化的 mock 数据（字段含义与后端 Micrometer 指标一一对应）
    services.value = [
      { name: 'API Gateway', status: 'UP', uptime: '15d 3h 22m', version: '26.09.01' },
      { name: '系统服务 (System)', status: 'UP', uptime: '12d 8h 11m', version: '26.09.01' },
      { name: '用户服务 (UserInfo)', status: 'UP', uptime: '15d 3h 20m', version: '26.09.01' },
      { name: '工作流服务 (Workflow)', status: 'UP', uptime: '10d 1h 05m', version: '26.09.01' },
      { name: '消息服务 (Message)', status: 'DEGRADED', uptime: '8d 12h 44m', version: '26.09.01' },
      { name: '调度服务 (Cronjob)', status: 'UP', uptime: '15d 3h 18m', version: '26.09.01' },
      { name: '规则引擎 (Literule)', status: 'UP', uptime: '7d 6h 30m', version: '26.09.01' },
      { name: '知识库 (NextWiki)', status: 'UP', uptime: '5d 9h 50m', version: '26.09.01' },
      { name: 'AI Agent', status: 'DOWN', uptime: '-', version: '26.09.01' },
    ];

    circuitBreakers.value = [
      { name: 'feign.UserInfoClient', state: 'CLOSED', failureRate: 0.02, slowCallRate: 0.05 },
      { name: 'feign.WorkflowClient', state: 'CLOSED', failureRate: 0.01, slowCallRate: 0.12 },
      { name: 'feign.MessageClient', state: 'HALF_OPEN', failureRate: 0.35, slowCallRate: 0.08 },
      { name: 'redis.CacheCircuitBreaker', state: 'CLOSED', failureRate: 0.0, slowCallRate: 0.01 },
    ];

    cacheMetrics.value = [
      { name: '本地缓存 (W-TinyLFU)', hitRate: 94.2, size: 18432, evictions: 1205 },
      { name: 'Redis 缓存', hitRate: 87.5, size: 524288, evictions: 8921 },
      { name: '字典缓存', hitRate: 99.1, size: 1024, evictions: 0 },
    ];

    gatewayQps.value = 1247;
    gatewayAvgLatency.value = 23;
  } finally {
    loading.value = false;
  }
}

let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  loadMetrics();
  timer = setInterval(loadMetrics, 30000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

/** 状态标签类型 */
const statusTagType = (status: string) => {
  switch (status) {
    case 'UP': return 'success';
    case 'DEGRADED': return 'warning';
    case 'DOWN': return 'danger';
    default: return 'info';
  }
};

/** 断路器状态颜色 */
const circuitBreakerColor = (state: string) => {
  switch (state) {
    case 'CLOSED': return '#67C236';
    case 'HALF_OPEN': return '#E6A23C';
    case 'OPEN': return '#F56C6C';
    default: return '#909399';
  }
};

/** 健康服务比例 */
const healthRatio = computed(() => {
  if (services.value.length === 0) return 0;
  const healthy = services.value.filter((s) => s.status === 'UP').length;
  return Math.round((healthy / services.value.length) * 100);
});
</script>

<template>
  <div class="monitor-dashboard p-4 space-y-6">
    <!-- 顶部关键指标 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
      <ElCard shadow="hover">
        <div class="metric-card">
          <div class="text-sm text-gray-500">网关 QPS</div>
          <div class="text-2xl font-bold mt-1">{{ gatewayQps.toLocaleString() }}</div>
          <div class="text-xs text-gray-400 mt-1">请求 / 秒</div>
        </div>
      </ElCard>
      <ElCard shadow="hover">
        <div class="metric-card">
          <div class="text-sm text-gray-500">平均延迟</div>
          <div class="text-2xl font-bold mt-1">{{ gatewayAvgLatency }}ms</div>
          <div class="text-xs text-gray-400 mt-1">P99: 87ms</div>
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
          <div class="text-2xl font-bold mt-1">
            {{ (cacheMetrics.length ? cacheMetrics.reduce((s, m) => s + m.hitRate, 0) / cacheMetrics.length).toFixed(1) }}%
          </div>
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
