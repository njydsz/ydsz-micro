#!/usr/bin/env node
/**
 * @file vsh CLI 入口
 * @author YDSZ Team
 * @since 2026-08-23
 * @description YDSZ 工程化工具链命令行入口
 */

import { Command } from 'commander';
import { resolve } from 'node:path';

const program = new Command();

program
  .name('vsh')
  .description('YDSZ 工程化工具链')
  .version('1.0.0');

// 架构检查
program
  .command('check-arch')
  .description('检查项目架构规范，确保模块依赖方向正确')
  .argument('[rootDir]', '项目根目录', '.')
  .action(async (rootDir) => {
    const { checkArch } = await import('../src/check-arch/index.ts');
    const violations = await checkArch({ rootDir: resolve(rootDir) });
    if (violations.length === 0) {
      console.log('✅ 架构检查通过：未发现违规依赖');
      process.exit(0);
    }
    console.error(`❌ 架构检查失败：发现 ${violations.length} 处违规\n`);
    for (const v of violations) {
      console.error(`  [${v.rule}] ${v.file}:${v.line}`);
      console.error(`    ${v.message}`);
    }
    process.exit(1);
  });

// 循环依赖检测
program
  .command('check-circular')
  .description('检测项目中的循环依赖')
  .argument('[rootDir]', '项目根目录', '.')
  .action(async (rootDir) => {
    const { checkCircular } = await import('../src/check-circular/index.ts');
    const cycles = await checkCircular({ rootDir: resolve(rootDir) });
    if (cycles.length === 0) {
      console.log('✅ 循环依赖检测通过：未发现循环');
      process.exit(0);
    }
    console.error(`❌ 发现 ${cycles.length} 处循环依赖:\n`);
    for (const c of cycles) {
      console.error(`  循环: ${c.description}`);
    }
    process.exit(1);
  });

// 依赖合规检查
program
  .command('check-dep')
  .description('检查依赖合规性')
  .argument('[rootDir]', '项目根目录', '.')
  .action(async (rootDir) => {
    const { checkDep } = await import('../src/check-dep/index.ts');
    const violations = await checkDep({ rootDir: resolve(rootDir) });
    if (violations.length === 0) {
      console.log('✅ 依赖合规检查通过');
      process.exit(0);
    }
    console.error(`❌ 发现 ${violations.length} 处依赖违规:\n`);
    for (const v of violations) {
      console.error(`  ${v.package}@${v.version}: ${v.reason}`);
    }
    process.exit(1);
  });

// 工作区同步
program
  .command('code-workspace')
  .description('同步 VS Code 工作区配置')
  .argument('[rootDir]', '项目根目录', '.')
  .option('-o, --output <path>', '输出文件路径')
  .action(async (rootDir, options) => {
    const { syncWorkspace } = await import('../src/code-workspace/index.ts');
    await syncWorkspace({ rootDir: resolve(rootDir), output: options.output });
  });

// 发布前检查
program
  .command('publint')
  .description('发布前检查包的合规性')
  .argument('[rootDir]', '项目根目录', '.')
  .action(async (rootDir) => {
    const { publint } = await import('../src/publint/index.ts');
    const results = await publint({ rootDir: resolve(rootDir) });
    let totalErrors = 0;
    let totalWarnings = 0;
    for (const r of results) {
      totalErrors += r.errors.length;
      totalWarnings += r.warnings.length;
      if (r.errors.length > 0 || r.warnings.length > 0) {
        console.log(`\n📦 ${r.package}`);
        for (const e of r.errors) console.error(`  ❌ ${e}`);
        for (const w of r.warnings) console.warn(`  ⚠️  ${w}`);
      }
    }
    if (totalErrors === 0 && totalWarnings === 0) {
      console.log('✅ 发布检查通过：所有包均合规');
      process.exit(0);
    }
    console.log(`\n📊 统计: ${totalErrors} 个错误, ${totalWarnings} 个警告`);
    process.exit(totalErrors > 0 ? 1 : 0);
  });

program.parse();
