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
  /**
   * 性能告警端点（超出阈值时主动上报）。
   * 未配置时，告警走 webVitals 端点，附加 `alert=true` 查询参数。
   *
   * @since 1.2.0 (P1-4)
   */
  webVitalsAlert?: string;
}

/** 默认错误上报端点 */
const DEFAULT_ERROR_ENDPOINT = '/api/v1/monitor/error';

/** 默认 Web Vitals 上报端点 */
const DEFAULT_WEB_VITALS_ENDPOINT = '/api/v1/monitor/web-vitals';

/** 默认 Web Vitals 告警上报端点（未配置时使用 webVitals 端点） */
const DEFAULT_WEB_VITALS_ALERT_ENDPOINT = '';

/** 当前生效的端点（初始为默认值） */
let errorEndpoint: string = DEFAULT_ERROR_ENDPOINT;
let webVitalsEndpoint: string = DEFAULT_WEB_VITALS_ENDPOINT;
let webVitalsAlertEndpoint: string = DEFAULT_WEB_VITALS_ALERT_ENDPOINT;

/**
 * 配置上报端点（仅覆盖显式传入项，未传入项保持当前值）
 *
 * ```ts
 * configureMonitorEndpoints({
 *   error: 'https://collector.example.com/api/v1/monitor/error',
 *   webVitalsAlert: 'https://collector.example.com/api/v1/monitor/web-vitals/alert',
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
  if (custom.webVitalsAlert) {
    webVitalsAlertEndpoint = custom.webVitalsAlert;
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

/**
 * 获取 Web Vitals 告警上报端点。
 *
 * <p>返回优先级：显式配置的 alert 端点 > webVitals 端点（附加 ?alert=true）。
 *
 * @returns 实际使用的告警端点 URL
 *
 * @since 1.2.0 (P1-4)
 */
export function getWebVitalsAlertEndpoint(): string {
  if (webVitalsAlertEndpoint) return webVitalsAlertEndpoint;
  // 未配置独立告警端点时，复用 webVitals 端点附加告警标记
  return `${webVitalsEndpoint}?alert=true`;
}
