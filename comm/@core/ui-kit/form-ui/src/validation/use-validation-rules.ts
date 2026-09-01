/**
 * 基于 OpenAPI schema 自动生成表单校验规则的 composable。
 *
 * <p>对标 Vben Admin 的「schema-driven form」理念：后端 DTO 的 JSR-380 注解是真理来源，
 * 前端表单通过 spec 路径自动推导 rules，消除「后端定义一次、前端再手写一次」的重复维护。
 *
 * <p>工作流程：
 * <ol>
 *   <li>后端 DTO 字段标注 {@code @NotBlank} / {@code @Size} / {@code @Pattern} 等</li>
 *   <li>springdoc 生成 OpenAPI spec（格式 / 长度 / 范围 / 正则等信息透传）</li>
 *   <li>前端 {@code pnpm gen:api --static} 生成 schema.d.ts + validation-rules.json</li>
 *   <li>本 composable 加载 validation-rules.json 并映射为 Element Plus FormRules</li>
 * </ol>
 *
 * <p>典型用法（在 setup 中调用）：
 * <pre>
 * const { rules: deptRules } = useValidationRules({
 *   module: 'system',
 *   schema: 'SaveDeptDto',
 *   overrides: { deptName: [{ max: 30, message: '部门名称不超过 30 字' }] },
 * });
 * </pre>
 *
 * @path comm/@core/ui-kit/form-ui/src/validation/use-validation-rules.ts
 * @author ydsz-team
 * @since 4.1.0 (P2-10)
 */

import type { OpenApiValidationMeta } from './openapi-to-rules';
import type { FormRules } from 'element-plus';

import { reactive } from 'vue';

import { toFormRules } from './openapi-to-rules';

/** composable 配置 */
export interface UseValidationRulesOptions {
  /**
   * 模块名（对应 SDK 目录），用于定位 validation-rules.json。
   *
   * <p>路径规则：{@code apps/{app}/src/api/sdk/validation-rules/{module}.json}
   */
  module: string;
  /**
   * schema 名称（如 SaveDeptDto），用于在 validation-rules.json 中查找对应字段的元信息。
   */
  schema?: string;
  /**
   * 自定义覆盖/补充 rules（优先级高于自动生成）。
   *
   * <p>适用于「前端特有的展示层校验」（如"确认密码必须与密码一致"），
   * 这类校验无法从后端 DTO 推导。
   */
  overrides?: FormRules;
  /**
   * i18n prefix（拼接 message 时使用）。
   */
  i18nPrefix?: string;
}

/**
 * 加载 validation-rules.json 的元信息。
 *
 * <p>注意：validation-rules.json 由 pnpm gen:api --static 产出（读取 OpenAPI spec）。
 * 产物位于 SDK 目录下，运行时通过动态 import 加载，以支持 Tree Shaking。
 *
 * @param module 模块名
 * @returns 校验元信息字典 (schema → metas[])
 */
async function loadValidationMeta(
  module: string,
): Promise<Record<string, OpenApiValidationMeta[]>> {
  try {
    // 动态 import（Vite 支持下）—— 定位到 SDK 下的 validation-rules.json
    const mod = await import(
      /* @vite-ignore */ `apps/system-web/src/api/sdk/validation-rules/${module}.json`,
      { assert: { type: 'json' } }
    );
    return mod.default as Record<string, OpenApiValidationMeta[]>;
  } catch {
    // 文件不存在或加载失败时返回空（降级为无自动生成规则，由 overrides 兜底）
    return {};
  }
}

/**
 * 基于 OpenAPI 校验元数据生成 Element Plus FormRules 的 composable。
 *
 * <p>响应式返回：规则在加载完成后自动填充，组件可立即绑定。
 *
 * @param options composable 配置
 * @returns FormRules 与加载状态
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { rules } = useValidationRules({ module: 'system', schema: 'SaveDeptDto' });
 * </script>
 * <template>
 *   <el-form :rules="rules">...</el-form>
 * </template>
 * ```
 */
export function useValidationRules(options: UseValidationRulesOptions) {
  const { module, schema, overrides, i18nPrefix } = options;

  /** 最终 rules（响应式，支持 overrides 动态合并） */
  const rules = reactive<FormRules>({ ...overrides });

  /** 加载状态 */
  let loaded = false;

  // 异步加载并合并
  void (async () => {
    if (loaded || !schema) return;
    loaded = true;

    const allMeta = await loadValidationMeta(module);
    const metas = allMeta[schema];
    if (!metas || metas.length === 0) {
      return;
    }

    const autoRules = toFormRules(metas, { blankMessage: true, i18nPrefix });
    // 合并：overrides 优先
    Object.assign(rules, autoRules, overrides ?? {});
  })();

  return {
    /** 响应式 rules（可直接绑定到 el-form :rules） */
    rules: rules as FormRules,
  };
}
