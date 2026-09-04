/**
 * 工作流表单渲染器类型定义
 *
 * @path apps/workflow-web/src/components/workflow-form-renderer/types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** JSON Schema 属性定义（来自 form-designer） */
export interface JsonSchemaProperty {
  /** 字段类型：string / number / integer / boolean */
  type: string;
  /** 字段标题（显示名） */
  title?: string;
  /** 字段描述（占位符/校验提示） */
  description?: string;
  /** 枚举可选值（Select 组件） */
  enum?: string[];
  /** 格式限定（date / date-time / textarea） */
  format?: string;
  /** 最大长度（字符串字段） */
  maxLength?: number;
  /** 最小值（数字字段） */
  minimum?: number;
  /** 最大值（数字字段） */
  maximum?: number;
  /** 默认值 */
  default?: unknown;
}

/** JSON Schema（表单设计器输出格式） */
export interface JsonSchema {
  /** 根类型（通常为 object） */
  type: string;
  /** 字段定义映射（key → 属性） */
  properties: Record<string, JsonSchemaProperty>;
  /** 必填字段列表 */
  required?: string[];
  /** UI 元信息 */
  ui?: { title?: string };
}
