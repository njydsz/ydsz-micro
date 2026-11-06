/**
 * useLoadingBar —— 全局顶部加载进度条命令式 API。
 *
 * 设计目标：
 *  - 与 Naive UI / NProgress 对标的 start / setProgress / finish 三段式 API；
 *  - 全局单例 store，跨组件共享状态；
 *  - 支持「滑动动画（indeterminate）」与「真实进度（determinate）」两种模式；
 *  - YdLoadingBar 容器未渲染时自动挂载，渲染后自动同步。
 *
 * 用法：
 * ```ts
 * import { useLoadingBar } from '@ydsz-core/ydsz-ui';
 *
 * const bar = useLoadingBar();
 * bar.start();
 * bar.setProgress(45);
 * bar.finish();
 * ```
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\loading-bar\use-loading-bar.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { computed, shallowRef } from 'vue';

import type { LoadingBarConfig, UseLoadingBarReturn } from './types';

/* ============================================================ */
/* 全局单例 store                                                  */
/* ============================================================ */

/** 是否处于加载中 */
const _loading = shallowRef<boolean>(false);

/** 当前进度（0-100） */
const _progress = shallowRef<number>(0);

/** 是否处于确定性进度模式 */
const _determinate = shallowRef<boolean>(false);

/** 全局配置 */
const _config = shallowRef<LoadingBarConfig>({});

/** 全局加载状态只读引用 */
const isLoading = computed(() => _loading.value);
/** 全局进度只读引用 */
const progress = computed(() => _progress.value);
/** 确定性模式只读引用 */
const isDeterminate = computed(() => _determinate.value);

/* ============================================================ */
/* 模块级操作函数                                                  */
/* ============================================================ */

/**
 * 覆写全局 LoadingBar 默认配置。
 */
export function configureLoadingBar(config: LoadingBarConfig): void {
  _config.value = { ..._config.value, ...config };
}

/** 开始加载 */
export function start(): void {
  _loading.value = true;
  _progress.value = 0;
  _determinate.value = _config.value.determinate ?? false;
}

/** 设置真实进度（0-100） */
export function setProgress(value: number): void {
  const clamped = Math.min(100, Math.max(0, Number.isNaN(value) ? 0 : value));
  _progress.value = clamped;
  _determinate.value = true;
  _loading.value = true;
}

/** 结束加载 */
export function finish(): void {
  _loading.value = false;
  _progress.value = 0;
  _determinate.value = false;
}

/* ============================================================ */
/* 主 Composable                                                  */
/* ============================================================ */

/**
 * useLoadingBar —— 全局顶部加载进度条控制器。
 *
 * @returns UseLoadingBarReturn
 *
 * @example
 * ```typescript
 * const bar = useLoadingBar();
 * bar.start();
 * try {
 *   await fetchData();
 * } finally {
 *   bar.finish();
 * }
 * ```
 */
export function useLoadingBar(): UseLoadingBarReturn {
  return {
    start,
    setProgress,
    finish,
    done: finish,
    isLoading,
    progress,
    isDeterminate,
  };
}

/* ============================================================ */
/* 模块级便捷函数（无需 composable 上下文）                        */
/* ============================================================ */

/** 全局单例句柄（供非组件环境直接调用） */
export const loadingBar = {
  start,
  setProgress,
  finish,
  done: finish,
  configure: configureLoadingBar,
  isLoading,
  progress,
  isDeterminate,
};

/** 独立函数形式（供 import { startLoadingBar } 使用） */
export function startLoadingBar(): void {
  start();
}

export function setLoadingBarProgress(value: number): void {
  setProgress(value);
}

export function finishLoadingBar(): void {
  finish();
}

/* ============================================================ */
/* 供 YdLoadingBar 容器消费的注入 key                              */
/* ============================================================ */

export {
  isLoading as loadingBarIsLoading,
  progress as loadingBarProgress,
  isDeterminate as loadingBarIsDeterminate,
};
