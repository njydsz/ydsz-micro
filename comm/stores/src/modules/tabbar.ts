/**
 * tabbar Pinia 状态管理
 *
 * 纯工具函数已拆分至 `./tabbar-utils`（见云顶编码规范 §15.1）。
 * 动作函数已拆分至 `./tabbar-actions` 与 `./tabbar-manage`。
 * 本文件采用 Composition API（setup）语法，符合云顶编码规范 §8.1，
 * 仅保留状态定义、计算属性与动作绑定。
 *
 * @path comm\stores\src\modules\tabbar.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { ComputedRef } from 'vue';
import type { Router } from 'vue-router';
import type { RouteRecordNormalized } from 'vue-router';
import type { TabDefinition } from '@YDSZ-core/typings';

import { openRouteInNewWindow } from '@YDSZ-core/shared/utils';

import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

import {
  getTabKey,
  isAffixTab,
  onTabClosed,
} from './tabbar-utils';
import type { TabbarStoreContext } from './tabbar-utils';
import {
  closeAllTabs,
  closeLeftTabs,
  closeOtherTabs,
  closeRightTabs,
  closeTab,
  closeTabByKey,
  refresh,
} from './tabbar-actions';
import {
  addTab,
  getTabByKey,
  refreshByName,
  sortTabs,
  updateCacheTabs,
} from './tabbar-store-actions';
import {
  pinTab,
  resetTabTitle,
  setAffixTabs,
  setTabTitle,
  toggleTabPin,
  unpinTab,
} from './tabbar-manage';

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

    const getExcludeCachedTabs = computed<string[]>(() => [
      ...excludeCachedTabs.value,
    ]);

    const getMenuList = computed<string[]>(() => menuList.value);

    /** 常规标签页 + 固定标签页（固定优先） */
    const getTabs = computed<TabDefinition[]>(() => {
      const normalTabs = tabs.value.filter((tab) => !isAffixTab(tab));
      return [...affixTabs.value, ...normalTabs].filter(Boolean);
    });

    // ─── 构建 utility 函数所需的上下文 ───

    const _ctx: TabbarStoreContext = {
      cachedTabs,
      dragEndIndex,
      excludeCachedTabs,
      getCachedTabs,
      getTabs,
      renderRouteView,
      tabs,
      updateTime,
    };

    // ─── 保持内联的极简动作（仅一行委托，无需独立文件） ───

    /**
     * 在新浏览器窗口中打开标签页对应路由。
     *
     * @param tab - 目标标签页
     */
    async function openTabInNewWindow(tab: TabDefinition) {
      openRouteInNewWindow(tab.fullPath || tab.path);
    }

    /**
     * 更新标签右键菜单项列表。
     *
     * @param list - 菜单项标识数组（如 ['close', 'reload']）
     */
    function setMenuList(list: string[]) {
      menuList.value = list;
    }

    /** 触发 watchers 重新执行的时间戳更新（用于性能敏感场景替代 deep watch）。 */
    function setUpdateTime() {
      updateTime.value = Date.now();
    }

    // ─── 动作绑定：委托至 tabbar-actions / tabbar-manage ───

    const _addTab = (routeTab: TabDefinition) => addTab(_ctx, routeTab);
    const _closeAllTabs = (router: Router) => closeAllTabs(_ctx, router);
    const _closeLeftTabs = (tab: TabDefinition) =>
      closeLeftTabs(_ctx, tab);
    const _closeOtherTabs = (tab: TabDefinition) =>
      closeOtherTabs(_ctx, tab);
    const _closeRightTabs = (tab: TabDefinition) =>
      closeRightTabs(_ctx, tab);
    const _closeTab = (tab: TabDefinition, router: Router) =>
      closeTab(_ctx, tab, router);
    const _closeTabByKey = (key: string, router: Router) =>
      closeTabByKey(_ctx, key, router);
    const _getTabByKey = (key: string) => getTabByKey(_ctx, key);
    const _pinTab = (tab: TabDefinition) => pinTab(_ctx, tab);
    const _refresh = (router: Router | string) => refresh(_ctx, router);
    const _refreshByName = (name: string) => refreshByName(_ctx, name);
    const _resetTabTitle = (tab: TabDefinition) =>
      resetTabTitle(_ctx, tab);
    const _setAffixTabs = (routeTabs: RouteRecordNormalized[]) =>
      setAffixTabs(_ctx, routeTabs);
    const _setTabTitle = (
      tab: TabDefinition,
      title: ComputedRef<string> | string,
    ) => setTabTitle(_ctx, tab, title);
    const _sortTabs = (oldIndex: number, newIndex: number) =>
      sortTabs(_ctx, oldIndex, newIndex);
    const _toggleTabPin = (tab: TabDefinition) => toggleTabPin(_ctx, tab);
    const _unpinTab = (tab: TabDefinition) => unpinTab(_ctx, tab);
    const _updateCacheTabs = () => updateCacheTabs(_ctx);

    return {
      affixTabs,
      addTab: _addTab,
      cachedTabs,
      closeAllTabs: _closeAllTabs,
      closeLeftTabs: _closeLeftTabs,
      closeOtherTabs: _closeOtherTabs,
      closeRightTabs: _closeRightTabs,
      closeTab: _closeTab,
      closeTabByKey: _closeTabByKey,
      dragEndIndex,
      excludeCachedTabs,
      getCachedTabs,
      getExcludeCachedTabs,
      getMenuList,
      getTabByKey: _getTabByKey,
      getTabs,
      menuList,
      openTabInNewWindow,
      pinTab: _pinTab,
      refresh: _refresh,
      refreshByName: _refreshByName,
      renderRouteView,
      resetTabTitle: _resetTabTitle,
      setAffixTabs: _setAffixTabs,
      setMenuList,
      setTabTitle: _setTabTitle,
      setUpdateTime,
      sortTabs: _sortTabs,
      tabs,
      toggleTabPin: _toggleTabPin,
      unpinTab: _unpinTab,
      updateCacheTabs: _updateCacheTabs,
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
