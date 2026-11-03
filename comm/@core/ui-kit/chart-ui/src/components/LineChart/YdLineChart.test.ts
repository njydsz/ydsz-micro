/**
 * YdLineChart 组件测试 —— 验证 props 传递与 series 推导。
 *
 * @path comm\@core\ui-kit\chart-ui\src\components\LineChart\YdLineChart.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

const setOptionMock = vi.fn();

vi.mock('echarts', () => {
  const echarts = {
    clear: vi.fn(),
    dispose: vi.fn(),
    hideLoading: vi.fn(),
    init: vi.fn(() => ({
      clear: vi.fn(),
      dispose: vi.fn(),
      hideLoading: vi.fn(),
      on: vi.fn(),
      resize: vi.fn(),
      setOption: setOptionMock,
      showLoading: vi.fn(),
    })),
    on: vi.fn(),
    registerTheme: vi.fn(),
    resize: vi.fn(),
    setOption: setOptionMock,
    showLoading: vi.fn(),
  };
  return { default: echarts, ...echarts };
});

import YdLineChart from './YdLineChart.vue';

/**
 * 冲刷 nextTick，等待 `import('echarts')` 的 Promise 链完成。
 */
async function flushPromises(): Promise<void> {
  for (let index = 0; index < 12; index += 1) {
    await nextTick();
  }
}

describe('YdLineChart', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('应渲染并调用 ECharts 渲染', async () => {
    const wrapper = mount(YdLineChart, {
      props: {
        categories: ['A', 'B'],
        series: [{ data: [1, 2], name: 's1' }],
      },
    });
    await flushPromises();

    expect(wrapper.find('.chart-container').exists()).toBe(true);
    expect(setOptionMock).toHaveBeenCalled();
  });

  it('series 为空时应展示空态', async () => {
    const wrapper = mount(YdLineChart, {
      props: {
        categories: [],
        series: [],
      },
    });
    await flushPromises();

    expect(wrapper.find('[data-testid="chart-empty"]').exists()).toBe(true);
  });

  it('透传 height 与 dark 属性', async () => {
    const wrapper = mount(YdLineChart, {
      props: {
        categories: ['A'],
        dark: true,
        height: 200,
        series: [{ data: [1], name: 's1' }],
      },
    });
    await flushPromises();

    expect(wrapper.find('.chart-container').attributes('style')).toContain('height: 200px');
    expect(wrapper.find('[data-theme]').attributes('data-theme')).toBe('ydsz-dark');
  });
});
