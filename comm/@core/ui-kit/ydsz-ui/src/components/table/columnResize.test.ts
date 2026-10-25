/**
 * useColumnResize composable 测试 —— 验证拖拽列宽逻辑。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\columnResize.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useColumnResize } from './useColumnResize';

describe('useColumnResize', () => {
  beforeEach(() => {
    vi.spyOn(document.body.style, 'cursor', 'set').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应默认未在拖拽中', () => {
    const { isResizing } = useColumnResize();
    expect(isResizing.value).toBe(false);
  });

  it('应默认最小宽度为 60', () => {
    const { columnWidths } = useColumnResize();
    expect(columnWidths.value).toEqual({});
  });

  it('应能设置初始宽度', () => {
    const { columnWidths } = useColumnResize({
      initialWidths: { name: 120, age: 80 },
    });
    expect(columnWidths.value.name).toBe(120);
    expect(columnWidths.value.age).toBe(80);
  });

  it('开始拖拽后 isResizing 应为 true', () => {
    const { isResizing, onResizeStart } = useColumnResize();
    const fakeEvent = {
      clientX: 100,
      preventDefault: () => {},
      stopPropagation: () => {},
    } as unknown as PointerEvent;

    onResizeStart('name', fakeEvent);
    expect(isResizing.value).toBe(true);
  });

  it('开始拖拽后 resizingProp 应为对应列', () => {
    const { resizingProp, onResizeStart } = useColumnResize();
    const fakeEvent = {
      clientX: 100,
      preventDefault: () => {},
      stopPropagation: () => {},
    } as unknown as PointerEvent;

    onResizeStart('age', fakeEvent);
    expect(resizingProp.value).toBe('age');
  });

  it('拖拽移动应更新列宽', () => {
    const { columnWidths, onResizeStart, onResizeMove } = useColumnResize({
      initialWidths: { name: 100 },
    });
    const startEvent = {
      clientX: 200,
      preventDefault: () => {},
      stopPropagation: () => {},
    } as unknown as PointerEvent;

    onResizeStart('name', startEvent);

    const moveEvent = { clientX: 250 } as PointerEvent;
    onResizeMove(moveEvent);

    expect(columnWidths.value.name).toBe(150); // 100 + 50
  });

  it('列宽不应低于最小宽度', () => {
    const { columnWidths, onResizeStart, onResizeMove } = useColumnResize({
      defaultMinWidth: 60,
      initialWidths: { name: 100 },
    });
    const startEvent = {
      clientX: 200,
      preventDefault: () => {},
      stopPropagation: () => {},
    } as unknown as PointerEvent;

    onResizeStart('name', startEvent);

    const moveEvent = { clientX: 100 } as PointerEvent; // 向左拖 100px
    onResizeMove(moveEvent);

    expect(columnWidths.value.name).toBe(60); // clamped at minWidth
  });

  it('拖拽结束应重置状态', () => {
    const { isResizing, resizingProp, onResizeStart, onResizeEnd } = useColumnResize();
    const fakeEvent = {
      clientX: 100,
      preventDefault: () => {},
      stopPropagation: () => {},
    } as unknown as PointerEvent;

    onResizeStart('name', fakeEvent);
    expect(isResizing.value).toBe(true);

    onResizeEnd();
    expect(isResizing.value).toBe(false);
    expect(resizingProp.value).toBeNull();
  });

  it('getColumnWidthStyle 应返回 px 格式', () => {
    const { getColumnWidthStyle } = useColumnResize({
      initialWidths: { name: 120 },
    });
    expect(getColumnWidthStyle('name')).toBe('120px');
  });

  it('getColumnWidthStyle 对未知列应返回 undefined', () => {
    const { getColumnWidthStyle } = useColumnResize();
    expect(getColumnWidthStyle('unknown')).toBeUndefined();
  });

  it('自定义最小宽度应生效', () => {
    const { columnWidths, onResizeStart, onResizeMove } = useColumnResize({
      defaultMinWidth: 80,
      initialWidths: { name: 100 },
    });
    const startEvent = {
      clientX: 200,
      preventDefault: () => {},
      stopPropagation: () => {},
    } as unknown as PointerEvent;

    onResizeStart('name', startEvent);

    const moveEvent = { clientX: 150 } as PointerEvent; // 向左 50px → 应该 clamp 到 80
    onResizeMove(moveEvent);

    expect(columnWidths.value.name).toBe(80);
  });
});
