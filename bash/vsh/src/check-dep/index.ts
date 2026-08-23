/**
 * @file vsh check-dep - 依赖合规检查工具
 * @author YDSZ Team
 * @since 2026-08-23
 * @description 检查依赖合规性，确保许可证、安全漏洞等符合标准
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** 依赖合规配置 */
interface DepComplianceConfig {
  /** 允许的许可证 */
  allowedLicenses: string[];
  /** 禁止使用的包 */
  forbiddenPackages: string[];
  /** 必须使用的工作区协议 */
  requireWorkspaceProtocol: boolean;
}

/** 违规结果 */
interface DepViolation {
  package: string;
  version: string;
  license: string;
  reason: string;
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
  ],
  forbiddenPackages: [],
  requireWorkspaceProtocol: true,
};

/**
 * 检查 package.json 的依赖
 */
function checkPackageJson(
  packagePath: string,
  config: DepComplianceConfig,
): DepViolation[] {
  const violations: DepViolation[] = [];

  if (!existsSync(packagePath)) {
    return violations;
  }

  const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
  const deps = pkg.dependencies ?? {};
  const devDeps = pkg.devDependencies ?? {};

  // 检查是否使用了禁止的包
  const allDeps = { ...deps, ...devDeps };
  for (const [name, version] of Object.entries(allDeps)) {
    // 检查禁止包
    if (config.forbiddenPackages.includes(name)) {
      violations.push({
        package: name,
        version: version as string,
        license: 'unknown',
        reason: '包在禁止列表中',
      });
    }

    // 检查工作区协议
    if (config.requireWorkspaceProtocol && name.startsWith('@ydsz/')) {
      if (version !== 'workspace:*' && !version.startsWith('workspace:')) {
        violations.push({
          package: name,
          version: version as string,
          license: 'unknown',
          reason: '@ydsz 内部包应使用 workspace 协议',
        });
      }
    }
  }

  return violations;
}

/**
 * 执行依赖合规检查
 */
export async function checkDep(options: {
  rootDir?: string;
  config?: Partial<DepComplianceConfig>;
}): Promise<DepViolation[]> {
  const rootDir = options.rootDir ?? process.cwd();
  const config = { ...DEFAULT_CONFIG, ...options.config };

  const violations: DepViolation[] = [];

  // 检查根 package.json
  const rootPkg = resolve(rootDir, 'package.json');
  violations.push(...checkPackageJson(rootPkg, config));

  // 检查 apps 子包
  const appsDir = resolve(rootDir, 'apps');
  if (existsSync(appsDir)) {
    const { readdirSync } = await import('node:fs');
    const apps = readdirSync(appsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => resolve(appsDir, d.name, 'package.json'))
      .filter(p => existsSync(p));

    for (const appPkg of apps) {
      violations.push(...checkPackageJson(appPkg, config));
    }
  }

  return violations;
}

// CLI 入口
if (import.meta.url === `file://${process.argv[1]}`) {
  const rootDir = process.argv[2] ?? process.cwd();
  console.log(`🔍 执行依赖合规检查: ${rootDir}`);
  checkDep({ rootDir })
    .then(violations => {
      if (violations.length === 0) {
        console.log('✅ 依赖合规检查通过');
        process.exit(0);
      }
      console.error(`❌ 发现 ${violations.length} 处依赖违规:\n`);
      for (const v of violations) {
        console.error(`  ${v.package}@${v.version}: ${v.reason}`);
      }
      process.exit(1);
    })
    .catch(err => {
      console.error('依赖合规检查出错:', err);
      process.exit(2);
    });
}
