/**
 * OpenAPI Schema 属性 → YDSZForm 组件类型 自动映射器。
 *
 * <p>打通后端 JSR-380 → OpenAPI spec → 前端表单组件类型的最后一公里：
 * <ol>
 *   <li>后端 DTO 标注类型注解 → springdoc 输出 OpenAPI schema（type/format/enum）</li>
 *   <li>本模块根据 schema 自动推断应使用的表单组件类型</li>
 *   <li>结合 {@link openapi-to-rules} 的校验规则 → 完整 YDSZFormSchema</li>
 * </ol>
 *
 * <p>映射规则：
 * <ul>
 *   <li>{@code enum}（含字典编码引用）→ {@code Select} / {@code RadioGroup}</li>
 *   <li>{@code boolean} → {@code Switch}</li>
 *   <li>{@code string} + {@code date} / {@code date-time} → {@code DatePicker}</li>
 *   <li>{@code string} + {@code time} → {@code TimePicker}</li>
 *   <li>{@code integer} / {@code number} → {@code InputNumber}</li>
 *   <li>{@code string} + {@code textarea} hint → {@code Input} (textarea)</li>
 *   <li>{@code string} + 长文本描述 → {@code Input} (textarea)</li>
 *   <li>其他 → {@code Input}</li>
 * </ul>
 *
 * <p>表单 Schema 生成示例：
 * <pre>{@code
 * import { openApiSchemaToFormSchema } from '@ydsz/openapi-to-component';
 *
 * const schema = openApiSchemaToFormSchema(openApiJsonSchema, {
 *   tenantName: { required: true, maxLength: 128 },
 *   status: { enum: ['ENABLED', 'DISABLED'] },
 * });
 * // → 可直接传给 YDSZForm :schema 渲染完整表单
 * }</pre>
 *
 * @path comm/@core/ui-kit/form-ui/src/validation/openapi-to-component.ts
 * @author ydsz-team
 * @since 4.1.0 (P1-1)
 */

import type { ComponentType } from '@ydsz/shared-business';

import type { OpenApiValidationMeta } from './openapi-to-rules';

/** Schema → 组件推断上下文选项 */
export interface ComponentMappingOptions {
  /**
   * 字段名称 → 强制指定组件类型（覆盖自动推断）。
   *
   * <p>用于场景：字段是外联实体 ID 但业务上需要 ApiSelect 而非 InputNumber。
   */
  overrides?: Record<string, ComponentType>;
  /**
   * 字典类型编码（field name → dict typeCode 映射）。
   *
   * <p>匹配时使用 RadioGroup 组件，运行时通过 dictStore 获取选项列表。
   * 未匹配的 enum 使用 Select 组件。
   */
  dictMapping?: Record<string, string>;
  /**
   * textarea 触发条件：description 超过该字符数时自动使用 textarea 模式。
   *
   * @default 256
   */
  textareaThreshold?: number;
}

/**
 * 根据 OpenAPI Schema 属性元信息推断表单组件类型。
 *
 * <p>纯函数，便于单测。优先级：
 * <ol>
 *   <li>overrides 显式覆盖</li>
 *   <li>dictMapping 存在的字段 → RadioGroup</li>
 *   <li>enum 存在 → Select</li>
 *   <li>format=date/date-time → DatePicker</li>
 *   <li>format=time → TimePicker</li>
 *   <li>type=boolean → Switch</li>
 *   <li>type=integer/number → InputNumber</li>
 *   <li>description 超长 → Input(textarea)</li>
 *   <li>兜底 → Input</li>
 * </ol>
 *
 * @param field - 字段名（Java 驼峰如 {@code tenantName}）
 * @param meta - OpenAPI 校验元信息（type/format/enum/description 等）
 * @param options - 映射选项
 * @returns 表单组件类型
 */
