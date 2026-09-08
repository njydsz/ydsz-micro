/**
 * 运维监控 API 封装
 *
 * <p>对应后端 {@code MonitorController}（规划中，当前端点尚未全部上线）。
 * <p>数据源优先级：
 * <ol>
 *   <li>后端结构化 JSON：{@code GET /api/monitor/overview} 等（Micrometer 聚合）</li>
 *   <li>Actuator Prometheus 端点：{@code GET /actuator/prometheus}（Micrometer 原生格式，需前端解析）</li>
 *   <li>Mock 数据兜底：后端端点不可用时使用结构化 mock（字段与真实指标一一对应）</li>
 * </ol>
 *
 * <p>指标字段与后端 {@code SystemMetrics}（Micrometer 前缀 {@code ydsz_system_}）对齐。
 *
 * @path apps/system-web/src/api/monitor.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';

import type {
  CacheMetricsVO,
  CircuitBreakerStateVO,
  MonitorOverviewVO,
  ServiceHealthVO,
} from './monitor-types';

/** 是否启用 mock 兜底（后端端点不可用时切换） */
const ENABLE_MOCK_FALLBACK = true;

// =====================================================================
// 真实 API 端点（后端上线后直接可用）
// =====================================================================

/**
 * 获取监控概览（QPS + 延迟 + 健康度）
 *
 * <p>对应后端 {@code GET /api/monitor/overview}
 *
 * @return 监控概览数据
 */
export async function getMonitorOverview(): Promise<MonitorOverviewVO> {
  return requestClient.get<MonitorOverviewVO>('/api/monitor/overview');
}

/**
 * 获取服务健康状态列表
 *
 * <p>对应后端 {@code GET /api/monitor/services}
 *
 * @return 服务健康状态列表
 */
export async function getMonitorServices(): Promise<ServiceHealthVO[]> {
  return requestClient.get<ServiceHealthVO[]>('/api/monitor/services');
}

/**
 * 获取断路器状态列表
 *
 * <p>对应后端 {@code GET /api/monitor/circuit-breakers}
 *
 * @return 断路器状态列表
 */
export async function getMonitorCircuitBreakers(): Promise<CircuitBreakerStateVO[]> {
  return requestClient.get<CircuitBreakerStateVO[]>('/api/monitor/circuit-breakers');
}

/**
 * 获取缓存指标列表
 *
 * <p>对应后端 {@code GET /api/monitor/cache-metrics}
 *
 * @return 缓存指标列表
 */
export async function getMonitorCacheMetrics(): Promise<CacheMetricsVO[]> {
  return requestClient.get<CacheMetricsVO[]>('/api/monitor/cache-metrics');
}

// =====================================================================
// Mock 兜底数据（字段与真实后端指标一一对应；端点上线后由真实数据替换）
// =====================================================================

/** Mock 兜底：监控概览 */
function mockOverview(): MonitorOverviewVO {
  return {
    gatewayQps: 1247,
    gatewayAvgLatencyMs: 23,
    gatewayP99LatencyMs: 87,
    healthRatio: 89,
    cacheAvgHitRate: 93.6,
  };
}

/** Mock 兜底：服务健康状态 */
function mockServices(): ServiceHealthVO[] {
  return [
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
}

/** Mock 兜底：断路器状态 */
function mockCircuitBreakers(): CircuitBreakerStateVO[] {
  return [
    { name: 'feign.UserInfoClient', state: 'CLOSED', failureRate: 0.02, slowCallRate: 0.05 },
    { name: 'feign.WorkflowClient', state: 'CLOSED', failureRate: 0.01, slowCallRate: 0.12 },
    { name: 'feign.MessageClient', state: 'HALF_OPEN', failureRate: 0.35, slowCallRate: 0.08 },
    { name: 'redis.CacheCircuitBreaker', state: 'CLOSED', failureRate: 0.0, slowCallRate: 0.01 },
  ];
}

/** Mock 兜底：缓存指标 */
function mockCacheMetrics(): CacheMetricsVO[] {
  return [
    { name: '本地缓存 (W-TinyLFU)', hitRate: 94.2, size: 18432, evictions: 1205 },
    { name: 'Redis 缓存', hitRate: 87.5, size: 524_288, evictions: 8921 },
    { name: '字典缓存', hitRate: 99.1, size: 1024, evictions: 0 },
  ];
}

// =====================================================================
// 带 Mock 兜底的统一入口
// =====================================================================

/**
 * 获取监控概览（带 Mock 兜底）
 *
 * <p>后端端点未上线时自动返回 mock 数据，上线后无需修改调用方代码。
 *
 * @return 监控概览数据
 */
export async function loadMonitorOverview(): Promise<MonitorOverviewVO> {
  if (!ENABLE_MOCK_FALLBACK) {
    return getMonitorOverview();
  }
  try {
    return await getMonitorOverview();
  } catch {
    // 端点不可用（404 / 503 / 网络错误），降级到 mock
    return mockOverview();
  }
}

/**
 * 获取服务健康状态列表（带 Mock 兜底）
 *
 * @return 服务健康状态列表
 */
export async function loadMonitorServices(): Promise<ServiceHealthVO[]> {
  if (!ENABLE_MOCK_FALLBACK) {
    return getMonitorServices();
  }
  try {
    return await getMonitorServices();
  } catch {
    return mockServices();
  }
}

/**
 * 获取断路器状态列表（带 Mock 兜底）
 *
 * @return 断路器状态列表
 */
export async function loadMonitorCircuitBreakers(): Promise<CircuitBreakerStateVO[]> {
  if (!ENABLE_MOCK_FALLBACK) {
    return getMonitorCircuitBreakers();
  }
  try {
    return await getMonitorCircuitBreakers();
  } catch {
    return mockCircuitBreakers();
  }
}

/**
 * 获取缓存指标列表（带 Mock 兜底）
 *
 * @return 缓存指标列表
 */
export async function loadMonitorCacheMetrics(): Promise<CacheMetricsVO[]> {
  if (!ENABLE_MOCK_FALLBACK) {
    return getMonitorCacheMetrics();
  }
  try {
    return await getMonitorCacheMetrics();
  } catch {
    return mockCacheMetrics();
  }
}
