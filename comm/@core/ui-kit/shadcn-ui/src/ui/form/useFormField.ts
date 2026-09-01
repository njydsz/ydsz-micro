/**
 * 读取当前字段上下文的组合式函数：把 vee-validate 的字段状态与本项目的表单项 id 合并成一份上下文。
 *
 * 同时注入 FieldContextKey 与 FORM_ITEM_INJECTION_KEY 两个键：
 * 前者提供 name 与校验状态，后者提供 aria 所需的 id 前缀，
 * 缺任一都无法完整拼出 aria-describedby，故在脱离 FormField 时直接抛错而不是静默降级 ——
 * 静默降级只会产出一个看似正常、实则无无障碍关联的控件。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\form\useFormField.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { inject } from 'vue';

import {
  FieldContextKey,
  useFieldError,
  useIsFieldDirty,
  useIsFieldTouched,
  useIsFieldValid,
} from 'vee-validate';

import { FORM_ITEM_INJECTION_KEY } from './injectionKeys';

/**
 * 在 `<FormField>` 上下文内获取表单字段的标识与校验状态。
 *
 * @remarks
 * 必须位于 `FormField` / `FormItem` 的注入作用域内，否则抛出
 * `useFormField should be used within <FormField>` 异常。内部通过 vee-validate 的
 * `FieldContextKey` 与本项目 `FORM_ITEM_INJECTION_KEY` 注入拿到字段名与表单项 id，
 * 并组合出 `aria` 所需的 `*-form-item-*` 描述 / 消息 id。
 *
 * @returns 包含 `name`、表单项 `id`，以及 `error` / `isDirty` / `isTouched` / `valid`
 * 等字段状态的只读对象，供 `FormItem` / `FormMessage` 等组件消费
 * @throws {Error} 当脱离 `FormField` 上下文调用时
 */
export function useFormField() {
  const fieldContext = inject(FieldContextKey);
  const fieldItemContext = inject(FORM_ITEM_INJECTION_KEY);

  if (!fieldContext)
    throw new Error('useFormField should be used within <FormField>');

  const { name } = fieldContext;
  const id = fieldItemContext;

  const fieldState = {
    error: useFieldError(name),
    isDirty: useIsFieldDirty(name),
    isTouched: useIsFieldTouched(name),
    valid: useIsFieldValid(name),
  };

  return {
    formDescriptionId: `${id}-form-item-description`,
    formItemId: `${id}-form-item`,
    formMessageId: `${id}-form-item-message`,
    id,
    name,
    ...fieldState,
  };
}
