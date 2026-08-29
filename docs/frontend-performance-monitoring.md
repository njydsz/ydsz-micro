# 前端性能监控 RUM 体系指南

> 更新日期：2026-08-29
> 相关规范：云顶编码规范 §20 性能规范

## 背景

项目当前有 Lighthouse CI 性能预算（Performance ≥ 0.9, LCP ≤ 2500ms, CLS ≤ 0.1），但缺少真实用户监控（RUM）。Lighthouse 是实验室数据，无法反映真实用户体验。

## 监控架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          前端性能监控架构                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐  │
│  │ 数据采集     │───▶│ 数据上报     │───▶│ 数据存储     │───▶│ 数据展示 │  │
│  │              │    │              │    │              │    │          │  │
│  │ Web Vitals   │    │ Beacon API   │    │ Sentry /     │    │ Grafana  │  │
│  │ Performance  │    │ Fetch API    │    │ 自建服务     │    │ Dashboard│  │
│  │ 自定义指标   │    │ 批量上报     │    │              │    │          │  │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 核心指标（Web Vitals）

| 指标 | 说明 | 优秀 | 需改进 | 差 |
|------|------|------|--------|-----|
| **LCP** | 最大内容绘制 | ≤ 2.5s | 2.5-4s | > 4s |
| **INP** | 交互到下次绘制 | ≤ 200ms | 200-500ms | > 500ms |
| **CLS** | 累积布局偏移 | ≤ 0.1 | 0.1-0.25 | > 0.25 |
| **FCP** | 首次内容绘制 | ≤ 1.8s | 1.8-3s | > 3s |
| **TTFB** | 首字节时间 | ≤ 800ms | 800-1800ms | > 1800ms |

## 实施方案

### 1. 数据采集

```typescript
// utils/performance-monitor.ts
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

/**
 * 性能数据采集器
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Record<string, number> = {};
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 启动监控
   */
  start() {
    // Web Vitals 核心指标
    this.collectWebVitals();
    
    // 资源加载监控
    this.collectResourceTiming();
    
    // 长任务监控
    this.collectLongTasks();
    
    // 错误监控
    this.collectErrors();
  }

  /**
   * 采集 Web Vitals
   */
  private collectWebVitals() {
    onLCP((metric) => {
      this.metrics.lcp = metric.value;
      this.report('lcp', metric.value, metric);
    });

    onINP((metric) => {
      this.metrics.inp = metric.value;
      this.report('inp', metric.value, metric);
    });

    onCLS((metric) => {
      this.metrics.cls = metric.value;
      this.report('cls', metric.value, metric);
    });

    onFCP((metric) => {
      this.metrics.fcp = metric.value;
      this.report('fcp', metric.value, metric);
    });

    onTTFB((metric) => {
      this.metrics.ttfb = metric.value;
      this.report('ttfb', metric.value, metric);
    });
  }

  /**
   * 采集资源加载时间
   */
  private collectResourceTiming() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          
          // 只关注慢资源（> 1s）
          if (resource.duration > 1000) {
            this.report('slow-resource', resource.duration, {
              name: resource.name,
              type: resource.initiatorType,
              duration: resource.duration,
            });
          }
        }
      }
    });

    observer.observe({ type: 'resource', buffered: true });
    this.observers.push(observer);
  }

  /**
   * 采集长任务（> 50ms）
   */
  private collectLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          this.report('long-task', entry.duration, {
            name: entry.name,
            duration: entry.duration,
          });
        }
      }
    });

    observer.observe({ type: 'longtask', buffered: true });
    this.observers.push(observer);
  }

  /**
   * 采集错误
   */
  private collectErrors() {
    window.addEventListener('error', (event) => {
      this.report('error', 1, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.report('unhandledrejection', 1, {
        reason: String(event.reason),
      });
    });
  }

  /**
   * 上报数据
   */
  private report(name: string, value: number, details?: unknown) {
    // 批量上报（使用 sendBeacon 或 fetch）
    const data = {
      name,
      value,
      details,
      page: window.location.pathname,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      traceId: this.getTraceId(),
    };

    // 使用 sendBeacon 确保数据发送（页面关闭时也能发送）
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/v1/metrics/performance', JSON.stringify(data));
    } else {
      fetch('/api/v1/metrics/performance', {
        method: 'POST',
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(() => {});
    }
  }

  /**
   * 获取 TraceId（与后端关联）
   */
  private getTraceId(): string {
    // 从响应头或 Cookie 获取
    return document.cookie.match(/traceId=([^;]+)/)?.[1] || '';
  }

  /**
   * 销毁监控
   */
  destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

/**
 * 启动性能监控
 */
export function initPerformanceMonitor() {
  if (import.meta.env.PROD) {
    const monitor = PerformanceMonitor.getInstance();
    monitor.start();
  }
}
```

### 2. 自定义指标采集

