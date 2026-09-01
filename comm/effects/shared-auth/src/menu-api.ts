/**
 * Menu API — 获取用户菜单树与可访问路由配置
 *
 * 封装用户菜单查询接口，为动态路由注册与权限导航提供数据源，
 * 消除各子应用中重复的菜单请求逻辑。
 *
 * @path comm\effects\shared-auth\src\menu-api.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordStringComponent } from '@ydsz/types';

import { requestClient } from './request-setup';

/**
 * 获取用户可访问的菜单树（用于动态路由注册）
 *
 * @returns 用户有权限访问的路由组件列表
 */
export async function getAllMenusApi() {
  return requestClient.get<RouteRecordStringComponent[]>(
    '/api/v1/menu/routes',
  );
}

/**
 * 获取全部菜单树（管理维护场景）
 *
 * @returns 完整菜单树列表
 */
export async function getMenuTreeApi() {
  return requestClient.get<RouteRecordStringComponent[]>(
    '/api/v1/menu/tree',
  );
}
