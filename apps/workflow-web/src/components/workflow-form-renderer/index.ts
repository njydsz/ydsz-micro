/**
 * WorkflowFormRenderer — 工作流动态表单渲染器
 *
 * <p>将表单设计器的 JSON Schema 转为 YDSZForm Schema 并在任务运行时动态渲染。
 *
 * @path apps/workflow-web/src/components/workflow-form-renderer/index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as WorkflowFormRenderer } from './workflow-form-renderer.vue';

export type { JsonSchema, JsonSchemaProperty } from './types';
