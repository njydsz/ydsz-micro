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

  it('垂直拖拽命中范围内条目应更新悬停索引', () => {
    const moveHandlers = mockDragEnvironment(6, 'vertical');
    const onReorder = vi.fn();
    const { dragState, getItemProps } = useDragSort({ items, onReorder });

    startDrag(getItemProps, 0, { clientX: 10, clientY: 10 });
    fire(moveHandlers, { clientX: 10, clientY: 250 });

    expect(dragState.value.isDragging).toBe(true);
    expect(dragState.value.toIndex).toBe(2);
  });

  it('命中索引超出 items 数量时应被忽略，避免越界重排', () => {
    // 页面上存在 6 个同 selector 节点，但本列表只有 4 项
    const moveHandlers = mockDragEnvironment(6, 'vertical');
    const onReorder = vi.fn();
    const { dragState, getItemProps } = useDragSort({ items, onReorder });

    startDrag(getItemProps, 0, { clientX: 10, clientY: 10 });
    fire(moveHandlers, { clientX: 10, clientY: 550 });

    expect(dragState.value.isDragging).toBe(true);
    expect(dragState.value.toIndex).toBe(0);
    expect(onReorder).not.toHaveBeenCalled();
  });
});

/**
 * 造一组 100px 高的拖拽节点并拦截 document 事件，返回 pointermove 回调队列。
 *
 * @param count - 页面上命中 selector 的节点数量
 * @param axis - 排列方向，决定 rect 沿 X 还是 Y 递增
 * @returns 捕获到的 pointermove 处理函数列表
 */
function mockDragEnvironment(count: number, axis: 'horizontal' | 'vertical') {
  const els = Array.from({ length: count }, (_, i) => ({
    getBoundingClientRect: () => ({
      bottom: (i + 1) * 100,
      height: 100,
      left: axis === 'horizontal' ? i * 100 : 0,
      right: axis === 'horizontal' ? (i + 1) * 100 : 0,
      top: axis === 'vertical' ? i * 100 : 0,
      width: 100,
    }),
  }));
  vi.spyOn(document, 'querySelectorAll').mockReturnValue(
    els as unknown as NodeListOf<Element>,
  );
  const handlers: Array<(event: PointerEvent) => void> = [];
  vi.spyOn(document, 'addEventListener').mockImplementation(((type: string, listener: unknown) => {
    if (type === 'pointermove') {
      handlers.push(listener as (event: PointerEvent) => void);
    }
  }) as typeof document.addEventListener);
  return handlers;
}

/**
 * 触发列表项上的 pointerdown，进入拖拽准备态。
 *
 * @param getItemProps - useDragSort 返回的条目 props 工厂
 * @param index - 被按下的条目索引
 * @param event - 模拟的 PointerEvent 字段
 * @returns 无
 */
function startDrag(
  getItemProps: (index: number) => Record<string, unknown>,
  index: number,
  event: Record<string, number>,
): void {
  const props = getItemProps(index) as Record<string, unknown>;
  (props.onPointerdown as (e: PointerEvent) => void)(event as PointerEvent);
}

/**
 * 依次执行捕获到的 pointermove 回调。
 *
 * @param handlers - pointermove 回调队列
 * @param event - 模拟的 PointerEvent 字段
 * @returns 无
 */
function fire(
  handlers: Array<(event: PointerEvent) => void>,
  event: Record<string, number>,
): void {
  for (const handler of handlers) {
    handler({ pointerId: 1, ...event } as PointerEvent);
  }
}
