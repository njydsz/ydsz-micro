#!/usr/bin/env node
/**
 * @file vsh CLI 入口（零依赖原生实现）
 * @author YDSZ Team
 * @since 2026-08-24
 * @description YDSZ 工程化工具链命令行入口。2026-08-24 重构：移除 commander 第三方依赖，
 *              改用 Node 原生 argv 解析，契合「最小化外部依赖、绝对可控」原则；并确保各子命令
 *              实际递归收集源码文件参与检查（修复原入口未传 files 导致零检查的缺陷）。
 *
 * 运行需 Node 类型剥离能力（脚本经 --experimental-strip-types 调用，见根 package.json scripts）。
 */

import { resolve, relative } from 'node:path';

const args = process.argv.slice(2);
const command = args[0];
const rest = args.slice(1);

/** 解析位置参数与选项（-o/--output） */
function parseArgs(items) {
  const opts = {};
  const positional = [];
  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    if (a === '-o' || a === '--output') {
      opts.output = items[++i];
    } else if (a.startsWith('--output=')) {
      opts.output = a.slice('--output='.length);
    } else {
      positional.push(a);
    }
  }
  return { opts, positional };
}

const { opts, positional } = parseArgs(rest);
const rootDir = resolve(positional[0] || '.');

async function main() {
  switch (command) {
    case 'check-arch': {
      const { checkArch } = await import('../src/check-arch/index.ts');
      const violations = await checkArch({ rootDir });
      if (violations.length === 0) {
        console.log('✅ 架构检查通过：未发现违规依赖');
        process.exit(0);
      }
      console.error(`❌ 发现 ${violations.length} 处架构违规:\n`);
      for (const v of violations) {
        console.error(`  [${v.rule}] ${relativePath(rootDir, v.file)}:${v.line}`);
        console.error(`    ${v.message}`);
      }
      process.exit(1);
    }
    case 'check-circular': {
      const { checkCircular } = await import('../src/check-circular/index.ts');
      const cycles = await checkCircular({ rootDir });
      if (cycles.length === 0) {
        console.log('✅ 循环依赖检测通过：未发现循环');
        process.exit(0);
      }
      console.error(`❌ 发现 ${cycles.length} 处循环依赖:\n`);
      for (const c of cycles) {
        console.error(`  循环: ${c.description}`);
      }
      process.exit(1);
    }
    case 'check-dep': {
      const { checkDep } = await import('../src/check-dep/index.ts');
      const violations = await checkDep({ rootDir });
      const errors = violations.filter((v) => v.severity !== 'warn');
      const warns = violations.filter((v) => v.severity === 'warn');
      if (warns.length > 0) {
        console.warn(`\n⚠️  ${warns.length} 处警告（不阻断）:`);
        for (const v of warns) {
          console.warn(`  ${v.package}@${v.version}: ${v.reason}`);
        }
      }
      if (errors.length === 0) {
        console.log(`✅ 依赖合规检查通过${warns.length ? `（含 ${warns.length} 警告）` : ''}`);
        process.exit(0);
      }
      console.error(`\n❌ 发现 ${errors.length} 处依赖违规:`);
      for (const v of errors) {
        console.error(`  ${v.package}@${v.version}: ${v.reason}`);
      }
      process.exit(1);
    }
    case 'code-workspace': {
      const { syncWorkspace } = await import('../src/code-workspace/index.ts');
      await syncWorkspace({ rootDir, output: opts.output });
      break;
    }
    case 'publint': {
      const { publint } = await import('../src/publint/index.ts');
      const results = await publint({ rootDir });
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
    }
    default: {
      console.error(`未知命令: ${command ?? '(空)'}`);
      console.error('可用命令: check-arch, check-circular, check-dep, code-workspace, publint');
      process.exit(2);
    }
  }
}

function relativePath(base, target) {
  try {
    return relative(base, target);
  } catch {
    return target;
  }
}

main().catch((err) => {
  console.error('vsh 执行出错:', err);
  process.exit(2);
});
