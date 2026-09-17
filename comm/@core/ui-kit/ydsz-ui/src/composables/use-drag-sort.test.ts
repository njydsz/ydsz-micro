// cspell:words draggable
/**
 * useDragSort 单元测试 —— 验证通用拖拽排序逻辑。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-drag-sort.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDragSort } from './use-drag-sort';

describe('useDragSort', () => {
  const items = ['A', 'B', 'C', 'D'];

  beforeEach(() => {
    vi.spyOn(document, 'querySelectorAll').mockReturnValue([] as unknown as NodeListOf<Element>);
    vi.spyOn(document, 'addEventListener').mockImplementation(() => {});
    vi.spyOn(document, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('初始化时不应处于拖拽状态', () => {
    const onReorder = vi.fn();
    const { dragState } = useDragSort({ items, onReorder });

    expect(dragState.value.isDragging).toBe(false);
    expect(dragState.value.fromIndex).toBe(-1);
  });

  it('指针按下应记录初始索引', () => {
    const onReorder = vi.fn();
    const { dragState, getItemProps } = useDragSort({ items, onReorder });

    const props = getItemProps(2) as Record<string, unknown>;
    (props.onPointerdown as (e: PointerEvent) => void)({
      pointerId: 1,
      clientX: 10,
      clientY: 20,
    } as PointerEvent);

    expect(dragState.value.fromIndex).toBe(2);
    expect(dragState.value.toIndex).toBe(2);
  });

  it('canDrag 返回 false 时不应开始拖拽', () => {
    const onReorder = vi.fn();
    const { dragState, getItemProps } = useDragSort({
      canDrag: (idx) => idx !== 2,
      items,
      onReorder,
    });

    const props = getItemProps(2) as Record<string, unknown>;
    (props.onPointerdown as (e: PointerEvent) => void)({
      pointerId: 1,
      clientX: 10,
      clientY: 20,
    } as PointerEvent);

    // 索引 2 被 canDrag 禁止，fromIndex 应保持 -1
    expect(dragState.value.fromIndex).toBe(-1);
  });

  it('getItemProps 应返回正确的 data 属性', () => {
    const onReorder = vi.fn();
    const { getItemProps } = useDragSort({ items, onReorder });

    const props = getItemProps(0) as Record<string, unknown>;
    expect(props['data-drag-sort-item']).toBe('');
  });

  it('getListProps 应包含正确的 data 属性', () => {
    const onReorder = vi.fn();
    const { getListProps } = useDragSort({ items, onReorder });
    expect((getListProps() as Record<string, unknown>)['data-drag-sort-list']).toBe('');
  });
});
