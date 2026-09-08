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

import type { TabDefinition } from '@ydsz-core/typings';

import {
  startProgress,
  stopProgress,
} from '@ydsz-core/shared/utils';
import { createLogger } from '@ydsz-core/shared/utils';

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
 * 关闭所有标签页，仅保留已固定的 affix 标签页。
 *
 * @param ctx - Tabbar store 上下文
 * @param router - Vue Router 实例，用于跳转
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
 * 关闭当前标签页左侧所有非固定标签页。
 *
 * @param ctx - Tabbar store 上下文
 * @param tab - 参考标签页（关闭其左侧标签）
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
 * 关闭除当前标签页外的所有非固定标签页。
 *
 * @param ctx - Tabbar store 上下文
 * @param tab - 需要保留的标签页
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
 * 关闭当前标签页右侧所有非固定标签页。
 *
 * @param ctx - Tabbar store 上下文
 * @param tab - 参考标签页（关闭其右侧标签）
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
 * 关闭指定标签页；若关闭当前激活标签页，自动跳转至相邻标签。
 *
 * @param ctx - Tabbar store 上下文
 * @param tab - 待关闭的标签页
 * @param router - Vue Router 实例，用于跳转
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
 * 通过标签页 key 关闭指定标签页。
 *
 * @param ctx - Tabbar store 上下文
 * @param key - 标签页唯一 key（URL 编码）
 * @param router - Vue Router 实例，用于跳转
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
 * 刷新标签页。
 *
 * <p>两种调用方式：
 * <ul>
 *   <li>传入 Router 实例 — 刷新当前路由对应标签页</li>
 *   <li>传入 string（路由名）— 定向刷新指定名称的标签页</li>
 * </ul>
 *
 * @param ctx - Tabbar store 上下文
 * @param router - Vue Router 实例或路由名
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
