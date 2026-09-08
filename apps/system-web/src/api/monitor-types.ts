/**
 * 运维监控类型定义
 *
 * <p>对应后端 Micrometer 指标（前缀 {@code ydsz_system_}）的结构化视图。
 * <p>该文件非 gen-contract.py 产物，手动维护，与后端 MonitorController 契约对齐。
 *
 * @path apps/system-web/src/api/monitor-types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 服务状态枚举 */
export type ServiceStatus = 'UP' | 'DOWN' | 'DEGRADED';

/** 断路器状态枚举 */
export type CircuitBreakerStateEnum = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/** 服务健康项 */
export interface ServiceHealthVO {
  /** 服务名称 */
  name: string;
  /** 服务状态 */
  status: ServiceStatus;
  /** 运行时长（人类可读） */
  uptime: string;
  /** 服务版本号 */
  version: string;
}

/** 断路器状态 */
export interface CircuitBreakerStateVO {
  /** 断路器名称（资源名） */
  name: string;
  /** 断路器状态 */
  state: CircuitBreakerStateEnum;
  /** 失败率（0~1） */
  failureRate: number;
  /** 慢调用率（0~1） */
  slowCallRate: number;
}

/** 缓存指标 */
export interface CacheMetricsVO {
  /** 缓存名称 */
  name: string;
  /** 命中率（百分比，0~100） */
  hitRate: number;
  /** 当前条目数 */
  size: number;
  /** 累计淘汰数 */
  evictions: number;
}

/** 监控概览 */
export interface MonitorOverviewVO {
  /** 网关 QPS */
  gatewayQps: number;
  /** 平均延迟（ms） */
  gatewayAvgLatencyMs: number;
  /** P99 延迟（ms） */
  gatewayP99LatencyMs: number;
  /** 服务健康度百分比（0~100） */
  healthRatio: number;
  /** 缓存平均命中率 */
  cacheAvgHitRate: number;
}
