/**
 * 设计器依赖注入上下文。
 *
 * <p>用于顶层 FormDesigner 向深层子组件传递 isReadonly 等全局开关，
 * 避免 props drilling。
 *
 * @path comm\@core\ui-kit\form-designer\src\components\designer-context.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { InjectionKey, Ref } from 'vue';

import { inject } from 'vue';

/** 设计器全局上下文类型 */
export interface DesignerContext {
  /** 只读模式标志（全只读时禁止拖拽/编辑/新增/删除） */
  isReadonly: boolean;
}

/** 依赖注入 key */
export const DESIGNER_CONTEXT_KEY: InjectionKey<Readonly<Ref<DesignerContext>>> =
  Symbol('ydsz-form-designer-context');

/**
 * 消费设计器上下文的便捷函数。
 *
 * @returns 设计器上下文
 */
export function useDesignerContext(): DesignerContext {
  const ctx = inject(DESIGNER_CONTEXT_KEY);
  if (!ctx) {
    return { isReadonly: false };
  }
  return ctx.value;
}
