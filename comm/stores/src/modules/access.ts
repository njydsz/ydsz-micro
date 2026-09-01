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
     * 根据路径在已授权菜单列表递归查找匹配项。
     *
     * @param path - 目标菜单路径（如 '/system/user'）
     * @returns 匹配的菜单项，未找到返回 undefined
     */
    function getMenuByPath(path: string): MenuRecordRaw | undefined {
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

    /**
     * 设置当前用户权限码列表。
     *
     * @param codes - 权限码字符串数组（如 ['system:user:add', 'system:user:edit']）
     */
    function setAccessCodes(codes: string[]) {
      accessCodes.value = codes;
    }

    /**
     * 设置可访问菜单列表。
     *
     * @param menus - 经后端或前端过滤后的菜单配置数组
     */
    function setAccessMenus(menus: MenuRecordRaw[]) {
      accessMenus.value = menus;
    }

    /**
     * 设置可访问路由列表。
     *
     * @param routes - 经鉴权过滤后的 Vue Router 路由配置
     */
    function setAccessRoutes(routes: RouteRecordRaw[]) {
      accessRoutes.value = routes;
    }

    /**
     * 设置数据行级权限范围。
     *
     * @param scopes - 资源码到数据范围约束的映射
     */
    function setDataScopes(scopes: Record<string, unknown>) {
      dataScopes.value = scopes;
    }

    /**
     * 设置字段级访问控制清单。
     *
     * @param perms - 字段标识到访问模式（read / mask / hidden）的映射
     */
    function setFieldPermissions(perms: Record<string, 'mask' | 'hidden' | 'read'>) {
      fieldPermissions.value = perms;
    }

    /**
     * 标记权限检查是否已完成。
     *
     * @param checked - true 表示权限已检查
     */
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
