/**
 * @file vsh check-dep - 依赖合规检查工具
 * @author YDSZ Team
 * @since 2026-08-23
 * @description 依赖合规检查：许可证白名单、工作区协议、import 边界（云顶规范 §6.1）、lockfile 一致性
 *
 * 退出码：0 = 通过；1 = 存在违规；2 = 执行异常。
 * 零外部依赖，使用 Node 原生 API + 项目内共享解析工具（与 check-circular 复用同一套别名/导入解析）。
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative, join, dirname } from 'node:path';

import { extractSpecifiers } from '../shared/fs-path.ts';

/** 依赖合规配置 */
interface DepComplianceConfig {
  /** 允许的许可证 */
  allowedLicenses: string[];
  /** 禁止使用的包 */
  forbiddenPackages: string[];
  /** 必须使用的工作区协议 */
  requireWorkspaceProtocol: boolean;
  /** 业务代码目录（仅这些目录受 import boundary 约束） */
  businessDirs: string[];
  /** import boundary 禁止业务代码直接引入的 HTTP 客户端包 */
  forbiddenFetchPackages: string[];
  /** 允许直接使用 axios/fetch 的基础设施目录（豁免 import boundary） */
  fetchInfraDirs: string[];
}

/** 违规结果 */
interface DepViolation {
  package: string;
  version: string;
  license: string;
  reason: string;
  /** 定位文件（import boundary / lockfile 场景） */
  file?: string;
  /** 严重级别：error 计入失败，warn 仅提示 */
  severity?: 'error' | 'warn';
}

/** 默认配置 */
const DEFAULT_CONFIG: DepComplianceConfig = {
  allowedLicenses: [
    'MIT',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'ISC',
    '0BSD',
    'Unlicense',
    'CC0-1.0',
    'Python-2.0',
    'BlueOak-1.0.0',
  ],
  forbiddenPackages: ['moment', 'jquery', 'lodash'],
  requireWorkspaceProtocol: true,
  businessDirs: ['apps', 'main/src'],
  forbiddenFetchPackages: [
    'axios',
    'node-fetch',
    'undici',
    'ofetch',
    'cross-fetch',
    'got',
    'superagent',
  ],
  fetchInfraDirs: ['comm/effects/request'],
};

/** 跳过的目录（避免扫描产物与依赖） */
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'coverage', '.turbo']);

/**
 * 解析某个直接依赖的真实许可证（读取其 package.json）。
 * 优先查包本地 node_modules，再回退到根 node_modules（pnpm 提升）。
 */
function resolveLicense(name: string, pkgDir: string, rootDir: string): string {
  const candidates = [
    join(pkgDir, 'node_modules', name, 'package.json'),
    join(rootDir, 'node_modules', name, 'package.json'),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    try {
      const meta = JSON.parse(readFileSync(p, 'utf-8').replace(/^﻿/, ''));
      if (typeof meta.license === 'string') return meta.license;
      if (Array.isArray(meta.licenses) && meta.licenses.length > 0) {
        const first = meta.licenses[0];
        if (typeof first === 'string') return first;
        if (first && typeof first.type === 'string') return first.type;
      }
    } catch {
      /* 解析失败忽略，回退 unknown */
    }
  }
  return 'unknown';
}

/**
 * 检查单个 package.json 的依赖
 */
