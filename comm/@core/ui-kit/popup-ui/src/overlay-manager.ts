/**
 * OverlayManager —— 嵌套弹窗管理器（单例）。
 *
 * <p>追踪所有已打开的 Dialog / Sheet / Drawer，提供：
 * <ul>
 *   <li>栈顶查询（最后一层打开的弹窗）</li>
 *   <li>最长路径的 z-index 计算</li>
 *   <li>统一关闭栈顶（Escape 键的默认行为目标）</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\popup-ui\src\overlay-manager.ts
 * @author ydsz-team
 * @since 26.09.17
 */

/** 浮层条目接口 */
export interface OverlayEntry {
  /** 唯一标识 */
  id: string;
  /** 关闭回调 */
  close: () => void;
  /** 层级（auto-increment） */
  depth: number;
}

/** 下一个 auto-id 计数器 */
let nextId = 0;

/** 当前打开的浮层栈（数组：越后越上层） */
const overlayStack: OverlayEntry[] = [];

/**
 * 注册浮层。
 *
 * @return 注销函数（调用后从栈中移除本浮层）
 */
export function registerOverlay(entry: Omit<OverlayEntry, 'depth'>): () => void {
  const depth = overlayStack.length + 1;
  const fullEntry: OverlayEntry = { ...entry, depth };
  overlayStack.push(fullEntry);

  return () => {
    const idx = overlayStack.indexOf(fullEntry);
    if (idx >= 0) {
      overlayStack.splice(idx, 1);
    }
  };
}

/**
 * 获取当前栈顶浮层。
 *
 * @return 栈顶条目；若栈为空则返回 undefined
 */
export function getTopOverlay(): OverlayEntry | undefined {
  return overlayStack.length > 0 ? overlayStack[overlayStack.length - 1] : undefined;
}

/**
 * 获取当前栈深度。
 *
 * @return 浮层数量
 */
export function getOverlayDepth(): number {
  return overlayStack.length;
}

/**
 * 生成下一个唯一 ID。
 *
 * @return 唯一浮层 ID
 */
export function nextOverlayId(): string {
  return `yd-overlay-${++nextId}`;
}

/**
 * 关闭栈顶浮层。
 *
 * @return 是否成功关闭
 */
export function closeTopOverlay(): boolean {
  const top = getTopOverlay();
  if (top) {
    top.close();
    return true;
  }
  return false;
}
