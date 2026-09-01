/**
 * 右键菜单项的数据结构定义。
 *
 * 单独成文件是因为菜单数据常由路由或权限配置生成，业务侧需要在不引入组件
 * （及其 radix 依赖）的前提下引用该类型。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\context-menu\interface.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Component } from 'vue';

interface IContextMenuItem {
  /**
   * @zh_CN 是否禁用
   */
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
   * @zh_CN 是否显示图标
   */
  inset?: boolean;
  /**
   * @zh_CN 唯一标识
   */
  key: string;
  /**
   * @zh_CN 是否是分割线
   */
  separator?: boolean;
  /**
   * @zh_CN 快捷键
   */
  shortcut?: string;
  /**
   * @zh_CN 标题
   */
  text: string;
}
export type { IContextMenuItem };

