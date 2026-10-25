#!/usr/bin/env node
/**
 * CI 接线门禁 — 断言"工作流里写的每一条命令真的能跑"。
 *
 * 起因（S8）：`.github/workflows/ci.yml` 里两处仍写 `node bash/gen-error-codes.mjs`、
 * `node bash/contract-notify.mjs`，而这两个脚本早已改名为 `.mts`。CI 里这一步永远在
 * "Cannot find module" 上失败，于是整个 contract job 变红，团队把它当噪声忽略，
 * 真正需要卡的契约漂移反而没人看——一个引用了不存在文件的门禁，比没有门禁更糟。
 *
 * 校验项（行内 `run: xxx` 与块 `run: |` 两种写法都要覆盖）：
 *   A. workflow 中每条 `node <file>` / `python3 <file>` 的目标文件存在
 *   B. 每条 `pnpm <script>`（含 `pnpm run`/`pnpm -F <pkg> run`）在对应 package.json 的
 *      scripts 中存在；`pnpm exec <bin>` 只要求 bin 可解析（不猜 npx 全局）
 *   C. 每个 `needs: <job>` 指向同文件内真实存在的 job id
 *   D. 校验类脚本（`check:*` 前缀，以及 `*:check` / `*:self-test` 后缀）必须被 CI 接线
 *      （`pnpm 别名` 或与脚本正文等价的直接命令均算），或在 MANUAL_ONLY 中写明理由
 *      （防止"写完门禁忘了挂上去"——本仓已有多个此类死门禁）
 *   E. job 必须有 `- uses: actions/checkout@v*`，否则命令在无代码的工作目录里跑
 *
 * 用法：
 *   node ./bash/check-ci.mts              # 校验
 *   node ./bash/check-ci.mts --self-test   # 用反例夹具证明本门禁不是空转
 *
 * @path bash/check-ci.mts
 * @author ydsz-team
 * @since 4.5.0
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 有意只本地跑、不接 CI 的校验脚本 → 理由。
 * 新增条目必须写清"它检查的东西在 CI 里由哪一步承担"，否则等于给门禁开后门。
 */
const MANUAL_ONLY = {
  'gen:api:check':
    '编排入口，其组成步骤已分别接线（键同步=verify 的 check:i18n；契约=contract job 直调 gen-contract.py）；此入口供本地一次跑全链',
  'gen:api:legacy:check': '旧 unified-contract 通道，仅在与 gen-contract.py 结果对账时手工使用',
  'check:cspell':
    '存量未登记词需一次性字典治理（lorem 占位文本 + 库专有名词），治理完再接线；跟进归 B1-8',
  'format:check':
    'prettier --check . 当前 3309 个文件不一致（且 6 个文件解析报错），一次性 pnpm format 前接线等于把整个 CI 变红；' +
    '另需先把 .dev-logs/（203 个已入库的临时脚本）从扫描范围剔除。跟进归 B1-9',
  'tokens:check':
    '需要 FIGMA_TOKEN 联网比对 Figma 变量，CI 无该凭据；由设计侧改令牌时本地执行，CI 侧的等价保障是 check:tokens（源码↔CSS 接线）',
};

/** 归一化命令行，使 `python`/`python3`、`./bash/x` 与 `bash/x` 的两种写法可比 */
function normalizeCmd(cmd) {
  return cmd
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)\.\//g, '$1')
    .replace(/(^|\s)python3(\s)/g, '$1python$2')
    .trim();
}

/** 收集工作流文件 */
function listWorkflows(workflowDir) {
  try {
    return readdirSync(workflowDir)
      .filter((f) => /\.ya?ml$/.test(f))
      .map((f) => join(workflowDir, f));
  } catch {
    return [];
  }
}

