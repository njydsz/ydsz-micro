/**
 * 统一代码生成入口（API 契约 + i18n）
 *
 * <p>串联 OpenAPI SDK 生成与 i18n 翻译流程，提供单一入口替代分散脚本。
 *
 * <p>使用方式:
 *   npx tsx bash/gen-api.mts                  # 全量生成（API + i18n）
 *   npx tsx bash/gen-api.mts --check          # CI 模式：仅检查（有漂移则失败）
 *   npx tsx bash/gen-api.mts --i18n-only      # 仅执行 i18n 翻译（es-ES/fr-FR/ja-JP/ko-KR）
 *
 * <p>子脚本:
 *   - unified-contract.mts : API 契约生成主逻辑（pnpm gen:api 默认入口）
 *   - data/scripts/gen_i18n.py : en-US → 四语翻译（保留为被调用子脚本）
 *
 * @path bash/gen-api.mts
 * @author ydsz-team
 * @since 4.1.0
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BASH_DIR = __dirname;

/** 颜色日志 */
function ok(msg: string)  { console.log(`  ✓ ${msg}`); }
function err(msg: string) { console.error(`  ✗ ${msg}`); }
function warn(msg: string){ console.log(`  ! ${msg}`); }
function info(msg: string){ console.log(`  · ${msg}`); }

/**
 * 执行命令并返回结果（不抛出异常）
 */
function run(cmd: string, args: string[], opts?: { cwd?: string; stdio?: 'pipe' | 'inherit' }) {
  const result = spawnSync(cmd, args, {
    cwd: opts?.cwd || ROOT,
    stdio: opts?.stdio || 'inherit',
    shell: process.platform === 'win32',
    windowsHide: true,
  });
  return { status: result.status ?? 1, error: result.error };
}

// ─── 子流程 ───────────────────────────────────────────────────────────────

/**
 * 流程 A：调用 unified-contract.mts 生成 API SDK
 * 复用 pnpm gen:api 的全部逻辑，保留 --check 支持
 */
function runApiGeneration(extraArgs: string[] = []) {
  console.log('\n[gen:api] ━━━ Phase 1: OpenAPI SDK 生成 ━━━\n');
  const script = join(BASH_DIR, 'unified-contract.mts');
  const tsx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  // tsx 执行 unified-contract.mts，透传额外参数（如 --check、--live 等）
  const args = ['tsx', script, ...extraArgs];
  const { status, error } = run(tsx, args);
  if (error) {
    err(`API SDK 生成失败: ${error.message}`);
    return false;
  }
  if (status !== 0) {
    err(`API SDK 生成退出码: ${status}`);
    return false;
  }
  ok('OpenAPI SDK 生成完成');
  return true;
}

/**
 * 流程 B：调用 Python 脚本执行 i18n 翻译（en-US → es-ES / fr-FR / ja-JP / ko-KR）
 * 子脚本保留在 data/scripts/gen_i18n.py，此处仅做入参适配与错误处理
 */
function runI18nGeneration() {
  console.log('\n[gen:api] ━━━ Phase 2: i18n 翻译生成 ━━━\n');
  const scriptPath = join(ROOT, 'data', 'scripts', 'gen_i18n.py');
  if (!existsSync(scriptPath)) {
    err(`子脚本不存在: ${scriptPath}`);
    return false;
  }
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const { status, error } = run(pythonCmd, [scriptPath]);
  if (error) {
    err(`i18n 翻译失败: ${error.message}`);
    info('提示: 确保 Python 环境已安装（需 i18n_dicts 依赖模块）');
    return false;
  }
  if (status !== 0) {
    err(`i18n 翻译退出码: ${status}`);
    return false;
  }
  ok('i18n 翻译生成完成');
  return true;
}

/**
 * 流程 C：键同步检查（调用 bash/check-locales.mts）
 */
function runLocaleCheck() {
  console.log('\n[gen:api] ━━━ Phase 3: i18n 键一致性检查 ━━━\n');
  const scriptPath = join(BASH_DIR, 'check-locales.mts');
  if (!existsSync(scriptPath)) {
    warn('check-locales.mts 不存在，跳过键检查');
    return true;
  }
  const tsx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const { status, error } = run(tsx, ['tsx', scriptPath]);
  if (error) {
    err(`键同步检查失败: ${error.message}`);
    return false;
  }
  if (status !== 0) {
    err(`键同步检查退出码: ${status}（存在缺失键）`);
    return false;
  }
  ok('i18n 键一致性检查通过');
  return true;
}

// ─── CLI 解析 ─────────────────────────────────────────────────────────────

function printUsage() {
  console.log(`
用法: npx tsx bash/gen-api.mts [选项] [服务名]

选项:
  --check         CI 模式：仅检查 API 契约漂移 + i18n 键一致性
  --i18n-only     仅执行 i18n 翻译 + 键检查（不生成 API SDK）
  --no-i18n       全量模式跳过 i18n 步骤（仅生成 API SDK）
  --help, -h      显示此帮助

服务名（透传给 unified-contract.mts）:
  userinfo | system | message | cronjob | workflow | nextwiki | literule | agent

示例:
  npx tsx bash/gen-api.mts                  # 全量：API + i18n
  npx tsx bash/gen-api.mts --check          # CI 检查
  npx tsx bash/gen-api.mts --i18n-only      # 仅更新翻译
  npx tsx bash/gen-api.mts --live workflow  # 从运行中的后端拉取 workflow spec
`);
}

// ─── 主入口 ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // --help
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  const isCheck = args.includes('--check');
  const isI18nOnly = args.includes('--i18n-only');
  const skipI18n = args.includes('--no-i18n');

  // 透传给子脚本的参数（仅消费本入口独有的标志，--check 需透传给 unified-contract.mts）
  const passthroughArgs = args.filter(
    (a) => !['--i18n-only', '--no-i18n'].includes(a),
  );

  const startTime = Date.now();
  console.log(`[gen:api] 统一代码生成入口 — ${new Date().toISOString()}`);
  console.log(`[gen:api] 模式: ${isCheck ? 'CI 检查' : isI18nOnly ? '仅 i18n' : '全量'}`);

  let allSuccess = true;

  // ── Phase 1: OpenAPI SDK 生成 / 检查 ──
  if (!isI18nOnly) {
    // 委托 unified-contract.mts（透传 --check / --live / --static / 服务名）
    const phase1Ok = runApiGeneration(passthroughArgs);
    if (!phase1Ok) allSuccess = false;
  }

  // ── Phase 2: i18n 翻译 ──
  if (!skipI18n && !isCheck) {
    const i18nOk = runI18nGeneration();
    if (!i18nOk) allSuccess = false;
  }

  // ── Phase 3: i18n 键检查（CI 模式或全量模式末尾） ──
  if (isCheck || (!skipI18n && !isI18nOnly)) {
    const checkOk = runLocaleCheck();
    if (!checkOk) allSuccess = false;
  }

  // ── 总结 ──
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n[gen:api] ━━━ ${allSuccess ? '✓ 全部完成' : '✗ 存在失败'} (${elapsed}s) ━━━\n`);

  if (!allSuccess) {
    process.exit(1);
  }
}

main();
