/**
 * tabbar Store —— 叶子动作函数与 addTab
 *
 * 包含不依赖其他 action 的叶子动作函数，以及 addTab（最大单函数）。
 * 这些函数被 tabbar-actions 和 tabbar-manage 共同依赖，抽出以避免循环引用。
 *
 * @path comm\stores\src\modules\tabbar-store-actions.ts
 * @author ydsz-team
 * @since 4.3.0
 */
import type { Router } from 'vue-router';

import type { TabDefinition } from '@YDSZ-core/typings';

import { toRaw } from 'vue';

import { preferences } from '@YDSZ-core/preferences';

import {
  cloneTab,
  equalTab,
  getTabKey,
  getTabKeyFromTab,
  isAffixTab,
  isTabShown,
  notifyTabClosed,
} from './tabbar-utils';
import type { TabbarStoreContext } from './tabbar-utils';

/**
 * @zh_CN 跳转到标签页
 * @param tab
 * @param router
 */
export async function goToTab(tab: TabDefinition, router: Router) {
  const { params, path, query } = tab;
  const toParams = {
    params: params || {},
    path,
    query: query || {},
  };
  await router.replace(toParams);
}

/**
 * @zh_CN 跳转到默认标签页
 * @param ctx
 * @param router
 */
export async function goToDefaultTab(
  ctx: TabbarStoreContext,
  router: Router,
) {
  if (ctx.getTabs.value.length <= 0) {
    return;
  }
  const firstTab = ctx.getTabs.value[0];
  if (firstTab) {
    await goToTab(firstTab, router);
  }
}

/**
 * @zh_CN 关闭标签页（内部函数）
 * @param ctx
 * @param tab
 */
export function closeTabInternal(ctx: TabbarStoreContext, tab: TabDefinition) {
  if (isAffixTab(tab)) {
    return;
  }
  const index = ctx.tabs.value.findIndex((item) => equalTab(item, tab));
  if (index !== -1) {
    const closedPath =
      ctx.tabs.value[index]!.fullPath || ctx.tabs.value[index]!.path;
    ctx.tabs.value.splice(index, 1);
    notifyTabClosed(closedPath);
  }
}

/**
 * @zh_CN 设置标签页顺序
 * @param ctx
 * @param oldIndex
 * @param newIndex
 */
export async function sortTabs(
  ctx: TabbarStoreContext,
  oldIndex: number,
  newIndex: number,
) {
  const currentTab = ctx.tabs.value[oldIndex];
  if (!currentTab) {
    return;
  }
  ctx.tabs.value.splice(oldIndex, 1);
  ctx.tabs.value.splice(newIndex, 0, currentTab);
  ctx.dragEndIndex.value = ctx.dragEndIndex.value + 1;
}

/**
 * 根据当前打开的选项卡更新缓存
 * @param ctx
 */
export async function updateCacheTabs(ctx: TabbarStoreContext) {
  const cacheMap = new Set<string>();

  for (const tab of ctx.tabs.value) {
    // 跳过不需要持久化的标签页
    const keepAlive = tab.meta?.keepAlive;
    if (!keepAlive) {
      continue;
    }
    (tab.matched || []).forEach((t, i) => {
      if (i > 0) {
        cacheMap.add(t.name as string);
      }
    });

    const name = tab.name as string;
    cacheMap.add(name);
  }
  ctx.cachedTabs.value = [...cacheMap];
}

/**
 * 根据tab的key获取tab
 * @param ctx
 * @param key
 */
export function getTabByKey(ctx: TabbarStoreContext, key: string) {
  return ctx.getTabs.value.find(
    (item) => getTabKeyFromTab(item) === key,
  ) as TabDefinition;
}

/**
 * 根据路由名称刷新指定标签页
 * @param ctx
 * @param name
 */
export async function refreshByName(ctx: TabbarStoreContext, name: string) {
  ctx.excludeCachedTabs.value = [
    ...new Set([...ctx.excludeCachedTabs.value, name]),
  ];
  await new Promise((resolve) => setTimeout(resolve, 200));
  ctx.excludeCachedTabs.value = ctx.excludeCachedTabs.value.filter(
    (n) => n !== name,
  );
}

/**
 * @zh_CN 添加标签页
 * @param ctx
 * @param routeTab
 */
export function addTab(
  ctx: TabbarStoreContext,
  routeTab: TabDefinition,
): TabDefinition {
  let tab = cloneTab(routeTab);
  if (!tab.key) {
    tab.key = getTabKey(routeTab);
  }
  if (!isTabShown(tab)) {
    return tab;
  }

  const tabIndex = ctx.tabs.value.findIndex((item) => {
    return equalTab(item, tab);
  });

  if (tabIndex === -1) {
    const maxCount = preferences.tabbar.maxCount;
    // 获取动态路由打开数，超过 0 即代表需要控制打开数
    const maxNumOfOpenTab = (routeTab?.meta?.maxNumOfOpenTab ?? -1) as number;
    // 如果动态路由层级大于 0 了，那么就要限制该路由的打开数限制了
    // 获取到已经打开的动态路由数, 判断是否大于某一个值
    if (
      maxNumOfOpenTab > 0 &&
      ctx.tabs.value.filter((t) => t.name === routeTab.name).length >=
        maxNumOfOpenTab
    ) {
      // 关闭第一个
      const index = ctx.tabs.value.findIndex(
        (item) => item.name === routeTab.name,
      );
      index !== -1 && ctx.tabs.value.splice(index, 1);
    } else if (maxCount > 0 && ctx.tabs.value.length >= maxCount) {
      // 关闭第一个
      const index = ctx.tabs.value.findIndex(
        (item) =>
          !Reflect.has(item.meta, 'affixTab') || !item.meta.affixTab,
      );
      index !== -1 && ctx.tabs.value.splice(index, 1);
    }
    ctx.tabs.value.push(tab);
  } else {
    // 页面已经存在，不重复添加选项卡，只更新选项卡参数
    const currentTab = toRaw(ctx.tabs.value)[tabIndex];
    const mergedTab = {
      ...currentTab,
      ...tab,
      meta: { ...currentTab?.meta, ...tab.meta },
    };
    if (currentTab) {
      const curMeta = currentTab.meta;
      if (Reflect.has(curMeta, 'affixTab')) {
        mergedTab.meta.affixTab = curMeta.affixTab;
      }
      if (Reflect.has(curMeta, 'newTabTitle')) {
        mergedTab.meta.newTabTitle = curMeta.newTabTitle;
      }
    }
    tab = mergedTab;
    ctx.tabs.value.splice(tabIndex, 1, mergedTab);
  }
  updateCacheTabs(ctx);
  return tab;
}
