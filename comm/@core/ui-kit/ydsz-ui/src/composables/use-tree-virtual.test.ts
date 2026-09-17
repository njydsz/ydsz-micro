// cspell:words virtualnode
/**
 * useTreeVirtual 单元测试 —— 验证树形虚拟滚动调度逻辑。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-tree-virtual.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */
import { describe, expect, it, vi } from 'vitest';

import { nextTick, ref } from 'vue';

import type { FlatTreeNode } from './use-tree-virtual';
import { useTreeVirtual } from './use-tree-virtual';

function makeFlatNodes(): FlatTreeNode[] {
  return [
    { data: { label: 'Root1' }, hasChildren: true, level: 0, parents: [], value: '1' },
    { data: { label: 'Child1-1' }, hasChildren: false, level: 1, parents: ['1'], value: '1-1' },
    { data: { label: 'Child1-2' }, hasChildren: false, level: 1, parents: ['1'], value: '1-2' },
    { data: { label: 'Root2' }, hasChildren: true, level: 0, parents: [], value: '2' },
    { data: { label: 'Child2-1' }, hasChildren: false, level: 1, parents: ['2'], value: '2-1' },
  ];
}

describe('useTreeVirtual', () => {
  it('无展开时只应展示根节点', () => {
    const nodes = ref(makeFlatNodes());
    const expandedKeys = ref<Set<string | number>>(new Set());

    const handle = useTreeVirtual({
      expandedKeys,
      flattenedNodes: nodes,
      itemHeight: 28,
      viewportHeight: 100,
    });

    expect(handle.expandedVisibleNodes.value.length).toBe(2);
    expect(handle.expandedVisibleNodes.value[0].value).toBe('1');
    expect(handle.expandedVisibleNodes.value[1].value).toBe('2');
  });

  it('展开某节点后应包含其子孙', () => {
    const nodes = ref(makeFlatNodes());
    const expandedKeys = ref<Set<string | number>>(new Set(['1']));

    const handle = useTreeVirtual({
      expandedKeys,
      flattenedNodes: nodes,
      itemHeight: 28,
      viewportHeight: 200,
    });

    // Root1 + Child1-1 + Child1-2 + Root2 = 4
    expect(handle.expandedVisibleNodes.value.length).toBe(4);
  });

  it('totalHeight 应与展开后的节点数匹配', () => {
    const nodes = ref(makeFlatNodes());
    const expandedKeys = ref<Set<string | number>>(new Set(['1', '2']));

    const handle = useTreeVirtual({
      expandedKeys,
      flattenedNodes: nodes,
      itemHeight: 28,
      viewportHeight: 200,
    });

    // 所有 5 个节点全部可见
    expect(handle.totalHeight.value).toBe(28 * 5);
  });

  it('可见切片长度应不超过视口容量 + overscan', () => {
    const nodes = ref(makeFlatNodes());
    const expandedKeys = ref<Set<string | number>>(new Set(['1', '2']));

    const handle = useTreeVirtual({
      expandedKeys,
      flattenedNodes: nodes,
      itemHeight: 28,
      overscan: 3,
      viewportHeight: 84, // ~3 rows
    });

    // 可见切片 = visibleCount(3) + overscan*2(6) = 最多 9，但节点总数只有 5
    expect(handle.visibleSlice.value.length).toBe(5);
  });

  it('滚动更新 scrollTop 后应偏移切片', async () => {
    const nodes = ref(makeFlatNodes());
    const expandedKeys = ref<Set<string | number>>(new Set(['1', '2']));

    const handle = useTreeVirtual({
      expandedKeys,
      flattenedNodes: nodes,
      itemHeight: 28,
      overscan: 0,
      viewportHeight: 56,
    });

    // 模拟滚动：scrollTop=56，itemHeight=28 → startIndex=2 → offsetY=56
    const event = { target: { scrollTop: 56 } } as unknown as Event;
    handle.onScroll(event);
    await nextTick();

    expect(handle.offsetY.value).toBe(56);
  });

  it('lazyLoad 回调应能被调用', async () => {
    const nodes = ref(makeFlatNodes());
    const expandedKeys = ref<Set<string | number>>(new Set());
    const onLoad = vi.fn();

    const handle = useTreeVirtual({
      expandedKeys,
      flattenedNodes: nodes,
      onLazyLoad: onLoad,
    });

    await handle.loadLazyNode('1');
    expect(onLoad).toHaveBeenCalledWith(
      expect.objectContaining({ value: '1', level: 0 }),
    );
  });
});
