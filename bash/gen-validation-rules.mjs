#!/usr/bin/env node
/**
 * 从 OpenAPI spec 提取 JSR-380 校验信息 → validation-rules JSON。
 *
 * <p>读取 gen:api 后产出在各 SDK 目录下的 openapi.json，解析 schema 字段的
 * format / minLength / maxLength / pattern / minimum / maximum / required / enum 等，
 * 按 schema 名 → 字段列表组织输出为 validation-rules.json。
 *
 * <p>前端 {@link useValidationRules} composable 消费此文件，自动推导 Element Plus FormRules。
 *
 * <p>使用方式：
 * <pre>
 *   pnpm gen:validation     # 默认处理全部模块
 *   pnpm gen:validation --module system  # 仅处理 system 模块
 * </pre>
 *
 * @path bash/gen-validation-rules.mjs
 * @author ydsz-team
 * @since 4.1.0 (P2-10)
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/** 请求客户端子模块的 OpenAPI spec 与输出目录（与 unified-contract.mjs 同步） */
const SERVICE_MAP = {
  userinfo: {
    specDir: 'apps/userinfo-web/src/api/sdk',
    outputDir: 'apps/userinfo-web/src/api/sdk/validation-rules',
  },
  system: {
    specDir: 'apps/system-web/src/api/sdk',
    outputDir: 'apps/system-web/src/api/sdk/validation-rules',
  },
  message: {
    specDir: 'apps/message-web/src/api/sdk',
    outputDir: 'apps/message-web/src/api/sdk/validation-rules',
  },
  cronjob: {
    specDir: 'apps/cronjob-web/src/api/sdk',
    outputDir: 'apps/cronjob-web/src/api/sdk/validation-rules',
  },
  workflow: {
    specDir: 'apps/workflow-web/src/api/sdk',
    outputDir: 'apps/workflow-web/src/api/sdk/validation-rules',
  },
  nextwiki: {
    specDir: 'apps/nextwiki-web/src/api/sdk',
    outputDir: 'apps/nextwiki-web/src/api/sdk/validation-rules',
  },
  literule: {
    specDir: 'apps/literule-web/src/api/sdk',
    outputDir: 'apps/literule-web/src/api/sdk/validation-rules',
  },
  agent: {
    specDir: 'apps/agent-web/src/api/sdk',
    outputDir: 'apps/agent-web/src/api/sdk/validation-rules',
  },
};

/**
 * 从单条属性 schema 中提取校验元信息。
 *
 * @param field 字段名
 * @param propSchema 属性 schema
 * @param requiredSet required 字段集合
 * @returns 校验元信息对象（无有效字段时为空对象）
 */
function extractFieldMeta(field, propSchema, requiredSet) {
  const meta = { field };
  let hasAny = false;

  if (requiredSet.has(field)) {
    meta.required = true;
    hasAny = true;
  }
  if (propSchema.minLength !== undefined) {
    meta.minLength = propSchema.minLength;
    hasAny = true;
  }
  if (propSchema.maxLength !== undefined) {
    meta.maxLength = propSchema.maxLength;
    hasAny = true;
  }
  if (propSchema.pattern !== undefined) {
    meta.pattern = propSchema.pattern;
    hasAny = true;
  }
  if (propSchema.minimum !== undefined) {
    meta.minimum = propSchema.minimum;
    hasAny = true;
  }
  if (propSchema.maximum !== undefined) {
    meta.maximum = propSchema.maximum;
    hasAny = true;
  }
  if (propSchema.format !== undefined) {
    meta.format = propSchema.format;
    hasAny = true;
  }
  if (Array.isArray(propSchema.enum)) {
    meta.enum = propSchema.enum;
    hasAny = true;
  }
  if (propSchema.type !== undefined) {
    meta.type = propSchema.type;
    hasAny = true;
  } else if (propSchema.$ref) {
    // 通过 $ref 引用了其他 schema
    meta.type = 'object';
    hasAny = true;
  }
  if (propSchema.description) {
    meta.description = propSchema.description;
  }
  // integer 类型标记
  if (propSchema.type === 'integer') {
    meta.integer = true;
    hasAny = true;
  }

  return hasAny ? meta : null;
}