```typescript
// utils/custom-metrics.ts
/**
 * 自定义业务指标
 */
export class CustomMetrics {
  private static metrics: Record<string, number[]> = {};

  /**
   * 记录页面加载时间
   */
  static recordPageLoad(pageName: string, duration: number) {
    this.record(`page-load:${pageName}`, duration);
  }

  /**
   * 记录 API 调用时间
   */
  static recordApiCall(api: string, duration: number, success: boolean) {
    this.record(`api:${api}:duration`, duration);
    this.record(`api:${api}:success`, success ? 1 : 0);
  }

  /**
   * 记录组件渲染时间
   */
  static recordComponentRender(componentName: string, duration: number) {
    this.record(`component:${componentName}:render`, duration);
  }

  /**
   * 记录用户交互时间
   */
  static recordInteraction(action: string, duration: number) {
    this.record(`interaction:${action}`, duration);
  }

  private static record(name: string, value: number) {
    if (!this.metrics[name]) {
      this.metrics[name] = [];
    }
    this.metrics[name].push(value);
  }

  /**
   * 获取统计信息
   */
  static getStats(name: string) {
    const values = this.metrics[name] || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      avg: sum / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  /**
   * 获取所有指标
   */
  static getAllStats() {
    const result: Record<string, unknown> = {};
    for (const name of Object.keys(this.metrics)) {
      result[name] = this.getStats(name);
    }
    return result;
  }
}
```

### 3. Vue 插件集成

```typescript
// plugins/performance.ts
import type { App } from 'vue';
import { initPerformanceMonitor } from '@/utils/performance-monitor';
import { CustomMetrics } from '@/utils/custom-metrics';

/**
 * 性能监控插件
 */
export const performancePlugin = {
  install(app: App) {
    // 启动 Web Vitals 监控
    initPerformanceMonitor();

    // 路由切换性能监控
    app.config.globalProperties.$router?.afterEach((to, from) => {
      if (to.path !== from.path) {
        // 记录页面切换时间
        performance.mark(`page-${to.path}-start`);
      }
    });

    // 组件渲染性能监控
    const originalMount = app.mount;
    app.mount = function (...args) {
      performance.mark('app-mount-start');
      const result = originalMount.apply(this, args);
      performance.mark('app-mount-end');
      performance.measure('app-mount', 'app-mount-start', 'app-mount-end');

      const measure = performance.getEntriesByName('app-mount')[0];
      CustomMetrics.recordPageLoad('app', measure.duration);

      return result;
    };
  },
};
```

### 4. 后端接收接口

```java
/**
 * 性能指标接收 Controller
 */
@RestController
@RequestMapping("/api/v1/metrics")
public class MetricsController {

    private final PerformanceMetricsService metricsService;

    @PostMapping("/performance")
    public YdszResponse<Void> reportPerformance(@RequestBody PerformanceMetricDTO metric) {
        metricsService.save(metric);
        return YdszResponse.success(null);
    }

    @GetMapping("/dashboard")
    public YdszResponse<PerformanceDashboardVO> getDashboard(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return YdszResponse.success(metricsService.getDashboard(date));
    }
}

/**
 * 性能指标 DTO
 */
@Data
public class PerformanceMetricDTO {
    private String name;       // 指标名称（lcp, inp, cls 等）
    private Double value;      // 指标值
    private String page;       // 页面路径
    private Long timestamp;    // 时间戳
    private String userAgent;  // 用户代理
    private String traceId;    // 链路追踪 ID
    private Object details;    // 详细信息
}
```

### 5. 数据看板

```sql
-- 性能指标表
CREATE TABLE ydsz_sys_performance_metric (
    id              VARCHAR(32)     NOT NULL,
    metric_name     VARCHAR(64)     NOT NULL,
    metric_value    DOUBLE PRECISION NOT NULL,
    page_path       VARCHAR(256),
    user_agent      VARCHAR(512),
    trace_id        VARCHAR(64),
    tenant_id       VARCHAR(32),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_performance_metric PRIMARY KEY (id)
);

-- 索引
CREATE INDEX idx_perf_metric_name_time ON ydsz_sys_performance_metric(metric_name, created_at);
CREATE INDEX idx_perf_page_time ON ydsz_sys_performance_metric(page_path, created_at);
```

## 告警配置

```yaml
# 性能告警规则
performance-alerts:
  rules:
    - name: LCP 过高
      condition: lcp.p90 > 4000
      severity: warning
      notification: feishu
    
    - name: CLS 过高
      condition: cls.p90 > 0.25
      severity: critical
      notification: feishu
    
    - name: API 慢请求
      condition: api.duration.p99 > 3000
      severity: warning
      notification: feishu
    
    - name: 错误率过高
      condition: error.rate > 0.01
      severity: critical
      notification: phone
```

## 与 Sentry 集成

```typescript
// 项目已集成 Sentry，可直接使用
import * as Sentry from '@sentry/vue';

// 性能追踪
Sentry.startTransaction({
  name: 'config-list-load',
  op: 'navigation',
});

// 自定义指标
Sentry.setMeasurement('lcp', lcpValue, 'millisecond');
Sentry.setMeasurement('cls', clsValue, '');

// 错误上报
Sentry.captureException(error);
```

## 性能预算

| 指标 | 预算 | 告警阈值 |
|------|------|---------|
| LCP | ≤ 2.5s | > 4s |
| INP | ≤ 200ms | > 500ms |
| CLS | ≤ 0.1 | > 0.25 |
| FCP | ≤ 1.8s | > 3s |
| TTFB | ≤ 800ms | > 1800ms |
| 首屏 JS | ≤ 200KB | > 300KB |
| 首屏 CSS | ≤ 100KB | > 150KB |

## 相关文件

- 前端监控：`utils/performance-monitor.ts`
- 后端接口：`MetricsController`
- 数据表：`ydsz_sys_performance_metric`
- Sentry 配置：`plugins/sentry.ts`