/** 解析单个 workflow：返回 run 命令行、job id 与 needs、是否 checkout */
function parseWorkflow(src) {
  const lines = src.split(/\r?\n/);
  const runLines = [];
  const jobs = [];
  let currentJob = null;
  let inJobsBlock = false;
  let runBlockIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const indent = line.length - line.trimStart().length;

    if (indent === 0) {
      inJobsBlock = /^jobs:\s*$/.test(line);
      currentJob = null;
      continue;
    }
    if (!inJobsBlock) continue;

    if (indent === 2) {
      const jobId = /^([\w-]+):\s*$/.exec(line.trim());
      if (jobId) {
        currentJob = { id: jobId[1], needs: [], hasCheckout: false, line: i + 1 };
        jobs.push(currentJob);
      }
      continue;
    }
    if (!currentJob) continue;

    const needsMatch = /^needs:\s*([\w'"\-\s,]+)$/.exec(line.trim());
    if (needsMatch) {
      for (const n of needsMatch[1].split(',')) {
        const name = n.trim().replace(/^['"]|['"]$/g, '');
        if (name) currentJob.needs.push(name);
      }
    }
    // 数组形式 needs（同缩进层，紧随其后）
    const needsItem = /^-\s*([\w-]+)\s*$/.exec(line.trim());
    if (needsItem && /^\s*needs:/.test(lines[i - 1] ?? '')) currentJob.needs.push(needsItem[1]);
    if (/uses:\s*actions\/checkout@/.test(line)) currentJob.hasCheckout = true;

    // 先判块形式：`run: |` / `run: >-` 里的 `|`、`>` 都是 \S，若先跑"行内"正则
    // 会把整块误判成一条内容为 `|` 的命令，导致块内所有命令逃出扫描。
    if (/^\s*run:\s*[|>&][-+]?\s*$/.test(line)) {
      runBlockIndent = indent;
      continue;
    }
    const inlineRun = /^\s*run:\s*(\S.*)$/.exec(line);
    if (inlineRun) {
      runLines.push(inlineRun[1].replace(/^['"]|['"]$/g, ''));
      runBlockIndent = 0;
      continue;
    }
    if (runBlockIndent > 0 && indent > runBlockIndent) {
      runLines.push(line.trim());
      continue;
    }
    runBlockIndent = 0;
  }
  return { runLines, jobs };
}

/** 读 package.json scripts */
function scriptsOf(pkgDir) {
  const file = join(pkgDir, 'package.json');
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8')).scripts ?? {};
  } catch {
    return null;
  }
}

/** 收集 workspace 内所有包的 scripts，按 package.json 的 name 建索引（供 pnpm -F <name> 解析） */
function workspaceScripts(root, globs) {
  const byName = new Map();
  const dirs = [root];
  for (const glob of globs) {
    const abs = join(root, glob.replace(/\/?\*.*$/, ''));
    if (!existsSync(abs)) continue;
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      if (entry.isDirectory()) dirs.push(join(abs, entry.name));
    }
  }
  for (const dir of dirs) {
    const file = join(dir, 'package.json');
    if (!existsSync(file)) continue;
    let json;
    try {
      json = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      continue;
    }
    if (json.name) byName.set(json.name, json.scripts ?? {});
  }
  return byName;
}

/**
 * 主检查。
 *
 * @param {object} opts 夹具覆盖（--self-test 用）
 * @returns {{failures: string[], checked: {runLines: number, jobs: number}}}
 */
function collectFailures(opts = {}) {
  const root = opts.root ?? ROOT_DIR;
  const workflowDir = opts.workflowDir ?? join(root, '.github/workflows');
  const failures = [];

  const workflows = listWorkflows(workflowDir);
  if (workflows.length === 0) {
    failures.push(`未找到任何工作流文件：${workflowDir}`);
    return { failures, checked: { runLines: 0, jobs: 0 } };
  }

  const rootScripts = scriptsOf(root) ?? {};
  const wsScripts = workspaceScripts(root, opts.workspaces ?? ['comm', 'main', 'apps', 'packages', 'internal', 'scripts', 'tooling']);
  const ciCommands = new Set();
  let runLineCount = 0;
  let jobCount = 0;

  for (const wf of workflows) {
    const { runLines, jobs } = parseWorkflow(readFileSync(wf, 'utf8'));
    jobCount += jobs.length;
    for (const cmd of runLines) ciCommands.add(normalizeCmd(cmd));
    runLineCount += runLines.length;

    for (const job of jobs) {
      for (const need of job.needs) {
        if (!jobs.some((j) => j.id === need)) {
          failures.push(`${relative(root, wf)}: job '${job.id}' needs 了不存在的 job '${need}'`);
        }
      }
      if (!job.hasCheckout) {
        failures.push(`${relative(root, wf)}: job '${job.id}' 没有 actions/checkout 步骤，run 命令会在空目录里执行`);
      }
    }

    for (const cmd of runLines) {
      // A. node/python 直接调用的脚本文件必须存在
      for (const m of cmd.matchAll(/\b(?:node|python3|python|tsx)\s+(?!-)([\w./@-]+\.(?:mts|ts|mjs|cjs|js|py))\b/g)) {
        const target = m[1];
        if (!existsSync(join(root, target))) {
          failures.push(`${relative(root, wf)}: 引用了不存在的脚本 ${target}（命令：${cmd}）`);
        }
      }

      // B. pnpm 脚本必须存在
      const filtered = cmd.split('&&').map((s) => s.trim());
      for (const piece of filtered) {
        const pnpmMatch = /^pnpm\s+(?:--?\S+\s+)*(?:run\s+)?(?!exec\b|add\b|install\b|audit\b|list\b|dlx\b|patch\b|remove\b|link\b|unlink\b|store\b|fund\b|why\b|prune\b|rebuild\b|outdated\b|init\b|import\b|up\b)([\w:][\w:-]*)/.exec(
          piece,
        );
        if (!pnpmMatch) continue;
        const script = pnpmMatch[1];
        const filterMatch = /-F\s+(\S+)/.exec(piece);
        let scripts = rootScripts;
        if (filterMatch) {
          const name = filterMatch[1].replace(/^['"]|['"]$/g, '');
          const found = wsScripts.get(name);
          if (!found) {
            failures.push(`${relative(root, wf)}: pnpm -F ${name} 指向的包不存在（命令：${piece}）`);
            continue;
          }
          scripts = found;
        }
        if (!(script in scripts)) {
          failures.push(`${relative(root, wf)}: pnpm 脚本 '${script}' 不存在（命令：${piece}）`);
        }
      }
    }
  }

  // D. 校验类脚本必须接线（或其等价命令出现在 CI 中）
  // 命名口径不止 check:* —— `*:check`（--check 语义的校验入口）和 `*:self-test`
  // （门禁自己的反例自检）同样属于"要么在 CI 里跑，要么写明为什么只在本地跑"。
  for (const [name, command] of Object.entries(rootScripts)) {
    if (!/^(check:|.*:check$|.*:self-test$)/.test(name)) continue;
    const normalized = normalizeCmd(String(command));
    const wired = ciCommands.has(`pnpm ${name}`) || ciCommands.has(`pnpm run ${name}`) || ciCommands.has(normalized);
    if (wired) continue;
    if (MANUAL_ONLY[name]) continue;
    failures.push(
      `校验脚本 '${name}' 未被任何工作流引用，也没有在 MANUAL_ONLY 里写明理由 —— ` +
        '要么接线，要么把"它检查的东西由 CI 哪一步承担"写进 bash/check-ci.mts 的 MANUAL_ONLY',
    );
  }

  return { failures, checked: { runLines: runLineCount, jobs: jobCount } };
}

/** 反例夹具：证明 A/B/C/D/E 各项确实会红 */
function selfTest() {
  const dir = mkdtempSync(join(tmpdir(), 'ydsz-ci-selftest-'));
  const wfDir = join(dir, '.github/workflows');
  mkdirSync(wfDir, { recursive: true });
  mkdirSync(join(dir, 'bash'), { recursive: true });
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({
      name: 'fixture',
      scripts: {
        'check:real': 'node ./bash/real.mts',
        'check:orphan': 'node ./bash/orphan.mts --check',
        // 以"等价命令"（而非 pnpm 别名）出现在 CI 的 run: | 块里，必须判为已接线
        'check:equivalent': 'node ./bash/equivalent.mts --check',
        // 后缀式校验入口（*:check），同样受 D 约束
        'style:check': 'node ./bash/real.mts --check',
      },
    }),
    'utf8',
  );
  writeFileSync(join(dir, 'bash/real.mts'), '', 'utf8');
  writeFileSync(join(dir, 'bash/equivalent.mts'), '', 'utf8');

  const fixture = [
    'name: CI',
    'on: push',
    'jobs:',
    '  verify:',
    '    name: 质量门禁',
    '    runs-on: ubuntu-latest',
    '    needs: ghost',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - name: 引用已改名的脚本',
    '        run: node bash/gen-error-codes.mjs --check',
    '      - name: 引用不存在的 pnpm 脚本',
    '        run: pnpm lint:nothing',
    '      - name: 真实脚本',
    '        run: pnpm run check:real',
    '      - name: 块形式里的幽灵脚本',
    '        run: |',
    '          node bash/block-ghost.mts --check',
    '      - name: 等价命令接线',
    '        run: |',
    '          node bash/equivalent.mts --check',
    '  nocheckout:',
    '    name: 缺 checkout 的 job',
    '    runs-on: ubuntu-latest',
    '    steps:',
    "      - name: 直接跑命令",
    '        run: pnpm test',
    '',
  ].join('\n');
  writeFileSync(join(wfDir, 'ci.yml'), fixture, 'utf8');

  try {
    const { failures } = collectFailures({ root: dir, workflowDir: wfDir, workspaces: [] });
    const required = [
      ['A 脚本文件不存在（行内 run）', '不存在的脚本 bash/gen-error-codes.mjs'],
      ['A 脚本文件不存在（run: | 块内）', '不存在的脚本 bash/block-ghost.mts'],
      ['B pnpm 脚本不存在', "pnpm 脚本 'lint:nothing' 不存在"],
      ['C needs 指向幽灵 job', "needs 了不存在的 job 'ghost'"],
      ['D 校验脚本未接线', "校验脚本 'check:orphan' 未被任何工作流引用"],
      ['D 后缀式（*:check）校验脚本未接线', "校验脚本 'style:check' 未被任何工作流引用"],
      ['E job 缺 checkout', "job 'nocheckout' 没有 actions/checkout"],
    ];
    const missed = required.filter(([, needle]) => !failures.some((f) => f.includes(needle)));
    if (missed.length > 0) {
      console.error('❌ CI 门禁自检失败：反例未被下列检查捕获，说明检查已空转：');
      for (const [name] of missed) console.error(`  - ${name}`);
      console.error(`  实际检出 ${failures.length} 条：`);
      for (const f of failures) console.error(`    · ${f}`);
      process.exit(1);
    }
    for (const name of ['check:real', 'check:equivalent']) {
      if (failures.some((f) => f.includes(name))) {
        console.error(`❌ CI 门禁自检失败：已接线的 ${name} 被判为未接线（正向断言不成立）`);
        process.exit(1);
      }
    }
    console.log(`✅ CI 门禁自检通过：反例命中 ${required.length}/${required.length} 类缺陷（检出 ${failures.length} 条）`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---------- 主流程 ----------
if (process.argv.includes('--self-test')) {
  selfTest();
} else {
  const { failures, checked } = collectFailures();
  if (failures.length > 0) {
    console.error(`❌ CI 接线检查未通过（扫描 ${checked.jobs} 个 job / ${checked.runLines} 条 run 命令）：`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`✅ CI 接线通过：${checked.jobs} 个 job、${checked.runLines} 条 run 命令的脚本/文件/job 引用全部存在`);
}
