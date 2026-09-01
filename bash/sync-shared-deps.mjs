/**
 * 共享依赖自托管同步脚本。
 *
 * 配合 importmap 插件的 selfHostBase 模式，将 ESM 依赖产物从公网 CDN
 * 预下载到本地 public/vendor/，并生成完整的 importmap.json（含全部传递依赖），
 * 消除运行时公网 CDN SPOF。
 *
 * 原理：
 *   1. 使用 @jspm/generator 解析 ALL_SHARED_DEPS 的完整依赖图
 *   2. 下载 importmap 中引用的所有 URL 到 vendor/ 下（保留 host/path 结构）
 *   3. 将 importmap 中的 URL 改写为同源 /vendor/ 路径
 *   4. 输出 public/vendor/importmap.json 供构建期读取
 *
 * 使用方式：
 *   pnpm sync:shared-deps                          # 默认下载到 main/public/vendor
 *   node bash/sync-shared-deps.mjs apps/agent-web  # 指定目标应用目录
 *   node bash/sync-shared-deps.mjs --refresh       # 忽略锁定版本重新解析
 *   node bash/sync-shared-deps.mjs --check         # CI 校验：锁定版本一致 + vendor 无悬空引用
 *
 * 版本锁定（v4.4.0）：
 *   解析结果写入 bash/importmap.lock.json（顶层依赖名 → 精确版本 + URL）。
 *   后续同步默认按锁定的精确版本安装，避免 `^range` 在不同时间解析到不同
 *   patch 版本，导致主/子应用加载两个 Vue 实例（provide/inject 割裂）。
 *   升级共享依赖：先 `--refresh` 重新解析，检查 diff 后提交 lock 文件。
 *
 * @path bash\sync-shared-deps.mjs
 * @author ydsz-team
 * @since 3.1.0
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// 与 micro-shared-deps.ts 保持一致；TS 文件无法直接 import，此处内联镜像
const ALL_SHARED_DEPS = [
  { name: 'vue', range: '^3.5.17' },
  { name: 'vue-router', range: '^4.5.1' },
  { name: 'pinia', range: '^3.0.3' },
  { name: 'element-plus', range: '^2.10.2' },
  { name: '@element-plus/icons-vue', range: '^2.3.2' },
  { name: 'vxe-table', range: '^4.14.4' },
  { name: 'vxe-pc-ui', range: '^4.7.12' },
  { name: 'axios', range: '^1.10.0' },
  { name: 'echarts', range: '^5.6.0' },
  { name: 'dayjs', range: '^1.11.13' },
  { name: 'vue-demi', range: '^0.14.10' },
];

const VENDOR_DIR_NAME = 'vendor';

/** 仓库根级版本锁文件（顶层依赖名 → 精确版本 + 解析 URL） */
const LOCK_FILE = path.join(root, 'bash', 'importmap.lock.json');

/** 解析命令行标志 */
const flags = process.argv.slice(2).filter((a) => a.startsWith('--'));
const positionals = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const isCheck = flags.includes('--check');
const isRefresh = flags.includes('--refresh');

/** 从 esm.sh 类 URL 中提取精确版本号，失败返回 null */
function extractVersion(url) {
  const match = new URL(url).pathname.match(/\/@?[^/@]+@(\d+\.\d+\.\d+(?:-[\w.]+)?)/);
  return match ? match[1] : null;
}