function checkPackageJson(
  packagePath: string,
  config: DepComplianceConfig,
  rootDir: string,
): DepViolation[] {
  const violations: DepViolation[] = [];

  if (!existsSync(packagePath)) {
    return violations;
  }

  const pkgDir = dirname(packagePath);
  const pkg = JSON.parse(readFileSync(packagePath, 'utf-8').replace(/^﻿/, ''));
  const deps = pkg.dependencies ?? {};
  const devDeps = pkg.devDependencies ?? {};

  const allDeps = { ...deps, ...devDeps };
  for (const [name, version] of Object.entries(allDeps)) {
    const v = version as string;

    // 检查禁止包
    if (config.forbiddenPackages.includes(name)) {
      violations.push({
        package: name,
        version: v,
        license: 'unknown',
        reason: '包在禁止列表中',
        file: packagePath,
        severity: 'error',
      });
    }

    // 检查工作区协议（@ydsz/* 内部包必须走 workspace 协议）
    if (config.requireWorkspaceProtocol && name.startsWith('@ydsz/')) {
      if (v !== 'workspace:*' && !v.startsWith('workspace:')) {
        violations.push({
          package: name,
          version: v,
          license: 'unknown',
          reason: '@ydsz 内部包应使用 workspace 协议（workspace:*）',
          file: packagePath,
          severity: 'error',
        });
      }
    }

    // 解析真实许可证（内部 @ydsz 包跳过；workspace: 协议跳过）
    if (!name.startsWith('@ydsz/') && !v.startsWith('workspace:')) {
      const license = resolveLicense(name, pkgDir, rootDir);
      if (license === 'unknown') {
        violations.push({
          package: name,
          version: v,
          license,
          reason: '无法解析许可证（node_modules 中未找到），请确认依赖已安装',
          file: packagePath,
          severity: 'warn',
        });
      } else if (!config.allowedLicenses.includes(license)) {
        violations.push({
          package: name,
          version: v,
          license,
          reason: `许可证「${license}」不在白名单（${config.allowedLicenses.join('/')}）`,
          file: packagePath,
          severity: 'error',
        });
      }
    }
  }

  return violations;
}

/**
 * 递归收集目录下的 package.json 所在目录（排除产物与依赖）。
 * 用于 lockfile importer 覆盖率校验。
 */
function collectPackageDirs(rootDir: string, baseDirs: string[]): string[] {
  const result: string[] = [];

  const walk = (dir: string, depth: number): void => {
    if (depth > 8) return;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry)) continue;
      const full = join(dir, entry);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (!st.isDirectory()) continue;
      if (existsSync(join(full, 'package.json'))) {
        result.push(relative(rootDir, full).split('\\').join('/'));
      }
      walk(full, depth + 1);
    }
  };

  for (const b of baseDirs) {
    const full = join(rootDir, b);
    if (existsSync(full)) walk(full, 0);
  }
  return result;
}

/**
 * 从 pnpm-lock.yaml 提取 importers 段的键集合（工作区包路径）。
 */
function parseLockfileImporters(lockPath: string): Set<string> {
  const importers = new Set<string>();
  if (!existsSync(lockPath)) return importers;

  const text = readFileSync(lockPath, 'utf-8');
  const startIdx = text.indexOf('\nimporters:');
  if (startIdx < 0) return importers;

  // importers 段结束于下一个顶层键（0 缩进的 `key:`），通常是 `packages:`
  const afterStart = text.slice(startIdx + 1);
  const endMatch = afterStart.match(/\n[A-Za-z][A-Za-z0-9_-]*:/);
  const section = endMatch ? afterStart.slice(0, endMatch.index) : afterStart;

  // importer 键为 2 空格缩进的 `path:` 行
  const re = /^[ ]{2}([A-Za-z0-9@/_.-]+):/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(section)) !== null) {
    importers.add(m[1]);
  }
  return importers;
}

/**
 * 从 pnpm-workspace.yaml 解析 catalog 段定义的键集合。
 * 用于校验各包 `catalog:` 引用的一致性（"最小化外部依赖、版本绝对可控"的硬性抓手）。
 */
function parseCatalogKeys(rootDir: string): Set<string> {
  const keys = new Set<string>();
  const wsPath = join(rootDir, 'pnpm-workspace.yaml');
  if (!existsSync(wsPath)) return keys;
  let text: string;
  try {
    text = readFileSync(wsPath, 'utf-8');
  } catch {
    return keys;
  }
  // catalog 段：顶层 `catalog:` 键起，到下一个 0 缩进顶层键（或文件末尾）止
  const lines = text.split('\n');
  let inCatalog = false;
  for (const line of lines) {
    if (line.trim() === 'catalog:') {
      inCatalog = true;
      continue;
    }
    if (inCatalog) {
      if (line && !line.startsWith(' ')) {
        inCatalog = false;
        continue;
      }
      const m = /^\s{2}['"]?([^'":\s]+)['"]?\s*:/.exec(line);
      if (m) keys.add(m[1]);
    }
  }
  return keys;
}

