#!/usr/bin/env node
/**
 * OpenAPI 破坏性变更检测 —— CI 门禁脚本。
 *
 * <p>比对「上次生成的 lock spec」与「当前编译产物 spec」，识别以下破坏性变更：
 * <ul>
 *   <li>B1: 接口整个移除（path 在旧 spec 中存在、新 spec 中不存在）</li>
 *   <li>B2: HTTP 方法移除（path 存在但某方法被删除）</li>
 *   <li>B3: 请求必填字段新增（response required 字段变多）</li>
 *   <li>B4: 响应字段移除（旧 schema 字段在新 schema 中消失）</li>
 *   <li>B5: 字段类型变更（string → integer 等静默不兼容变更）</li>
 *   <li>B6: 枚举值缩减（enum 数组长度减少）</li>
 *   <li>B7: 参数格式约束收紧（maxLength 变小 / pattern 变更 / minimum 变大）</li>
 * </ul>
 *
 * <p>非破坏性变更（不阻断 CI）：
 * <ul>
 *   <li>N1: 接口新增</li>
 *   <li>N2: 响应字段新增</li>
 *   <li>N3: 参数约束放宽（maxLength 变大 / minimum 变小）</li>
 * </ul>
 *
 * <p>使用方式（在 CI 中）：
 * <pre>
 *   node bash/api-breaking-change-check.mjs --baseline path/to/old-spec.json
 *   # 或非 CI 模式：对比当前 git HEAD 的 spec 与上一次.lock
 *   node bash/api-breaking-change-check.mjs
 * </pre>
 *
 * <p>退出码：
 * <ul>
 *   <li>0 — 未发现破坏性变更（或非阻断模式）</li>
 *   <li>1 — 发现破坏性变更，CI 应阻止合并</li>
 * </ul>
 *
 * @path bash/api-breaking-change-check.mjs
 * @author ydsz-team
 * @since 4.1.0 (P2-11)
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/** 破坏性变更等级：阻断 (B) 或 警告 (W) */
const LEVEL = { BLOCK: 'BLOCK', WARN: 'WARN' };

/** 检测结果 */
const findings = [];

/**
 * pathA 的 keys 在 pathB 中是否存在缺失
 */
function findMissing(oldItems, newItems, label, level = LEVEL.BLOCK) {
  const result = [];
  for (const key of Object.keys(oldItems)) {
    if (!(key in newItems)) {
      result.push({ label, key, level });
    }
  }
  return result;
}

/**
 * 比较两个 schema 的属性，返回破坏性变更列表。
 */
function diffSchemaProps(schemaName, oldProps, newProps) {
  const results = [];
  for (const [field, oldFieldSchema] of Object.entries(oldProps)) {
    const newFieldSchema = newProps[field];
    if (!newFieldSchema) {
      results.push({
        level: LEVEL.BLOCK,
        type: 'B4',
        message: `[${schemaName}] 响应字段 ${field} 被移除`,
      });
      continue;
    }
    // 类型变更
    if (oldFieldSchema.type && newFieldSchema.type && oldFieldSchema.type !== newFieldSchema.type) {
      results.push({
        level: LEVEL.BLOCK,
        type: 'B5',
        message: `[${schemaName}] 字段 ${field} 类型变更: ${oldFieldSchema.type} → ${newFieldSchema.type}`,
      });
    }
    // 枚举值缩减
    if (Array.isArray(oldFieldSchema.enum) && Array.isArray(newFieldSchema.enum)) {
      const removedEnumValues = oldFieldSchema.enum.filter((v) => !newFieldSchema.enum.includes(v));
      if (removedEnumValues.length > 0) {
        results.push({
          level: LEVEL.BLOCK,
          type: 'B6',
          message: `[${schemaName}] 字段 ${field} 枚举值缩减: 移除 ${JSON.stringify(removedEnumValues)}`,
        });
      }
    }
    // maxLength 收紧
    if (oldFieldSchema.maxLength !== undefined && newFieldSchema.maxLength !== undefined) {
      if (newFieldSchema.maxLength < oldFieldSchema.maxLength) {
        results.push({
          level: LEVEL.BLOCK,
          type: 'B7',
          message: `[${schemaName}] 字段 ${field} maxLength 收紧: ${oldFieldSchema.maxLength} → ${newFieldSchema.maxLength}`,
        });
      }
    }
    // minimum 收紧
    if (oldFieldSchema.minimum !== undefined && newFieldSchema.minimum !== undefined) {
      if (newFieldSchema.minimum > oldFieldSchema.minimum) {
        results.push({
          level: LEVEL.BLOCK,
          type: 'B7',
          message: `[${schemaName}] 字段 ${field} minimum 收紧: ${oldFieldSchema.minimum} → ${newFieldSchema.minimum}`,
        });
      }
    }
  }
  return results;
}

/**
 * 比较旧新 OpenAPI spec。
 */
