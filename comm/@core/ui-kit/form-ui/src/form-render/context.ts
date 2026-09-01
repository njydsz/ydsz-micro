/**
 * 表单渲染上下文：用 provide/inject 向下传递渲染配置及其派生状态。
 *
 * 表单项嵌套层级不固定（分组、栅格、自定义插槽都可能再包一层），逐层透传 props
 * 会迫使中间组件接收并转发大量与自身无关的属性；改为注入后中间层可完全不感知。
 * useFormContext 另外集中导出几个派生计算属性（是否纵向、组件映射、事件映射等），
 * 让子组件不必各自重复从 props 推导同一份结论。
 *
 * @path comm\@core\ui-kit\form-ui\src\form-render\context.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { FormRenderProps } from '../types';

import { computed } from 'vue';

import { createContext } from '@YDSZ-core/shadcn-ui';

export const [injectRenderFormProps, provideFormRenderProps] =
  createContext<FormRenderProps>('FormRenderProps');

/**
 * 从依赖注入中取出表单渲染上下文，供表单项子组件消费。
 *
 * @remarks
 * 用途是让深层嵌套的字段组件无需逐层透传 props 即可拿到控件映射表与布局信息。
 *
 * 返回的三项均为 computed，会随上层 `provideFormRenderProps` 提供的值自动更新；
 * `isVertical` 是对 `layout` 的语义化派生，避免各处重复写 `layout === 'vertical'` 的字符串比较。
 *
 * 约束：必须在 `<YDSZForm>` 的组件子树内、且在 setup 阶段调用；
 * 脱离该上下文调用时注入会失败，返回值上的属性访问将抛错。
 *
 * @returns `componentMap` 控件名到组件的映射；`componentBindEventMap` 控件的 v-model prop 名映射；
 *          `isVertical` 当前是否为垂直布局
 */
export const useFormContext = () => {
  const formRenderProps = injectRenderFormProps();

  const isVertical = computed(() => formRenderProps.layout === 'vertical');

  const componentMap = computed(() => formRenderProps.componentMap);
  const componentBindEventMap = computed(
    () => formRenderProps.componentBindEventMap,
  );
  return {
    componentBindEventMap,
    componentMap,
    isVertical,
  };
};

