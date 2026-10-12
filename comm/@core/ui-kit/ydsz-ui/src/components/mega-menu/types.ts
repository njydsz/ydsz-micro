/**
 * MegaMenu —— 大型菜单组件 Props / Emits / 菜单项类型。
 *
 * 多列分组的大型菜单，类似 Azure / Office 的 mega menu 模式。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\mega-menu\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 子菜单列内的条目 */
export interface MegaMenuSubItem {
  /** 显示文本 */
  label: string;
  /** 图标（图标名） */
  icon?: string;
  /** 点击回调 */
  command?: () => void;
}

/** 子菜单分组 */
export interface MegaMenuColumn {
  /** 列标题 */
  title: string;
  /** 分组内的条目 */
  items: MegaMenuSubItem[];
}

/** 顶级菜单项 */
export interface MegaMenuItem {
  /** 顶级菜单显示文本 */
  label: string;
  /** 图标 */
  icon?: string;
  /** 多级分组数据 */
  items: MegaMenuColumn[];
  /** 点击顶级项的回调 */
  command?: () => void;
}

/** MegaMenu 组件 Props */
export interface YdMegaMenuProps {
  /** 菜单数据 */
  items: MegaMenuItem[];
  /** 排列方向 */
  orientation?: 'horizontal' | 'vertical';
}

/** MegaMenu 组件 Emits */
export interface YdMegaMenuEmits {
  /** 子菜单条目被点击时触发，参数为 MegaMenuSubItem */
  (e: 'command', item: MegaMenuSubItem): void;
}
