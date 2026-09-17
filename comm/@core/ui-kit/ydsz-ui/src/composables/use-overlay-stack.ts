/**
 * useOverlayStack —— 嵌套弹窗 z-index 栈管理 composable。
 *
 * <p>解决的问题：当多个 Dialog / Sheet / Drawer 同时打开时，
 * 后打开的应该显示在上层。若各组件自行设置 z-index，嵌套场景下会出现后打开的被先打开的遮挡。
 *
 * <p>原理：全局单调 position 分配器。每个浮层注册时分配一个递增的位置序号，
 * 注销时释放。z-index 公式：{@code baseZIndex + (position - 1) * step}。
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

/** 下一个 position 分配器 —— 单调递增，永不回退 */
let nextPosition = 0;

/**
 * useOverlayStack：嵌套浮层栈管理。
 *
 * @param options —— 配置项
 * @return 浮层句柄
 */
export function useOverlayStack(options?: { baseZIndex?: number; step?: number }): OverlayStackHandle {
  const base = options?.baseZIndex ?? 1000;
  const step = options?.step ?? 20;

  const isRegistered = ref(false);
  const currentPosition = ref(0);

  /** 注册浮层 */
  function register(): void {
    if (isRegistered.value) return;
    isRegistered.value = true;
    currentPosition.value = ++nextPosition;
  }

  /** 注销浮层 */
  function unregister(): void {
    if (!isRegistered.value) return;
    isRegistered.value = false;
    currentPosition.value = 0;
  }

  // 组件卸载时自动清理
  onBeforeUnmount(() => {
    unregister();
  });

  const depth = computed(() => (isRegistered.value ? currentPosition.value : 0));
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

/**
 * 重置全局栈状态 —— 仅用于测试隔离。
 *
 * <p>生产环境不应调用本函数，否则会破坏 z-index 单调性。
 */
export function __resetOverlayStackForTests(): void {
  nextPosition = 0;
}
