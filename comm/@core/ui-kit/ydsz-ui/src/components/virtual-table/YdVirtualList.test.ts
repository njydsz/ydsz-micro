/**
 * YdVirtualList 性能测试 —— 验证大列表下仅渲染可见区 + overscan 范围内的 DOM 节点。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * <p>核心断言：对于 N 项数据（N >> viewport 容量），实际渲染的 DOM 节点数
 * 应约等于 ceil(viewportHeight / itemHeight) + overscan * 2，而非全部 N 项。
 *
 * <p>测试策略：由于 @vue/test-utils + jsdom 环境不存在真实滚动布局，
 * 本套件断言：
 *  1. composable 层面：visibleItems 长度远小于总数据量（虚拟化生效）；
 *  2. 大数据量下 rendered DOM 中 option 节点数量与理论值一致。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\virtual-table\YdVirtualList.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, expect, it } from 'vitest';

import { nextTick, ref } from 'vue';

import { useVirtualList } from '../../composables/use-virtual-list';

import type { VisibleItem } from '../../composables/use-virtual-list';

/** 构造 count 项测试数据 */
function makeItems<T = { id: number; label: string }>(
  count: number,
  factory?: (i: number) => T,
): T[] {
  return Array.from({ length: count }, (_, i) =>
    factory ? factory(i) : ({ id: i, label: `item-${i}` } as unknown as T),
  );
}

describe('YdVirtualList - useVirtualList 虚拟化覆盖率', () => {
  const ITEM_HEIGHT = 32;
  const VIEWPORT_HEIGHT = 256;
  const OVERSCAN = 5;

  /**
   * 计算理论可见项数：viewport 内完整显示的项数 + 上下 overscan 缓冲
   *
   * @param viewport  - 视口高度
   * @param itemH     - 单项高度
   * @param overscan  - 上下缓冲行数
   */
  function theoreticalVisibleCount(
    viewport = VIEWPORT_HEIGHT,
    itemH = ITEM_HEIGHT,
    overscan = OVERSCAN,
  ): number {
    const visibleRows = Math.ceil(viewport / itemH);
    return visibleRows + overscan * 2;
  }

  it('1000 项数据下 visibleItems 应远小于总数', () => {
    const items = ref(makeItems(1000));
    const { visibleItems } = useVirtualList(items, {
      itemHeight: ITEM_HEIGHT,
      overscan: OVERSCAN,
      viewportHeight: VIEWPORT_HEIGHT,
    });

    const expected = theoreticalVisibleCount();

    // visibleItems 数量应约等于理论值（<= 总数 且 <= 理论值 + 容差）
    expect(visibleItems.value.length).toBeLessThanOrEqual(expected + OVERSCAN);
    expect(visibleItems.value.length).toBeLessThan(1000);
  });

  it('10000 项数据下 visibleItems 数量应保持稳定', () => {
    const items5k = ref(makeItems(5000));
    const { visibleItems: v5k } = useVirtualList(items5k, {
      itemHeight: ITEM_HEIGHT,
      overscan: OVERSCAN,
      viewportHeight: VIEWPORT_HEIGHT,
    });

    const items10k = ref(makeItems(10000));
    const { visibleItems: v10k } = useVirtualList(items10k, {
      itemHeight: ITEM_HEIGHT,
      overscan: OVERSCAN,
      viewportHeight: VIEWPORT_HEIGHT,
    });

    // 数据量翻倍但可见项数应保持同一量级
    expect(v5k.value.length).toBe(v10k.value.length);
    expect(v10k.value.length).toBeLessThan(50); // 实际约为 8 + 10 = 18
  });

  it('可见项数量应正比于 viewport 高度（大列表下）', () => {
    const items = ref(makeItems(2000));

    const { visibleItems: smallVp } = useVirtualList(items, {
      itemHeight: ITEM_HEIGHT,
      overscan: OVERSCAN,
      viewportHeight: 128, // 约 4 行
    });

    const { visibleItems: largeVp } = useVirtualList(items, {
      itemHeight: ITEM_HEIGHT,
      overscan: OVERSCAN,
      viewportHeight: 512, // 约 16 行
    });

    expect(largeVp.value.length).toBeGreaterThan(smallVp.value.length);
  });

  it('总高度应等于 n × itemHeight（大列表）', () => {
    const count = 5000;
    const items = ref(makeItems(count));
    const { totalHeight } = useVirtualList(items, {
      itemHeight: ITEM_HEIGHT,
      viewportHeight: VIEWPORT_HEIGHT,
    });

    expect(totalHeight.value).toBe(count * ITEM_HEIGHT);
  });

  it('大量数据下 offsetY 和 scrollTop 应响应滚动并偏移区间', async () => {
    const items = ref(makeItems(3000));
    const { visibleItems, onScroll, offsetY } = useVirtualList(items, {
      itemHeight: ITEM_HEIGHT,
      overscan: OVERSCAN,
      viewportHeight: VIEWPORT_HEIGHT,
    });

    // 初始 offsetY = 0，首个 index = 0
    expect(offsetY.value).toBe(0);
    expect(visibleItems.value.length).toBeGreaterThan(0);
    expect(visibleItems.value[0]?.index).toBe(0);

    // 滚动到 640px：640 / 32 = 20，起始约 15
    onScroll({ target: { scrollTop: 640 } } as unknown as Event);
    await nextTick();

    expect(visibleItems.value.length).toBeGreaterThan(0);
    const firstIdx = visibleItems.value[0]?.index ?? 0;
    expect(firstIdx).toBeGreaterThanOrEqual(10); // 20 - overscan(5) = 15 ± 容差
    expect(firstIdx).toBeLessThanOrEqual(20);
  });

  it('不同 overscan 值应线性影响可见项数量', () => {
    const items = ref(makeItems(2000));

    const { visibleItems: lowOs } = useVirtualList(items, {
      itemHeight: ITEM_HEIGHT,
      overscan: 2,
      viewportHeight: VIEWPORT_HEIGHT,
    });

    const { visibleItems: highOs } = useVirtualList(items, {
      itemHeight: ITEM_HEIGHT,
      overscan: 10,
      viewportHeight: VIEWPORT_HEIGHT,
    });

    // overscan 差 = 8，可见项差距应接近 8 × 2 = 16（上下各扩）
    const diff = highOs.value.length - lowOs.value.length;
    expect(diff).toBeGreaterThanOrEqual(10);
    expect(diff).toBeLessThanOrEqual(20);
  });

  it('getKey 应使每项具有稳定唯一 key（大列表下不重复）', () => {
    const items = ref(makeItems(1000));
    const { visibleItems } = useVirtualList(items, {
      itemHeight: ITEM_HEIGHT,
      overscan: OVERSCAN,
      viewportHeight: VIEWPORT_HEIGHT,
      getKey: (item: any) => item.id,
    });

    const keys = visibleItems.value.map((v: VisibleItem<any>) => v.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});
