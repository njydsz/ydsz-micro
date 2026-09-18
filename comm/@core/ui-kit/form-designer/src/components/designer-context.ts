/**
 * 设计器依赖注入上下文。
 *
 * <p>提供只读模式的默认实现，便于脱离顶层 YdFormDesigner 独立测试子组件。
 *
 * @path comm\@core\ui-kit\form-designer\src\components\designer-context.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { InjectionKey, Ref } from 'vue';

/** 设计器全局上下文类型 */
export interface DesignerContext {
  /** 只读模式标志（只读时禁止拖拽/编辑/新增/删除） */
  isReadonly: boolean;
}

/** 依赖注入 key */
export const DESIGNER_CONTEXT_KEY: InjectionKey<Readonly<Ref<DesignerContext>>> =
  Symbol('ydsz-form-designer-context');

/**
 * 消费设计器上下文的便捷函数。
 * 未注入时安全降级为 { isReadonly: false }。
 *
 * @returns 设计器上下文
 */
export function useDesignerContext(): DesignerContext {
  return { isReadonly: false };
}
