/**
 * monitor-endpoints.ts — 监控上报端点集中配置
 *
 * 此前错误与 Web Vitals 上报端点硬编码在各自模块中，
 * 跨环境部署（内网网关 / 云端独立采集服务）时无法覆盖。
 * 现将端点收敛到本模块，默认值保持向后兼容，
 * 应用可在 setupMonitor({ endpoints }) 中按环境注入。
 *
 * @path comm/effects/monitor/src/monitor-endpoints.ts
 * @author ydsz-team
 * @since 4.4.0
 */

/** 可配置的上报端点集合 */
export interface MonitorEndpoints {
  /** 错误上报端点，默认 `/api/v1/monitor/error` */
  error?: string;
  /** Web Vitals 上报端点，默认 `/api/v1/monitor/web-vitals` */
  webVitals?: string;
}

/** 默认错误上报端点 */
const DEFAULT_ERROR_ENDPOINT = '/api/v1/monitor/error';

/** 默认 Web Vitals 上报端点 */
const DEFAULT_WEB_VITALS_ENDPOINT = '/api/v1/monitor/web-vitals';

/** 当前生效的端点（初始为默认值） */
let errorEndpoint: string = DEFAULT_ERROR_ENDPOINT;
let webVitalsEndpoint: string = DEFAULT_WEB_VITALS_ENDPOINT;

/**
 * 配置上报端点（仅覆盖显式传入项，未传入项保持当前值）
 *
 * ```ts
 * configureMonitorEndpoints({
 *   error: 'https://collector.example.com/api/v1/monitor/error',
 * });
 * ```
 *
 * @param custom - 自定义端点集合
 */
export function configureMonitorEndpoints(custom?: MonitorEndpoints): void {
  if (!custom) return;
  if (custom.error) {
    errorEndpoint = custom.error;
  }
  if (custom.webVitals) {
    webVitalsEndpoint = custom.webVitals;
  }
}

/** 获取错误上报端点 */
export function getErrorEndpoint(): string {
  return errorEndpoint;
}

/** 获取 Web Vitals 上报端点 */
export function getWebVitalsEndpoint(): string {
  return webVitalsEndpoint;
}
