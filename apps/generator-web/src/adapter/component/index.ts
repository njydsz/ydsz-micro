/**
 * 组件适配器 —— generator-web 本地组件注册表。
 *
 * @path apps/generator-web/src/adapter/component/index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { globalShareState } from '@ydsz/common-ui';

import { ElNotification } from 'element-plus';

import type { ComponentType } from './component-type';

/**
 * 初始化组件适配器。
 *
 * <p>generator-web 为轻量代码生成器，无需注册大量表单组件，
 * 仅初始化全局消息提示能力。
 */
export async function initComponentAdapter(): Promise<void> {
  // 空组件表（generator-web 不渲染复杂表单）
  globalShareState.setComponents({} as Record<string, ComponentType>);

  // 全局消息提示
  globalShareState.defineMessage({
    copyPreferencesSuccess: (title: string, content: string) => {
      ElNotification({
        title,
        message: content,
        position: 'bottom-right',
        duration: 0,
        type: 'success',
      });
    },
  });
}

export type { ComponentType };
