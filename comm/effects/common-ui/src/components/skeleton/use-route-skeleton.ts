/**
 * 路由骨架屏加载状态管理
 *
 * <p>在路由切换时自动显示骨架屏，避免白屏。
 * <p>符合云顶编码规范 §5 性能规范、§9 路由规范。
 *
 * <p>使用方式:
 * <pre>{@code
 *   // 在路由守卫中
 *   router.beforeEach((to, from, next) => {
 *     startSkeletonLoading();
 *     next();
 *   });
 *
 *   router.afterEach(() => {
 *     stopSkeletonLoading();
 *   });
 *
 *   // 在组件中
 *   const { isLoading, skeletonType } = useRouteSkeleton();
 * }</pre>
 *
 * @path comm/effects/common-ui/src/components/skeleton/use-route-skeleton.ts
 * @author ydsz-team
 * @since 4.0.0
 */

import { ref, readonly } from 'vue';
import type { SkeletonType } from './skeleton.vue';

/**
 * 加载状态
 */
interface SkeletonState {
  /** 是否正在加载 */
  isLoading: boolean;
  /** 骨架屏类型 */
  skeletonType: SkeletonType;
  /** 加载开始时间 */
  startTime: number;
}

/**
 * 全局状态
 */
const state = ref<SkeletonState>({
  isLoading: false,
  skeletonType: 'list',
  startTime: 0,
});

/**
 * 最小显示时间（避免闪烁）
 */
const MIN_DISPLAY_TIME = 300;

/**
 * 开始加载骨架屏
 *
 * @param type 骨架屏类型
 */
export function startSkeletonLoading(type: SkeletonType = 'list'): void {
  state.value = {
    isLoading: true,
    skeletonType: type,
    startTime: Date.now(),
  };
}

/**
 * 停止加载骨架屏
 *
 * <p>如果显示时间不足最小时间，延迟停止，避免闪烁。
 */
export function stopSkeletonLoading(): void {
  const elapsed = Date.now() - state.value.startTime;
  const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);

  if (remaining > 0) {
    setTimeout(() => {
      state.value.isLoading = false;
    }, remaining);
  } else {
    state.value.isLoading = false;
  }
}

/**
 * 设置骨架屏类型
 *
 * @param type 骨架屏类型
 */
export function setSkeletonType(type: SkeletonType): void {
  state.value.skeletonType = type;
}

/**
 * 获取路由骨架屏状态
 *
 * <p>返回只读的响应式状态，用于组件中绑定。
 */
export function useRouteSkeleton() {
  return {
    isLoading: readonly(state).value.isLoading,
    skeletonType: readonly(state).value.skeletonType,
    startLoading: startSkeletonLoading,
    stopLoading: stopSkeletonLoading,
    setType: setSkeletonType,
  };
}

/**
 * 路由骨架屏配置
 */
export interface RouteSkeletonConfig {
  /** 路由路径匹配 */
  path: string | RegExp;
  /** 骨架屏类型 */
  type: SkeletonType;
}

/**
 * 根据路由路径获取骨架屏类型
 *
 * @param path 路由路径
 * @param configs 配置列表
 * @returns 骨架屏类型
 */
export function getSkeletonTypeByRoute(path: string, configs: RouteSkeletonConfig[]): SkeletonType {
  for (const config of configs) {
    if (typeof config.path === 'string') {
      if (path.startsWith(config.path)) {
        return config.type;
      }
    } else if (config.path.test(path)) {
      return config.type;
    }
  }
  return 'list';
}

/**
 * 默认路由骨架屏配置
 */
export const DEFAULT_SKELETON_CONFIGS: RouteSkeletonConfig[] = [
  { path: '/dashboard', type: 'dashboard' },
  { path: '/user', type: 'list' },
  { path: '/system/config', type: 'form' },
  { path: '/workflow', type: 'list' },
  { path: '/message', type: 'list' },
  { path: '/cronjob', type: 'table' },
  { path: '/literule', type: 'list' },
  { path: '/nextwiki', type: 'list' },
  { path: '/agent', type: 'detail' },
];
