/**
 * 通过路径在菜单树中查找匹配的菜单项及其根级菜单，支持父子层级导航。
 *
 * @path comm\utils\src\helpers\find-menu-by-path.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { MenuRecordRaw } from '@YDSZ-core/typings';

/**
 * 在菜单树中递归查找匹配路径的菜单项。
 *
 * @param list - 菜单列表
 * @param path - 目标路径（如 '/system/user'）
 * @returns 匹配的菜单项，未找到返回 null
 */
function findMenuByPath(
  list: MenuRecordRaw[],
  path?: string,
): MenuRecordRaw | null {
  for (const menu of list) {
    if (menu.path === path) {
      return menu;
    }
    const findMenu = menu.children && findMenuByPath(menu.children, path);
    if (findMenu) {
      return findMenu;
    }
  }
  return null;
}

/**
 * 查找菜单项及其指定层级的根菜单。
 *
 * @remarks
 * 先调用 findMenuByPath 定位目标菜单，再根据其 parents 路径回溯到指定层级的根菜单，
 * 用于侧边栏菜单展开/高亮当前激活路径。
 *
 * @param menus - 菜单列表
 * @param path - 目标路径
 * @param level - 根菜单层级索引，默认 0（顶级）
 * @returns 包含查找结果、根菜单及根菜单路径的对象
 */
function findRootMenuByPath(menus: MenuRecordRaw[], path?: string, level = 0): {
  findMenu: MenuRecordRaw | null;
  rootMenu: MenuRecordRaw | undefined;
  rootMenuPath: string | undefined;
} {
  const findMenu = findMenuByPath(menus, path);
  const rootMenuPath = findMenu?.parents?.[level];
  const rootMenu = rootMenuPath
    ? menus.find((item) => item.path === rootMenuPath)
    : undefined;
  return {
    findMenu,
    rootMenu,
    rootMenuPath,
  };
}

export { findMenuByPath, findRootMenuByPath };
