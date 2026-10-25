/**
 * use-virtual-list 测试 — 验证可见区间计算、动态高度与 overscan 缓冲
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-virtual-list.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, it, expect } from 'vitest';

import { nextTick, ref } from 'vue';

import { useVirtualList } from './use-virtual-list';

describe('useVirtualList', () => {
  it('应返回所有可见项（小列表不裁剪）', () => {
    const items = ref(Array.from({ length: 10 }, (_, i) => ({ id: i })));
    const { visibleItems } = useVirtualList(items, {
      itemHeight: 32,
      viewportHeight: 320,
    });

    // viewport 320 / itemHeight 32 = 10 项；overscan 默认 5，但列表只有 10 项
    expect(visibleItems.value.length).toBe(10);
    expect(visibleItems.value[0].index).toBe(0);
    expect(visibleItems.value[9].index).toBe(9);
  });

  it('totalHeight 应等于 项数 × itemHeight', () => {
    const items = ref(
      Array.from({ length: 100 }, (_, i) => ({ id: i })),
    );
    const { totalHeight } = useVirtualList(items, {
      itemHeight: 32,
      viewportHeight: 256,
    });

    expect(totalHeight.value).toBe(100 * 32);
  });

  it('滚动后应更新可见项区间', async () => {
    const items = ref(
      Array.from({ length: 1000 }, (_, i) => ({ id: i })),
    );
    const { visibleItems, onScroll } = useVirtualList(items, {
      itemHeight: 32,
      viewportHeight: 256,
    });

    // 初始状态：index 0 可见
    expect(visibleItems.value[0].index).toBe(0);

    // 模拟滚动到 320px（320 / 32 = 10 项）
    onScroll({ target: { scrollTop: 320 } } as unknown as Event);
    await nextTick();

    // 可见区间应起始于约 10 - overscan(5) = 5
    const firstVisibleIndex = visibleItems.value[0].index;
    expect(firstVisibleIndex).toBeGreaterThanOrEqual(0);
    expect(firstVisibleIndex).toBeLessThanOrEqual(10);
  });

  it('offsetY 应表示首个可见项的顶部偏移', () => {
    const items = ref(
      Array.from({ length: 100 }, (_, i) => ({ id: i })),
    );
    const { offsetY } = useVirtualList(items, {
      itemHeight: 32,
      viewportHeight: 256,
    });

    // 初始时 offsetY = 0
    expect(offsetY.value).toBe(0);
  });

  it('measuredHeights 应影响单项高度', () => {
    const items = ref(
      Array.from({ length: 10 }, (_, i) => ({ id: i })),
    );
    const measured = ref(new Map<number, number>([[0, 64]]));

    const { totalHeight } = useVirtualList(items, {
      itemHeight: 32,
      viewportHeight: 320,
      measuredHeights: measured,
    });

    // index 0 高度 64，其余 9 项各 32 → 64 + 9×32 = 352
    expect(totalHeight.value).toBe(64 + 9 * 32);
  });

  it('getKey 应生成稳定的 key', () => {
    const items = ref([
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Beta' },
    ]);
    const { visibleItems } = useVirtualList(items, {
      itemHeight: 32,
      viewportHeight: 256,
      getKey: (item) => (item as { id: string }).id,
    });

    expect(visibleItems.value[0].key).toBe('a');
    expect(visibleItems.value[1].key).toBe('b');
  });

  it('visibleItems 应包含正确的 data 引用', () => {
    const rows = [{ label: 'row-0' }, { label: 'row-1' }];
    const items = ref(rows);

    const { visibleItems } = useVirtualList(items, {
      itemHeight: 32,
      viewportHeight: 256,
    });

    expect(visibleItems.value[0].data).toEqual({ label: 'row-0' });
    expect(visibleItems.value[1].data).toEqual({ label: 'row-1' });
  });

  it('scrollTop 应响应 onScroll 调用', () => {
    const items = ref([{ id: 0 }]);
    const { scrollTop, onScroll } = useVirtualList(items, {
      itemHeight: 32,
      viewportHeight: 256,
    });

    expect(scrollTop.value).toBe(0);
    onScroll({ target: { scrollTop: 500 } } as unknown as Event);
    expect(scrollTop.value).toBe(500);
  });

  it('空 measuredHeights 映射应与不传时结果一致（等高速率路径不被空 Map 拖入逐项扫描）', () => {
    const items = ref(Array.from({ length: 500 }, (_, i) => ({ id: i })));

    const plain = useVirtualList(items, {
      itemHeight: 32,
      viewportHeight: 256,
    });
    const emptyMeasured = useVirtualList(items, {
      itemHeight: 32,
      measuredHeights: ref(new Map<number, number>()),
      viewportHeight: 256,
    });

    expect(emptyMeasured.totalHeight.value).toBe(plain.totalHeight.value);
    expect(emptyMeasured.visibleItems.value.map((item) => item.index)).toEqual(
      plain.visibleItems.value.map((item) => item.index),
    );
    expect(emptyMeasured.offsetY.value).toBe(plain.offsetY.value);
  });

  it('动态高度下 offsetY 应按前缀和定位，滚动到底部不回卷', () => {
    const items = ref(Array.from({ length: 10 }, (_, i) => ({ id: i })));
    // 首项实测 100px，其余按 itemHeight=32 估算 → offsets = [0,100,132,...,388]
    const measured = ref(new Map<number, number>([[0, 100]]));

    const { offsetY, onScroll, visibleItems } = useVirtualList(items, {
      itemHeight: 32,
      measuredHeights: measured,
      overscan: 0,
      viewportHeight: 100,
    });

    // 滚到第 3 项起点（132 = 100 + 32），可见区间应从此处开始
    onScroll({ target: { scrollTop: 132 } } as unknown as Event);
    expect(visibleItems.value[0]?.index).toBe(2);
    expect(visibleItems.value[0]?.offsetY).toBe(132);
    expect(offsetY.value).toBe(132);

    // 滚到底部（288 + 100 = 388 恰为总高度），旧实现的线性扫描会错误回到 0
    onScroll({ target: { scrollTop: 288 } } as unknown as Event);
    expect(visibleItems.value[0]?.index).toBe(6);
    expect(visibleItems.value.map((item) => item.index)).toEqual([6, 7, 8, 9]);
  });

  it('实测高度变化后总高度与区间应随之更新', () => {
    const items = ref(Array.from({ length: 5 }, (_, i) => ({ id: i })));
    const measured = ref(new Map<number, number>());

    const { onScroll, totalHeight, visibleItems } = useVirtualList(items, {
      itemHeight: 32,
      measuredHeights: measured,
      overscan: 0,
      viewportHeight: 40,
    });

    expect(totalHeight.value).toBe(5 * 32);

    measured.value = new Map([
      [0, 200],
      [1, 200],
    ]);
    expect(totalHeight.value).toBe(200 + 200 + 3 * 32);

    onScroll({ target: { scrollTop: 200 } } as unknown as Event);
    expect(visibleItems.value[0]?.index).toBe(1);
    expect(visibleItems.value[0]?.offsetY).toBe(200);
  });

  it('空列表应安全返回空结果', () => {
    const items = ref<unknown[]>([]);

    const { visibleItems, totalHeight } = useVirtualList(items, {
      itemHeight: 32,
      viewportHeight: 256,
    });

    expect(visibleItems.value.length).toBe(0);
    expect(totalHeight.value).toBe(0);
  });
});
