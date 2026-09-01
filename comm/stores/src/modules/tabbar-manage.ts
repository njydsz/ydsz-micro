/**
 * tabbar Store —— 标签页管理动作
 *
 * 从 tabbar.ts 拆出，包含标签页的固定/取消固定、标题设置等管理操作。
 * 每个动作函数接受 TabbarStoreContext 作为第一个参数，操作 store 的响应式状态。
 *
 * @path comm\stores\src\modules\tabbar-manage.ts
 * @author ydsz-team
 * @since 4.3.0
 */
import type { ComputedRef } from 'vue';
import type { RouteRecordNormalized } from 'vue-router';

import type { TabDefinition } from '@YDSZ-core/typings';

import { createLogger } from '@YDSZ-core/shared/utils';

import {
  equalTab,
  isAffixTab,
  routeToTab,
} from './tabbar-utils';
import type { TabbarStoreContext } from './tabbar-utils';
import {
  addTab,
  sortTabs,
  updateCacheTabs,
} from './tabbar-store-actions';

/** 模块级日志器 */
const _logger = createLogger('Tabbar');

/**
 * @zh_CN 固定标签页
 * @param ctx
 * @param tab
 */
export async function pinTab(ctx: TabbarStoreContext, tab: TabDefinition) {
  const index = ctx.tabs.value.findIndex((item) => equalTab(item, tab));
  if (index === -1) {
    return;
  }
  const oldTab = ctx.tabs.value[index];
  tab.meta.affixTab = true;
  tab.meta.title = oldTab?.meta?.title as string;
  ctx.tabs.value.splice(index, 1, tab);
  // 过滤固定tabs，后面更改affixTabOrder的值的话可能会有问题，目前排序affixTabs没有设置值
  const pinned = ctx.tabs.value.filter((t) => isAffixTab(t));
  // 获得固定tabs的index
  const newIndex = pinned.findIndex((item) => equalTab(item, tab));
  // 交换位置重新排序
  await sortTabs(ctx, index, newIndex);
}

/**
 * @zh_CN 取消固定标签页
 * @param ctx
 * @param tab
 */
export async function unpinTab(ctx: TabbarStoreContext, tab: TabDefinition) {
  const index = ctx.tabs.value.findIndex((item) => equalTab(item, tab));
  if (index === -1) {
    return;
  }
  const oldTab = ctx.tabs.value[index];
  tab.meta.affixTab = false;
  tab.meta.title = oldTab?.meta?.title as string;
  ctx.tabs.value.splice(index, 1, tab);
  // 过滤固定tabs，后面更改affixTabOrder的值的话可能会有问题，目前排序affixTabs没有设置值
  const pinned = ctx.tabs.value.filter((t) => isAffixTab(t));
  // 获得固定tabs的下一个位置也就是活动tabs的第一个位置
  const newIndex = pinned.length;
  // 交换位置重新排序
  await sortTabs(ctx, index, newIndex);
}

/**
 * @zh_CN 切换固定标签页
 * @param ctx
 * @param tab
 */
export async function toggleTabPin(
  ctx: TabbarStoreContext,
  tab: TabDefinition,
) {
  const affixTab = tab?.meta?.affixTab ?? false;

  await (affixTab ? unpinTab(ctx, tab) : pinTab(ctx, tab));
}

/**
 * @zh_CN 重置标签页标题
 * @param ctx
 * @param tab
 */
export async function resetTabTitle(
  ctx: TabbarStoreContext,
  tab: TabDefinition,
) {
  if (tab?.meta?.newTabTitle) {
    return;
  }
  const findTab = ctx.tabs.value.find((item) => equalTab(item, tab));
  if (findTab) {
    findTab.meta.newTabTitle = undefined;
    await updateCacheTabs(ctx);
  }
}

/**
 * 设置固定标签页
 * @param ctx
 * @param routeTabs
 */
export function setAffixTabs(
  ctx: TabbarStoreContext,
  routeTabs: RouteRecordNormalized[],
) {
  for (const tab of routeTabs) {
    tab.meta.affixTab = true;
    addTab(ctx, routeToTab(tab));
  }
}

/**
 * @zh_CN 设置标签页标题
 *
 * @zh_CN 支持设置静态标题字符串或计算属性作为动态标题
 * @zh_CN 当标题为计算属性时,标题会随计算属性值变化而自动更新
 * @zh_CN 适用于需要根据状态或多语言动态更新标题的场景
 *
 * @param ctx - store 上下文
 * @param {TabDefinition} tab - 标签页对象
 * @param {ComputedRef<string> | string} title - 标题内容,支持静态字符串或计算属性
 *
 * @example
 * // 设置静态标题
 * setTabTitle(ctx, tab, '新标签页');
 *
 * @example
 * // 设置动态标题
 * setTabTitle(ctx, tab, computed(() => t('common.dashboard')));
 */
export async function setTabTitle(
  ctx: TabbarStoreContext,
  tab: TabDefinition,
  title: ComputedRef<string> | string,
) {
  const findTab = ctx.tabs.value.find((item) => equalTab(item, tab));

  if (findTab) {
    findTab.meta.newTabTitle = title;

    await updateCacheTabs(ctx);
  }
}
