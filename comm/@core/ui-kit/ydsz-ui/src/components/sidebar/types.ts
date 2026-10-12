/**
 * Sidebar（侧边栏导航）Props / Emits / 数据模型。
 *
 * <p>支持嵌套子菜单、手风琴模式、收起/展开、图标+文本+徽章、
 * 键盘导航、ARIA 树形结构等交互能力。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\sidebar\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/* ============================================================ */
/* 数据模型                                                        */
/* ============================================================ */

/** 侧边栏菜单项 */
export interface SidebarItem {
  /** 唯一键 */
  key: string;
  /** 显示文本 */
  label: string;
  /** Iconify 图标名 */
  icon?: string;
  /** 子菜单 */
  children?: SidebarItem[];
  /** 角标（数字或文本） */
  badge?: number | string;
  /** 是否禁用 */
  disabled?: boolean;
}

/* ============================================================ */
/* Props                                                          */
/* ============================================================ */

/** YdSidebar 组件 Props */
export interface YdSidebarProps {
  /** 菜单项列表 */
  items: SidebarItem[];
  /** 当前激活项的 key（受控） */
  activeKey?: string;
  /** 是否收起为 icon-only 模式 */
  collapsed?: boolean;
  /** 展开时宽度，默认 240px */
  width?: number | string;
  /** 收起时宽度，默认 64px */
  collapsedWidth?: number | string;
  /** 手风琴模式（同时只展开一个子菜单） */
  accordion?: boolean;
}

/* ============================================================ */
/* Emits                                                          */
/* ============================================================ */

/** YdSidebar 组件 Emits */
export interface YdSidebarEmits {
  /** 激活项变化（v-model:activeKey） */
  (e: 'update:activeKey', key: string): void;
  /** 菜单项选中 */
  (e: 'select', item: SidebarItem): void;
  /** 子菜单展开变化 */
  (e: 'expand-change', expandedKeys: string[]): void;
}
