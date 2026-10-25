/**
 * YdVirtualTable 行高量测生命周期测试 —— 守卫 ResizeObserver 的登记与回收。
 *
 * <p>历史缺陷：teardown 被写在 onMounted 的返回值里（Vue 不会执行），观察器随
 * 组件卸载一起泄漏；且虚拟滚动替换行 DOM 后新行从未被 observe。
 *
 * <p>云顶编码规范 §5.5 内存管理、§16.10.5 测试必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\virtual-table\YdVirtualTable.test.ts
 * @author ydsz-team
 * @since 26.10.25
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { nextTick } from 'vue';

import { mount } from '@vue/test-utils';

import YdVirtualTable from './YdVirtualTable.vue';

/** 观察器替身的调用记录 */
interface ObserverProbe {
  /** 传入构造函数的回调，供测试手动触发 */
  callback: ResizeObserverCallback;
  /** 被 observe 的元素调用序 */
  observed: Element[];
  /** disconnect 调用次数 */
  disconnected: number;
}

/**
 * 用替身接管全局 ResizeObserver（happy-dom 未实现该 API）。
 *
 * @returns 每次实例化产生的调用记录数组
 */
function stubResizeObserver(): ObserverProbe[] {
  const probes: ObserverProbe[] = [];

  vi.stubGlobal(
    'ResizeObserver',
    class {
      observed: Element[] = [];
      disconnected = 0;

      constructor(callback: ResizeObserverCallback) {
        probes.push({ callback, observed: this.observed, disconnected: 0 });
      }

      disconnect(): void {
        this.disconnected += 1;
        const probe = probes[probes.length - 1];
        if (probe) probe.disconnected = this.disconnected;
      }

      observe(element: Element): void {
        this.observed.push(element);
        const probe = probes[probes.length - 1];
        if (probe) probe.observed = this.observed;
      }

      unobserve(): void {}
    },
  );

  return probes;
}

/** 构造最小可用的列与行数据 */
function makeTableProps(rowCount: number) {
  return {
    columns: [
      { dataIndex: 'name', key: 'name', title: '名称' },
      { dataIndex: 'amount', key: 'amount', title: '金额' },
    ],
    dataSource: Array.from({ length: rowCount }, (_, index) => ({
      amount: index,
      name: `行 ${index}`,
    })),
    estimateRowHeight: 40,
    scrollY: 120,
  };
}

describe('YdVirtualTable 行高量测', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('挂载时应为视口内的行登记量测', () => {
    const probes = stubResizeObserver();

    const wrapper = mount(YdVirtualTable, { props: makeTableProps(3) });

    expect(probes).toHaveLength(1);
    expect(probes[0]?.observed).toHaveLength(3);
    wrapper.unmount();
  });

  it('卸载时必须 disconnect，避免观察器泄漏', () => {
    const probes = stubResizeObserver();

    const wrapper = mount(YdVirtualTable, { props: makeTableProps(3) });
    wrapper.unmount();

    expect(probes[0]?.disconnected).toBe(1);
  });

  it('实测高度应回填为行内联高度，且同批 entry 只触发一次更新', async () => {
    const probes = stubResizeObserver();

    const wrapper = mount(YdVirtualTable, { props: makeTableProps(3) });
    const rows = wrapper.findAll('[data-index]');
    const firstRow = rows[0];
    if (!firstRow) throw new Error('首行未渲染');

    probes[0]?.callback(
      [
        {
          contentRect: { height: 77 } as DOMRectReadOnly,
          target: firstRow.element,
        } as ResizeObserverEntry,
      ],
      {} as ResizeObserver,
    );
    await nextTick();

    expect(firstRow.attributes('style')).toContain('height: 77px');
    wrapper.unmount();
  });

  it('滚动产生新行后应补登记量测', async () => {
    const probes = stubResizeObserver();

    const wrapper = mount(YdVirtualTable, { props: makeTableProps(3) });
    const observedBefore = probes[0]?.observed.length ?? 0;

    // 数据整体替换 → 行 DOM 重建，观察器需重新覆盖新行
    wrapper.setProps({
      dataSource: Array.from({ length: 3 }, (_, index) => ({
        amount: index,
        name: `新行 ${index}`,
      })),
    });
    await nextTick();
    await nextTick();

    expect(probes[0]?.observed.length).toBeGreaterThan(observedBefore);
    wrapper.unmount();
  });
});
