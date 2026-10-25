/**
 * Form 组件的 props 类型。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */

/**
 * Form 组件属性。
 */
export interface FormProps {
  /** 自定义 CSS class */
  class?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可见（受控模式） */
  open?: boolean;
}

/**
 * Form 组件事件。
 */
export interface FormEmits {
  /** open 变化回调 */
  (e: 'update:open', value: boolean): void;
  /** 确认回调 */
  (e: 'confirm'): void;
  /** 取消回调 */
  (e: 'cancel'): void;
}

/**
 * YdForm 通过 defineExpose 暴露的实例类型，供 `ref<FormInstance>()` 使用。
 */
export interface FormInstance {
  /** 各字段校验错误信息 */
  errors: Record<string, string | undefined>;
  /** 当前表单值 */
  values: Record<string, any>;
  /** 触发整体校验 */
  validate: () => Promise<{ errors: Record<string, string | undefined>; valid: boolean }>;
  /** 提交并在失败时聚焦首个错误字段 */
  submitWithErrorFocus: (event?: Event) => Promise<void>;
}
