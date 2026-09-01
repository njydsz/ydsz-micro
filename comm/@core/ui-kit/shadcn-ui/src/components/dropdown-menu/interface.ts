/**
 * 下拉菜单项与组件 props 的类型定义。
 *
 * 独立成文件以便业务在组装菜单数据时引用，无需连带引入组件实现。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\dropdown-menu\interface.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Component } from 'vue';

interface YDSZDropdownMenuItem {
  disabled?: boolean;
  /**
   * @zh_CN 点击事件处理
   * @param data
   */
  handler?: (data: any) => void;
  /**
   * @zh_CN 图标
   */
  icon?: Component;
  /**
   * @zh_CN 标题
   */
  label: string;
  /**
   * @zh_CN 是否是分割线
   */
  separator?: boolean;
  /**
   * @zh_CN 唯一标识
   */
  value: string;
}

interface DropdownMenuProps {
  menus: YDSZDropdownMenuItem[];
}

export type { DropdownMenuProps, YDSZDropdownMenuItem };

