/**
 * tabbar Pinia 状态管理
 *
 * 纯工具函数与回调注册中心已拆分至 `./tabbar-utils`（见云顶编码规范 §15.1）。
 * 本文件采用 Composition API（setup）语法，符合云顶编码规范 §8.1。
 *
 * @path comm\stores\src\modules\tabbar.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { ComputedRef } from 'vue';
import type {
  Router,
  RouteRecordNormalized,
} from 'vue-router';

import type { TabDefinition } from '@YDSZ-core/typings';

import { toRaw } from 'vue';

import { preferences } from '@YDSZ-core/preferences';
import {
  openRouteInNewWindow,
  startProgress,
  stopProgress,
} from '@YDSZ-core/shared/utils';
import { createLogger } from '@YDSZ-core/shared/utils';

import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

import {
  cloneTab,
  equalTab,
  getTabKey,
  getTabKeyFromTab,
  isAffixTab,
  isTabShown,
  notifyTabClosed,
  onTabClosed,
  routeToTab,
} from './tabbar-utils';

/** 模块级日志器 */
const logger = createLogger('Tabbar');

/**
 * @zh_CN 访问权限相关
 */
export const useTabbarStore = defineStore(
  'core-tabbar',
  () => {
    /**
     * @zh_CN 当前打开的标签页列表缓存（使用数组避免 Set 序列化隐患）
     */
    const cachedTabs = ref<string[]>([]);
    /**
     * @zh_CN 拖拽结束的索引
     */
    const dragEndIndex = ref(0);
    /**
     * @zh_CN 需要排除缓存的标签页（使用数组避免 Set 序列化隐患）
     */
    const excludeCachedTabs = ref<string[]>([]);
    /**
     * @zh_CN 标签右键菜单列表
     */
    const menuList = ref<string[]>([
      'close',
      'affix',
      'maximize',
      'reload',
      'open-in-new-window',
      'close-left',
      'close-right',
      'close-other',
      'close-all',
    ]);
    /**
     * @zh_CN 是否刷新
     */
    const renderRouteView = ref(true);
    /**
     * @zh_CN 当前打开的标签页列表
     */
    const tabs = ref<TabDefinition[]>([]);
    /**
     * @zh_CN 更新时间，用于一些更新场景，使用watch深度监听的话，会损耗性能
     */
    const updateTime = ref(Date.now());

    /** 固定标签页（按 affixTabOrder 排序） */
    const affixTabs = computed<TabDefinition[]>(() => {
      const pinned = tabs.value.filter((tab) => isAffixTab(tab));

      return pinned.sort((a, b) => {
        const orderA = (a.meta?.affixTabOrder ?? 0) as number;
        const orderB = (b.meta?.affixTabOrder ?? 0) as number;
        return orderA - orderB;
      });
    });

    const getCachedTabs = computed<string[]>(() => [...cachedTabs.value]);

    const getExcludeCachedTabs = computed<string[]>(() => [...excludeCachedTabs.value]);

    const getMenuList = computed<string[]>(() => menuList.value);

    /** 常规标签页 + 固定标签页（固定优先） */
    const getTabs = computed<TabDefinition[]>(() => {
      const normalTabs = tabs.value.filter((tab) => !isAffixTab(tab));
      return [...affixTabs.value, ...normalTabs].filter(Boolean);
    });

    /**
     * Close tabs in bulk
     */
    async function _bulkCloseByKeys(keys: string[]) {
      const keySet = new Set(keys);
      tabs.value = tabs.value.filter(
        (item) => !keySet.has(getTabKeyFromTab(item)),
      );

      await updateCacheTabs();
    }

    /**
     * @zh_CN 关闭标签页
     * @param tab
     */
    function _close(tab: TabDefinition) {
      if (isAffixTab(tab)) {
        return;
      }
      const index = tabs.value.findIndex((item) => equalTab(item, tab));
      if (index !== -1) {
        const closedPath = tabs.value[index]!.fullPath || tabs.value[index]!.path;
        tabs.value.splice(index, 1);
        notifyTabClosed(closedPath);
      }
    }

    /**
     * @zh_CN 跳转到默认标签页
     */
    async function _goToDefaultTab(router: Router) {
      if (getTabs.value.length <= 0) {
        return;
      }
      const firstTab = getTabs.value[0];
      if (firstTab) {
        await _goToTab(firstTab, router);
      }
    }

    /**
     * @zh_CN 跳转到标签页
     * @param tab
     * @param router
     */
    async function _goToTab(tab: TabDefinition, router: Router) {
      const { params, path, query } = tab;
      const toParams = {
        params: params || {},
        path,
        query: query || {},
      };
      await router.replace(toParams);
    }

    /**
     * @zh_CN 添加标签页
     * @param routeTab
     */
    function addTab(routeTab: TabDefinition): TabDefinition {
      let tab = cloneTab(routeTab);
      if (!tab.key) {
        tab.key = getTabKey(routeTab);
      }
      if (!isTabShown(tab)) {
        return tab;
      }

      const tabIndex = tabs.value.findIndex((item) => {
        return equalTab(item, tab);
      });

      if (tabIndex === -1) {
        const maxCount = preferences.tabbar.maxCount;
        // 获取动态路由打开数，超过 0 即代表需要控制打开数
        const maxNumOfOpenTab = (routeTab?.meta?.maxNumOfOpenTab ??
          -1) as number;
        // 如果动态路由层级大于 0 了，那么就要限制该路由的打开数限制了
        // 获取到已经打开的动态路由数, 判断是否大于某一个值
        if (
          maxNumOfOpenTab > 0 &&
          tabs.value.filter((t) => t.name === routeTab.name).length >=
            maxNumOfOpenTab
        ) {
          // 关闭第一个
          const index = tabs.value.findIndex(
            (item) => item.name === routeTab.name,
          );
          index !== -1 && tabs.value.splice(index, 1);
        } else if (maxCount > 0 && tabs.value.length >= maxCount) {
          // 关闭第一个
          const index = tabs.value.findIndex(
            (item) =>
              !Reflect.has(item.meta, 'affixTab') || !item.meta.affixTab,
          );
          index !== -1 && tabs.value.splice(index, 1);
        }
        tabs.value.push(tab);
      } else {
        // 页面已经存在，不重复添加选项卡，只更新选项卡参数
        const currentTab = toRaw(tabs.value)[tabIndex];
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
        tabs.value.splice(tabIndex, 1, mergedTab);
      }
      updateCacheTabs();
      return tab;
    }

    /**
     * @zh_CN 关闭所有标签页
     */
    async function closeAllTabs(router: Router) {
      const newTabs = tabs.value.filter((tab) => isAffixTab(tab));
      tabs.value = newTabs.length > 0 ? newTabs : tabs.value.slice(0, 1);
      await _goToDefaultTab(router);
      updateCacheTabs();
    }

    /**
     * @zh_CN 关闭左侧标签页
     * @param tab
     */
    async function closeLeftTabs(tab: TabDefinition) {
      const index = tabs.value.findIndex((item) => equalTab(item, tab));

      if (index < 1) {
        return;
      }

      const leftTabs = tabs.value.slice(0, index);
      const keys: string[] = [];

      for (const item of leftTabs) {
        if (!isAffixTab(item)) {
          keys.push(item.key as string);
        }
      }
      await _bulkCloseByKeys(keys);
    }

    /**
     * @zh_CN 关闭其他标签页
     * @param tab
     */
    async function closeOtherTabs(tab: TabDefinition) {
      const closeKeys = tabs.value.map((item) => getTabKeyFromTab(item));

      const keys: string[] = [];

      for (const key of closeKeys) {
        if (key !== getTabKeyFromTab(tab)) {
          const closeTab = tabs.value.find(
            (item) => getTabKeyFromTab(item) === key,
          );
          if (!closeTab) {
            continue;
          }
          if (!isAffixTab(closeTab)) {
            keys.push(closeTab.key as string);
          }
        }
      }
      await _bulkCloseByKeys(keys);
    }

    /**
     * @zh_CN 关闭右侧标签页
     * @param tab
     */
    async function closeRightTabs(tab: TabDefinition) {
      const index = tabs.value.findIndex((item) => equalTab(item, tab));

      if (index !== -1 && index < tabs.value.length - 1) {
        const rightTabs = tabs.value.slice(index + 1);

        const keys: string[] = [];
        for (const item of rightTabs) {
          if (!isAffixTab(item)) {
            keys.push(item.key as string);
          }
        }
        await _bulkCloseByKeys(keys);
      }
    }

    /**
     * @zh_CN 关闭标签页
     * @param tab
     * @param router
     */
    async function closeTab(tab: TabDefinition, router: Router) {
      const { currentRoute } = router;
      // 关闭不是激活选项卡
      if (getTabKey(currentRoute.value) !== getTabKeyFromTab(tab)) {
        _close(tab);
        updateCacheTabs();
        return;
      }
      const index = getTabs.value.findIndex(
        (item) => getTabKeyFromTab(item) === getTabKey(currentRoute.value),
      );

      const before = getTabs.value[index - 1];
      const after = getTabs.value[index + 1];

      // 下一个tab存在，跳转到下一个
      if (after) {
        _close(tab);
        await _goToTab(after, router);
        // 上一个tab存在，跳转到上一个
      } else if (before) {
        _close(tab);
        await _goToTab(before, router);
      } else {
        logger.error('Failed to close the tab; only one tab remains open.');
      }
    }

    /**
     * @zh_CN 通过key关闭标签页
     * @param key
     * @param router
     */
    async function closeTabByKey(key: string, router: Router) {
      const originKey = decodeURIComponent(key);
      const index = tabs.value.findIndex(
        (item) => getTabKeyFromTab(item) === originKey,
      );
      if (index === -1) {
        return;
      }

      const tab = tabs.value[index];
      if (tab) {
        await closeTab(tab, router);
      }
    }

    /**
     * 根据tab的key获取tab
     * @param key
     */
    function getTabByKey(key: string) {
      return getTabs.value.find(
        (item) => getTabKeyFromTab(item) === key,
      ) as TabDefinition;
    }

    /**
     * @zh_CN 新窗口打开标签页
     * @param tab
     */
    async function openTabInNewWindow(tab: TabDefinition) {
      openRouteInNewWindow(tab.fullPath || tab.path);
    }

    /**
     * @zh_CN 固定标签页
     * @param tab
     */
    async function pinTab(tab: TabDefinition) {
      const index = tabs.value.findIndex((item) => equalTab(item, tab));
      if (index === -1) {
        return;
      }
      const oldTab = tabs.value[index];
      tab.meta.affixTab = true;
      tab.meta.title = oldTab?.meta?.title as string;
      tabs.value.splice(index, 1, tab);
      // 过滤固定tabs，后面更改affixTabOrder的值的话可能会有问题，目前排序affixTabs没有设置值
      const pinned = tabs.value.filter((t) => isAffixTab(t));
      // 获得固定tabs的index
      const newIndex = pinned.findIndex((item) => equalTab(item, tab));
      // 交换位置重新排序
      await sortTabs(index, newIndex);
    }

    /**
     * 刷新标签页
     */
    async function refresh(router: Router | string) {
      // 如果是Router路由，那么就根据当前路由刷新
      // 如果是string字符串，为路由名称，则定向刷新指定标签页，不能是当前路由名称，否则不会刷新
      if (typeof router === 'string') {
        return await refreshByName(router);
      }

      const { currentRoute } = router;
      const { name } = currentRoute.value;

      excludeCachedTabs.value = [...new Set([...excludeCachedTabs.value, name as string])];
      renderRouteView.value = false;
      startProgress();

      await new Promise((resolve) => setTimeout(resolve, 200));

      excludeCachedTabs.value = excludeCachedTabs.value.filter((n) => n !== (name as string));
      renderRouteView.value = true;
      stopProgress();
    }

    /**
     * 根据路由名称刷新指定标签页
     */
    async function refreshByName(name: string) {
      excludeCachedTabs.value = [...new Set([...excludeCachedTabs.value, name])];
      await new Promise((resolve) => setTimeout(resolve, 200));
      excludeCachedTabs.value = excludeCachedTabs.value.filter((n) => n !== name);
    }

    /**
     * @zh_CN 重置标签页标题
     */
    async function resetTabTitle(tab: TabDefinition) {
      if (tab?.meta?.newTabTitle) {
        return;
      }
      const findTab = tabs.value.find((item) => equalTab(item, tab));
      if (findTab) {
        findTab.meta.newTabTitle = undefined;
        await updateCacheTabs();
      }
    }

    /**
     * 设置固定标签页
     * @param routeTabs
     */
    function setAffixTabs(routeTabs: RouteRecordNormalized[]) {
      for (const tab of routeTabs) {
        tab.meta.affixTab = true;
        addTab(routeToTab(tab));
      }
    }

    /**
     * @zh_CN 更新菜单列表
     * @param list
     */
    function setMenuList(list: string[]) {
      menuList.value = list;
    }

    /**
     * @zh_CN 设置标签页标题
     *
     * @zh_CN 支持设置静态标题字符串或计算属性作为动态标题
     * @zh_CN 当标题为计算属性时,标题会随计算属性值变化而自动更新
     * @zh_CN 适用于需要根据状态或多语言动态更新标题的场景
     *
     * @param {TabDefinition} tab - 标签页对象
     * @param {ComputedRef<string> | string} title - 标题内容,支持静态字符串或计算属性
     *
     * @example
     * // 设置静态标题
     * setTabTitle(tab, '新标签页');
     *
     * @example
     * // 设置动态标题
     * setTabTitle(tab, computed(() => t('common.dashboard')));
     */
    async function setTabTitle(tab: TabDefinition, title: ComputedRef<string> | string) {
      const findTab = tabs.value.find((item) => equalTab(item, tab));

      if (findTab) {
        findTab.meta.newTabTitle = title;

        await updateCacheTabs();
      }
    }

    function setUpdateTime() {
      updateTime.value = Date.now();
    }

    /**
     * @zh_CN 设置标签页顺序
     * @param oldIndex
     * @param newIndex
     */
    async function sortTabs(oldIndex: number, newIndex: number) {
      const currentTab = tabs.value[oldIndex];
      if (!currentTab) {
        return;
      }
      tabs.value.splice(oldIndex, 1);
      tabs.value.splice(newIndex, 0, currentTab);
      dragEndIndex.value = dragEndIndex.value + 1;
    }

    /**
     * @zh_CN 切换固定标签页
     * @param tab
     */
    async function toggleTabPin(tab: TabDefinition) {
      const affixTab = tab?.meta?.affixTab ?? false;

      await (affixTab ? unpinTab(tab) : pinTab(tab));
    }

    /**
     * @zh_CN 取消固定标签页
     * @param tab
     */
    async function unpinTab(tab: TabDefinition) {
      const index = tabs.value.findIndex((item) => equalTab(item, tab));
      if (index === -1) {
        return;
      }
      const oldTab = tabs.value[index];
      tab.meta.affixTab = false;
      tab.meta.title = oldTab?.meta?.title as string;
      tabs.value.splice(index, 1, tab);
      // 过滤固定tabs，后面更改affixTabOrder的值的话可能会有问题，目前排序affixTabs没有设置值
      const pinned = tabs.value.filter((t) => isAffixTab(t));
      // 获得固定tabs的index,使用固定tabs的下一个位置也就是活动tabs的第一个位置
      const newIndex = pinned.length;
      // 交换位置重新排序
      await sortTabs(index, newIndex);
    }

    /**
     * 根据当前打开的选项卡更新缓存
     */
    async function updateCacheTabs() {
      const cacheMap = new Set<string>();

      for (const tab of tabs.value) {
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
      cachedTabs.value = [...cacheMap];
    }

    return {
      affixTabs,
      addTab,
      cachedTabs,
      closeAllTabs,
      closeLeftTabs,
      closeOtherTabs,
      closeRightTabs,
      closeTab,
      closeTabByKey,
      dragEndIndex,
      excludeCachedTabs,
      getCachedTabs,
      getExcludeCachedTabs,
      getMenuList,
      getTabByKey,
      getTabs,
      menuList,
      openTabInNewWindow,
      pinTab,
      refresh,
      refreshByName,
      renderRouteView,
      resetTabTitle,
      setAffixTabs,
      setMenuList,
      setTabTitle,
      setUpdateTime,
      sortTabs,
      tabs,
      toggleTabPin,
      unpinTab,
      updateCacheTabs,
      updateTime,
    };
  },
  {
    persist: [
      // tabs不需要保存在localStorage
      {
        pick: ['tabs'],
        storage: sessionStorage,
      },
    ],
  },
);

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useTabbarStore, hot));
}

export { onTabClosed };
export { getTabKey };
