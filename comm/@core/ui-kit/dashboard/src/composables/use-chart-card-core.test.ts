/**
 * useChartCardCore 单元测试 —— 实例生命周期 / resize / option 合并 / empty 态判定。
 *
 * @path comm\@core\ui-kit\dashboard\src\composables\use-chart-card-core.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { EChartsOption } from 'echarts';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import { mount } from '@vue/test-utils';

import type { Ref } from 'vue';

import { isEmptyOption, useChartCardCore } from './use-chart-card-core';

import type { EChartsInstanceLike } from './use-chart-card-core';

/** 构造一个假的 ECharts 实例 */
function createFakeInstance(): EChartsInstanceLike & {
  setOption: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
  resize: ReturnType<typeof vi.fn>;
} {
  return {
    dispose: vi.fn(),
    resize: vi.fn(),
    setOption: vi.fn(),
  };
}

/** mock echarts 动态导入 */
const initMock = vi.fn();
vi.mock('echarts', () => ({
  default: {
    init: (...args: unknown[]) => initMock(...args),
  },
  init: (...args: unknown[]) => initMock(...args),
}));

/** mock useDark（@vueuse/core） */
const isDarkRef = ref<boolean>(false);
vi.mock('@vueuse/core', () => ({
  useDark: () => isDarkRef,
}));

/**
 * 挂载一个测试宿主组件，在 setup 中调用 useChartCardCore。
 *
 * @param optionRef - 响应式 option
 * @param options - 传递给 useChartCardCore 的额外配置
 * @returns 测试包装器与 composable 句柄
 */
function mountHost(
  optionRef: Ref<EChartsOption>,
  options: { enableDarkTheme?: boolean; notMerge?: boolean } = {},
) {
  let api: ReturnType<typeof useChartCardCore> | null = null;
  const Host = defineComponent({
    setup() {
      const container = ref<HTMLDivElement | null>(null);
      api = useChartCardCore({
        container,
        enableDarkTheme: options.enableDarkTheme,
        notMerge: options.notMerge,
        option: () => optionRef.value,
      });
      return () => h('div', { ref: container });
    },
  });
  const wrapper = mount(Host);
  return { api: api!, wrapper };
}

describe('isEmptyOption', () => {
  it('option 为 null / undefined 时视为空', () => {
    expect(isEmptyOption(null)).toBe(true);
    expect(isEmptyOption(undefined)).toBe(true);
  });

  it('option 无 series 时视为空', () => {
    expect(isEmptyOption({} as EChartsOption)).toBe(true);
    expect(isEmptyOption({ title: { text: 'x' } } as EChartsOption)).toBe(true);
  });

  it('series 为空数组时视为空', () => {
    expect(isEmptyOption({ series: [] } as unknown as EChartsOption)).toBe(true);
  });

  it('series 有数据时不为空', () => {
    expect(isEmptyOption({ series: [{ type: 'line', data: [1, 2] }] } as unknown as EChartsOption)).toBe(false);
  });

  it('单个 series 对象时不为空', () => {
    expect(isEmptyOption({ series: { type: 'line', data: [1] } } as unknown as EChartsOption)).toBe(false);
  });
});

