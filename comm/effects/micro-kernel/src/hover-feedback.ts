/**
 * 预加载 hover 视觉反馈工具（P3-1）
 *
 * 在用户 hover 某个子应用入口（导航菜单项、Tab 等）时，主应用触发预加载，
 * 同时本模块给该入口元素加上视觉反馈，让用户感知"此应用已开始预取"，
 * 提升导航确认感与首屏打开速度的体感。
 *
 * **设计原则（无侵入）**：
 * - 不注入硬编码内联样式，仅通过 `data-micro-prefetch` 数据属性标记状态，
 *   由主应用侧 CSS（如 `[data-micro-prefetch='loading'] { ... }`）决定视觉效果。
 * - 提供内联 `getComputedStyle` 可读的 CSS 变量（--micro-prefetch-status）作为兜底。
 * - 所有函数返回清理函数，便于在 hover 移开 / 组件卸载时还原元素状态。
 *
 * **典型用法**（主应用导航栏）：
 * ```ts
 * import { attachHoverPreloadFeedback } from '@ydsz/micro-kernel';
 *
 * const cleanup = attachHoverPreloadFeedback(navItemEl, () => {
 *   // 触发该子应用的预加载
 *   return kernel.prefetchApp('workflow-web');
 * });
 * // 组件卸载时调用 cleanup() 移除监听
 * ```
 *
 * @path comm/effects/micro-kernel/src/hover-feedback.ts
 * @author ydsz-team
 * @since 4.1.0
 */

/** 预加载反馈状态（写入 data-micro-prefetch 属性） */
export type PrefetchFeedbackState = 'loading' | 'ready' | 'failed';

/** 已解析出的元素状态快照，用于清理时还原 */
interface ElementStateSnapshot {
  attr: string | null;
  varValue: string | null;
}

/**
 * 给单个元素打上预加载反馈标记。
 *
 * @param el - 目标元素（导航入口）
 * @param state - 预加载状态
 */
function applyFeedbackState(el: HTMLElement, state: PrefetchFeedbackState): void {
  el.setAttribute('data-micro-prefetch', state);
  // 兜底：写入 CSS 变量供 getComputedStyle 读取（无内联样式，不破坏布局）
  el.style.setProperty('--micro-prefetch-status', state);
}

/**
 * 读取元素当前的反馈标记快照。
 *
 * @param el - 目标元素
 */
function snapshotElementState(el: HTMLElement): ElementStateSnapshot {
  return {
    attr: el.getAttribute('data-micro-prefetch'),
    varValue: el.style.getPropertyValue('--micro-prefetch-status'),
  };
}

/**
 * 还原元素到指定快照状态。
 *
 * @param el - 目标元素
 * @param snap - 之前记录的快照
 */
function restoreElementState(el: HTMLElement, snap: ElementStateSnapshot): void {
  if (snap.attr === null) {
    el.removeAttribute('data-micro-prefetch');
  } else {
    el.setAttribute('data-micro-prefetch', snap.attr);
  }
  if (snap.varValue === '') {
    el.style.removeProperty('--micro-prefetch-status');
  } else {
    el.style.setProperty('--micro-prefetch-status', snap.varValue);
  }
}

/**
 * P3-1: 给子应用入口元素挂载 hover 预加载视觉反馈。
 *
 * 监听元素的 `mouseenter`，触发传入的 `onHover` 回调（通常触发 `prefetchApp`）。
 * 根据 Promise 结果自动切换视觉状态：
 * - `loading`：预加载进行中
 * - `ready`：预加载成功（资源已就绪）
 * - `failed`：预加载失败（视觉提示降级，可让用户知道点进去可能较慢）
 *
 * **去抖**：同一元素 hover 在 `debounceMs`（默认 150ms）内重复触发不会重复调用
 * `onHover`，避免鼠标扫过导航栏时频繁预取。
 *
 * **清理**：返回清理函数，移除监听并还原元素初始状态。
 *
 * @param el - 入口元素
 * @param onHover - hover 时触发预加载的回调（返回 Promise 用于状态反馈）
 * @param options - 配置项
 * @returns 清理函数
 *
 * @example
 * ```ts
 * const cleanup = attachHoverPreloadFeedback(navItem, async () => {
 *   await kernel.prefetchApp('workflow-web');
 * });
 * ```
 */
export function attachHoverPreloadFeedback(
  el: HTMLElement,
  onHover: () => void | Promise<void>,
  options: {
    /** hover 去抖间隔（ms），默认 150ms，0 表示不去抖 */
    debounceMs?: number;
    /** 是否允许失败时显示 failed 反馈，默认 true */
    showFailedFeedback?: boolean;
  } = {},
): () => void {
  const { debounceMs = 150, showFailedFeedback = true } = options;

  const snapshot = snapshotElementState(el);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let active = false;
  let disposed = false;

  function schedule(): void {
    if (timer !== null) return;
    timer = setTimeout(() => {
      timer = null;
      void run();
    }, debounceMs);
  }

  async function run(): Promise<void> {
    if (disposed || active) return;
    active = true;
    applyFeedbackState(el, 'loading');
    try {
      await onHover();
      if (!disposed) applyFeedbackState(el, 'ready');
    } catch {
      if (!disposed && showFailedFeedback) applyFeedbackState(el, 'failed');
    } finally {
      active = false;
    }
  }

  function onMouseEnter(): void {
    if (disposed) return;
    if (debounceMs <= 0) {
      void run();
    } else {
      schedule();
    }
  }

  el.addEventListener('mouseenter', onMouseEnter);

  return () => {
    disposed = true;
    el.removeEventListener('mouseenter', onMouseEnter);
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    restoreElementState(el, snapshot);
  };
}

/**
 * P3-1: 批量给多个子应用入口挂载 hover 预加载视觉反馈。
 *
 * 便于主应用在导航菜单渲染后一次性绑定所有入口。
 *
 * @param items - 入口元素 + 对应预加载回调的映射
 * @returns 聚合清理函数（调用后一次性移除全部监听）
 *
 * @example
 * ```ts
 * const cleanup = attachHoverPreloadFeedbackAll([
 *   { el: elWorkflow, onHover: () => kernel.prefetchApp('workflow-web') },
 *   { el: elSystem, onHover: () => kernel.prefetchApp('system-web') },
 * ]);
 * ```
 */
export function attachHoverPreloadFeedbackAll(
  items: Array<{
    el: HTMLElement;
    onHover: () => void | Promise<void>;
    debounceMs?: number;
  }>,
): () => void {
  const cleanups = items.map((item) =>
    attachHoverPreloadFeedback(item.el, item.onHover, { debounceMs: item.debounceMs }),
  );
  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}