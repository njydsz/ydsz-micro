/**
 * use-web-vitals 单元测试
 *
 * 覆盖核心场景：
 * 1. 模拟 LCP 回调，验证 store 收到正确结果
 * 2. 模拟超阈值调用 reportError（monitor.warn 等同路径）
 *
 * @path main\src\composables\__tests__\use-web-vitals.test.ts
 * @author ydsz-team
 * @since 5.2.0
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ===== Mock @ydsz/monitor 模块（before import to ensure hoisting works）=====
const mockReportWebVital = vi.fn();
const mockCustomizeAlertThresholds = vi.fn();
const mockGetAlertThresholds = vi.fn().mockReturnValue({
  CLS: 0.05,
  FCP: 1800,
  FID: 100,
  INP: 200,
  LCP: 2500,
  TTFB: 800,
});
const mockReportError = vi.fn();

vi.mock('@ydsz/monitor', () => ({
  reportWebVital: (...args: unknown[]) => mockReportWebVital(...args),
  customizeAlertThresholds: (...args: unknown[]) =>
    mockCustomizeAlertThresholds(...args),
  getAlertThresholds: () => mockGetAlertThresholds(),
  reportError: (...args: unknown[]) => mockReportError(...args),
}));

// ===== Mock logger =====
vi.mock('@ydsz-core/shared/utils', async (importActual) => {
  const actual =
    await importActual<typeof import('@ydsz-core/shared/utils')>();
  return {
    ...actual,
    createLogger: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  };
});

describe('useWebVitals', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllTimers();
    mockReportWebVital.mockReset();
    mockCustomizeAlertThresholds.mockReset();
    mockGetAlertThresholds.mockReset();
    mockReportError.mockReset();
    mockGetAlertThresholds.mockReturnValue({
      CLS: 0.05,
      FCP: 1800,
      FID: 100,
      INP: 200,
      LCP: 2500,
      TTFB: 800,
    });
    // 重置模块缓存，使每个测试独立
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ==================== Test 1: LCP 回调验证 store ====================

  it('LCP 指标到达后 store 应收到正确结果', async () => {
    // 模拟 performance.getEntriesByType 返回 LCP 数据
    const mockLcpEntry = { startTime: 2100 };
    Object.defineProperty(global, 'performance', {
      value: {
        getEntriesByType: vi.fn().mockImplementation((type: string) => {
          if (type === 'largest-contentful-paint') {
            return [mockLcpEntry];
          }
          return [];
        }),
        now: vi.fn().mockReturnValue(0),
      },
      configurable: true,
    });

    Object.defineProperty(global, 'navigator', {
      value: {
        sendBeacon: vi.fn().mockReturnValue(true),
        onLine: true,
        userAgent: 'test',
      },
      configurable: true,
    });

    Object.defineProperty(global, 'document', {
      value: {
        readyState: 'complete',
        querySelector: vi.fn().mockReturnValue(null),
        addEventListener: vi.fn(),
      },
      configurable: true,
    });

    Object.defineProperty(global, 'requestAnimationFrame', {
      value: (cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      },
      configurable: true,
    });

    Object.defineProperty(global, 'window', {
      value: {
        location: { pathname: '/', hash: '' },
      },
      configurable: true,
    });

    const { vitalsStore, useWebVitals } = await import('../use-web-vitals');

    // 记录初始 store 长度
    const initialLength = vitalsStore.value.length;

    // 调用 composable
    useWebVitals();

    // 等待 rAF 回调执行
    await vi.advanceTimersByTimeAsync(16);

    // store 中应新增至少一条 Web Vital 报告
    expect(vitalsStore.value.length).toBeGreaterThan(initialLength);
    const lastReport = vitalsStore.value[vitalsStore.value.length - 1];
    expect(lastReport).toBeDefined();
    expect(lastReport!.name).toBe('LCP');
    expect(lastReport!.value).toBeCloseTo(2100, 0);
    expect(lastReport!.rating).toBe('good'); // 2100 <= 2500
    expect(lastReport!.page).toContain('/');
    expect(lastReport!.timestamp).toBeTypeOf('number');
  });

  // ==================== Test 2: 超阈值调用 reportError ====================

  it('超 budget 阈值时应调用 reportError 上报 WARN', async () => {
    // 模拟一个超阈值的 LCP 数据（LCP budget = 2500ms，此处 4200ms 明显超标）
    const mockLcpEntry = { startTime: 4200 };
    Object.defineProperty(global, 'performance', {
      value: {
        getEntriesByType: vi.fn().mockImplementation((type: string) => {
          if (type === 'largest-contentful-paint') {
            return [mockLcpEntry];
          }
          return [];
        }),
        now: vi.fn().mockReturnValue(0),
      },
      configurable: true,
    });

    Object.defineProperty(global, 'navigator', {
      value: {
        sendBeacon: vi.fn().mockReturnValue(true),
        onLine: true,
        userAgent: 'test',
      },
      configurable: true,
    });

    Object.defineProperty(global, 'document', {
      value: {
        readyState: 'complete',
        querySelector: vi.fn().mockReturnValue(null),
        addEventListener: vi.fn(),
      },
      configurable: true,
    });

    Object.defineProperty(global, 'requestAnimationFrame', {
      value: (cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      },
      configurable: true,
    });

    Object.defineProperty(global, 'window', {
      value: {
        location: { pathname: '/', hash: '' },
      },
      configurable: true,
    });

    const { useWebVitals } = await import('../use-web-vitals');

    // 调用 composable
    useWebVitals();

    // 等待 rAF 回调执行完成
    await vi.advanceTimersByTimeAsync(16);

    // reportError 应被调用（超阈值告警）
    expect(mockReportError).toHaveBeenCalledTimes(1);

    // 验证调用参数
    const [type, message, extra] = mockReportError.mock.calls[0];
    expect(type).toBe('window');
    expect(message).toContain('LCP');
    expect(message).toContain('4200');
    expect(message).toContain('2500'); // budget 阈值
    expect(extra).toMatchObject({
      metric: 'LCP',
      threshold: 2500,
      value: 4200,
      rating: 'poor',
    });
  });
});
