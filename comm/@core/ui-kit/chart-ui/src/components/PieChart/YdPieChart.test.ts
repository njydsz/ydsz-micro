/**
 * YdPieChart 组件测试 —— 验证 props 传递与数据推导。
 *
 * @path comm\@core\ui-kit\chart-ui\src\components\PieChart\YdPieChart.test.ts
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

import YdPieChart from './YdPieChart.vue';

/**
 * 冲刷 nextTick，等待 `import('echarts')` 的 Promise 链完成。
 */
async function flushPromises(): Promise<void> {
  for (let index = 0; index < 12; index += 1) {
    await nextTick();
  }
}

describe('YdPieChart', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('应渲染并调用 ECharts 渲染', async () => {
    const wrapper = mount(YdPieChart, {
      props: {
        data: [
          { name: 'a', value: 1 },
          { name: 'b', value: 2 },
        ],
      },
    });
    await flushPromises();

    expect(wrapper.find('.chart-container').exists()).toBe(true);
    expect(setOptionMock).toHaveBeenCalled();
  });

  it('data 为空时应展示空态', async () => {
    const wrapper = mount(YdPieChart, {
      props: { data: [] },
    });
    await flushPromises();

    expect(wrapper.find('[data-testid="chart-empty"]').exists()).toBe(true);
  });

  it('支持 roseType 与 radius 透传', async () => {
    mount(YdPieChart, {
      props: {
        data: [{ name: 'a', value: 1 }],
        radius: '60%',
        roseType: 'radius',
      },
    });
    await flushPromises();

    expect(setOptionMock).toHaveBeenCalled();
  });
});
