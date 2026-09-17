/**
 * 表单校验规则模块 —— OpenAPI Schema → Element Plus FormRules 转换体系
 * 与 Schema 运行时校验工具。
 *
 * <p>导出四类产物：
 * <ul>
 *   <li>纯函数转换：{@link toFormItemRules} / {@link toFormRules}（无框架依赖）</li>
 *   <li>依赖映射：{@link buildDependencyMap}（用于字段级 re-validation 联动）</li>
 *   <li>Vue composable：{@link useValidationRules}（setup 中调用）</li>
 *   <li>Schema 校验：{@link validateFormSchema} / {@link assertValidSchema}（开发期防御）</li>
 * </ul>
 *
 * @path comm/@core/ui-kit/form-ui/src/validation/index.ts
 * @author ydsz-team
 * @since 26.09.17
 */

export { buildDependencyMap, toFormItemRules, toFormRules } from './openapi-to-rules';
export type { OpenApiValidationMeta, ToRulesOptions } from './openapi-to-rules';

export { useValidationRules } from './use-validation-rules';
export type { UseValidationRulesOptions } from './use-validation-rules';

export {
  assertValidSchema,
  validateFormSchema,
} from './validate-schema';
export type {
  SchemaValidationErrorItem,
  SchemaValidationResult,
} from './validate-schema';
