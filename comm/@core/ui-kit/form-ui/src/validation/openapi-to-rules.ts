/**
 * OpenAPI Schema → Element Plus 表单校验规则转换器。
 *
 * <p>打通后端 JSR-380 注解 → OpenAPI spec → 前端 Element Plus rules 的全链路：
 * <ol>
 *   <li>后端 DTO 标注 {@code @NotBlank} / {@code @Size} / {@code @Email} 等</li>
 *   <li>springdoc 自动生成 OpenAPI spec（format / minLength / maxLength / pattern / required 等）</li>
 *   <li>前端契约生成时提取为 {@link OpenApiValidationMeta}</li>
 *   <li>本模块将其转为 Element Plus {@link FormRules} 格式</li>
 * </ol>
 *
 * <p>与手写 rules 的区别：
 * <ul>
 *   <li>单向来源：rules 由 OpenAPI spec 推导，后端是唯一真理来源</li>
 *   <li>结构同步：后端 DTO 字段变更时，CI 门禁自动检测并更新 rules</li>
 *   <li>避免重复：消除后端 {@code @Size(max=50)} 与前端 {@code [{ max: 50, message: '...' }]} 的重复维护</li>
 * </ul>
 *
 * @path comm/@core/ui-kit/form-ui/src/validation/openapi-to-rules.ts
 * @author ydsz-team
 * @since 4.1.0 (P2-10)
 */

import type { FormItemRule, FormRules } from 'element-plus';

/** 从 OpenAPI schema 属性提取的校验元信息 */
export interface OpenApiValidationMeta {
  /** 字段名 */
  field: string;
  /** 是否必填 */
  required?: boolean;
  /** 最小长度（字符串） */
  minLength?: number;
  /** 最大长度（字符串） */
  maxLength?: number;
  /**
   * 正则模式（字符串或 RegExp 序列化）。
   *
   * <p>在后端 Java 中为 {@code @Pattern(regexp="...")}，通过 springdoc 同步至 OpenAPI pattern 字段。
   */
  pattern?: string;
  /** 最小值（数值） */
  minimum?: number;
  /** 最大值（数值） */
  maximum?: number;
  /** 整数类型（true 时 max/min 使用数字大小校验而非数位） */
  integer?: boolean;
  /** 格式类型（email / uri / date / date-time 等） */
  format?: string;
  /** 枚举可选值 */
  enum?: (string | number | boolean)[];
  /** 字段描述（用于 i18n message） */
  description?: string;
  /** 类型 */
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
}

/** 转换选项 */
export interface ToRulesOptions {
  /**
   * 是否保留「校验未通过」时的空白 message（由 UI 层填写）。
   *
   * <p>设为 true 时，message 字段留空字符串，便于上层通过 i18n key 注入更友好的提示文案。
   * 设 false 时，message 使用 description 字段拼接默认提示。
   */
  blankMessage?: boolean;
  /** 自定义 prefix（如 module name），作为 i18n key 拼接前缀 */
  i18nPrefix?: string;
}

/**
 * 将单条 OpenAPI 校验元信息转为 Element Plus FormItemRule 数组。
 *
 * <p>规则顺序（Element Plus 按数组顺序校验）：
 * <ol>
 *   <li>required → 必填校验</li>
 *   <li>pattern → 正则校验</li>
 *   <li>min/max + type=string → 长度校验</li>
 *   <li>min/max + type=number|integer → 数值范围校验</li>
 *   <li>format=email → 邮箱格式校验</li>
 *   <li>enum → 枚举合法值校验</li>
 * </ol>
 *
 * @param meta OpenAPI 校验元信息
 * @param options 转换选项
 * @returns Element Plus FormItemRule 数组
 */