export function openApiSchemaToComponentType(
  field: string,
  meta: OpenApiValidationMeta,
  options: ComponentMappingOptions = {},
): ComponentType {
  const { overrides, dictMapping, textareaThreshold = 256 } = options;

  // 1. 显式覆盖
  if (overrides?.[field]) {
    return overrides[field];
  }
  // 2. 字典映射 → 运行时下拉
  if (dictMapping?.[field] || isDictFieldByConvention(field)) {
    return 'RadioGroup';
  }
  // 3. 枚举 → 静态下拉
  if (meta.enum && meta.enum.length > 0) {
    return 'Select';
  }
  // 4. 日期时间格式
  if (meta.format === 'date' && meta.type === 'string') {
    return 'DatePicker';
  }
  if (meta.format === 'date-time' && meta.type === 'string') {
    return 'DatePicker';
  }
  if (meta.format === 'time' && meta.type === 'string') {
    return 'TimePicker';
  }
  // 5. 布尔 → 开关
  if (meta.type === 'boolean') {
    return 'Switch';
  }
  // 6. 数值 → 数字输入
  if (meta.type === 'integer' || meta.type === 'number') {
    return 'InputNumber';
  }
  // 7. 长文本 → 文本域
  if (meta.type === 'string' && meta.description && meta.description.length > textareaThreshold) {
    return 'Input'; // renderProps.type = 'textarea' 由调用方处理
  }
  // 8. 兜底
  return 'Input';
}

/**
 * 根据 Java 字段命名约定判断是否为字典字段。
 *
 * <p>约定：以 {@code status} / {@code type} / {@code category} / {@code level} 结尾的 String 字段自动视为字典引用。
 *
 * @param field - 字段名
 * @return true 表示按字典字段处理
 */
function isDictFieldByConvention(field: string): boolean {
  return /^(status|type|category|level|state|flag)$/i.test(field);
}

/**
 * 将一组 OpenAPI Schema 属性转换为 YDSZFormSchema 结构（仅结构描述，不含组件实现）。
 *
 * <p>返回描述型对象，需配合 {@link initSetupYDSZForm} 注册组件后交给 YDSZForm 渲染。
 * 若已有具体的 YDSZFormSchema 类型约束，返回值可强转为该类型。
 *
 * @param properties - 字段名 → 校验元信息 映射
 * @param options - 映射选项
 * @returns 表单字段配置数组
 */
export function openApiSchemaToFormFields(
  properties: Record<string, OpenApiValidationMeta>,
  options: ComponentMappingOptions = {},
): ComponentFieldConfig[] {
  const fields: ComponentFieldConfig[] = [];
  for (const [field, meta] of Object.entries(properties)) {
    const component = openApiSchemaToComponentType(field, meta, options);
    const isTextarea = component === 'Input'
      && meta.type === 'string'
      && !!meta.description
      && meta.description.length > (options.textareaThreshold ?? 256);

    fields.push({
      component,
      fieldName: field,
      label: meta.description || field,
      required: meta.required,
      ...(component === 'RadioGroup' && dictMappingExists(field, options)
        ? { dictType: options.dictMapping![field] || fieldToDictType(field) }
        : {}),
      ...(component === 'Select' && meta.enum
        ? { options: meta.enum.map((v) => ({ label: String(v), value: String(v) })) }
        : {}),
      ...(isTextarea ? { type: 'textarea' as const, rows: 3 } : {}),
    });
  }
  return fields;
}

/** 字段配置描述（可强转为 YDSZFormSchema[number]） */
export interface ComponentFieldConfig {
  /** 组件类型 */
  component: ComponentType;
  /** 字段名（绑定 v-model） */
  fieldName: string;
  /** 字段标签 */
  label: string;
  /** 是否必填 */
  required?: boolean;
  /** 字典类型编码（RadioGroup 时使用） */
  dictType?: string;
  /** 静态选项（Select 时使用） */
  options?: Array<{ label: string; value: string }>;
  /** 文本域模式 */
  type?: 'textarea';
  /** 文本域行数 */
  rows?: number;
}

// -----------------------------------------------------------------------

function dictMappingExists(field: string, options: ComponentMappingOptions): boolean {
  return !!(options.dictMapping?.[field]) || isDictFieldByConvention(field);
}

function fieldToDictType(field: string): string {
  // 将 tenantStatus → tenant_status（snake_case 用于匹配后端字典表）
  return field
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}
