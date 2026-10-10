/**
 * use-flow-designer 组合式函数单元测试
 *
 * <p>覆盖设计器核心交互：节点选中、Delete 快捷键删除、Ctrl+C/V 复制粘贴、
 * 画布缩放与居中快捷键。
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\effects\shared-business\src\composables\use-flow-designer.test.ts
 * @author ydsz-team
 * @since 26.09.24
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { FlowNode, FlowCanvasControls } from './use-flow-designer';

/** 模拟节点列表 */
const mockNodes: FlowNode[] = [
  { id: 'node-1', type: 'start', label: '开始' },
  { id: 'node-2', type: 'task', label: '审批' },
  { id: 'node-3', type: 'end', label: '结束' },
];

/** 模拟画布控件 */
function createMockControls(): FlowCanvasControls {
  return {
    center: vi.fn(),
    copyNode: vi.fn(),
    deleteNode: vi.fn(),
    getZoom: vi.fn(() => 1),
    pasteNode: vi.fn(),
    zoom: vi.fn(),
  };
}

describe('use-flow-designer', () => {
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    // 避免关键事件监听器在 tests 间泄漏：强制清理所有 keydown 监听
    vi.restoreAllMocks();
  });

  it('正常路径：selectNode 应更新 selectedNodeId', async () => {
    const { useFlowDesigner } = await import('./use-flow-designer');
    const controls = createMockControls();
    const designer = useFlowDesigner({ controls, nodes: mockNodes });

    designer.selectNode(mockNodes[1]);

    expect(designer.selectedNodeId.value).toBe('node-2');
    expect(designer.getSelectedNode()).toEqual(mockNodes[1]);
  });

  it('正常路径：clearSelection 应清空选中状态', async () => {
    const { useFlowDesigner } = await import('./use-flow-designer');
    const controls = createMockControls();
    const designer = useFlowDesigner({ controls, nodes: mockNodes });

    designer.selectNode(mockNodes[0]);
    designer.clearSelection();

    expect(designer.selectedNodeId.value).toBeNull();
    expect(designer.getSelectedNode()).toBeNull();
  });

  it('正常路径：按下 Delete 键应调用 controls.deleteNode 并清空选中', async () => {
    const { useFlowDesigner } = await import('./use-flow-designer');
    const controls = createMockControls();
    const designer = useFlowDesigner({ controls, nodes: mockNodes });

    designer.selectNode(mockNodes[1]);

    const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
    window.dispatchEvent(deleteEvent);

    // 源码通过内部获取 selected 后调用 controls.deleteNode
    expect(controls.deleteNode).toHaveBeenCalledWith('node-2');
    expect(designer.selectedNodeId.value).toBeNull();
  });

  it('正常路径：Ctrl+C 选中节点后，Ctrl+V 应能调起粘贴（验证内部剪贴板连通）', async () => {
    const { useFlowDesigner } = await import('./use-flow-designer');
    const controls = createMockControls();
    const designer = useFlowDesigner({ controls, nodes: mockNodes });

    // 选中 node-2
    designer.selectNode(mockNodes[1]);

    // Ctrl+C — 源码把节点写入模块级剪贴板，不直接调 controls.copyNode
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'c', ctrlKey: true }),
    );

    // Ctrl+V — 源码从模块级剪贴板取出节点调 controls.pasteNode()
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'v', ctrlKey: true }),
    );

    // 验证整个复制-粘贴链路连通
    expect(controls.pasteNode).toHaveBeenCalled();
  });

  it('正常路径：Ctrl+0 居中画布', async () => {
    const { useFlowDesigner } = await import('./use-flow-designer');
    const controls = createMockControls();
    useFlowDesigner({ controls, nodes: mockNodes });

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: '0', ctrlKey: true }),
    );

    expect(controls.center).toHaveBeenCalled();
  });

  it('正常路径：Ctrl+加号放大画布', async () => {
    const { useFlowDesigner } = await import('./use-flow-designer');
    const controls = createMockControls();
    useFlowDesigner({ controls, nodes: mockNodes });

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: '=', ctrlKey: true }),
    );

    expect(controls.zoom).toHaveBeenCalledWith(0.1);
  });

  it('正常路径：Ctrl+减号缩小画布', async () => {
    const { useFlowDesigner } = await import('./use-flow-designer');
    const controls = createMockControls();
    useFlowDesigner({ controls, nodes: mockNodes });

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: '-', ctrlKey: true }),
    );

    expect(controls.zoom).toHaveBeenCalledWith(-0.1);
  });

  it('边界路径：未选中节点时按下 Delete 不触发删除', async () => {
    const { useFlowDesigner } = await import('./use-flow-designer');
    const controls = createMockControls();
    useFlowDesigner({ controls, nodes: mockNodes });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));

    expect(controls.deleteNode).not.toHaveBeenCalled();
  });

  it('边界路径：destroy 应移除 keydown 事件监听', async () => {
    const { useFlowDesigner } = await import('./use-flow-designer');
    const controls = createMockControls();
    const designer = useFlowDesigner({ controls, nodes: mockNodes });

    designer.destroy();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
    );
  });

  it('边界路径：在 INPUT/TEXTAREA 中按 Delete 不应触删节点删除', async () => {
    const { useFlowDesigner } = await import('./use-flow-designer');
    const controls = createMockControls();
    const designer = useFlowDesigner({ controls, nodes: mockNodes });

    designer.selectNode(mockNodes[1]);

    const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
    Object.defineProperty(deleteEvent, 'target', {
      value: document.createElement('input'),
    });
    window.dispatchEvent(deleteEvent);

    expect(controls.deleteNode).not.toHaveBeenCalled();
  });

  it('正常路径：enableShortcuts=false 时不应注册 keydown 监听', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    addEventListenerSpy.mockClear();

    const { useFlowDesigner } = await import('./use-flow-designer');
    const controls = createMockControls();
    useFlowDesigner({ controls, enableShortcuts: false, nodes: mockNodes });

    const keydownListeners = addEventListenerSpy.mock.calls.filter(
      (call) => call[0] === 'keydown',
    );
    expect(keydownListeners.length).toBe(0);
  });
});
