/**
 * YdChart 组件测试 —— 验证 props 透传、容器渲染与空态行为。
 *
 * <p>ECharts 依赖 canvas 与真实布局，测试中 mock `import('echarts')` 为最小桩，
 * 只断言组件自身的渲染与事件契约。
 *
 * @path comm\@core\ui-kit\chart-ui\src\components\Chart\YdChart.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

const initMock = vi.fn();
const disposeMock = vi.fn();
const setOptionMock = vi.fn();
const clearMock = vi.fn();
const resizeMock = vi.fn();
const showLoadingMock = vi.fn();
const hideLoadingMock = vi.fn();
const onMock = vi.fn();

vi.mock('echarts', () => {
  const echarts = {
    clear: clearMock,
    dispose: disposeMock,
    hideLoading: hideLoadingMock,
    init: initMock,
    on: onMock,
    registerTheme: vi.fn(),
    resize: resizeMock,
    setOption: setOptionMock,
    showLoading: showLoadingMock,
  };
  return { default: echarts, ...echarts };
});

import YdChart from './YdChart.vue';

/**
 * 冲刷微任务队列，确保 `import('echarts')` 的 Promise 链完成。
 *
 * <p>`import('echarts')` 在 Vitest 里被 mock 为同步 resolved 的 Promise，
 * 但组件内还有 `await registerTheme(...)` 与 `await nextTick()` 两级链，
 * 单次 nextTick 不足以让 `initializing` 完成翻转。
 */
async function flushPromises(): Promise<void> {
  for (let index = 0; index < 12; index += 1) {
    await nextTick();
  }
}

/**
 * 构造一个最小可用的 ECharts 实例桩。
 */
function setupInstanceMock(): void {
  const instance = {
    clear: clearMock,
    dispose: disposeMock,
    hideLoading: hideLoadingMock,
    on: onMock,
    resize: resizeMock,
    setOption: setOptionMock,
    showLoading: showLoadingMock,
  };
  initMock.mockReset().mockReturnValue(instance);
}

describe('YdChart', () => {
  beforeEach(() => {
    setupInstanceMock();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.documentElement.classList.remove('dark');
  });

  it('应渲染图表容器并携带正确的 data-theme', async () => {
    const wrapper = mount(YdChart, {
      props: { option: { series: [{ data: [1], type: 'line' }] } },
    });
    await flushPromises();

    const container = wrapper.find('.chart-container');
    expect(container.exists()).toBe(true);
    expect(wrapper.find('[data-theme]').attributes('data-theme')).toBe('ydsz-light');
  });

  it('传入 height 数值时应转换为像素高度', () => {
    const wrapper = mount(YdChart, { props: { height: 320 } });

    expect(wrapper.find('.chart-container').attributes('style')).toContain('height: 320px');
  });

  it('无 option 且非 loading 时应展示空态', async () => {
    const wrapper = mount(YdChart, { props: { showEmpty: true } });
    await flushPromises();

    expect(wrapper.find('[data-testid="chart-empty"]').exists()).toBe(true);
  });

  it('series 为空数组时应展示空态', async () => {
    const wrapper = mount(YdChart, { props: { option: { series: [] } } });
    await flushPromises();

    expect(wrapper.find('[data-testid="chart-empty"]').exists()).toBe(true);
  });

  it('初始化完成后不应继续展示 loading', async () => {
    const wrapper = mount(YdChart, { props: { loading: false } });
    await flushPromises();

    expect(wrapper.find('[data-testid="chart-loading"]').exists()).toBe(false);
  });

  it('显式 loading 时应展示 loading 遮罩', async () => {
    const wrapper = mount(YdChart, { props: { loading: true } });
    await flushPromises();

    expect(wrapper.find('[data-testid="chart-loading"]').exists()).toBe(true);
  });

  it('应在挂载时调用 echarts.init', async () => {
    mount(YdChart, { props: { option: { series: [{ data: [1], type: 'line' }] } } });
    await flushPromises();

    expect(initMock).toHaveBeenCalled();
  });

  it('option 变化时应重新 setOption', async () => {
    const wrapper = mount(YdChart, {
      props: { option: { series: [{ data: [1], type: 'line' }] } },
    });
    await flushPromises();

    await wrapper.setProps({ option: { series: [{ data: [2], type: 'line' }] } });
    await flushPromises();

    expect(setOptionMock).toHaveBeenCalled();
  });

  it('根节点存在 .dark 时应使用暗色主题名', async () => {
    document.documentElement.classList.add('dark');
    const wrapper = mount(YdChart, {
      props: { option: { series: [{ data: [1], type: 'line' }] } },
    });
    await flushPromises();

    expect(wrapper.find('[data-theme]').attributes('data-theme')).toBe('ydsz-dark');
  });

  it('卸载时应 dispose ECharts 实例', async () => {
    const wrapper = mount(YdChart, {
      props: { option: { series: [{ data: [1], type: 'line' }] } },
    });
    await flushPromises();

    wrapper.unmount();
    expect(disposeMock).toHaveBeenCalled();
  });
});
