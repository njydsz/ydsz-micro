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

/**
 * 从 esm.sh 类 URL 中提取精确版本号，失败返回 null。
 *
 * @param url 依赖包的 CDN URL（如 https://esm.sh/vue@3.5.13）
 * @return 精确版本号（如 '3.5.13'），提取失败返回 null
 */
function extractVersion(url) {
  const match = new URL(url).pathname.match(/\/@?[^/@]+@(\d+\.\d+\.\d+(?:-[\w.]+)?)/);
  return match ? match[1] : null;
}

/**
 * 读取版本锁文件（bash/importmap.lock.json），不存在或解析失败返回 null。
 *
 * @return 锁文件内容（含 deps / syncedAt 等字段），读取失败返回 null
 */
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

  // v4.3.2：强制对齐锁版本。
  // 实测 jspm 的 `range` 参数对 esm.sh provider 不生效：即使传 `range: '4.5.1'`，
  // 解析结果仍是 5.4.0（跨大版本，破坏 Vue 3 peer 契约并产生双 Vue 实例）。
  // 因此在此处对解析出的 URL 做后处理：凡指向某个已锁定依赖的 URL，
  // 一律改写为锁定版本的 URL。
  enforceLockedVersions(generator, lock);

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
  /** v4.3.2：下载失败的 URL 列表，非空则最终退出码非 0（阻断 CI） */
  const downloadErrors: string[] = [];

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
      console.error(`  ✗ 下载失败: ${url} → ${err.message}`);
      // v4.3.2：不再静默回退到公网 CDN。
      // 自托管的全部意义就是消除运行时 CDN SPOF；若允许失败项保留原始 URL，
      // 线上仍会依赖 esm.sh，且 --check 门禁无法发现（它只检查 /vendor/ 前缀）。
      // 因此记录为硬失败，最终退出码非 0，交由 CI 阻断。
      downloadErrors.push(url);
      // 仍写入原始 URL 以便本地构建可继续，但门禁会因 downloadErrors 非空而失败
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

  // v4.3.2：有下载失败时以非 0 退出，阻断 CI 发布
  if (downloadErrors.length > 0) {
    console.error(
      `[sync-shared-deps] ✗ ${downloadErrors.length} 个模块下载失败，` +
        'importmap 中仍残留公网 CDN 引用（自托管失效）：',
    );
    for (const url of downloadErrors) console.error(`    - ${url}`);
    process.exit(1);
  }
}

/**
 * 强制把解析结果对齐到锁文件中的版本。
 *
 * 背景（v4.3.2）：实测 `@jspm/generator` 的 `install({ target, range })` 中
 * `range` 对 esm.sh provider 不生效 —— 即使传 `range: '4.5.1'`，解析出的
 * vue-router 仍是 5.4.0。跨大版本漂移会破坏 Vue 3 peer 契约，
 * 并可能让主/子应用加载两个 Vue 实例（provide/inject 割裂）。
 *
 * 做法：遍历生成器的 importmap（imports + scopes），对每个 URL：
 *   1. 解析出「依赖名 + 版本」
 *   2. 若该依赖在锁文件中有记录且版本不同 → 改写为锁定 URL
 *
 * 找不到匹配的依赖名时保持原 URL（传递依赖不都在锁文件中）。
 *
 * @param generator - jspm 生成器实例（就地修改其内部 map）
 * @param lock - 锁文件内容（含 deps）
 */
