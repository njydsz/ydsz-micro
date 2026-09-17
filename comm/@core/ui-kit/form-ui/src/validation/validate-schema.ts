/**
 * Schema 运行时校验 —— 在表单初始化前捕获常见配置错误。
 *
 * 规范：YDIZ-FORM-007（表单 Schema 静态校验）
 *
 * <p>痛点：Schema 配置错误（漏写 fieldName、component 名拼错、循环依赖）
 * 原先只在运行时表现为「字段渲染不出来」或「联动不生效」，难以排查。
 * <p>本工具在开发期（import.meta.dev）对 schema 做一次全量检查，
 * 发现异常时抛出带定位信息的 Error，便于快速定位。
 *
 * <p>校验项：
 * <ul>
 *   <li>每个字段必须含 fieldName 与 component</li>
 *   <li>fieldName 在同一 schema 内唯一</li>
 *   <li>声明了 dependencies.triggerFields 的字段必须存在</li>
 *   <li>递归依赖检测（防止 A→B→A 无限循环）</li>
 *   <li>dependencies 中不能同时存在 trigger 与同名计算属性</li>
 *   <li>component 应为字符串（内置名）或合法的 Vue 组件对象</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\form-ui\src\validation\validate-schema.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import type { FormSchema } from '../types-schema';

/** 校验错误信息 */
export interface SchemaValidationErrorItem {
  /** 出错字段的 fieldName，全局性错误为 '__root__' */
  fieldName: string;
  /** 错误等级 */
  level: 'error' | 'warn';
  /** 错误描述 */
  message: string;
}

/** 校验结果 */
export interface SchemaValidationResult {
  /** 是否通过（无 error 级别错误） */
  isSchemaValid: boolean;
  /** 所有校验发现问题 */
  errors: SchemaValidationErrorItem[];
}

const DEPENDENCY_KEYS = [
  'componentProps',
  'disabled',
  'if',
  'required',
  'rules',
  'show',
  'trigger',
] as const;

/**
 * 校验一份 FormSchema 的合法性。
 *
 * @param schema - 待校验的表单 schema
 * @param options - 校验选项
 * @return 校验结果（含 errors 列表）
 *
 * @example
 * ```ts
 * const result = validateFormSchema(schema);
 * if (!result.isSchemaValid) {
 *   console.error('Schema 校验失败：', result.errors);
 * }
 * ```
 */
export function validateFormSchema(
  schema: FormSchema[],
  options: { strict?: boolean } = {},
): SchemaValidationResult {
  const { strict = false } = options;
  const errors: SchemaValidationErrorItem[] = [];

  if (!Array.isArray(schema)) {
    errors.push({
      fieldName: '__root__',
      level: 'error',
      message: 'Schema 必须是数组',
    });
    return { errors, isSchemaValid: false };
  }

  // 收集所有 fieldName，用于唯一性与依赖引用检查
  const fieldNames = new Set<string>();
  const duplicateNames = new Set<string>();

  for (const item of schema) {
    // 1. 必填字段检查
    if (!item.fieldName || typeof item.fieldName !== 'string') {
      errors.push({
        fieldName: '__root__',
        level: 'error',
        message: '发现缺少 fieldName 的表单项',
      });
      continue;
    }

    // 2. 唯一性检查
    if (fieldNames.has(item.fieldName)) {
      duplicateNames.add(item.fieldName);
    }
    fieldNames.add(item.fieldName);

    // 3. component 校验
    if (!item.component) {
      errors.push({
        fieldName: item.fieldName,
        level: 'error',
        message: `字段 "${item.fieldName}" 缺少 component`,
      });
    } else if (typeof item.component !== 'string' && typeof item.component !== 'object') {
      errors.push({
        fieldName: item.fieldName,
        level: 'error',
        message: `字段 "${item.fieldName}" 的 component 类型无效（期望 string | Component）`,
      });
    }

    // 4. dependencies.triggerFields 引用存在性
    if (item.dependencies) {
      const { triggerFields } = item.dependencies;
      if (!triggerFields || triggerFields.length === 0) {
        errors.push({
          fieldName: item.fieldName,
          level: 'error',
          message: `字段 "${item.fieldName}" 配置了 dependencies 但缺少 triggerFields`,
        });
      } else {
        for (const dep of triggerFields) {
          if (!fieldNames.has(dep) && !schema.some((s) => s.fieldName === dep)) {
            errors.push({
              fieldName: item.fieldName,
              level: 'warn',
              message: `字段 "${item.fieldName}" 依赖的 triggerField "${dep}" 不存在于 schema 中`,
            });
          }
        }
      }

      // 5. 不应同时存在 trigger 和同名计算属性
      if (item.dependencies.trigger) {
        const hasComputedDep = DEPENDENCY_KEYS.some(
          (key) => key !== 'trigger' && item.dependencies?.[key] !== undefined,
        );
        if (hasComputedDep && strict) {
          errors.push({
            fieldName: item.fieldName,
            level: 'warn',
            message: `字段 "${item.fieldName}" 同时配置了 trigger 与其他计算依赖，可能产生竞态`,
          });
        }
      }
    }
  }

  // 6. 重复 fieldName 报错
  for (const name of duplicateNames) {
    errors.push({
      fieldName: name,
      level: 'error',
      message: `fieldName "${name}" 在同一 schema 中重复出现`,
    });
  }

  // 7. 循环依赖检测（DFS）
  const dependencyGraph = new Map<string, Set<string>>();
  for (const item of schema) {
    if (item.dependencies?.triggerFields) {
      dependencyGraph.set(
        item.fieldName,
        new Set(item.dependencies.triggerFields),
      );
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function detectCircular(fieldName: string, path: string[]): boolean {
    if (visiting.has(fieldName)) {
      const cycle = [...path, fieldName].slice(path.indexOf(fieldName)).join(' → ');
      errors.push({
        fieldName,
        level: 'error',
        message: `检测到循环依赖：${cycle}`,
      });
      return true;
    }
    if (visited.has(fieldName)) {
      return false;
    }

    visiting.add(fieldName);
    path.push(fieldName);

    const deps = dependencyGraph.get(fieldName);
    if (deps) {
      for (const dep of deps) {
        detectCircular(dep, [...path]);
      }
    }

    visiting.delete(fieldName);
    visited.add(fieldName);
    return false;
  }

  for (const fieldName of dependencyGraph.keys()) {
    if (!visited.has(fieldName)) {
      detectCircular(fieldName, []);
    }
  }

  const isSchemaValid = !errors.some((e) => e.level === 'error');
  return { errors, isSchemaValid };
}

/**
 * 开发期断言 schema 合法性，校验失败时抛出 Error。
 * 生产环境为 no-op（零运行时成本）。
 *
 * @param schema - 待校验的表单 schema
 *
 * @example
 * ```ts
 * // 在表单入口调用，开发期立即暴露问题
 * assertValidSchema(schema);
 * ```
 */
export function assertValidSchema(schema: FormSchema[]): void {
  if (import.meta.env?.PROD) {
    return;
  }

  const result = validateFormSchema(schema, { strict: true });
  if (!result.isSchemaValid) {
    const detail = result.errors
      .map((e) => `[${e.level}] ${e.fieldName}: ${e.message}`)
      .join('\n');
    throw new Error(`FormSchema 校验失败：\n${detail}`);
  }
}