/** 读取版本锁文件，不存在或解析失败返回 null */
function readLock() {
  if (isRefresh || !fs.existsSync(LOCK_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
  } catch (err) {
    console.warn(`[sync-shared-deps] 锁文件解析失败，忽略锁定: ${err.message}`);
    return null;
  }
}

// ==================== 主流程 ====================

async function main() {
  // === CI 校验模式：不联网，只校验锁与产物一致性 ===
  if (isCheck) {
    process.exit(checkVendorArtifacts());
  }

  const targetAppDir = positionals[0] || 'main';
  const vendorBase = `/${VENDOR_DIR_NAME}`;
  const publicDir = path.resolve(root, targetAppDir, 'public');
  const vendorDir = path.join(publicDir, VENDOR_DIR_NAME);

  console.info(`[sync-shared-deps] 目标应用: ${targetAppDir}`);
  console.info(`[sync-shared-deps] 输出目录: ${vendorDir}`);

  // 1. 清理旧产物
  if (fs.existsSync(vendorDir)) {
    fs.rmSync(vendorDir, { recursive: true, force: true });
    console.info('[sync-shared-deps] 已清理旧产物');
  }
  fs.mkdirSync(vendorDir, { recursive: true });

  // 2. jspm generator 解析完整依赖图（存在锁文件时按精确版本安装）
  // 惰性导入：--check 模式不联网也不依赖该包
  // v4.4.1: @jspm/generator 声明在 @ydsz/vite-config 依赖中，
  // 从 vite-config 包路径解析导入（bash/ 脚本自身不声明该依赖）
  const generatorModulePath = path.join(
    root,
    'conf/vite-config/node_modules/@jspm/generator/dist/generator.js',
  );
  const { Generator } = await import(
    /* webpackIgnore: true */ pathToFileURL(generatorModulePath).href
  );
  const lock = readLock();
  if (lock?.deps) {
    console.info(`[sync-shared-deps] 检测到版本锁，按锁定版本安装（--refresh 可重解析）`);
  }
  console.info('[sync-shared-deps] 通过 jspm generator 解析依赖图...');
  const generator = new Generator({
    baseUrl: root,
    env: ['production', 'browser', 'module'],
    defaultProvider: 'esm.sh',
    commonJS: true,
  });

  for (const dep of ALL_SHARED_DEPS) {
    // v4.4.1: axios 的 esm.sh 产物缺少 ./lib/adapters/xhr 子路径导出声明，
    // jspm 按 exports map 严格解析失败（vxe-pc-ui → axios 深层引用触发）。
    // 对 axios 关联依赖改用 CDN 基础 URL 直装（绕过 esm.sh 重写导出），
    // 其余依赖仍走 esm.sh provider。
    const axiosFamily = ['axios', 'vxe-table', 'vxe-pc-ui'];
    if (axiosFamily.includes(dep.name)) {
      const lockedVersion = lock?.deps?.[dep.name]?.version;
      const version = lockedVersion || dep.range;
      try {
        await generator.install({
          target: `https://cdn.jsdelivr.net/npm/${dep.name}@${version}`,
        });
        console.info(`  ✓ ${dep.name}@${version}（jsdelivr 直装）`);
        continue;
      } catch (err) {
        console.warn(
          `[sync-shared-deps] ${dep.name} jsdelivr 直装失败，回退 esm.sh: ${err.message}`,
        );
      }
    }
    const lockedVersion = lock?.deps?.[dep.name]?.version;
    await generator.install({
      target: dep.name,
      range: lockedVersion || dep.range,
    });
    console.info(`  ✓ ${dep.name}@${lockedVersion || dep.range}${lockedVersion ? '（锁定）' : ''}`);
  }

  const originalMap = generator.getMap();
  if (!originalMap) {
    throw new Error('[sync-shared-deps] importmap 生成失败');
  }

  // 3. 收集所有需下载的 URL
  const urlSet = new Set();
  for (const url of Object.values(originalMap.imports || {})) urlSet.add(url);
  for (const scope of Object.values(originalMap.scopes || {})) {
    for (const url of Object.values(scope)) urlSet.add(url);
  }

  console.info(`[sync-shared-deps] 待下载模块: ${urlSet.size} 个`);

  // 4. 下载并改写 URL → 同源路径
  const urlRemap = new Map(); // originalUrl → localPath（以 /vendor 开头）
  let downloaded = 0;
  let failed = 0;

  for (const url of urlSet) {
    try {
      const localPath = await downloadToVendor(url, vendorDir, vendorBase);
      urlRemap.set(url, localPath);
      downloaded++;
      if (downloaded % 10 === 0) {
        console.info(`  进度: ${downloaded}/${urlSet.size}`);
      }
    } catch (err) {
      failed++;
      console.warn(`  ✗ 下载失败: ${url} → ${err.message}`);
      // 失败时保留原始 URL（回退到 CDN）
      urlRemap.set(url, url);
    }
  }

  console.info(`[sync-shared-deps] 下载完成: ${downloaded} 成功, ${failed} 失败`);

  // 5. 改写 importmap
  const remapped = {
    imports: remapKeys(originalMap.imports || {}, urlRemap),
    scopes: remapScopes(originalMap.scopes || {}, urlRemap),
  };

  // 6. 写入 importmap.json
  const importmapPath = path.join(vendorDir, 'importmap.json');
  fs.writeFileSync(importmapPath, JSON.stringify(remapped, null, 2), 'utf-8');
  console.info(`[sync-shared-deps] importmap 已写入: ${importmapPath}`);

  // 7. 写入/更新版本锁文件（顶层依赖 → 精确版本）
  writeLock(originalMap.imports || {});

  console.info('[sync-shared-deps] 完成。构建时设置 VITE_IMPORTMAP_SELF_HOST=/vendor 即可启用。');
}

/**
 * 从解析结果提取顶层依赖的精确版本并写入锁文件。
 * 已存在锁且未 --refresh 时保留原锁（防覆盖人工确认过的版本）。
 */
function writeLock(imports) {
  const lock = readLock() || { version: 1, syncedAt: '', deps: {} };
  let updated = false;

  for (const dep of ALL_SHARED_DEPS) {
    const url = imports[dep.name];
    if (!url) continue;
    const version = extractVersion(url);
    if (!version) {
      console.warn(`[sync-shared-deps] 无法从 URL 提取版本: ${dep.name} → ${url}`);
      continue;
    }
    const prev = lock.deps[dep.name];
    if (!prev || prev.version !== version || isRefresh) {
      lock.deps[dep.name] = { url, version };
      updated = true;
    }
  }

  if (updated || !fs.existsSync(LOCK_FILE)) {
    lock.syncedAt = new Date().toISOString();
    fs.writeFileSync(LOCK_FILE, JSON.stringify(lock, null, 2), 'utf-8');
    console.info(`[sync-shared-deps] 版本锁已写入: ${LOCK_FILE}`);
  }
}

/**
 * CI 校验模式：校验各应用 vendor 产物与版本锁的一致性。
 * - 每个引用的 /vendor/ 路径必须存在对应文件（无悬空引用）
 * - 各应用 importmap.json 顶层依赖版本必须与锁一致（跨应用单实例保证）
 * @returns 退出码（0 一致，1 漂移）
 */
function checkVendorArtifacts() {
  let drift = 0;
  const lock = readLock();

  const appDirs = ['main', ...fs.readdirSync(path.join(root, 'apps'))];
  const seen = new Map(); // 应用名 → 顶层依赖版本 Map

  for (const app of appDirs) {
    const importmapPath = path.join(root, app, 'public/vendor/importmap.json');
    if (!fs.existsSync(importmapPath)) continue;
    const vendorDir = path.join(root, app, 'public/vendor');

    const map = JSON.parse(fs.readFileSync(importmapPath, 'utf-8'));
    const versions = new Map();

    // 1. 悬空引用检查
    for (const [key, url] of Object.entries(map.imports || {})) {
      if (!url.startsWith('/vendor/')) continue;
      const rel = url.slice('/vendor/'.length);
      if (!fs.existsSync(path.join(vendorDir, rel)) && !fs.existsSync(path.join(vendorDir, rel, 'index.js'))) {
        console.error(`  [悬空] ${app}: ${key} → ${url}`);
        drift++;
      }
    }

    // 2. 顶层依赖版本提取（bare 名 key）
    // v4.4.1: importmap 已改写为 /vendor/ 同源路径，版本号从锁定记录
    // （lock.deps）比对而非从 URL 提取（/vendor/ 路径无协议，extractVersion 不适用）
    for (const dep of ALL_SHARED_DEPS) {
      const url = map.imports?.[dep.name];
      if (!url || !url.startsWith('/vendor/')) continue;
      // /vendor/esm.sh/_starvue@3.5.42/... → 提取 name@version 段
      const atMatch = url.match(/\/@?[^/@_]+(?:_star)?@(\d+\.\d+\.\d+(?:-[\w.]+)?)/);
      if (atMatch) versions.set(dep.name, atMatch[1]);
    }
    seen.set(app, versions);
  }

  // 3. 跨应用版本一致性
  if (seen.size >= 2) {
    const [baseApp, baseVersions] = [...seen.entries()][0];
    for (const [app, versions] of seen.entries()) {
      for (const [dep, version] of versions) {
        if (baseVersions.has(dep) && baseVersions.get(dep) !== version) {
          console.error(
            `  [漂移] ${dep}: ${baseApp}@${baseVersions.get(dep)} vs ${app}@${version}（将产生双实例）`,
          );
          drift++;
        }
      }
    }
  }

  // 4. 与锁文件比对
  if (lock?.deps) {
    for (const [app, versions] of seen.entries()) {
      for (const [dep, version] of versions) {
        const locked = lock.deps[dep]?.version;
        if (locked && locked !== version) {
          console.error(`  [锁漂移] ${app} ${dep}@${version} ≠ lock@${locked}，请重跑 sync:shared-deps`);
          drift++;
        }
      }
    }
  }

  if (drift === 0) {
    console.log(`[sync-shared-deps] --check 通过：${seen.size} 个应用 vendor 产物一致且无悬空引用 ✓`);
    return 0;
  }
  console.error(`[sync-shared-deps] --check 发现 ${drift} 处不一致`);
  return 1;
}

/**
 * 下载单个 URL 到 vendor 目录，返回同源路径。
 * URL 结构保留 host + pathname 作为目录层级，避免文件名冲突。
 *
 * v4.4.1 修复：Windows 下 esm.sh URL 中的 `*`（如 `*memoize-one@6.0.0`）
 * 是非法文件名字符（NTFS 保留），mkdir 报 ENOENT。本地落盘时将 `*` 归一化为
 * `_star`，返回的同源路径与 importmap 改写保持一致。
 */
async function downloadToVendor(url, vendorDir, vendorBase) {
  const parsed = new URL(url);
  // host/pathname 作为子路径，去除协议；`*` 归一化以兼容 Windows 文件系统
  const safeHost = parsed.host.replaceAll('*', '_star');
  const safePath = parsed.pathname.replaceAll('*', '_star');
  const relPath = path.posix.join(safeHost, safePath);
  // 以 .js 结尾直接作为文件；否则视为目录，追加 index.js
  const isFile = /\.(js|mjs)$/.test(relPath);
  const filePath = isFile
    ? path.join(vendorDir, relPath)
    : path.join(vendorDir, relPath, 'index.js');
  const localUrlPath = isFile
    ? `${vendorBase}/${relPath}`
    : `${vendorBase}/${relPath}/index.js`;

  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const body = await res.text();
  fs.writeFileSync(filePath, body, 'utf-8');
  return localUrlPath;
}

/** 改写 importmap.imports 的值 */
function remapKeys(imports, urlRemap) {
  const result = {};
  for (const [key, url] of Object.entries(imports)) {
    result[key] = urlRemap.get(url) || url;
  }
  return result;
}

/** 改写 importmap.scopes 的值 */
function remapScopes(scopes, urlRemap) {
  const result = {};
  for (const [scope, mapping] of Object.entries(scopes)) {
    result[urlRemap.get(scope) || scope] = remapKeys(mapping, urlRemap);
  }
  return result;
}

main().catch((err) => {
  console.error('[sync-shared-deps] 致命错误:', err);
  process.exit(1);
});
