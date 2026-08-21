/**
 * access Pinia 状态管理 — 访问控制（menus/routes/codes）
 *
 * 认证相关状态（token/refreshToken/lockScreen）由 useTokenStore 管理，
 * 本 store 仅负责权限码、菜单、路由的存取。
 *
 * 采用 Composition API（setup）语法，符合云顶编码规范 §8.1。
 *
 * @path comm\stores\src\modules\access.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordRaw } from 'vue-router';

import type { MenuRecordRaw } from '@YDSZ-core/typings';

import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * @zh_CN 访问权限相关（menus/routes/codes）
 *
 * 认证 Token 相关操作请使用 useTokenStore。
 */
export const useAccessStore = defineStore(
  'core-access',
  () => {
    /**
     * 权限码
     */
    const accessCodes = ref<string[]>([]);
    /**
     * 可访问的菜单列表
     */
    const accessMenus = ref<MenuRecordRaw[]>([]);
    /**
     * 可访问的路由列表
     */
    const accessRoutes = ref<RouteRecordRaw[]>([]);
    /**
     * 是否已经检查过权限
     */
    const isAccessChecked = ref(false);
    /**
     * 数据权限范围（行级）。
     *
     * 后端返回的资源访问范围清单，键为资源码（如 'project:budget'），
     * 值为该资源的数据范围约束（如部门 ID 列表、项目 ID 列表等）。
     * undefined/null 表示未受限，可访问全部数据。
     *
     * @since 3.4.0
     */
    const dataScopes = ref<Record<string, unknown>>({});
    /**
     * 字段级权限清单。
     *
     * 后端返回的字段访问控制清单，键为字段标识（如 'project.budget.amount'），
     * 值为访问模式：'read'（只读）/ 'mask'（脱敏展示）/ 'hidden'（隐藏）。
     *
     * @since 3.4.0
     */
    const fieldPermissions = ref<Record<string, 'mask' | 'hidden' | 'read'>>({});

    /**
     * 根据路径查找菜单（含子级递归）
     */
    function getMenuByPath(path: string) {
      function findMenu(
        menus: MenuRecordRaw[],
        targetPath: string,
      ): MenuRecordRaw | undefined {
        for (const menu of menus) {
          if (menu.path === targetPath) {
            return menu;
          }
          if (menu.children) {
            const matched = findMenu(menu.children, targetPath);
            if (matched) {
              return matched;
            }
          }
        }
      }
      return findMenu(accessMenus.value, path);
    }

    function setAccessCodes(codes: string[]) {
      accessCodes.value = codes;
    }

    function setAccessMenus(menus: MenuRecordRaw[]) {
      accessMenus.value = menus;
    }

    function setAccessRoutes(routes: RouteRecordRaw[]) {
      accessRoutes.value = routes;
    }

    function setDataScopes(scopes: Record<string, unknown>) {
      dataScopes.value = scopes;
    }

    function setFieldPermissions(perms: Record<string, 'mask' | 'hidden' | 'read'>) {
      fieldPermissions.value = perms;
    }

    function setIsAccessChecked(checked: boolean) {
      isAccessChecked.value = checked;
    }

    return {
      accessCodes,
      accessMenus,
      accessRoutes,
      dataScopes,
      fieldPermissions,
      getMenuByPath,
      isAccessChecked,
      setAccessCodes,
      setAccessMenus,
      setAccessRoutes,
      setDataScopes,
      setFieldPermissions,
      setIsAccessChecked,
    };
  },
  {
    persist: {
      pick: ['accessCodes'],
    },
  },
);

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useAccessStore, hot));
}
