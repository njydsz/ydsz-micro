/**
 * 普通菜单组件的 props 类型契约。
 *
 * 与 Menu 的 props 刻意不复用：普通菜单只消费扁平的 menus 数组，
 * 不支持 defaultOpeneds 等递归菜单才有的状态，合并类型会对外承诺做不到的事情。
 *
 * @path comm\@core\ui-kit\menu-ui\src\components\normal-menu\normal-menu.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { MenuRecordRaw } from '@YDSZ-core/typings';

interface NormalMenuProps {
  /**
   * 菜单数据
   */
  activePath?: string;
  /**
   * 是否折叠
   */
  collapse?: boolean;
  /**
   * 菜单项
   */
  menus?: MenuRecordRaw[];
  /**
   * @zh_CN 是否圆润风格
   * @default true
   */
  rounded?: boolean;
  /**
   * 主题
   */
  theme?: 'dark' | 'light';
}

export type { NormalMenuProps };
