/**
 * tabbar Store —— 标签页组合动作
 *
 * 从 tabbar.ts 拆出，包含标签页的打开、关闭、跳转、刷新等组合操作。
 * 每个动作函数接受 TabbarStoreContext 作为第一个参数，操作 store 的响应式状态。
 * 叶子动作函数（无 action 间依赖）已下沉至 `./tabbar-utils`。
 *
 * @path comm\stores\src\modules\tabbar-actions.ts
 * @author ydsz-team
 * @since 4.3.0
 */
import type { Router } from 'vue-router';

import type { TabDefinition } from '@YDSZ-core/typings';

import {
  startProgress,
  stopProgress,
} from '@YDSZ-core/shared/utils';
import { createLogger } from '@YDSZ-core/shared/utils';

import {
  equalTab,
  getTabKey,
  getTabKeyFromTab,
  isAffixTab,
} from './tabbar-utils';
import type { TabbarStoreContext } from './tabbar-utils';
import {
  closeTabInternal,
  goToDefaultTab,
  goToTab,
  refreshByName,
  updateCacheTabs,
} from './tabbar-store-actions';

/** 模块级日志器 */
const logger = createLogger('Tabbar');

/**
 * 批量关闭指定 key 的标签页。
 *
 * @param ctx - Tabbar store 上下文
 * @param keys - 待关闭的标签页 key 列表
 */
export async function bulkCloseByKeys(
  ctx: TabbarStoreContext,
  keys: string[],
) {
  const keySet = new Set(keys);
  ctx.tabs.value = ctx.tabs.value.filter(
    (item) => !keySet.has(getTabKeyFromTab(item)),
  );

  await updateCacheTabs(ctx);
}

/**
 * @zh_CN 关闭所有标签页
 * @param ctx
 * @param router
 */
export async function closeAllTabs(
  ctx: TabbarStoreContext,
  router: Router,
) {
  const newTabs = ctx.tabs.value.filter((tab) => isAffixTab(tab));
  ctx.tabs.value = newTabs.length > 0 ? newTabs : ctx.tabs.value.slice(0, 1);
  await goToDefaultTab(ctx, router);
  updateCacheTabs(ctx);
}

/**
 * @zh_CN 关闭左侧标签页
 * @param ctx
 * @param tab
 */
export async function closeLeftTabs(
  ctx: TabbarStoreContext,
  tab: TabDefinition,
) {
  const index = ctx.tabs.value.findIndex((item) => equalTab(item, tab));

  if (index < 1) {
    return;
  }

  const leftTabs = ctx.tabs.value.slice(0, index);
  const keys: string[] = [];

  for (const item of leftTabs) {
    if (!isAffixTab(item)) {
      keys.push(item.key as string);
    }
  }
  await bulkCloseByKeys(ctx, keys);
}

/**
 * @zh_CN 关闭其他标签页
 * @param ctx
 * @param tab
 */
export async function closeOtherTabs(
  ctx: TabbarStoreContext,
  tab: TabDefinition,
) {
  const closeKeys = ctx.tabs.value.map((item) => getTabKeyFromTab(item));

  const keys: string[] = [];

  for (const key of closeKeys) {
    if (key !== getTabKeyFromTab(tab)) {
      const closeTabItem = ctx.tabs.value.find(
        (item) => getTabKeyFromTab(item) === key,
      );
      if (!closeTabItem) {
        continue;
      }
      if (!isAffixTab(closeTabItem)) {
        keys.push(closeTabItem.key as string);
      }
    }
  }
  await bulkCloseByKeys(ctx, keys);
}

/**
 * @zh_CN 关闭右侧标签页
 * @param ctx
 * @param tab
 */
export async function closeRightTabs(
  ctx: TabbarStoreContext,
  tab: TabDefinition,
) {
  const index = ctx.tabs.value.findIndex((item) => equalTab(item, tab));

  if (index !== -1 && index < ctx.tabs.value.length - 1) {
    const rightTabs = ctx.tabs.value.slice(index + 1);

    const keys: string[] = [];
    for (const item of rightTabs) {
      if (!isAffixTab(item)) {
        keys.push(item.key as string);
      }
    }
    await bulkCloseByKeys(ctx, keys);
  }
}

/**
 * @zh_CN 关闭标签页
 * @param ctx
 * @param tab
 * @param router
 */
export async function closeTab(
  ctx: TabbarStoreContext,
  tab: TabDefinition,
  router: Router,
) {
  const { currentRoute } = router;
  // 关闭不是激活选项卡
  if (getTabKey(currentRoute.value) !== getTabKeyFromTab(tab)) {
    closeTabInternal(ctx, tab);
    updateCacheTabs(ctx);
    return;
  }
  const index = ctx.getTabs.value.findIndex(
    (item) => getTabKeyFromTab(item) === getTabKey(currentRoute.value),
  );

  const before = ctx.getTabs.value[index - 1];
  const after = ctx.getTabs.value[index + 1];

  // 下一个tab存在，跳转到下一个
  if (after) {
    closeTabInternal(ctx, tab);
    await goToTab(after, router);
    // 上一个tab存在，跳转到上一个
  } else if (before) {
    closeTabInternal(ctx, tab);
    await goToTab(before, router);
  } else {
     
    logger.error('Failed to close the tab; only one tab remains open.');
  }
}

/**
 * @zh_CN 通过key关闭标签页
 * @param ctx
 * @param key
 * @param router
 */
export async function closeTabByKey(
  ctx: TabbarStoreContext,
  key: string,
  router: Router,
) {
  const originKey = decodeURIComponent(key);
  const index = ctx.tabs.value.findIndex(
    (item) => getTabKeyFromTab(item) === originKey,
  );
  if (index === -1) {
    return;
  }

  const tab = ctx.tabs.value[index];
  if (tab) {
    await closeTab(ctx, tab, router);
  }
}

/**
 * 刷新标签页
 * @param ctx
 * @param router
 */
export async function refresh(
  ctx: TabbarStoreContext,
  router: Router | string,
) {
  // 如果是Router路由，那么就根据当前路由刷新
  // 如果是string字符串，为路由名称，则定向刷新指定标签页，不能是当前路由名称，否则不会刷新
  if (typeof router === 'string') {
    return await refreshByName(ctx, router);
  }

  const { currentRoute } = router;
  const { name } = currentRoute.value;

  ctx.excludeCachedTabs.value = [
    ...new Set([...ctx.excludeCachedTabs.value, name as string]),
  ];
  ctx.renderRouteView.value = false;
  startProgress();

  await new Promise((resolve) => setTimeout(resolve, 200));

  ctx.excludeCachedTabs.value = ctx.excludeCachedTabs.value.filter(
    (n) => n !== (name as string),
  );
  ctx.renderRouteView.value = true;
  stopProgress();
}
