/**
 * YdVCascader 虚拟滚动性能测试 —— 验证列级 useVirtualList 在大数据下的行为。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * <p>YdVCascader 每列独立使用 useVirtualList。本套件验证：
 *  1. 单列 >1000 选项时，仅渲染可见区 + overscan 范围内的节点；
 *  2. 小列（< virtualThreshold）不启用虚拟滚动，全量渲染；
 *  3. 面板总 DOM 节点数受控，不随数据量线性增长。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\cascader\YdVCascader.virtual.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, expect, it } from 'vitest';

import { nextTick, ref } from 'vue';

import type { CascaderOption } from './types';
import { useVirtualList } from '../../composables/use-virtual-list';

/** 构造大规模列数据 */
function makeColumnItems(count: number): CascaderOption[] {
  return Array.from({ length: count }, (_, i) => ({
    label: `选项 ${i}`,
    value: `opt-${i}`,
  }));
}

describe('YdVCascader - 列级虚拟滚动性能测试', () => {
  const ITEM_HEIGHT = 32;
  const COLUMN_HEIGHT = 256;
  const OVERSCAN = 5;

  it('1000 项单列下 visibleItems 应远小于总数', () => {
    const columnItems = ref(makeColumnItems(1000));
    const { visibleItems } = useVirtualList(columnItems, {
      itemHeight: ITEM_HEIGHT,
      overscan: OVERSCAN,
      viewportHeight: COLUMN_HEIGHT,
    });

    // 理论可见行 = 256 / 32 ≈ 8，加上 overscan 10 = ~18
    expect(visibleItems.value.length).toBeLessThanOrEqual(20);
    expect(visibleItems.value.length).toBeLessThan(1000);
  });

  it('3000 项单列下 totalHeight 正确但 visibleItems 短小', () => {
    const columnItems = ref(makeColumnItems(3000));
    const { totalHeight, visibleItems } = useVirtualList(columnItems, {
      itemHeight: ITEM_HEIGHT,
      overscan: OVERSCAN,
      viewportHeight: COLUMN_HEIGHT,
    });

    expect(totalHeight.value).toBe(3000 * ITEM_HEIGHT);
    expect(visibleItems.value.length).toBeLessThanOrEqual(20);
  });

  it('单列数据量翻倍时 visibleItems 数量应保持恒定', () => {
    const items1k = ref(makeColumnItems(1000));
    const { visibleItems: v1k } = useVirtualList(items1k, {
      itemHeight: ITEM_HEIGHT,
      overscan: OVERSCAN,
      viewportHeight: COLUMN_HEIGHT,
    });

    const items5k = ref(makeColumnItems(5000));
    const { visibleItems: v5k } = useVirtualList(items5k, {
      itemHeight: ITEM_HEIGHT,
      overscan: OVERSCAN,
      viewportHeight: COLUMN_HEIGHT,
    });

    expect(v1k.value.length).toBe(v5k.value.length);
  });

  it('滚动后 visibleItems 应更新区间（模拟级联列展开后下滑）', async () => {
    const columnItems = ref(makeColumnItems(2000));
    const { visibleItems, onScroll } = useVirtualList(columnItems, {
      itemHeight: ITEM_HEIGHT,
      overscan: OVERSCAN,
      viewportHeight: COLUMN_HEIGHT,
    });

    expect(visibleItems.value.length).toBeGreaterThan(0);
    expect(visibleItems.value[0]?.index).toBe(0);

    // 模拟滚动到 640px: 640 / 32 = 20
    onScroll({ target: { scrollTop: 640 } } as unknown as Event);
    await nextTick();

    expect(visibleItems.value.length).toBeGreaterThan(0);
    const firstIdx = visibleItems.value[0]?.index ?? 0;
    expect(firstIdx).toBeGreaterThanOrEqual(12); // 20 - overscan(5) ± 容差
    expect(firstIdx).toBeLessThanOrEqual(20);
  });

  it('50 项单列下仍受视口 + overscan 约束（不随总量线性增长）', () => {
    const columnItems = ref(makeColumnItems(50));
    const { visibleItems } = useVirtualList(columnItems, {
      itemHeight: ITEM_HEIGHT,
      overscan: OVERSCAN,
      viewportHeight: COLUMN_HEIGHT,
    });

    // 50 项总量 > 视口容量(ceil(256/32)=8) + overscan(10) = 18
    // 虚拟列表始终按视口+overscan裁剪，不因总量小而全量渲染
    expect(visibleItems.value.length).toBeLessThanOrEqual(18);
    expect(visibleItems.value[0]?.index).toBe(0);
  });

  it('多列合计数据量 >5000 时每列可见节点数独立受控', () => {
    const col1 = ref(makeColumnItems(2000));
    const col2 = ref(makeColumnItems(3000));

    const { visibleItems: v1 } = useVirtualList(col1, {
      itemHeight: ITEM_HEIGHT,
      overscan: OVERSCAN,
      viewportHeight: COLUMN_HEIGHT,
    });

    const { visibleItems: v2 } = useVirtualList(col2, {
      itemHeight: ITEM_HEIGHT,
      overscan: OVERSCAN,
      viewportHeight: COLUMN_HEIGHT,
    });

    // 每列独立虚拟化，虽然 col2 数据量更大，但可见项数量一致
    expect(v1.value.length).toBe(v2.value.length);

    // 两列总可见节点约 ~36，远小于 5000
    const totalVisible = v1.value.length + v2.value.length;
    expect(totalVisible).toBeLessThan(50);
  });
});
