/**
 * use-web-vitals 单元测试
 *
 * 覆盖核心场景：
 * 1. 模拟 LCP 回调，验证 store 收到正确结果
 * 2. 模拟超阈值调用 reportError（monitor.warn 等同路径）
 *
 * <p>环境桩一律用 spyOn / stubGlobal 改写真实全局的单个能力：整只替换
 * global.document 会让 @vue/runtime-dom 在 import 阶段就拿不到 createElement，
 * 整只替换 global.performance 会让 vi.useRealTimers() 还原时撞上只读属性。
 *
 * @path main\src\composables\__tests__\use-web-vitals.test.ts
 * @author ydsz-team
 * @since 5.2.0
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import type * as sharedUtils from '@ydsz-core/shared/utils';

// ===== Mock @ydsz/monitor 模块（before import to ensure hoisting works）=====
const mockReportWebVital = vi.fn();
const mockCustomizeAlertThresholds = vi.fn();
const mockGetAlertThresholds = vi.fn();
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
  const actual = await importActual<typeof sharedUtils>();
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

/** 让 rAF 同步执行，指标采集不依赖真实帧调度 */
function stubAnimationFrame() {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
}

/** 只回放一条 LCP 记录，其余 Performance 类型返回空 */
function stubLcpEntry(startTime: number) {
  vi.spyOn(performance, 'getEntriesByType').mockImplementation(((type: string) =>
    type === 'largest-contentful-paint'
      ? [{ entryType: 'paint', name: 'largest-contentful-paint', startTime }]
      : []) as typeof performance.getEntriesByType);
}

/** 打桩 sendBeacon，避免指标上报走到网络分支 */
function stubSendBeacon() {
  if (typeof navigator.sendBeacon !== 'function') {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon: vi.fn().mockReturnValue(true) });
    return;
  }
  vi.spyOn(navigator, 'sendBeacon').mockReturnValue(true);
}

describe('useWebVitals', () => {
  beforeEach(() => {
    // 先开 fake timers：它会接管 globalThis.performance，spy 必须打在接管后的对象上
    vi.useFakeTimers();
    vi.clearAllTimers();
    mockReportWebVital.mockReset();
    mockCustomizeAlertThresholds.mockReset();
    mockGetAlertThresholds.mockReset();
    mockReportError.mockReset();
    // 重置模块缓存，使每个测试独立（installed 标记与 vitalsStore 都是模块级单例）
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // ==================== Test 1: LCP 回调验证 store ====================

  it('LCP 指标到达后 store 应收到正确结果', async () => {
    stubAnimationFrame();
    stubLcpEntry(2100);
    stubSendBeacon();

    const { vitalsStore, useWebVitals } = await import('../use-web-vitals');

    // 记录初始 store 长度
    const initialLength = vitalsStore.value.length;

    // 调用 composable
    const { isInstalled } = useWebVitals();
    await vi.advanceTimersByTimeAsync(16);

    expect(isInstalled).toBe(true);
    // store 中应新增至少一条 Web Vital 报告
    expect(vitalsStore.value.length).toBeGreaterThan(initialLength);
    const lastReport = vitalsStore.value[vitalsStore.value.length - 1];
    expect(lastReport).toBeDefined();
    expect(lastReport!.name).toBe('LCP');
    expect(lastReport!.value).toBeCloseTo(2100, 0);
    expect(lastReport!.rating).toBe('good'); // 2100 <= 2500
    expect(lastReport!.page).toContain('/');
    expect(lastReport!.timestamp).toBeTypeOf('number');
    // 未超 budget：不应触发告警
    expect(mockReportError).not.toHaveBeenCalled();
    // 阈值表已与 budget 文件对齐后回灌给 monitor
    expect(mockCustomizeAlertThresholds).toHaveBeenCalledWith(expect.objectContaining({ LCP: 2500 }));
  });

  // ==================== Test 2: 超阈值调用 reportError ====================

  it('超 budget 阈值时应调用 reportError 上报 WARN', async () => {
    stubAnimationFrame();
    // LCP budget = 2500ms，此处 4200ms 明显超标
    stubLcpEntry(4200);
    stubSendBeacon();

    const { useWebVitals } = await import('../use-web-vitals');

    useWebVitals();
    await vi.advanceTimersByTimeAsync(16);

    // reportError 应被调用（超阈值告警）
    expect(mockReportError).toHaveBeenCalledTimes(1);

    // 验证调用参数
    const [type, message, extra] = mockReportError.mock.calls[0]!;
    expect(type).toBe('window');
    expect(message).toContain('LCP');
    expect(message).toContain('4200');
    expect(message).toContain('2500'); // budget 阈值
    expect(extra).toMatchObject({
      metric: 'LCP',
      rating: 'poor',
      threshold: 2500,
      value: 4200,
    });
  });
});
