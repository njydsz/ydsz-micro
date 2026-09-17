/**
 * useTreeDrag composable 测试 —— 验证树拖拽逻辑。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\headless\use-tree-drag.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, it, expect, vi } from 'vitest';

import { ref } from 'vue';

import { useTreeDrag } from './use-tree-drag';

interface TestNode {
  id: string;
  children?: TestNode[];
  name: string;
}

function createMockOptions(overrides: Record<string, unknown> = {}) {
  const treeData = ref<TestNode[]>([
    { id: '1', name: 'A', children: [{ id: '1-1', name: 'A1' }, { id: '1-2', name: 'A2' }] },
    { id: '2', name: 'B', children: [{ id: '2-1', name: 'B1' }] },
    { id: '3', name: 'C' },
  ]);

  return {
    autoExpandDelay: 600,
    canDrag: undefined,
    expandedKeys: ref(new Set<string>()),
    flattenedNodes: ref([
      { data: treeData.value[0], hasChildren: true, level: 0, value: '1' },
      { data: treeData.value[0].children![0], hasChildren: false, level: 1, value: '1-1' },
      { data: treeData.value[0].children![1], hasChildren: false, level: 1, value: '1-2' },
      { data: treeData.value[1], hasChildren: true, level: 0, value: '2' },
      { data: treeData.value[2], hasChildren: false, level: 0, value: '3' },
    ]),
    getValue: (node: TestNode) => node.id,
    getChildren: (node: TestNode) => node.children ?? [],
    setChildren: (node: TestNode, children: TestNode[]) => {
      node.children = children;
    },
    treeData,
    onReorder: vi.fn(),
    ...overrides,
  };
}

describe('useTreeDrag', () => {
  it('初始状态应未在拖拽中', () => {
    const { dragState } = useTreeDrag(createMockOptions());
    expect(dragState.value.isDragging).toBe(false);
    expect(dragState.value.dragValue).toBeNull();
    expect(dragState.value.overValue).toBeNull();
  });

  it('startDrag 应更新拖拽状态', () => {
    const { dragState, startDrag } = useTreeDrag(createMockOptions());
    const node = { id: '1', name: 'A' };
    startDrag(node, 200);
    expect(dragState.value.isDragging).toBe(true);
    expect(dragState.value.dragValue).toBe('1');
  });

  it('startDrag 对 canDrag=false 的节点应无效', () => {
    const opts = createMockOptions({ canDrag: () => false });
    const { dragState, startDrag } = useTreeDrag(opts);
    startDrag({ id: '1', name: 'A' }, 200);
    expect(dragState.value.isDragging).toBe(false);
  });

  it('handleDragOver 应计算 before 位置', () => {
    const opts = createMockOptions();
    const { dragState, startDrag, handleDragOver } = useTreeDrag(opts);
    startDrag({ id: '1', name: 'A' }, 200);
    // offsetX = 20 (< 25% * 200 = 50) → before
    handleDragOver({ id: '3', name: 'C' }, 20);
    expect(dragState.value.overValue).toBe('3');
    expect(dragState.value.overPosition).toBe('before');
  });

  it('handleDragOver 应计算 after 位置', () => {
    const opts = createMockOptions();
    const { dragState, startDrag, handleDragOver } = useTreeDrag(opts);
    startDrag({ id: '1', name: 'A' }, 200);
    // offsetX = 180 (> 75% * 200 = 150) → after
    handleDragOver({ id: '3', name: 'C' }, 180);
    expect(dragState.value.overValue).toBe('3');
    expect(dragState.value.overPosition).toBe('after');
  });

  it('handleDragOver 应计算 inside 位置（有子节点时）', () => {
    const opts = createMockOptions();
    const { dragState, startDrag, handleDragOver } = useTreeDrag(opts);
    startDrag({ id: '3', name: 'C' }, 200);
    // offsetX = 100 (25% ~ 75%) 且目标有子节点 → inside
    handleDragOver({ id: '1', name: 'A', children: [{ id: 'x', name: 'X' }] }, 100);
    expect(dragState.value.overValue).toBe('1');
    expect(dragState.value.overPosition).toBe('inside');
  });

  it('落点不应在被拖拽节点自身上', () => {
    const opts = createMockOptions();
    const { dragState, startDrag, handleDragOver } = useTreeDrag(opts);
    startDrag({ id: '1', name: 'A' }, 200);
    handleDragOver({ id: '1', name: 'A' }, 100);
    expect(dragState.value.overValue).toBeNull();
  });

  it('endDrag 应在有有效落点时触发 onReorder', () => {
    const onReorder = vi.fn();
    const opts = createMockOptions({ onReorder });
    const { startDrag, handleDragOver, endDrag } = useTreeDrag(opts);
    startDrag({ id: '3', name: 'C' }, 200);
    handleDragOver({ id: '1', name: 'A', children: [{ id: 'x', name: 'X' }] }, 100);
    endDrag();
    expect(onReorder).toHaveBeenCalled();
  });

  it('endDrag 应清理拖拽状态', () => {
    const { dragState, startDrag, endDrag } = useTreeDrag(createMockOptions());
    startDrag({ id: '1', name: 'A' }, 200);
    expect(dragState.value.isDragging).toBe(true);
    endDrag();
    expect(dragState.value.isDragging).toBe(false);
    expect(dragState.value.dragValue).toBeNull();
    expect(dragState.value.overValue).toBeNull();
  });

  it('无有效落点时 endDrag 不应触发 onReorder', () => {
    const onReorder = vi.fn();
    const opts = createMockOptions({ onReorder });
    const { startDrag, endDrag } = useTreeDrag(opts);
    startDrag({ id: '3', name: 'C' }, 200);
    // 不调用 handleDragOver — overValue 保持 null
    endDrag();
    expect(onReorder).not.toHaveBeenCalled();
  });
});