function enforceLockedVersions(generator, lock) {
  if (!lock?.deps) return;

  // 注意：generator.getMap() 返回的是副本，就地修改无效。
  // 必须直接改内部字段 generator.map（jspm 的私有实现，无公开 setter）。
  const map = generator.map;
  if (!map) {
    console.warn('[sync-shared-deps] 无法访问 generator.map，跳过锁版本对齐');
    return;
  }

  let rewritten = 0;

  /** 把单个 URL 对齐到锁版本，返回改写后的 URL */
  const align = (url) => {
    if (!url || !url.startsWith('http')) return url;
    const parsed = new URL(url);
    // esm.sh 的 URL 前缀有两种形态：
    //   - `/_starvue-router@5.4.0/...`（落盘时 `*` 被归一化为 `_star`）
    //   - `/*vue-router@5.4.0/...`（解析阶段的原始形态）
    // 统一剥离后再提取 name@version
    const cleaned = parsed.pathname
      .replace(/^\/_star/, '/')
      .replace(/^\/\*/, '/');
    const seg = cleaned.match(/\/([^/@]+)@(\d+\.\d+\.\d+(?:-[\w.]+)?)/);
    if (!seg) return url;
    const [, depName, resolvedVersion] = seg;
    const locked = lock.deps[depName];
    if (!locked || locked.version === resolvedVersion) return url;

    rewritten++;
    console.info(
      `  ↻ 锁对齐: ${depName}@${resolvedVersion} → ${locked.version}（锁定）`,
    );
    return locked.url;
  };

  // imports
  if (map.imports) {
    for (const key of Object.keys(map.imports)) {
      map.imports[key] = align(map.imports[key]);
    }
  }
  // scopes：键（scope URL）与值（映射表）都可能需要改写
  if (map.scopes) {
    const newScopes = {};
    for (const [scope, mapping] of Object.entries(map.scopes)) {
      const newMapping = {};
      for (const key of Object.keys(mapping)) {
        newMapping[key] = align(mapping[key]);
      }
      newScopes[align(scope)] = newMapping;
    }
    map.scopes = newScopes;
  }

  // jspm Generator 无公开 setter，直接改内部字段后重新注入
  // getMap() 返回的是内部对象的引用，因此上述就地修改已生效
  if (rewritten > 0) {
    console.info(`[sync-shared-deps] 已对齐 ${rewritten} 处 URL 到锁版本`);
  }
}

/**
 * 从解析结果提取顶层依赖的精确版本并写入锁文件。
 *
 * v4.3.2 修复：此前「已存在锁且未 --refresh 时保留原锁」的注释与实现不符 ——
 * 实现里 `prev.version !== version` 仍会覆盖已有条目，导致例行 sync 把
 * vue-router 4.5.1 悄悄升级成 5.4.0（跨大版本，破坏 Vue 3 peer 契约，
 * 并可能产生双 Vue 实例）。现改为：锁已存在且未显式 --refresh 时完全不写。
 */
function writeLock(imports) {
  const existing = readLock();
  if (existing?.deps && !isRefresh) {
    // 锁已存在：例行同步不得改写版本，避免非预期升级
    return;
  }

  const lock = existing || { version: 1, syncedAt: '', deps: {} };
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

    // 1. 悬空引用检查 + v4.3.2 残留 CDN 引用检查
    for (const [key, url] of Object.entries(map.imports || {})) {
      // 自托管失效：importmap 仍指向公网 CDN（下载失败时的回退值）
      if (url.startsWith('http://') || url.startsWith('https://')) {
        console.error(`  [CDN 残留] ${app}: ${key} → ${url}`);
        drift++;
        continue;
      }
      if (!url.startsWith('/vendor/')) continue;
      const rel = url.slice('/vendor/'.length);
      if (
        !fs.existsSync(path.join(vendorDir, rel)) &&
        !fs.existsSync(path.join(vendorDir, rel, 'index.js'))
      ) {
        console.error(`  [悬空] ${app}: ${key} → ${url}`);
        drift++;
      }
    }

    // 1b. scopes 内的残留 CDN 引用（v4.3.2 新增：此前只检查 imports，
    //     传递依赖的 scope 映射被漏检，vue-router@5.4.0 的 404 正是藏在这里）
    for (const mapping of Object.values(map.scopes || {})) {
      for (const [key, url] of Object.entries(mapping)) {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          console.error(`  [CDN 残留/scope] ${app}: ${key} → ${url}`);
          drift++;
        }
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
          console.error(
            `  [锁漂移] ${app} ${dep}@${version} ≠ lock@${locked}，请重跑 sync:shared-deps`,
          );
          drift++;
        }
      }
    }
  }

  if (drift === 0) {
    console.log(
      `[sync-shared-deps] --check 通过：${seen.size} 个应用 vendor 产物一致且无悬空引用 ✓`,
    );
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
  const localUrlPath = isFile ? `${vendorBase}/${relPath}` : `${vendorBase}/${relPath}/index.js`;

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