describe('useChartCardCore', () => {
  beforeEach(() => {
    initMock.mockReset();
    isDarkRef.value = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initChart 懒加载 echarts 并设置 option', async () => {
    const fake = createFakeInstance();
    initMock.mockReturnValue(fake);
    const optionRef: Ref<EChartsOption> = shallowRef<EChartsOption>({ series: [{ type: 'line', data: [1] }] } as unknown as EChartsOption);

    const { api, wrapper } = mountHost(optionRef);
    // onMounted 在 mount 后触发，等待异步 initChart
    await vi.waitFor(() => {
      expect(initMock).toHaveBeenCalledTimes(1);
    });

    expect(fake.setOption).toHaveBeenCalledWith(optionRef.value);
    expect(api.isInitializing.value).toBe(false);

    wrapper.unmount();
  });

  it('容器为空时不初始化', async () => {
    // 容器始终为 null 的场景：手动构造一个不渲染 ref 的宿主
    let api: ReturnType<typeof useChartCardCore> | null = null;
    const Host = defineComponent({
      setup() {
        const container = ref<HTMLDivElement | null>(null);
        api = useChartCardCore({ container, option: () => ({}) });
        return () => h('div');
      },
    });
    mount(Host);
    await vi.waitFor(() => {
      // onMounted 已触发，但 container 为 null，initMock 不应被调用
    });
    expect(initMock).not.toHaveBeenCalled();
    expect(api!.isInitializing.value).toBe(true);
  });

  it('重复初始化会先 dispose 旧实例', async () => {
    const fake1 = createFakeInstance();
    const fake2 = createFakeInstance();
    initMock.mockReturnValueOnce(fake1).mockReturnValueOnce(fake2);
    const optionRef: Ref<EChartsOption> = shallowRef<EChartsOption>({});

    const { api, wrapper } = mountHost(optionRef);
    await vi.waitFor(() => {
      expect(initMock).toHaveBeenCalledTimes(1);
    });

    await api.initChart();
    expect(fake1.dispose).toHaveBeenCalledTimes(1);
    expect(initMock).toHaveBeenCalledTimes(2);

    wrapper.unmount();
  });

  it('暗色模式下注入 dark theme', async () => {
    isDarkRef.value = true;
    const fake = createFakeInstance();
    initMock.mockReturnValue(fake);
    const optionRef: Ref<EChartsOption> = shallowRef<EChartsOption>({});

    const { wrapper } = mountHost(optionRef);
    await vi.waitFor(() => {
      expect(initMock).toHaveBeenCalledWith(expect.any(HTMLElement), 'dark');
    });

    wrapper.unmount();
  });

  it('禁用暗色主题时不传 theme', async () => {
    isDarkRef.value = true;
    const fake = createFakeInstance();
    initMock.mockReturnValue(fake);
    const optionRef: Ref<EChartsOption> = shallowRef<EChartsOption>({});

    const { wrapper } = mountHost(optionRef, { enableDarkTheme: false });
    await vi.waitFor(() => {
      expect(initMock).toHaveBeenCalledWith(expect.any(HTMLElement), undefined);
    });

    wrapper.unmount();
  });

  it('watch option 变化触发 setOption', async () => {
    const fake = createFakeInstance();
    initMock.mockReturnValue(fake);
    const optionRef: Ref<EChartsOption> = shallowRef<EChartsOption>({ series: [{ data: [1] }] } as unknown as EChartsOption);

    const { wrapper } = mountHost(optionRef);
    await vi.waitFor(() => {
      expect(initMock).toHaveBeenCalledTimes(1);
    });

    const next = { series: [{ data: [2] }] } as unknown as EChartsOption;
    optionRef.value = next;
    await nextTick();
    expect(fake.setOption).toHaveBeenCalledWith(next, false);

    wrapper.unmount();
  });

  it('notMerge 模式透传给 setOption', async () => {
    const fake = createFakeInstance();
    initMock.mockReturnValue(fake);
    const optionRef: Ref<EChartsOption> = shallowRef<EChartsOption>({ series: [{ data: [1] }] } as unknown as EChartsOption);

    const { wrapper } = mountHost(optionRef, { notMerge: true });
    await vi.waitFor(() => {
      expect(initMock).toHaveBeenCalledTimes(1);
    });

    const next = { series: [{ data: [3] }] } as unknown as EChartsOption;
    optionRef.value = next;
    await nextTick();
    expect(fake.setOption).toHaveBeenCalledWith(next, true);

    wrapper.unmount();
  });

  it('handleResize 调用实例 resize', async () => {
    const fake = createFakeInstance();
    initMock.mockReturnValue(fake);
    const optionRef: Ref<EChartsOption> = shallowRef<EChartsOption>({});

    const { api, wrapper } = mountHost(optionRef);
    await vi.waitFor(() => {
      expect(initMock).toHaveBeenCalledTimes(1);
    });

    api.handleResize();
    expect(fake.resize).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('disposeChart 解绑 resize 并 dispose 实例', async () => {
    const fake = createFakeInstance();
    initMock.mockReturnValue(fake);
    const optionRef: Ref<EChartsOption> = shallowRef<EChartsOption>({});

    const { api, wrapper } = mountHost(optionRef);
    await vi.waitFor(() => {
      expect(initMock).toHaveBeenCalledTimes(1);
    });

    api.disposeChart();
    expect(fake.dispose).toHaveBeenCalledTimes(1);
    expect(api.isInitializing.value).toBe(true);

    wrapper.unmount();
  });

  it('isEmpty 反映 option 的空态', async () => {
    const fake = createFakeInstance();
    initMock.mockReturnValue(fake);
    const optionRef: Ref<EChartsOption> = shallowRef<EChartsOption>({ series: [] } as unknown as EChartsOption);

    const { api, wrapper } = mountHost(optionRef);
    await vi.waitFor(() => {
      expect(initMock).toHaveBeenCalledTimes(1);
    });

    expect(api.isEmpty.value).toBe(true);
    optionRef.value = { series: [{ data: [1] }] } as unknown as EChartsOption;
    await nextTick();
    expect(api.isEmpty.value).toBe(false);

    wrapper.unmount();
  });
});