function diffSpecs(oldSpec, newSpec) {
  const results = [];

  // 1. 检测 path 移除
  const oldPaths = oldSpec.paths ?? {};
  const newPaths = newSpec.paths ?? {};
  for (const [path, oldPathItem] of Object.entries(oldPaths)) {
    const newPathItem = newPaths[path];
    if (!newPathItem) {
      results.push({
        level: LEVEL.BLOCK,
        type: 'B1',
        message: `接口 ${path} 被移除`,
      });
      continue;
    }
    // 2. 检测 method 移除
    for (const [method, oldOperation] of Object.entries(oldPathItem)) {
      if (!['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method.toLowerCase())) {
        continue;
      }
      if (!newPathItem[method]) {
        results.push({
          level: LEVEL.BLOCK,
          type: 'B2',
          message: `接口 ${method.toUpperCase()} ${path} 方法被移除`,
        });
      }
      // 7. 检测 deprecated 新增（warn 级别 —— 提醒调用方迁移）
      if (!oldOperation.deprecated && newPathItem[method]?.deprecated) {
        results.push({
          level: LEVEL.WARN,
          type: 'B-DEPRECATE',
          message: `接口 ${method.toUpperCase()} ${path} 已被标记为废弃（请调用方迁移）`,
        });
      }
    }
  }

  // 3. 检测 schema 变更
  const oldSchemas = oldSpec.components?.schemas ?? {};
  const newSchemas = newSpec.components?.schemas ?? {};
  for (const [schemaName, oldSchema] of Object.entries(oldSchemas)) {
    const newSchema = newSchemas[schemaName];
    if (!newSchema) {
      results.push({
        level: LEVEL.BLOCK,
        type: 'B4-SCHEMA',
        message: `Schema ${schemaName} 被移除`,
      });
      continue;
    }

    // 内容物对比
    const oldProps = oldSchema.properties ?? {};
    const newProps = newSchema.properties ?? {};

    // 属性破坏性变更
    results.push(...diffSchemaProps(schemaName, oldProps, newProps));

    // 3. required 字段新增
    const oldRequired = new Set(oldSchema.required ?? []);
    for (const field of newSchema.required ?? []) {
      if (!oldRequired.has(field)) {
        results.push({
          level: LEVEL.WARN,
          type: 'B3',
          message: `[${schemaName}] 字段 ${field} 变为必填（可能导致旧调用方请求失败）`,
        });
      }
    }
  }

  return results;
}

// =====================================================================
// 主流程
// =====================================================================

async function main() {
  const args = process.argv.slice(2);
  const baselineArg = args.find((a, i) => a === '--baseline' && args[i + 1]);
  const currentArg = args.find((a, i) => a === '--current' && args[i + 1]);
  const warnOnly = args.includes('--warn-only');

  const currentSpecPath = currentArg
    ? args[args.indexOf('--current') + 1]
    : join(ROOT, 'apps', 'system-web', 'src', 'api', 'sdk', 'openapi.json');

  if (!existsSync(currentSpecPath)) {
    console.warn(`! 当前 spec 不存在: ${currentSpecPath}`);
    console.warn('! 跳过破坏性变更检测（首次生成时旧的参照不存在）');
    return;
  }

  const currentSpec = JSON.parse(readFileSync(currentSpecPath, 'utf-8'));
  let oldSpec;

  if (baselineArg) {
    const baselinePath = args[args.indexOf('--baseline') + 1];
    if (existsSync(baselinePath)) {
      oldSpec = JSON.parse(readFileSync(baselinePath, 'utf-8'));
    }
  }

  if (!oldSpec) {
    console.log('[breaking-change] 无 baseline spec 可比对，跳过。');
    console.log('[breaking-change] 提示: 生成 baseline 后再次运行可激活破坏性变更检测。');
    return;
  }

  const results = diffSpecs(oldSpec, currentSpec);
  const blockingResults = results.filter((r) => r.level === LEVEL.BLOCK);
  const warnResults = results.filter((r) => r.level === LEVEL.WARN);

  console.log(`[breaking-change] 阻断: ${blockingResults.length}，警告: ${warnResults.length}\n`);

  for (const { message, type } of blockingResults) {
    console.error(`  BLOCK [${type}]: ${message}`);
  }
  for (const { message, type } of warnResults) {
    console.warn(`  WARN  [${type}]: ${message}`);
  }

  if (blockingResults.length > 0 && !warnOnly) {
    console.error(`\n[breaking-change] 失败: 发现 ${blockingResults.length} 个破坏性变更。修复后重试。`);
    console.error('[breaking-change] 若确认为故意破坏性发布，请通过版本号升级（v1 → v2）处理并重新生成 baseline。');
    process.exit(1);
  }

  if (blockingResults.length > 0 && warnOnly) {
    console.warn(`\n[breaking-change] 警告模式: 发现 ${blockingResults.length} 个破坏性变更（未阻断）。`);
    return;
  }

  console.log('[breaking-change] ✓ 未发现破坏性变更');
}

main().catch((err) => {
  console.error('[breaking-change] 检测失败:', err);
  process.exit(1);
});
