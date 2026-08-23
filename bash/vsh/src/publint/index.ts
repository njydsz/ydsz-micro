/**
 * @file vsh publint - 包发布前检查工具
 * @author YDSZ Team
 * @since 2026-08-23
 * @description 发布前检查包的合规性，确保符合 npm 发布规范
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** 包检查项 */
interface PackageLintResult {
  package: string;
  path: string;
  errors: string[];
  warnings: string[];
}

/**
 * 检查单个包的 package.json
 */
function lintPackageJson(packagePath: string): PackageLintResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const pkgPath = resolve(packagePath, 'package.json');

  if (!existsSync(pkgPath)) {
    return {
      package: packagePath,
      path: pkgPath,
      errors: ['package.json 不存在'],
      warnings: [],
    };
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  if (!pkg.name) errors.push('缺少 name 字段');
  if (!pkg.version) errors.push('缺少 version 字段');
  if (!pkg.description) warnings.push('建议添加 description');
  if (!pkg.exports && !pkg.main) errors.push('缺少 exports 或 main 字段');
  if (!pkg.type) warnings.push('建议添加 type: "module"');
  if (!pkg.files) warnings.push('建议添加 files 字段');
  if (!pkg.license) errors.push('缺少 license 字段');

  return {
    package: pkg.name ?? packagePath,
    path: pkgPath,
    errors,
    warnings,
  };
}

/**
 * 查找所有需要检查的包
 */
function findPackages(rootDir: string): string[] {
  const packages: string[] = [];
  const { readdirSync, existsSync: exists } = require('node:fs');

  const scanDir = (dir: string) => {
    if (!exists(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const subDir = resolve(dir, entry.name);
        if (exists(resolve(subDir, 'package.json'))) {
          packages.push(subDir);
        }
      }
    }
  };

  scanDir(resolve(rootDir, 'apps'));
  scanDir(resolve(rootDir, 'comm'));
  scanDir(resolve(rootDir, 'conf'));

  return packages;
}

/**
 * 执行发布前检查
 */
export async function publint(options: {
  rootDir?: string;
  packages?: string[];
}): Promise<PackageLintResult[]> {
  const rootDir = options.rootDir ?? process.cwd();
  const results: PackageLintResult[] = [];

  const packages = options.packages ?? findPackages(rootDir);
  for (const pkg of packages) {
    results.push(lintPackageJson(pkg));
  }

  return results;
}

// CLI 入口
if (import.meta.url === `file://${process.argv[1]}`) {
  const rootDir = process.argv[2] ?? process.cwd();
  console.log(`🔍 执行发布前检查: ${rootDir}`);
  publint({ rootDir })
    .then(results => {
      let totalErrors = 0;
      let totalWarnings = 0;

      for (const r of results) {
        totalErrors += r.errors.length;
        totalWarnings += r.warnings.length;
      }

      if (totalErrors === 0 && totalWarnings === 0) {
        console.log('✅ 发布检查通过：所有包均合规');
        process.exit(0);
      }

      for (const r of results) {
        if (r.errors.length > 0 || r.warnings.length > 0) {
          console.log(`\n📦 ${r.package}`);
          for (const e of r.errors) console.error(`  ❌ ${e}`);
          for (const w of r.warnings) console.warn(`  ⚠️  ${w}`);
        }
      }

      console.log(`\n📊 统计: ${totalErrors} 个错误, ${totalWarnings} 个警告`);
      process.exit(totalErrors > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('发布检查出错:', err);
      process.exit(2);
    });
}
