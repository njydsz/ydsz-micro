/**
 * `@ts-nocheck` 棘轮门禁
 *
 * 背景：自研 UI 库（ydsz-ui / ydsz-vue）存在大量 `@ts-nocheck`（约 266 处），
 * 导致组件库几乎没有类型保护。一次性清理不可行——移除后会暴露被长期掩盖的
 * 类型债务（未使用变量、可能 undefined、props 类型不匹配等），需要逐目录治理。
 *
 * 本门禁提供棘轮机制：
 *   - 基线文件记录当前 `@ts-nocheck` 总数（bash/ts-nocheck-baseline.json）
 *   - 只允许总数**下降**；新增 `@ts-nocheck` 直接判红
 *   - 每清理完一个目录，运行 `--update-baseline` 收紧基线
 *
 * 用法：
 *   node bash/check-ts-nocheck.mts                 # 门禁
 *   node bash/check-ts-nocheck.mts --update-baseline  # 更新基线
 *   node bash/check-ts-nocheck.mts --list          # 列出分布
 *
 * 退出码非 0 表示存在新增 @ts-nocheck（前提不成立同样失败）。
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const BASELINE = 'bash/ts-nocheck-baseline.json';

interface Baseline {
  total: number;
  byPackage: Record<string, number>;
  note: string;
}

/** 统计 @ts-nocheck 分布（排除 node_modules / dist / 生成物）。 */
function scan(): { total: number; byPackage: Record<string, number> } {
  const byPackage: Record<string, number> = {};
  let total = 0;
  const dirs = ['comm', 'apps', 'main'];
  for (const dir of dirs) {
    // 用 git ls-files 取受版本控制的文件，避免遍历 node_modules
    let files: string[];
    try {
      // 注意：Windows 下 execSync 走 cmd.exe，单引号会被当作普通字符导致匹配失败；
      // 使用双引号并显式指定 shell 为空，交由 Node 直接 spawn。
      files = execSync(`git ls-files -- "${dir}"`, {
        cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
        windowsHide: true,
      })
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => (f.endsWith('.vue') || f.endsWith('.ts')) && !f.includes('node_modules'));
    } catch {
      continue;
    }
    for (const rel of files) {
      let content: string;
      try {
        content = readFileSync(`${ROOT}/${rel}`, 'utf8');
      } catch {
        continue;
      }
      const matches = content.match(/^\s*\/\/\s*@ts-nocheck\b/gm);
      if (!matches || matches.length === 0) continue;
      const count = matches.length;
      const parts = rel.split('/');
      const pkg = parts.slice(0, 5).join('/');
      byPackage[pkg] = (byPackage[pkg] || 0) + count;
      total += count;
    }
  }
  return { total, byPackage };
}

function loadBaseline(): Baseline | null {
  const p = `${ROOT}/${BASELINE}`;
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as Baseline;
  } catch {
    return null;
  }
}

function saveBaseline(b: Baseline): void {
  writeFileSync(
    `${ROOT}/${BASELINE}`,
    `${JSON.stringify(b, null, 2)}\n`,
    'utf8',
  );
}

const args = process.argv.slice(2);
const mode = args[0] || '';

const current = scan();

if (mode === '--list') {
  console.log(`当前 @ts-nocheck 总数：${current.total}`);
  const sorted = Object.entries(current.byPackage).sort((a, b) => b[1] - a[1]);
  for (const [pkg, n] of sorted.slice(0, 20)) {
    console.log(`  ${String(n).padStart(4)}  ${pkg}`);
  }
  process.exit(0);
}

const baseline = loadBaseline();

if (mode === '--update-baseline') {
  const b: Baseline = {
    total: current.total,
    byPackage: current.byPackage,
    note:
      '由 bash/check-ts-nocheck.mts --update-baseline 生成。'
      + '清理完一个组件目录后运行本命令收紧基线；总数只允许下降。',
  };
  saveBaseline(b);
  console.log(`基线已更新：total=${b.total}`);
  console.log('分布：');
  for (const [pkg, n] of Object.entries(b.byPackage).sort((a, b2) => b2[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${pkg}`);
  }
  process.exit(0);
}

if (!baseline) {
  console.error('ERROR: 基线文件不存在，请先执行 --update-baseline 初始化。');
  process.exit(2);
}

if (current.total > baseline.total) {
  const diff = current.total - baseline.total;
  console.error(
    `❌ @ts-nocheck 数量上涨（棘轮只可下调）：当前 ${current.total} > 基线 ${baseline.total}（+${diff}）`,
  );
  console.error('\n新增位置（对比基线分布）：');
  for (const [pkg, n] of Object.entries(current.byPackage).sort((a, b) => b[1] - a[1])) {
    const before = baseline.byPackage[pkg] || 0;
    if (n > before) {
      console.error(`  ${pkg}: ${before} → ${n}（+${n - before}）`);
    }
  }
  console.error('\n处理方式：移除新增的 @ts-nocheck，并修复暴露的类型问题。');
  process.exit(1);
}

console.log(
  `✅ @ts-nocheck 棘轮通过：当前 ${current.total}，基线 ${baseline.total}`
  + `（${current.total < baseline.total ? `已减少 ${baseline.total - current.total}` : '持平'}）`,
);
process.exit(0);
