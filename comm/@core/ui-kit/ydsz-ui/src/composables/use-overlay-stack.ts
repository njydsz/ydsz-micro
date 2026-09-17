/**
 * useOverlayStack —— 嵌套弹窗 z-index 栈管理 composable。
 *
 * <p>解决的问题：当多个 Dialog / Sheet / Drawer 同时打开时，
 * 后打开的应该显示在上层。若各组件自行设置 z-index，嵌套场景下会出现后打开的被先打开的遮挡。
 *
 * <p>原理：全局响应式计数器。每注册一个浮层，深度 +1；
 * 浮层注销时深度 -1。z-index 公式：{@code baseZIndex + depth * step}。
 *
 * <p>典型用法：
 * <pre>
 * const { zIndex, register, unregister } = useOverlayStack();
 * onMounted(() => register());
 * </pre>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-overlay-stack.ts
 * @author ydsz-team
 * @since 26.09.17
 */
import { computed, onBeforeUnmount, ref } from 'vue';

/** 全局已注册浮层计数 —— 响应式追踪当前栈深度 */
const globalDepth = ref(0);

/** 浮层注册句柄 */
export interface OverlayStackHandle {
  /** 当前浮层层级（0 = 未注册） */
  depth: number;
  /** 当前浮层应使用的 z-index */
  zIndex: number;
  /** 注册浮层 */
  register: () => void;
  /** 注销浮层 */
  unregister: () => void;
}

/**
 * useOverlayStack：嵌套浮层栈管理。
 *
 * @param options —— 配置项
 * @return 浮层句柄
 */
export function useOverlayStack(options?: { baseZIndex?: number; step?: number }): OverlayStackHandle {
  const base = options?.baseZIndex ?? 1000;
  const step = options?.step ?? 20;

  let isRegistered = false;

  /** 注册浮层 */
  function register(): void {
    if (isRegistered) return;
    isRegistered = true;
    globalDepth.value += 1;
  }

  /** 注销浮层 */
  function unregister(): void {
    if (!isRegistered) return;
    isRegistered = false;
    globalDepth.value = Math.max(0, globalDepth.value - 1);
  }

  // 组件卸载时自动清理
  onBeforeUnmount(() => {
    unregister();
  });

  const depth = computed(() => (isRegistered ? globalDepth.value : 0));
  const zIndex = computed(() => {
    const d = depth.value;
    return d > 0 ? base + (d - 1) * step : 0;
  });

  return {
    get depth() {
      return depth.value;
    },
    get zIndex() {
      return zIndex.value;
    },
    register,
    unregister,
  };
}