/**
 * catalog 一致性校验：各包依赖中 `catalog:` 引用必须能在 pnpm-workspace.yaml catalog 中找到定义。
 */
function checkCatalogConsistency(rootDir: string, packagePaths: string[]): DepViolation[] {
  const violations: DepViolation[] = [];
  const catalogKeys = parseCatalogKeys(rootDir);
  if (catalogKeys.size === 0) {
    violations.push({
      package: 'pnpm-workspace.yaml',
      version: '-',
      license: '-',
      reason: 'pnpm-workspace.yaml 中 catalog 段缺失或为空，无法校验 catalog: 引用一致性',
      file: join(rootDir, 'pnpm-workspace.yaml'),
      severity: 'error',
    });
    return violations;
  }
  for (const packagePath of packagePaths) {
    let pkg: Record<string, unknown>;
    try {
      pkg = JSON.parse(readFileSync(packagePath, 'utf-8').replace(/^﻿/, ''));
    } catch {
      continue;
    }
    const deps = pkg.dependencies as Record<string, string> | undefined;
    const devDeps = pkg.devDependencies as Record<string, string> | undefined;
    const allDeps = { ...(deps ?? {}), ...(devDeps ?? {}) };
    for (const [name, version] of Object.entries(allDeps)) {
      if (version === 'catalog:' && !catalogKeys.has(name)) {
        violations.push({
          package: name,
          version,
          license: '-',
          reason: `依赖使用 catalog: 协议，但 pnpm-workspace.yaml catalog 未定义「${name}」——请补 catalog 条目或改用显式版本`,
          file: packagePath,
          severity: 'error',
        });
      }
    }
  }
  return violations;
}

/**
 * lockfile 一致性校验：检查工作区包是否均已锁定（出现在 importers 中）。
 */
function checkLockfile(rootDir: string): DepViolation[] {
  const violations: DepViolation[] = [];
  const lockPath = join(rootDir, 'pnpm-lock.yaml');
  if (!existsSync(lockPath)) {
    violations.push({
      package: 'pnpm-lock.yaml',
      version: '-',
      license: '-',
      reason: '缺少 pnpm-lock.yaml，依赖未锁定',
      file: lockPath,
      severity: 'error',
    });
    return violations;
  }

  const importers = parseLockfileImporters(lockPath);
  const workspaceRoots = ['apps', 'comm', 'conf', 'main', 'bash'];
  const pkgDirs = collectPackageDirs(rootDir, workspaceRoots);

  for (const dir of pkgDirs) {
    const key = dir === 'main' ? 'main' : dir;
    if (!importers.has(key)) {
      violations.push({
        package: dir,
        version: '-',
        license: '-',
        reason: '工作区包未在 pnpm-lock.yaml 的 importers 中锁定（lockfile 可能过期，请运行 pnpm install）',
        file: join(rootDir, dir),
        severity: 'error',
      });
    }
  }
  return violations;
}

/**
 * import 边界校验（云顶规范 §6.1）：
 * 业务代码（businessDirs）禁止直接引入 axios/fetch 类 HTTP 客户端，必须统一经由 @ydsz/request 基础设施层。
 */
