import { createSetupYDSZForm } from '@ydsz/shared-auth';

import type { ComponentType } from './component';

/**
 * 表单适配器：绑定组件类型映射与全局校验规则。
 *
 * @path apps/generator-web/src/adapter/form.ts
 * @since 1.0.0
 */
export const { useYDSZForm, z, YDSZFormSchema } = createSetupYDSZForm<ComponentType>();

export async function initSetupYDSZForm(): Promise<void> {
  // 组件类型映射与校验规则已在 createSetupYDSZForm 中完成
}
