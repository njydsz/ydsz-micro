// cspell:words pointerdown pointermove pointerup
/**
 * useColumnDrag 单元测试 —— 验证列拖拽排序逻辑。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-column-drag.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */
import { ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useColumnDrag } from './use-column-drag';

describe('useColumnDrag', () => {
  const columns = [
    { id: 'name', label: 'Name' },
    { id: 'age', label: 'Age' },
    { id: 'email', label: 'Email' },
  ];

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
    const { dragState } = useColumnDrag(columns, onReorder);

    expect(dragState.value.isDragging).toBe(false);
    expect(dragState.value.fromIndex).toBe(-1);
    expect(dragState.value.toIndex).toBe(-1);
  });

  it('指针按下时应注册事件监听器', () => {
    const onReorder = vi.fn();
    const { onPointerDown } = useColumnDrag(columns, onReorder);

    const event = {
      clientX: 10,
      clientY: 20,
      pointerId: 1,
    } as PointerEvent;

    onPointerDown(event, 1);

    expect(document.addEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(document.addEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));
  });

  it('canDrag 返回 false 时应阻止拖拽', () => {
    const onReorder = vi.fn();
    const { onPointerDown } = useColumnDrag(columns, onReorder, {
      canDrag: () => false,
    });

    const event = {
      clientX: 10,
      clientY: 20,
      pointerId: 1,
    } as PointerEvent;

    onPointerDown(event, 1);

    expect(document.addEventListener).not.toHaveBeenCalled();
  });

  it('columns 为 ref 时应能正确读取初始状态', () => {
    const colRef = ref(columns);
    const onReorder = vi.fn();
    const { dragState } = useColumnDrag(colRef, onReorder);
    expect(dragState.value.isDragging).toBe(false);
  });

  it('columns 为 getter 函数时应能正确读取', () => {
    const onReorder = vi.fn();
    const { dragState } = useColumnDrag(() => columns, onReorder);
    expect(dragState.value.isDragging).toBe(false);
  });

  it('水平拖拽命中范围内表头应更新目标索引', () => {
    const moveHandlers = mockDragEnvironment(6);
    const onReorder = vi.fn();
    const { dragState, onPointerDown } = useColumnDrag(columns, onReorder);

    onPointerDown(pointer(10, 20), 0);
    fire(moveHandlers, pointer(250, 20));

    expect(dragState.value.isDragging).toBe(true);
    expect(dragState.value.toIndex).toBe(2);
  });

  it('命中索引超出列数时应被忽略，避免越界重排', () => {
    // 页面上存在 6 个 [data-col-drag] 节点，但本表只有 3 列
    const moveHandlers = mockDragEnvironment(6);
    const onReorder = vi.fn();
    const { dragState, onPointerDown } = useColumnDrag(columns, onReorder);

    onPointerDown(pointer(10, 20), 0);
    fire(moveHandlers, pointer(450, 20));

    expect(dragState.value.isDragging).toBe(true);
    expect(dragState.value.toIndex).toBe(0);
    expect(onReorder).not.toHaveBeenCalled();
  });
});

/**
 * 造一组 100px 宽的表头节点并拦截 document 事件，返回 pointermove 回调队列。
 *
 * @param count - 页面上命中 [data-col-drag] 的节点数量
 * @returns 捕获到的 pointermove 处理函数列表
 */
function mockDragEnvironment(count: number) {
  const ths = Array.from({ length: count }, (_, i) => ({
    getBoundingClientRect: () => ({
      bottom: 40,
      height: 40,
      left: i * 100,
      right: (i + 1) * 100,
      top: 0,
      width: 100,
    }),
  }));
  vi.spyOn(document, 'querySelectorAll').mockReturnValue(
    ths as unknown as NodeListOf<Element>,
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
 * 构造最小可用的 PointerEvent 字段集。
 *
 * @param clientX - 指针 X 坐标
 * @param clientY - 指针 Y 坐标
 * @returns 可强转为 PointerEvent 的字面量
 */
function pointer(clientX: number, clientY: number): PointerEvent {
  return { clientX, clientY, pointerId: 1 } as PointerEvent;
}

/**
 * 依次执行捕获到的 pointermove 回调。
 *
 * @param handlers - pointermove 回调队列
 * @param event - 模拟的 PointerEvent
 * @returns 无
 */
function fire(
  handlers: Array<(event: PointerEvent) => void>,
  event: PointerEvent,
): void {
  for (const handler of handlers) {
    handler(event);
  }
}
