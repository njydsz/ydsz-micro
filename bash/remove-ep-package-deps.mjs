/*!
 * 移除所有 package.json 中的 element-plus 相关依赖。
 *
 * Phase 4 构建层依赖清理：
 * - 删除 apps 下各 package.json dependencies 里的 element-plus 和 icons-vue
 * - 删除 apps 下各 package.json devDependencies 里的 unplugin-element-plus
 * - 更新根 package.json 的 description 与 keywords
 *
 * @path bash/remove-ep-package-deps.mjs
 * @author ydsz-team
 * @since 4.2.0
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const WRITE_MODE = process.argv.includes('--write');
const ROOT = resolve(process.cwd(), '.');

const SKIP = new Set(['node_modules', 'dist', '.turbo', '.git']);

/**
 * 递归查找所有 package.json（排除 node_modules）
 */
function walkPackageJson(out, dir = ROOT) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walkPackageJson(out, full);
    } else if (name === 'package.json') {
      out.push(full);
    }
  }
  return out;
}

const EP_DEPS = new Set(['element-plus', '@element-plus/icons-vue', 'unplugin-element-plus']);

/**
 * 自 dependencies/devDependencies 节点中移除 element-plus 相关
 */
function removeEpDeps(pkg, filePath) {
  let changed = false;
  for (const section of ['dependencies', 'devDependencies']) {
    if (!pkg[section]) continue;
    for (const dep of EP_DEPS) {
      if (pkg[section][dep] !== undefined) {
        delete pkg[section][dep];
        changed = true;
        console.log(`  [${filePath}] 移除 ${section}.${dep}`);
      }
    }
  }
  return changed;
}

/**
 * 主流程
 */
function processAll() {
  const pkgFiles = walkPackageJson([]);
  let changedCount = 0;

  for (const file of pkgFiles) {
    const relative = file.replace(ROOT, '.');
    const pkg = JSON.parse(readFileSync(file, 'utf8'));

    if (relative === './package.json') {
      // 根包：更新 description + keywords
      if (pkg.description && pkg.description.includes('Element Plus')) {
        console.log(`  [${relative}] 更新 description`);
        pkg.description = pkg.description.replace('Element Plus', 'YDSZ Vue UI');
      }
      if (pkg.keywords) {
        const idx = pkg.keywords.indexOf('element-plus');
        if (idx !== -1) {
          console.log(`  [${relative}] 移除 keywords.element-plus`);
          pkg.keywords.splice(idx, 1);
        }
      }
      const epDepsChanged = removeEpDeps(pkg, relative);
      if (epDepsChanged) {
        console.log(`  [${relative}] 清理 deps`);
      }
      if (WRITE_MODE) {
        writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
      }
      changedCount += 1;
      continue;
    }

    if (removeEpDeps(pkg, relative)) {
      if (WRITE_MODE) {
        writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
      }
      changedCount += 1;
    }
  }

  return changedCount;
}

const count = processAll();
console.log(`模式：${WRITE_MODE ? 'WRITE（已应用）' : 'DRY-RUN（加 --write 生效）'}`);
console.log(`已处理 package.json 文件数：${count}`);
