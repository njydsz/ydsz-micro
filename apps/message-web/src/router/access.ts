/**
 * 路由权限生成器
 * <p>根据用户角色/权限码动态生成可访问路由表。
 * <p>提供 {@code generateAccess} 异步方法，从后端拉取菜单、构建路由、注册到 router。
 * <p>支持前端静态路由 + 后端动态路由混合模式。
 *
 * @path apps\message-web\src\router\access.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { ComponentRecordType, GenerateMenuAndRoutesOptions } from '@ydsz/types';

import { generateAccessible } from '@ydsz/access';
import { preferences } from '@ydsz/preferences';

import { ElMessage } from 'element-plus';

import { getAllMenusApi } from '#/api';
import { BasicLayout, IFrameView } from '#/layouts';
import { $t } from '#/locales';

const forbiddenComponent = () => import('#/views/fallback/not-found.vue');

/**
 * 根据当前用户权限动态生成可访问路由表。
 *
 * <p>从后端拉取菜单列表，结合前端 pageMap / layoutMap 组件注册表，
 * 构造包含路由元信息、权限码的 RouteRecordRaw 数组并注册到 router。
 *
 * @param options 路由生成选项（含 router 实例等）
 * @returns 生成的可访问路由表
 */
async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  return await generateAccessible(preferences.app.accessMode, {
    ...options,
    fetchMenuListAsync: async () => {
      ElMessage({
        duration: 1500,
        message: `${$t('common.loadingMenu')}...`,
      });
      return await getAllMenusApi();
    },
    forbiddenComponent,
    layoutMap,
    pageMap,
  });
}

export { generateAccess };