/**
 * 从 OpenAPI schema 组件中提取所有需要校验的字段。
 *
 * @param schemaName schema 名称（object 类型）
 * @param schemaDef schema 定义
 * @returns schema 的校验元信息列表
 */
function extractSchemaRules(schemaName, schemaDef) {
  if (schemaDef.type !== 'object' && !schemaDef.properties) {
    return [];
  }

  const requiredSet = new Set(schemaDef.required ?? []);
  const metas = [];

  for (const [field, propSchema] of Object.entries(schemaDef.properties ?? {})) {
    // 跳过复杂嵌套（allOf / oneOf / $ref 直接引用）
    if (propSchema.$ref) {
      // $ref 引用的对象字段通常不直接校验（后端 DTO 嵌套需要 flatten 处理）
      continue;
    }
    if (propSchema.allOf || propSchema.oneOf || propSchema.anyOf) {
      continue;
    }

    const meta = extractFieldMeta(field, propSchema, requiredSet);
    if (meta) {
      metas.push(meta);
    }
  }

  return metas;
}

/**
 * 解析 $ref 指针（如 '#/components/schemas/SaveDeptDto'）
 */
function resolveRef(ref) {
  const match = ref.match(/^#\/components\/schemas\/(.+)$/);
  return match ? match[1] : null;
}

// =====================================================================
// 主流程
// =====================================================================

async function main() {
  const args = process.argv.slice(2);
  const moduleArg = args.find((a, i) => a === '--module' && args[i + 1]);
  const targetModule = moduleArg ? args[args.indexOf('--module') + 1] : undefined;

  const targets = targetModule
    ? { [targetModule]: SERVICE_MAP[targetModule] }
    : SERVICE_MAP;

  console.log(`[gen:validation] 开始提取校验规则，共 ${Object.keys(targets).length} 个模块\n`);

  let total = 0;

  for (const [name, { specDir, outputDir }] of Object.entries(targets)) {
    const specPath = join(ROOT, specDir, 'openapi.json');
    if (!existsSync(specPath)) {
      console.warn(`! [${name}] openapi.json 不存在，跳过: ${specPath}`);
      continue;
    }

    let spec;
    try {
      spec = JSON.parse(readFileSync(specPath, 'utf-8'));
    } catch {
      console.error(`✗ [${name}] 解析 openapi.json 失败`);
      continue;
    }

    const schemas = spec.components?.schemas;
    if (!schemas) {
      console.warn(`! [${name}] spec 中无 components.schemas`);
      continue;
    }

    /** schemaName → metas 字典 */
    const rulesBySchema = {};

    for (const [schemaName, schemaDef] of Object.entries(schemas)) {
      // 只处理 object 类型的 DTO（跳过 enum / Request 中的 PageQuery 等分页参数）
      if (schemaDef.type !== 'object' && !schemaDef.properties) {
        continue;
      }
      // 跳过 PageRequest / PageQuery 等基础查询类（无实际表单字段）
      if (/(PageRequest|PageQuery|SortOrder|BaseQuery)$/u.test(schemaName)) {
        continue;
      }

      const metas = extractSchemaRules(schemaName, schemaDef);
      if (metas.length > 0) {
        rulesBySchema[schemaName] = metas;
        total += metas.length;
      }
    }

    // 输出：合并每个 schema 为独立 JSON
    mkdirSync(join(ROOT, outputDir), { recursive: true });
    for (const [schemaName, metas] of Object.entries(rulesBySchema)) {
      const outputPath = join(ROOT, outputDir, `${schemaName}.json`);
      // schema 关联到 module 名（useValidationRules 拼接路径用）
      const moduleKey = `${name}/${schemaName}`;
      writeFileSync(
        outputPath,
        JSON.stringify({ moduleKey, metas }, null, 2),
      );
    }

    console.log(`✓ [${name}] ${Object.keys(rulesBySchema).length} 个 schema，${Object.values(rulesBySchema).reduce((s, m) => s + m.length, 0)} 条校验规则`);
  }

  console.log(`\n[gen:validation] 完成，共 ${total} 条字段校验规则`);
}

main().catch((err) => {
  console.error('[gen:validation] 提取失败:', err);
  process.exit(1);
});
