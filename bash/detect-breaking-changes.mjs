#!/usr/bin/env node
/**
 * OpenAPI 破坏性变更检测器
 *
 * 对比当前分支生成的 openapi.json 与基线版本，检测以下破坏性变更：
 * - 端点删除（Deleted Endpoint）
 * - 字段类型变更（Type Changed）
 * - 必填字段新增（Required Field Added）
 * - 字段删除（Field Removed）
 *
 * 用法：
 *   node bash/detect-breaking-changes.mjs
 *   node bash/detect-breaking-changes.mjs --baseline <path> --current <path>
 *
 * 退出码：
 *   0 - 无破坏性变更（或有且 --allow-breaking 传入）
 *   1 - 发现破坏性变更
 *
 * @path bash/detect-breaking-changes.mjs
 * @author ydsz-team
 * @since 1.0.0
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const baselinePath = getArg('--baseline') || 'apps/system-web/src/api/sdk/openapi.json';
const currentPath = getArg('--current') || '/tmp/openapi-current.json';
const allowBreaking = args.includes('--allow-breaking');

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const breakingChanges = [];
const additiveChanges = [];

// 读取两个 OpenAPI spec
let baseline, current;
try {
  baseline = JSON.parse(readFileSync(join(process.cwd(), baselinePath), 'utf-8'));
  current = JSON.parse(readFileSync(join(process.cwd(), currentPath), 'utf-8'));
} catch (e) {
  console.error(`[breaking-change] 无法读取 spec 文件：${e.message}`);
  console.error(`[breaking-change] 基线路径：${baselinePath}`);
  console.error(`[breaking-change] 当前路径：${currentPath}`);
  process.exit(1);
}

const basePaths = baseline.paths || {};
const curPaths = current.paths || {};

// 1. 检测端点删除
for (const path of Object.keys(basePaths)) {
  if (!curPaths[path]) {
    const methods = Object.keys(basePaths[path]).map(m => m.toUpperCase()).join(', ');
    breakingChanges.push({
      type: 'ENDPOINT_DELETED',
      severity: 'BREAKING',
      path,
      detail: `端点已删除：${methods} ${path}`,
    });
    continue;
  }

  // 检测 HTTP 方法删除
  for (const method of Object.keys(basePaths[path])) {
    if (!curPaths[path][method]) {
      breakingChanges.push({
        type: 'METHOD_DELETED',
        severity: 'BREAKING',
        path,
        detail: `HTTP 方法已删除：${method.toUpperCase()} ${path}`,
      });
    }
  }
}

// 2. 检测 requestBody 必填字段新增
for (const path of Object.keys(basePaths)) {
  if (!curPaths[path]) continue;

  for (const method of Object.keys(basePaths[path])) {
    if (!curPaths[path]?.[method]) continue;

    const baseReqBody = basePaths[path][method]?.requestBody;
    const curReqBody = curPaths[path][method]?.requestBody;

    if (!baseReqBody || !curReqBody) continue;

    const baseContent = baseReqBody.content || {};
    const curContent = curReqBody.content || {};

    for (const contentType of Object.keys(curContent)) {
      if (!baseContent[contentType]) continue;

      const baseSchema = baseContent[contentType]?.schema || {};
      const curSchema = curContent[contentType]?.schema || {};

      const baseRequired = new Set(baseSchema.required || []);
      const baseProps = baseSchema.properties || {};

      const curRequired = new Set(curSchema.required || []);
      const curProps = curSchema.properties || {};

      // 新增必填字段
      for (const field of curRequired) {
        if (!baseRequired.has(field) && field in curProps) {
          breakingChanges.push({
            type: 'REQUIRED_FIELD_ADDED',
            severity: 'BREAKING',
            path: `${method.toUpperCase()} ${path}`,
            detail: `RequestBody 新增必填字段：${field}`,
          });
        }
      }

      // 字段类型变更
      for (const field of Object.keys(curProps)) {
        if (!(field in baseProps)) continue;

        const baseType = JSON.stringify(baseProps[field]);
        const curType = JSON.stringify(curProps[field]);

        if (baseType !== curType) {
          breakingChanges.push({
            type: 'FIELD_TYPE_CHANGED',
            severity: 'BREAKING',
            path: `${method.toUpperCase()} ${path}`,
            detail: `字段 ${field} 类型变更：\n    基线：${baseType.slice(0, 60)}...\n    当前：${curType.slice(0, 60)}...`,
          });
        }
      }

      // 字段删除
      for (const field of Object.keys(baseProps)) {
        if (!(field in curProps)) {
          breakingChanges.push({
            type: 'FIELD_REMOVED',
            severity: 'BREAKING',
            path: `${method.toUpperCase()} ${path}`,
            detail: `RequestBody 字段已删除：${field}`,
          });
        }
      }
    }
  }
}

// 3. 检测 schema 级别变更（components/schemas）
const baseSchemas = baseline.components?.schemas || {};
const curSchemas = current.components?.schemas || {};

for (const schemaName of Object.keys(baseSchemas)) {
  if (!(schemaName in curSchemas)) {
    breakingChanges.push({
      type: 'SCHEMA_DELETED',
      severity: 'BREAKING',
      path: `#/components/schemas/${schemaName}`,
      detail: `Schema 已删除：${schemaName}`,
    });
    continue;
  }

  const baseProps = baseSchemas[schemaName].properties || {};
  const curProps = curSchemas[schemaName].properties || {};

  for (const field of Object.keys(baseProps)) {
    if (!(field in curProps)) {
      breakingChanges.push({
        type: 'SCHEMA_FIELD_REMOVED',
        severity: 'BREAKING',
        path: `#/components/schemas/${schemaName}`,
        detail: `Schema ${schemaName} 字段已删除：${field}`,
      });
    } else {
      const baseType = JSON.stringify(baseProps[field]);
      const curType = JSON.stringify(curProps[field]);
      if (baseType !== curType) {
        breakingChanges.push({
          type: 'SCHEMA_FIELD_CHANGED',
          severity: 'BREAKING',
          path: `#/components/schemas/${schemaName}`,
          detail: `Schema ${schemaName}.${field} 类型变更`,
        });
      }
    }
  }
}

// 4. 记录纯增量变更（不阻断）
for (const path of Object.keys(curPaths)) {
  if (!basePaths[path]) {
    additiveChanges.push({
      type: 'ENDPOINT_ADDED',
      severity: 'INFO',
      path,
      detail: `新增端点：${path}`,
    });
  }
}

// 输出报告
console.log('='.repeat(72));
console.log('  OpenAPI 破坏性变更检测报告');
console.log('='.repeat(72));

if (additiveChanges.length > 0) {
  console.log(`\n📝 纯增量变更（${additiveChanges.length} 项，不阻断）：`);
  additiveChanges.forEach(c => {
    console.log(`  + [${c.type}] ${c.detail}`);
  });
}

if (breakingChanges.length > 0) {
  console.log(`\n⚠️  破坏性变更（${breakingChanges.length} 项）：`);
  breakingChanges.forEach(c => {
    console.log(`  ✗ [${c.type}]`);
    console.log(`    位置：${c.path}`);
    console.log(`    详情：${c.detail}`);
    console.log('');
  });

  if (!allowBreaking) {
    console.error(`\n❌ 检测失败：${breakingChanges.length} 项破坏性变更未治理。`);
    console.error(`   如需强制合入（确保已有兼容处理），请添加 --allow-breaking 参数。`);
    process.exit(1);
  } else {
    console.warn(`\n⚠️  已忽略 ${breakingChanges.length} 项破坏性变更（--allow-breaking 模式）`);
    process.exit(0);
  }
} else {
  console.log('\n✅ 无破坏性变更。');
  process.exit(0);
}
