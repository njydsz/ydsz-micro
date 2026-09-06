import { registerElementPlusComponents } from '@ydsz/shared-auth';

import type { ComponentType } from './component-type';

/**
 * 初始化组件适配器：注册 Element Plus 组件到全局共享状态。
 *
 * @path apps/generator-web/src/adapter/component/index.ts
 * @since 1.0.0
 */
export async function initComponentAdapter(): Promise<void> {
  await registerElementPlusComponents<ComponentType>();
}

export type { ComponentType };