function checkImportBoundary(rootDir: string, config: DepComplianceConfig): DepViolation[] {
  const violations: DepViolation[] = [];

  const walk = (dir: string): string[] => {
    const files: string[] = [];
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return files;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry)) continue;
      const full = join(dir, entry);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        files.push(...walk(full));
      } else if (/\.(ts|mts|cts|vue)$/.test(entry)) {
        files.push(full);
      }
    }
    return files;
  };

  const fetchRe = /(^|[^.\w])fetch\s*\(|new\s+XMLHttpRequest\b/;

  for (const b of config.businessDirs) {
    const full = join(rootDir, b);
    if (!existsSync(full)) continue;
    for (const file of walk(full)) {
      const rel = relative(rootDir, file).split('\\').join('/');
      let content: string;
      try {
        content = readFileSync(file, 'utf-8');
      } catch {
        continue;
      }

      // 1) 禁止的 HTTP 客户端包直接 import
      for (const spec of extractSpecifiers(content)) {
        const base = spec.split('/').pop() ?? spec;
        if (config.forbiddenFetchPackages.includes(base)) {
          violations.push({
            package: spec,
            version: '-',
            license: '-',
            reason: '业务代码禁止直接引入 HTTP 客户端（云顶规范 §6.1），请改用 @ydsz/request',
            file: rel,
            severity: 'error',
          });
        }
      }

      // 2) 裸 fetch / XMLHttpRequest 调用（业务代码应经 @ydsz/request）
      if (fetchRe.test(content)) {
        violations.push({
          package: 'fetch/XMLHttpRequest',
          version: '-',
          license: '-',
          reason: '业务代码禁止直接使用 fetch/XMLHttpRequest（云顶规范 §6.1），请改用 @ydsz/request',
          file: rel,
          severity: 'error',
        });
      }
    }
  }

  return violations;
}

/**
 * 执行依赖合规检查（聚合：package.json / import boundary / lockfile）
 */
export async function checkDep(options: {
  rootDir?: string;
  config?: Partial<DepComplianceConfig>;
}): Promise<DepViolation[]> {
  const rootDir = options.rootDir ?? process.cwd();
  const config = { ...DEFAULT_CONFIG, ...options.config };

  const violations: DepViolation[] = [];

  // 1) 全 workspace package.json 依赖检查（根 + apps/comm/conf/main/bash 全部工作区包）
  const rootPkg = resolve(rootDir, 'package.json');
  const packagePaths: string[] = [rootPkg];
  const workspaceRoots = ['apps', 'comm', 'conf', 'main', 'bash'];
  for (const dir of collectPackageDirs(rootDir, workspaceRoots)) {
    packagePaths.push(resolve(rootDir, dir, 'package.json'));
  }
  for (const packagePath of packagePaths) {
    violations.push(...checkPackageJson(packagePath, config, rootDir));
  }

  // 1.5) catalog 一致性（catalog: 引用必须能在 pnpm-workspace.yaml 中找到定义）
  violations.push(...checkCatalogConsistency(rootDir, packagePaths));

  // 2) import 边界（云顶规范 §6.1）
  violations.push(...checkImportBoundary(rootDir, config));

  // 3) lockfile 一致性
  violations.push(...checkLockfile(rootDir));

  return violations;
}

// CLI 入口
if (import.meta.url === `file://${process.argv[1]}`) {
  const rootDir = process.argv[2] ?? process.cwd();
  // eslint-disable-next-line no-console
  console.log(`🔍 执行依赖合规检查: ${rootDir}`);
  checkDep({ rootDir })
    .then((violations) => {
      const errors = violations.filter((v) => v.severity !== 'warn');
      const warns = violations.filter((v) => v.severity === 'warn');

      if (warns.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(`\n⚠️  ${warns.length} 处警告（不阻断）:`);
        for (const v of warns) {
          const loc = v.file ? ` (${v.file})` : '';
          // eslint-disable-next-line no-console
          console.warn(`  ${v.package}@${v.version}: ${v.reason}${loc}`);
        }
      }

      if (errors.length === 0) {
        // eslint-disable-next-line no-console
        console.log(`✅ 依赖合规检查通过${warns.length ? `（含 ${warns.length} 警告）` : ''}`);
        process.exit(0);
      }

      // eslint-disable-next-line no-console
      console.error(`\n❌ 发现 ${errors.length} 处依赖违规:`);
      for (const v of errors) {
        const loc = v.file ? ` (${v.file})` : '';
        // eslint-disable-next-line no-console
        console.error(`  ${v.package}@${v.version}: ${v.reason}${loc}`);
      }
      process.exit(1);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('依赖合规检查出错:', err);
      process.exit(2);
    });
}