export function toFormItemRules(
  meta: OpenApiValidationMeta,
  options: ToRulesOptions = {},
): FormItemRule[] {
  const { blankMessage = false, i18nPrefix = '' } = options;
  const rules: FormItemRule[] = [];
  const baseMessageField = i18nPrefix ? `${i18nPrefix}.${meta.field}` : meta.field;
  const description = meta.description || meta.field;

  // 1. 必填
  if (meta.required) {
    rules.push({
      required: true,
      message: blankMessage ? '' : `{${baseMessageField}} 不能为空`,
      trigger: meta.type === 'array' ? 'change' : 'blur',
    });
  }

  // 2. 正则
  if (meta.pattern) {
    let regex: RegExp;
    try {
      // Java pattern 转 JS RegExp（处理 Java 专有语法如 \p{L}）
      const normalizedPattern = normalizeJavaPattern(meta.pattern);
      regex = new RegExp(`^${normalizedPattern}$`);
    } catch {
      // 正则构造失败时不阻断，跳过 pattern 校验
      regex = new RegExp('.*');
    }
    rules.push({
      pattern: regex,
      message: blankMessage ? '' : `{${baseMessageField}} 格式不正确`,
      trigger: 'blur',
    });
  }

  // 3. 字符串长度
  if (meta.type === 'string' && (meta.minLength !== undefined || meta.maxLength !== undefined)) {
    rules.push({
      min: meta.minLength,
      max: meta.maxLength,
      message: blankMessage
        ? ''
        : `{${baseMessageField}} 长度需在 ${meta.minLength ?? 0} ~ ${meta.maxLength ?? '∞'} 之间`,
      trigger: 'blur',
    });
  }

  // 4. 数值范围
  if ((meta.type === 'number' || meta.type === 'integer') && (meta.minimum !== undefined || meta.maximum !== undefined)) {
    if (meta.integer) {
      rules.push({
        type: 'integer',
        message: blankMessage ? '' : `{${baseMessageField}} 必须为整数`,
        trigger: 'blur',
      } as FormItemRule);
    }
    // min/max 数值校验需通过 validator 实现（Element Plus RuleItem 仅支持字符串长度）
    if (meta.minimum !== undefined || meta.maximum !== undefined) {
      rules.push({
        validator: (_rule: unknown, value: unknown, callback: (err?: Error) => void) => {
          if (value === undefined || value === null || value === '') {
            callback();
            return;
          }
          const num = Number(value);
          if (Number.isNaN(num)) {
            callback(new Error(`{${baseMessageField}} 必须为数字`));
            return;
          }
          if (meta.minimum !== undefined && num < meta.minimum) {
            callback(new Error(`{${baseMessageField}} 最小值为 ${meta.minimum}`));
            return;
          }
          if (meta.maximum !== undefined && num > meta.maximum) {
            callback(new Error(`{${baseMessageField}} 最大值为 ${meta.maximum}`));
            return;
          }
          callback();
        },
        trigger: 'blur',
      });
    }
  }

  // 5. 格式校验（email / uri）
  if (meta.format === 'email') {
    rules.push({
      type: 'email',
      message: blankMessage ? '' : `{${baseMessageField}} 邮箱格式不正确`,
      trigger: 'blur',
    });
  } else if (meta.format === 'uri' || meta.format === 'url') {
    rules.push({
      type: 'url',
      message: blankMessage ? '' : `{${baseMessageField}} URL 格式不正确`,
      trigger: 'blur',
    });
  }

  // 6. 枚举校验
  if (meta.enum && meta.enum.length > 0) {
    rules.push({
      validator: (_rule: unknown, value: unknown, callback: (err?: Error) => void) => {
        if (value === undefined || value === null || value === '') {
          callback();
          return;
        }
        if (!meta.enum!.includes(value as string | number | boolean)) {
          callback(new Error(`{${baseMessageField}} 不在允许的取值范围内`));
          return;
        }
        callback();
      },
      trigger: 'change',
    });
  }

  return rules;
}

/**
 * 将多条元信息批量转为 Element Plus FormRules 对象。
 *
 * @param metas OpenAPI 校验元信息列表
 * @param options 转换选项
 * @returns FormRules 对象（可直接绑定到 el-form :rules）
 */
export function toFormRules(
  metas: OpenApiValidationMeta[],
  options: ToRulesOptions = {},
): FormRules {
  const result: FormRules = {};
  for (const meta of metas) {
    const rules = toFormItemRules(meta, options);
    if (rules.length > 0) {
      result[meta.field] = rules;
    }
  }
  return result;
}

/**
 * 将 Java 正则的模式串标准化为 JS RegExp 兼容形式。
 *
 * <p>Java 与 JS 正则差异处理：
 * <ul>
 *   <li>{@code \p{L}} → 替换为等效 {@code [a-zA-Z\u00C0-\u024F]}（带重音符号拉丁字母）</li>
 *   <li>{@code \p{N}} → 替换为 {@code [0-9]}</li>
 *   <li>{@code \X} → 忽略（Java 扩展，JS 无等价）</li>
 * </ul>
 *
 * @param javaPattern Java 正则串（来自 @Pattern.regexp）
 * @returns 标准化后的 JS RegExp 字符串
 */
function normalizeJavaPattern(javaPattern: string): string {
  return javaPattern
    .replace(/\\p\{L\}/gu, '[a-zA-Z\\u00C0-\\u024F]')
    .replace(/\\p\{N\}/gu, '[0-9]')
    .replace(/\\X/gu, '.');
}
