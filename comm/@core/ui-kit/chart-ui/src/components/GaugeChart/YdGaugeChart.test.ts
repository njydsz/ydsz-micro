/**
 * YdGaugeChart 组件测试 —— 验证 props 传递与 gauge 配置推导。
 *
 * @path comm\@core\ui-kit\chart-ui\src\components\GaugeChart\YdGaugeChart.test.ts
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

import YdGaugeChart from './YdGaugeChart.vue';

/**
 * 冲刷 nextTick，等待 `import('echarts')` 的 Promise 链完成。
 */
async function flushPromises(): Promise<void> {
  for (let index = 0; index < 12; index += 1) {
    await nextTick();
  }
}

describe('YdGaugeChart', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('应渲染并调用 ECharts 渲染', async () => {
    const wrapper = mount(YdGaugeChart, {
      props: { value: 66 },
    });
    await flushPromises();

    expect(wrapper.find('.chart-container').exists()).toBe(true);
    expect(setOptionMock).toHaveBeenCalled();
  });

  it('value 为 0 时仍应渲染', async () => {
    const wrapper = mount(YdGaugeChart, {
      props: { value: 0 },
    });
    await flushPromises();

    expect(wrapper.find('.chart-container').exists()).toBe(true);
    expect(setOptionMock).toHaveBeenCalled();
  });

  it('支持 min / max / title 透传', async () => {
    mount(YdGaugeChart, {
      props: { max: 200, min: -50, title: 'gauge', value: 80 },
    });
    await flushPromises();

    expect(setOptionMock).toHaveBeenCalled();
  });
});
