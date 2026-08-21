/**
 * tabbar 纯工具函数与回调注册中心
 *
 * 从 tabbar.ts 拆出（原 697 行 → store 主体 + 本文件），
 * 满足云顶编码规范 §15.1「Store 模块 ≤ 200 行」的拆分要求：
 * - 本文件：无状态纯函数（tab 键计算/比较/克隆）+ 标签关闭回调注册中心
 * - tabbar.ts：仅保留 useTabbarStore 状态与业务动作
 *
 * @path comm\stores\src\modules\tabbar-utils.ts
 * @author ydsz-team
 * @since 4.3.0
 */
import type { ComputedRef, Ref } from 'vue';
import type { RouteLocationNormalized, RouteRecordNormalized } from 'vue-router';

import type { TabDefinition } from '@YDSZ-core/typings';

import { createLogger } from '@YDSZ-core/shared/utils';

/** 模块级日志器 */
const logger = createLogger('Tabbar');

/**
 * 标签关闭回调注册中心。
 * 主应用布局可注册回调，在标签关闭时通知微前端内核 unmountApp。
 * 回调接收已关闭标签的 path（如 '/YDSZ-proj/execution'）。
 */
const tabClosedCallbacks = new Set<(path: string) => void>();

/**
 * 注册标签关闭回调。
 *
 * @remarks
 * 主应用布局在标签关闭时注册回调，通知微前端内核 unmount 对应子应用；
 * 返回的取消函数可在组件卸载时调用以解除注册，避免回调泄漏。
 *
 * @param callback - 回调函数，接收已关闭标签的 path（如 '/YDSZ-proj/execution'）
 * @returns 取消注册函数（调用后移除该回调）
 */
export function onTabClosed(callback: (path: string) => void) {
  tabClosedCallbacks.add(callback);
  return () => {
    tabClosedCallbacks.delete(callback);
  };
}

/** 通知所有已注册的标签关闭回调（store 内部使用） */
export function notifyTabClosed(path: string) {
  for (const cb of tabClosedCallbacks) {
    try {
      cb(path);
    } catch (err) {
      logger.error('onTabClosed callback error:', err);
    }
  }
}

/**
 * @zh_CN 克隆路由,防止路由被修改
 * @param route
 */
export function cloneTab(route: TabDefinition): TabDefinition {
  if (!route) {
    return route;
  }
  const { matched, meta, ...opt } = route;
  return {
    ...opt,
    matched: (matched
      ? matched.map((item) => ({
          meta: item.meta,
          name: item.name,
          path: item.path,
        }))
      : undefined) as RouteRecordNormalized[],
    meta: {
      ...meta,
      newTabTitle: meta.newTabTitle,
    },
  };
}

/**
 * @zh_CN 是否是固定标签页
 * @param tab
 */
export function isAffixTab(tab: TabDefinition) {
  return tab?.meta?.affixTab ?? false;
}

/**
 * @zh_CN 是否显示标签
 * @param tab
 */
export function isTabShown(tab: TabDefinition) {
  const matched = tab?.matched ?? [];
  return !tab.meta.hideInTab && matched.every((item) => !item.meta.hideInTab);
}

/**
 * 从route获取tab页的key
 * @param tab
 */
export function getTabKey(tab: RouteLocationNormalized | RouteRecordNormalized) {
  const {
    fullPath,
    path,
    meta: { fullPathKey } = {},
    query = {},
  } = tab as RouteLocationNormalized;
  // pageKey可能是数组（查询参数重复时可能出现）
  const pageKey = Array.isArray(query.pageKey)
    ? query.pageKey[0]
    : query.pageKey;
  let rawKey;
  if (pageKey) {
    rawKey = pageKey;
  } else {
    rawKey = fullPathKey === false ? path : (fullPath ?? path);
  }
  try {
    return decodeURIComponent(rawKey);
  } catch {
    return rawKey;
  }
}

/**
 * 从tab获取tab页的key
 * 如果tab没有key,那么就从route获取key
 * @param tab
 */
export function getTabKeyFromTab(tab: TabDefinition): string {
  return tab.key ?? getTabKey(tab);
}

/**
 * 比较两个tab是否相等
 * @param a
 * @param b
 */
export function equalTab(a: TabDefinition, b: TabDefinition) {
  return getTabKeyFromTab(a) === getTabKeyFromTab(b);
}

/**
 * 路由记录转为标签页定义
 * @param route
 */
export function routeToTab(route: RouteRecordNormalized) {
  return {
    meta: route.meta,
    name: route.name,
    path: route.path,
    key: getTabKey(route),
  } as TabDefinition;
}

/**
 * Store 上下文接口
 *
 * 用于在 utility 函数中访问 store 的响应式状态与计算属性。
 * 将 store 的 refs 与 computed 集中传递，避免 action 函数签名过长。
 */
export interface TabbarStoreContext {
  /** 当前打开的标签页列表 */
  tabs: Ref<TabDefinition[]>;
  /** 当前打开的标签页列表缓存 */
  cachedTabs: Ref<string[]>;
  /** 需要排除缓存的标签页 */
  excludeCachedTabs: Ref<string[]>;
  /** 是否刷新 */
  renderRouteView: Ref<boolean>;
  /** 拖拽结束的索引 */
  dragEndIndex: Ref<number>;
  /** 更新时间 */
  updateTime: Ref<number>;
  /** 常规标签页 + 固定标签页（固定优先） */
  getTabs: ComputedRef<TabDefinition[]>;
  /** 缓存标签页副本 */
  getCachedTabs: ComputedRef<string[]>;
}

