/**
 * 从全部 app 的 vite.config.mts 中移除 unplugin-element-plus/vite 插件。
 *
 * 操作：
 * 1. 删除 `import ElementPlus from 'unplugin-element-plus/vite';` 行；
 * 2. 删除 plugins 数组中的 `ElementPlus({ format: 'esm' }),` 调用行（含逗号与空格变体）；
 * 3. 清理因移除而留下的多余空行。
 *
 * 用法：
 *   node bash/remove-ep-vite-plugin.mjs           # dry-run
 *   node bash/remove-ep-vite-plugin.mjs --write    # 应用
 *
 * @path bash\remove-ep-vite-plugin.mjs
 * @author ydsz-team
 * @since 1.0.0
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const WRITE_MODE = process.argv.includes('--write');
const ROOT = resolve(process.cwd(), '.');

const APPS = [
  'agent-web',
  'cronjob-web',
  'generator-web',
  'literule-web',
  'message-web',
  'nextwiki-web',
  'system-web',
  'userinfo-web',
  'workflow-web',
];

/**
 * 移除单文件中的 EP vite 插件引用。
 * @param {string} filePath
 * @returns {boolean} 是否变化
 */
function transformFile(filePath) {
  const original = readFileSync(filePath, 'utf8');
  let content = original;

  // 1) 移除 import ElementPlus from 'unplugin-element-plus/vite';
  content = content.replace(
    /import\s+ElementPlus\s+from\s*['"]unplugin-element-plus\/vite['"];\n?/g,
    '',
  );

  // 2) 移除 plugins 中的 ElementPlus({ format: 'esm' }) 调用
  //    常见格式：
  //      ElementPlus({ format: 'esm' }),
  //      ElementPlus({format:'esm'}),
  //      ElementPlus({
  //        format: 'esm',
  //      }),
  content = content.replace(
    /\s*ElementPlus\(\{\s*format:\s*['"]esm['"]:?[^}]*\}\),?/g,
    '',
  );

  // 3) 清理注释中提及 ElementPlus 但不影响逻辑的行
  content = content.replace(
    /\s*\/\/ 接入 ElementPlus 插件；\n/g,
    '\n',
  );
  // JSDoc 中的提及
  content = content.replace(
    /(\s*\*\s*).*ElementPlus.*$/gm,
    (match) => {
      // 如果整行只包含 ElementPlus 提及则删除该行
      return match.replace(/\s*\*\s*.*接入.*ElementPlus.*插件.*/, '');
    },
  );

  // 4) 清理多余空行（连续 3+ 空行 → 2 空行）
  content = content.replace(/\n{4,}/g, '\n\n\n');

  if (content !== original) {
    if (WRITE_MODE) writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
let touched = 0;
const reports = [];

for (const app of APPS) {
  const p = join(ROOT, 'apps', app, 'vite.config.mts');
  try {
    const changed = transformFile(p);
    if (changed) {
      touched += 1;
      reports.push(app);
    }
  } catch (err) {
    console.error(`  [SKIP] ${app}: ${err.message}`);
  }
}

console.log(`模式：${WRITE_MODE ? 'WRITE（已应用）' : 'DRY-RUN（加 --write 生效）'}`);
console.log(`处理文件：${APPS.length} 个`);
console.log(`变更文件：${touched} 个`);
if (!WRITE_MODE && reports.length > 0) {
  console.log('\n需变更应用：');
  for (const r of reports) console.log(`  apps/${r}/vite.config.mts`);
}
