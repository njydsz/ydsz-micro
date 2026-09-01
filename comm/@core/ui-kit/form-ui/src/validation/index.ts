/**
 * 表单校验规则模块 —— OpenAPI Schema → Element Plus FormRules 转换体系。
 *
 * <p>导出两类产物：
 * <ul>
 *   <li>纯函数转换：{@link toFormItemRules} / {@link toFormRules}（无框架依赖）</li>
 *   <li>Vue composable：{@link useValidationRules}（setup 中调用）</li>
 * </ul>
 *
 * @path comm/@core/ui-kit/form-ui/src/validation/index.ts
 * @author ydsz-team
 * @since 4.1.0 (P2-10)
 */

export { toFormItemRules, toFormRules } from './openapi-to-rules';
export type { OpenApiValidationMeta, ToRulesOptions } from './openapi-to-rules';

export { useValidationRules } from './use-validation-rules';
export type { UseValidationRulesOptions } from './use-validation-rules';
