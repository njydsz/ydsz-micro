/**
 * 批量文件头注释添加工具
 *
 * <p>遍历子应用 src 目录，为缺少 @path 文件头的 TS / Vue 文件
 * 按照云顶编码规范 §15.2 自动添加带 @path、@author、@since 的块注释。
 *
 * @path scripts\batch-add-file-headers.mjs
 * @author ydsz-team
 * @since 1.0.0
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/** 判断 Vue 文件是否已有头（必须包含 @path 才算合规） */
function vueHasHeader(src) {
  return src.slice(0, 600).includes('@path');
}

/** 判断 TS 文件是否已有头 */
function tsHasHeader(src) {
  return src.slice(0, 400).includes('@path');
}

/** 生成 Vue 文件头 */
function vueHeader(relPath, description, version) {
  return `<!--
 * ${description}
 *
 * @path ${relPath}
 * @author ydsz-team
 * @since ${version}
-->`;
}

/** 生成 TS 文件头 */
function tsHeader(relPath, description, version) {
  return `/**
 * ${description}
 *
 * @path ${relPath}
 * @author ydsz-team
 * @since ${version}
 */`;
}

/** 目录名 → 描述映射 */
function dirDesc(d) {
  const map = {
    components: '通用组件',
    views: '视图',
    composables: '组合式函数',
    hooks: '组合式函数',
    stores: 'Pinia 状态管理',
    utils: '工具函数',
    router: '路由配置',
    locales: '国际化资源',
    api: 'API 请求层',
    adapter: '适配器',
    mock: 'Mock 数据',
    preferences: '偏好设置',
    layouts: '布局组件',
    widgets: '微件',
  };
  return map[d] || '模块';
}

/** 推断 Vue 文件描述 */
function inferVueDescription(relPath) {
  const parts = relPath.split(/[\\/]/);
  const dirs = parts.slice(3); // 跳过 apps/<app>/src/
  const fileName = basename(parts[parts.length - 1], '.vue');
  const parentDir = dirs.length >= 2 ? dirs[dirs.length - 2] : '';

  if (fileName === 'index.vue' && parentDir) return `${dirDesc(parentDir)} - ${parentDir} 模块`;
  if (parentDir === 'components') return `${fileName} 通用组件`;
  if (parentDir === 'views' || dirs.includes('views')) return `${fileName} 视图`;
  if (parentDir === 'layouts') return `${fileName} 布局`;
  if (parentDir === 'composables') return `${fileName} 组合式函数`;
  return `${fileName} 模块`;
}

/** 推断 TS 文件描述 */
function inferTsDescription(relPath) {
  const fileName = basename(relPath, '.ts');
  const parent = basename(dirname(relPath));
  return `${dirDesc(parent)} - ${fileName} 模块`;
}

/** 读取 JSON */
function readJson(p) {
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return {}; }
}

/** 应用版本 */
function getAppVersion(appName) {
  return readJson(join(ROOT, 'apps', appName, 'package.json')).version || '1.0.0';
}

/** 遍历文件 */
function walk(dir, exts, excludeDirs = []) {
  const results = [];
  function recurse(current) {
    let entries;
    try { entries = readdirSync(current); } catch { return; }
    for (const entry of entries) {
      const full = join(current, entry);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) {
        if (!excludeDirs.includes(entry)) recurse(full);
      } else if (exts.some(e => entry.endsWith(e))) {
        results.push(full);
      }
    }
  }
  recurse(dir);
  return results;
}

// ========== 主程序 =========
const APPS = ['agent-web', 'cronjob-web', 'generator-web', 'literule-web', 'message-web', 'nextwiki-web', 'system-web', 'userinfo-web', 'workflow-web'];
const MAIN_SRC = join(ROOT, 'main', 'src');
const TS_EXCLUDE = ['node_modules', 'dist', 'api', 'generated'];
let totalFixed = 0;
const stats = {};

for (const app of APPS) {
  const srcDir = join(ROOT, 'apps', app, 'src');
  if (!existsSync(srcDir)) continue;
  const version = getAppVersion(app);
  let appFixed = 0;

  for (const fp of walk(srcDir, ['.vue'], TS_EXCLUDE)) {
    const src = readFileSync(fp, 'utf-8');
    if (vueHasHeader(src)) continue;
    const relPath = fp.replace(ROOT + '\\', '');
    const header = vueHeader(relPath, inferVueDescription(relPath), version) + '\n';
    writeFileSync(fp, header + src, 'utf-8');
    appFixed++;
  }

  for (const fp of walk(srcDir, ['.ts'], TS_EXCLUDE)) {
    const src = readFileSync(fp, 'utf-8');
    if (tsHasHeader(src)) continue;
    const relPath = fp.replace(ROOT + '\\', '');
    const header = tsHeader(relPath, inferTsDescription(relPath), version) + '\n\n';
    writeFileSync(fp, header + src, 'utf-8');
    appFixed++;
  }

  stats[app] = appFixed;
  totalFixed += appFixed;
}

// main/src
{
  const version = readJson(join(ROOT, 'main', 'package.json')).version || '1.0.0';
  let mainFixed = 0;

  for (const fp of walk(MAIN_SRC, ['.vue'], ['node_modules', 'dist'])) {
    const src = readFileSync(fp, 'utf-8');
    if (vueHasHeader(src)) continue;
    const relPath = 'main\\src\\' + fp.replace(MAIN_SRC + '\\', '');
    const header = vueHeader(relPath, inferVueDescription('main\\src\\' + fp.replace(MAIN_SRC + '\\', '')), version) + '\n';
    writeFileSync(fp, header + src, 'utf-8');
    mainFixed++;
  }

  for (const fp of walk(MAIN_SRC, ['.ts'], ['node_modules', 'dist'])) {
    const src = readFileSync(fp, 'utf-8');
    if (tsHasHeader(src)) continue;
    const relPath = 'main\\src\\' + fp.replace(MAIN_SRC + '\\', '');
    const header = tsHeader(relPath, inferTsDescription(relPath), version) + '\n\n';
    writeFileSync(fp, header + src, 'utf-8');
    mainFixed++;
  }

  stats['main'] = mainFixed;
  totalFixed += mainFixed;
}

console.log('=== 文件头批量添加完成 ===');
for (const [app, count] of Object.entries(stats)) {
  if (count > 0) console.log(`  ${app}: ${count} files`);
}
console.log(`\nTotal: ${totalFixed} files`);
