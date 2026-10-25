/**
 * Notification 组件的 TypeScript 类型定义。
 *
 * <p>这里描述的是「浮层通知卡片」这一展示层的条目契约：由宿主（业务列表或
 * 通知中心）负责排队与定位，卡片自身只管渲染与自动关闭计时。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\notification\types.ts
 * @author ydsz-team
 * @since 5.7.0
 */

import type { Component } from 'vue';

/** 通知语义级别 */
export type NotificationType = 'error' | 'info' | 'success' | 'warning';

/** 通知卡片属性 */
export interface NotificationProps {
  /** 自定义 CSS class */
  class?: string;
  /** 描述（次要文案） */
  description?: string;
  /** 自动关闭时长（毫秒），0 表示常驻 */
  duration?: number;
  /** 自定义图标组件（覆盖按级别选择的默认图标） */
  icon?: Component;
  /** 唯一标识，close 事件原样回传 */
  id: string;
  /** 标题（主文案） */
  message: string;
  /** 是否渲染图标 */
  showIcon?: boolean;
  /** 语义级别 */
  type?: NotificationType;
}
