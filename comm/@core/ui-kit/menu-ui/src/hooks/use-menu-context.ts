/**
 * 菜单的跨层级上下文：根菜单用固定 Symbol 键，子菜单按父实例 uid 生成键。
 *
 * 子菜单键必须带 uid：菜单是递归结构，若所有子菜单共用一个键，
 * 深层子菜单会读到最近一次 provide 的值，也就是兄弟节点的数据。
 * 取值时不能只靠 inject —— 需要先向上找到父级实例才能拼出正确的键，
 * 这是 useSubMenuContext 里 findComponentUpward 存在的原因。
 *
 * @path comm\@core\ui-kit\menu-ui\src\hooks\use-menu-context.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { MenuProvider, SubMenuProvider } from '../types';

import { getCurrentInstance, inject, provide } from 'vue';

import { findComponentUpward } from '../utils';

const menuContextKey = Symbol('menuContext');

/**
 * @zh_CN Provide menu context
 */
function createMenuContext(injectMenuData: MenuProvider) {
  provide(menuContextKey, injectMenuData);
}

/**
 * @zh_CN Provide menu context
 */
function createSubMenuContext(injectSubMenuData: SubMenuProvider) {
  const instance = getCurrentInstance();

  provide(`subMenu:${instance?.uid}`, injectSubMenuData);
}

/**
 * @zh_CN Inject menu context
 */
function useMenuContext() {
  const instance = getCurrentInstance();
  if (!instance) {
    throw new Error('instance is required');
  }
  const rootMenu = inject(menuContextKey) as MenuProvider;
  return rootMenu;
}

/**
 * @zh_CN Inject menu context
 */
function useSubMenuContext() {
  const instance = getCurrentInstance();
  if (!instance) {
    throw new Error('instance is required');
  }
  const parentMenu = findComponentUpward(instance, ['Menu', 'SubMenu']);
  const subMenu = inject(`subMenu:${parentMenu?.uid}`) as SubMenuProvider;
  return subMenu;
}

export {
  createMenuContext,
  createSubMenuContext,
  useMenuContext,
  useSubMenuContext,
};
