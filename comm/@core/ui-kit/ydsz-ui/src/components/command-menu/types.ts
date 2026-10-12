/**
 * CommandMenu —— 命令面板组件 Props / Emits / 菜单项类型。
 *
 * 受 VS Code / Raycast 启发的命令面板，支持搜索过滤、键盘导航、嵌套子菜单。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\command-menu\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 命令菜单项 */
export interface CommandItem {
  /** 唯一标识 */
  id: string;
  /** 显示文本 */
  label: string;
  /** 图标（图标名） */
  icon?: string;
  /** 快捷键展示文本（如 ['⌘', 'K']） */
  shortcut?: string[];
  /** 是否禁用 */
  disabled?: boolean;
  /** 点击执行的动作 */
  action: () => void;
  /** 嵌套子菜单 */
  children?: CommandItem[];
}

/** CommandMenu 组件 Props */
export interface YdCommandMenuProps {
  /** 命令列表（支持嵌套） */
  items: CommandItem[];
  /** 搜索框占位符 */
  placeholder?: string;
  /** 无匹配结果时显示文本 */
  emptyText?: string;
  /** 命令面板显隐（受控） */
  open?: boolean;
}

/** CommandMenu 组件 Emits */
export interface YdCommandMenuEmits {
  /** 选中命令项时触发 */
  (e: 'select', item: CommandItem): void;
  /** 显隐状态变化时触发 */
  (e: 'update:open', value: boolean): void;
}
