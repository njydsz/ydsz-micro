/**
 * 字段建议 → YdFormSchema 适配器。
 *
 * <p>将 AI 生成的 {@link FieldSuggestion} 列表转换为可直接传入 YdForm props 的 Schema。
 *
 * @path comm\@core\ui-kit\ai-builder\src\form-schema-adapter.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { FieldSuggestion } from './types';

/**
 * 表单 Schema 字段（简化版，适配 YdFormSchema 子集）。
 * 足以驱动 YdForm 渲染基础表单。
 */
export interface SimplifiedFormField {
  fieldName: string;
  label: string;
  component: string;
  componentProps?: Record<string, unknown>;
  required: boolean;
  sort: number;
  tooltip?: string;
}

/** 字段类型 → YdForm 组件类型映射 */
const TYPE_TO_COMPONENT: Record<string, string> = {
  string: 'YDSZInput',
  number: 'InputNumber',
  boolean: 'YdSwitch',
  date: 'YdDatePicker',
  datetime: 'YdDatePicker',
  enum: 'YdSelect',
  text: 'YdTextarea',
  email: 'YDSZInput',
  phone: 'YDSZInput',
  url: 'YDSZInput',
  money: 'InputNumber',
  percent: 'InputNumber',
};

/**
 * 将 AI 生成的字段列表转换为 YdForm 兼容的 Schema 数组。
 *
 * @param fields AI 生成器输出的字段建议
 * @return YdForm Schema 数组
 */
export function generateFormSchema(fields: FieldSuggestion[]): SimplifiedFormField[] {
  return [...fields]
    .sort((a, b) => a.sort - b.sort)
    .map((field) => {
      const component = TYPE_TO_COMPONENT[field.fieldType] ?? 'YDSZInput';
      const extraProps: Record<string, unknown> = {};
      if (field.fieldType === 'email') {
        extraProps.type = 'email';
      } else if (field.fieldType === 'url') {
        extraProps.type = 'url';
      } else if (field.fieldType === 'phone') {
        extraProps.type = 'tel';

      } else if (field.fieldType === 'money') {
        extraProps.precision = 2;
        extraProps.step = 0.01;
        extraProps.min = 0;
      } else if (field.fieldType === 'percent') {
        extraProps.precision = 2;
        extraProps.step = 0.1;
        extraProps.min = 0;
        extraProps.max = 100;
      } else if (field.fieldType === 'datetime') {
        extraProps.showTime = true;
      }
      if (field.options && field.options.length > 0) {
        extraProps.options = field.options.map((opt) => ({
          label: opt,
          value: opt,
        }));
      }
      return {
        fieldName: field.name,
        label: field.label,
        component,
        componentProps: Object.keys(extraProps).length > 0 ? extraProps : undefined,
        required: field.isRequired,
        sort: field.sort,
        tooltip: field.tooltip ?? field.validationHint,
      };
    });
}

/**
 * 校验字段配置是否可安全转换为 Schema。
 *
 * @param fields 字段列表
 * @return 是否全部可转换
 */
export function validateFieldsForSchema(fields: FieldSuggestion[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const field of fields) {
    if (!field.name || !field.name.trim()) {
      errors.push('存在字段名为空的记录');
    }
    if (!field.label || !field.label.trim()) {
      errors.push(`字段 "${field.name}" 缺少标签`);
    }
    if (!field.fieldType) {
      errors.push(`字段 "${field.name}" 缺少类型`);
    }
  }
  return { valid: errors.length === 0, errors };
}
