/**
 * 「API 版本退役提示」响应拦截器（自 preset-interceptors.ts 拆分出的内聚单元）。
 *
 * <p>P1-版本协商闭环（2026-09-01）。后端 ApiVersionHeaderFilter 按 RFC 8594
 * 下发 Deprecation / Sunset 响应头，本拦截器负责在开发期给出可读告警。
 *
 * @path comm\effects\request\src\request-client\preset-interceptors-deprecation.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { ResponseInterceptorConfig } from './types';

import { createLogger } from '@ydsz-core/shared/utils';

/** 模块级日志器 */
const logger = createLogger('preset-interceptors');

/**
 * 已提示退役的接口缓存（URL + 版本标识去重，避免同一接口重复刷屏）
 */
const deprecationWarned = new Set<string>();

/**
 * 创建「API 版本退役提示」响应拦截器（P1-版本协商闭环，2026-09-01）
 *
 * <p>后端 ApiVersionHeaderFilter 按 RFC 8594 下发：
 *
 * <ul>
 *   <li>{@code Deprecation}：接口已标记退役（值为时间戳或版本描述）
 *   <li>{@code Sunset}：计划下线时间（HTTP 日期）
 * </ul>
 *
 * <p>本拦截器必须在 {@link defaultResponseInterceptor} 之前注册 ——
 * 后者会把响应剥离为纯 data，响应头信息随之丢失。
 *
 * <p>默认行为：控制台告警（按 URL + Deprecation 值去重），并通过
 * {@code onDeprecated} 回调暴露给监控/埋点，不阻断请求流程。
 *
 * @param options.onDeprecated 退役接口命中回调（可选，用于上报监控）
 * @returns 响应拦截器配置
 */
export const deprecationNoticeInterceptor = (options: {
  onDeprecated?: (info: { sunset: string; url: string; version: string }) => void;
} = {}): ResponseInterceptorConfig => {
  return {
    fulfilled: (response) => {
      // axios 将响应头键统一小写
      const headers = (response as { headers?: Record<string, unknown> })?.headers ?? {};
      const version = String(headers['deprecation'] ?? '').trim();
      const sunset = String(headers['sunset'] ?? '').trim();

      if (!version && !sunset) {
        return response;
      }

      const url = response?.config?.url ?? 'unknown';
      const dedupeKey = `${url}#${version}`;
      if (!deprecationWarned.has(dedupeKey)) {
        deprecationWarned.add(dedupeKey);
        const sunsetTip = sunset ? `，计划下线时间: ${sunset}` : '';
        logger.warn(`接口 ${url} 已标记退役（Deprecation: ${version || 'true'}${sunsetTip}），请尽快迁移`);
        options.onDeprecated?.({ sunset, url, version });
      }
      return response;
    },
  };
};
