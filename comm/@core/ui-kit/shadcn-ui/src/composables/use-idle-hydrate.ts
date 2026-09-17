/**
 * 空闲期延迟挂载 —— 利用 requestIdleCallback 把非关键组件的初始化推迟到浏览器空闲。
 *
 * <p>痛点：首屏渲染时，弹窗内容、Dropdown 面板、YdTooltipSmart 内容即使未打开也会参与 setup 执行，
 * 占用主线程时间。对于卡片列表包裹大量可交互组件（YdEntityCard × 50）场景，
 * 滚动卡顿明显。
 *
 * <p>本 composable 初始只渲染占位（或完全不渲染），待以下任一条件满足后挂载真实内容：
 * 1. 浏览器触发 idle 回调（`requestIdleCallback`）；
 * 2. 显式调用 `forceMount()`（例如用户 hover / click 触发时立即显示）；
 * 3. 进入视口（`IntersectionObserver`，可选）。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-idle-hydrate.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import type { Ref } from 'vue';

import {
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue';

/** 安全获取 requestIdleCallback（运行时而非模块加载时解析，便于测试 mock） */
function getIdleCallback(): typeof requestIdleCallback {
  if (typeof globalThis.requestIdleCallback !== 'undefined') {
    return globalThis.requestIdleCallback;
  }
  return ((cb: IdleRequestCallback) => {
    const start = Date.now();
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      });
    }, 1000) as unknown as number;
  }) as typeof requestIdleCallback;
}

/** 安全获取 cancelIdleCallback */
function getCancelIdleCallback(): typeof cancelIdleCallback {
  if (typeof globalThis.cancelIdleCallback !== 'undefined') {
    return globalThis.cancelIdleCallback;
  }
  return ((id: number) => clearTimeout(id)) as typeof cancelIdleCallback;
}

/** idle 挂载配置选项 */
export interface UseIdleHydrateOptions {
  /**
   * 是否使用 IntersectionObserver 进行视口检测。
   * <p>使用者需自行通过 `containerRef` 传入被观察的 DOM。
   * @default false
   */
  intersection?: boolean;
  /**
   * IntersectionObserver 的 rootMargin —— 提前多少像素开始挂载。
   * @default "200px"
   */
  rootMargin?: string;
  /**
   * 是否启用 requestIdleCallback。
   * <p>设 false 时仅依赖 intersection 或手动 forceMount()。
   * @default true
   */
  idle?: boolean;
  /**
   * 是否立即挂载，不走延迟策略（开发模式默认 true 以保持可预测性）。
   * @default import.meta.env.DEV
   */
  immediate?: boolean;
}

/** 空闲期挂载句柄 */
export interface IdleHydrateHandle {
  /** 是否已挂载（响应式） */
  isHydrated: Ref<boolean>;
  /** 手动触发挂载（在用户交互时调用以跳过空闲等待） */
  forceMount: () => void;
  /** 容器 DOM ref —— 用于 IntersectionObserver 检测 */
  containerRef: Ref<HTMLElement | undefined>;
}

/**
 * 空闲期延迟挂载 composable。
 *
 * <p>典型用法：
 * ```vue
 * <script setup>
 * const { isHydrated, forceMount, containerRef } = useIdleHydrate({
 *   idle: true,
 *   intersection: true,
 * });
 * </script>
 * <template>
 *   <div ref="containerRef">
 *     <HeavyComponent v-if="isHydrated" />
 *     <YdSkeleton v-else />
 *   </div>
 * </template>
 * ```
 *
 * @param options - 配置选项
 * @return 挂载句柄
 */
export function useIdleHydrate(
  options: UseIdleHydrateOptions = {},
): IdleHydrateHandle {
  const {
    idle = true,
    intersection = false,
    rootMargin = '200px',
    immediate = false,
  } = options;

  const isHydrated = ref(immediate);
  const containerRef = ref<HTMLElement | undefined>();
  let idleId: number | null = null;
  let observer: IntersectionObserver | null = null;

  function markHydrated() {
    if (isHydrated.value) return;
    isHydrated.value = true;
    // 已挂载后清理观察器，避免重复触发
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function forceMount() {
    if (idleId !== null) {
      getCancelIdleCallback()(idleId);
      idleId = null;
    }
    markHydrated();
  }

  onMounted(() => {
    if (isHydrated.value) return;

    // 策略 1：requestIdleCallback —— 浏览器空闲时挂载
    if (idle && !isHydrated.value) {
      idleId = getIdleCallback()(() => {
        markHydrated();
      });
    }

    // 策略 2：IntersectionObserver —— 进入视口（提前 rootMargin）时挂载
    if (intersection && containerRef.value && !isHydrated.value) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              markHydrated();
              break;
            }
          }
        },
        { rootMargin },
      );
      observer.observe(containerRef.value);
    }
  });

  onBeforeUnmount(() => {
    if (idleId !== null) {
      getCancelIdleCallback()(idleId);
      idleId = null;
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  });

  return {
    containerRef,
    forceMount,
    isHydrated,
  };
}

/**
 * 简化版：仅在 requestIdleCallback 时挂载，无 intersection 逻辑。
 * 适用于无人参与的纯展示组件（如 Dashboard 图表卡片）。
 *
 * @param delay 兜底 setTimeout 延迟毫秒
 * @return isHydrated ref
 *
 * @example
 * ```vue
 * <script setup>
 * const isHydrated = useSimpleIdleHydrate();
 * </script>
 * <template>
 *   <Chart v-if="isHydrated" :data="chartData" />
 *   <ChartSkeleton v-else />
 * </template>
 * ```
 */
export function useSimpleIdleHydrate(
  delay = 2000,
): Ref<boolean> {
  const isHydrated = ref(import.meta.env.DEV);

  onMounted(() => {
    if (isHydrated.value) return;
    getIdleCallback()(() => {
      isHydrated.value = true;
    }, { timeout: delay } as IdleRequestOptions);
  });

  return isHydrated;
}

// 安全导出，业务侧按需 import
export type { Ref };
