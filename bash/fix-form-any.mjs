/**
 * 批量修复 CRUD form 页面中的 `formData as any`（云顶编码规范 §3.1 禁止 any）
 *
 * 模式：`updateXxxApi(formData as any)` / `createXxxApi(formData as any)`
 * 修复：替换为 API 模块中声明的 DTO 类型（如 `ApprovalApi.ApprovalDTO`）
 *
 * 用法：node bash/fix-form-any.mjs
 *
 * @path bash/fix-form-any.mjs
 * @author ydsz-team
 * @since 4.3.0
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

/** 收集所有 -form.vue 文件 */
const formFiles = globSync('apps/*/src/views/**/*-form.vue', { cwd: ROOT });

let fixed = 0;
const skipped = [];

for (const relPath of formFiles) {
  const absPath = join(ROOT, relPath);
  const src = readFileSync(absPath, 'utf8');
  // 无 as any 直接跳过
  if (!src.includes('formData as any')) continue;

  // 提取 API 模块路径与 namespace：import { createXxxApi, updateXxxApi } from '#/api/xxx'
  const apiImport = src.match(/import\s*\{[^}]*?(create|update)\w+Api[^}]*\}\s*from\s*['"](#\/api\/[\w-]+)['"]/);
  // 提取 namespace：import type { XxxApi } from '#/api/xxx'
  const typeImport = src.match(/import\s+type\s*\{[^}]*?(\w+Api)[^}]*\}\s*from\s*['"](#\/api\/[\w-]+)['"]/);

  if (!apiImport || !typeImport) {
    skipped.push(`${relPath}: 无法定位 api import`);
    continue;
  }
  const apiPath = apiImport[2]; // #/api/xxx
  const nsName = typeImport[1]; // XxxApi

  // 从 api 模块读取 DTO 类型名（#/api/xxx → <子应用>/src/api/xxx）
  // Windows 下 glob 返回反斜杠路径，统一转为正斜杠再匹配
  const normalized = relPath.replace(/\\/g, '/');
  const appDir = normalized.match(/^(apps\/[\w-]+)/)?.[1];
  if (!appDir) {
    skipped.push(`${relPath}: 无法定位子应用目录`);
    continue;
  }
  const apiRel = apiPath.replace('#/', '');
  const apiFileCandidates = [
    join(ROOT, appDir, 'src', apiRel + '.ts'),
    join(ROOT, appDir, 'src', apiRel + '/index.ts'),
  ];
  let apiSrc = null;
  for (const c of apiFileCandidates) {
    try {
      apiSrc = readFileSync(c, 'utf8');
      break;
    } catch { /* continue */ }
  }
  if (!apiSrc) {
    skipped.push(`${relPath}: 找不到 api 模块 ${apiPath}`);
    continue;
  }

  // 提取 create/update 函数的参数类型：export function createXxxApi(data: XxxApi.XxxDTO)
  const paramTypes = new Set();
  for (const m of src.matchAll(/(?:create|update)(\w+)Api\(formData as any\)/g)) {
    const entity = m[1]; // Approval
    // 在 api 源码中找该函数的参数类型
    const fnMatch = apiSrc.match(
      new RegExp(`export\\s+function\\s+(?:create|update)${entity}Api\\(\\s*\\w+\\s*:\\s*([\\w.]+)`, 's'),
    );
    if (fnMatch) {
      let paramType = fnMatch[1];
      // 未带 namespace 前缀的类型（如直接 `ApprovalDTO`）补全 namespace
      if (!paramType.includes('.')) {
        paramType = `${nsName}.${paramType}`;
      }
      paramTypes.add(paramType);
    }
  }

  if (paramTypes.size === 0) {
    skipped.push(`${relPath}: 未匹配到 create/update 函数参数类型`);
    continue;
  }
  const dtoType = [...paramTypes][0];

  // 替换所有 formData as any
  const updated = src.replace(/formData as any/g, `formData as ${dtoType}`);
  writeFileSync(absPath, updated, 'utf8');
  fixed++;
  console.log(`✓ ${relPath} → ${dtoType}`);
}

console.log(`\n完成：修复 ${fixed} 个文件，跳过 ${skipped.length} 个`);
if (skipped.length > 0) {
  console.log('跳过清单：');
  for (const s of skipped) console.log(`  - ${s}`);
}
