/**
 * 菜单项定位相关的两个组合式函数：向上查找父级链路与父组件、推导层级缩进变量。
 *
 * parentPaths 用 while 循环沿 instance.parent 上溯直到遇到 Menu，
 * 而不是维护一份外部注册表 —— 菜单项是递归嵌套的，
 * 注册表需要在展开/收起时同步增删，反而更容易出现脏数据。
 * useMenuStyle 把层级写成 CSS 变量 --menu-level，缩进交给样式层处理，
 * 避免为每一级都生成一个内联 padding。
 *
 * @path comm\@core\ui-kit\menu-ui\src\hooks\use-menu.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { SubMenuProvider } from '../types';

import { computed, getCurrentInstance } from 'vue';

import { findComponentUpward } from '../utils';

function useMenu() {
  const instance = getCurrentInstance();
  if (!instance) {
    throw new Error('instance is required');
  }

  /**
   * @zh_CN 获取所有父级菜单链路
   */
  const parentPaths = computed(() => {
    let parent = instance.parent;
    const paths: string[] = [instance.props.path as string];
    while (parent?.type.name !== 'Menu') {
      if (parent?.props.path) {
        paths.unshift(parent.props.path as string);
      }
      parent = parent?.parent ?? null;
    }

    return paths;
  });

  const parentMenu = computed(() => {
    return findComponentUpward(instance, ['Menu', 'SubMenu']);
  });

  return {
    parentMenu,
    parentPaths,
  };
}

function useMenuStyle(menu?: SubMenuProvider) {
  const subMenuStyle = computed(() => {
    return {
      '--menu-level': menu ? ((menu?.level ?? 0) + 1) : 0,
    };
  });
  return subMenuStyle;
}

export { useMenu, useMenuStyle };
