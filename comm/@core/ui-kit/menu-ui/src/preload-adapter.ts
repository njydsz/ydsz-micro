/**
 * 预加载适配器注入点（依赖反转）
 *
 * 底层 UI 组件（menu-ui）不直接依赖高层微前端内核（micro-kernel），
 * 而是通过本注入点获取“菜单 hover 预加载”能力。接线方（如主应用 bootstrap）
 * 在初始化时调用 {@link registerPreloadAdapter} 注入具体实现；
 * 未注入时 hover 预加载静默跳过，保证组件可独立运行。
 *
 * @path comm/@core/ui-kit/menu-ui/src/preload-adapter.ts
 * @author ydsz-team
 * @since 5.6.0
 */

/** 预加载触发函数（异步、不阻塞） */
export type PreloadTriggerFn = (appName: string) => Promise<void>;

/** 预加载权限检查函数 */
export type PreloadPermissionFn = (appName: string) => boolean;

/** 预加载适配器接口（由接线方实现） */
export interface PreloadAdapter {
  triggerPreload: PreloadTriggerFn;
  hasPermission: PreloadPermissionFn;
}

/** 模块级注入点（单例，由接线方注册） */
let preloadAdapter: PreloadAdapter | null = null;

/**
 * 注册预加载适配器（幂等，重复注册以后者为准）。
 * 应在应用初始化阶段调用一次。
 */
export function registerPreloadAdapter(adapter: PreloadAdapter): void {
  preloadAdapter = adapter;
}

/**
 * 获取已注册的预加载适配器。
 * 未注册时返回 null，调用方应静默跳过相关能力。
 */
export function getPreloadAdapter(): PreloadAdapter | null {
  return preloadAdapter;
}
