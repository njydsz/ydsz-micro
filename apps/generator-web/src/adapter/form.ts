/**
 * 表单适配器 —— generator-web 初始化 YDSZ-form 组件类型映射。
 *
 * @path apps/generator-web/src/adapter/form.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type {
  YDSZFormSchema as FormSchema,
  YDSZFormProps,
} from '@ydsz/common-ui';

import type { ComponentType } from './component';

import { setupYDSZForm, useYDSZForm as useForm, z } from '@ydsz/common-ui';

/**
 * 初始化 YDSZ-form 表单适配器。
 *
 * <p>generator-web 组件类型映射为空（不涉及复杂表单渲染），
 * 仅确保 YDSZ-form 模块的副作用正确加载、组件注册表可安全访问。
 */
export async function initGeneratorFormAdapter(): Promise<void> {
  setupYDSZForm<ComponentType>({
    config: {
      modelPropNameMap: {},
    },
  });
}

/** 封装后的表单组合式函数，已绑定业务组件类型。 */
const useYDSZForm = useForm<ComponentType>;

export { useYDSZForm, z };

/** 表单 Schema 类型，泛型参数已绑定业务组件类型。 */
export type YDSZFormSchema = FormSchema<ComponentType>;
export type { YDSZFormProps };
