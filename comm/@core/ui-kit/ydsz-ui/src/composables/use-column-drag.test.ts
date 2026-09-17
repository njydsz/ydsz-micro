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
});
