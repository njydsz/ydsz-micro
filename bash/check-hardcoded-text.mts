#!/usr/bin/env node
/**
 * 界面硬编码文案门禁 —— 把「视图里写死的中文」从主观 review 变成可度量、只减不增的预算。
 *
 * 为什么要有这个门禁（实测，不是推断）：
 *   本仓 i18n 只有 key parity 与翻译质量两类校验，**没有任何机制发现"根本没用 t() 的
 *   字面量"**。首轮实测：1270 个 .vue 里 4508 处渲染位置直接写中文，分布在 329 个文件、
 *   13 个 scope（最重的 agent-web 742、message-web 677、cronjob-web 634、literule-web 616）。
 *   这类缺陷的行为特征是「中文界面下完全正常」——切到 en-US 后列标题、按钮、校验提示仍是
 *   中文，混排成 pidgin，而 CI 与单测都不会红，于是只能靠人工逐页发现（本次 P0-5b 就是人工
 *   逐页扫出来的）。人工扫一遍的成本远高于修一遍，所以缺的是度量而不是意愿。
 *
 * 判据（只认「一定会被渲染出来」的位置，白名单式，避免冤枉合法写法）：
 *   1) 对象字面量的文案字段：title/label/placeholder/message/content/description/text/
 *      emptyText/confirmText/cancelText/okText/tooltip/ariaLabel（vxe 列定义、表单 schema、
 *      toast/confirm 配置都走这些 key），单引号、双引号、模板字符串三种写法都算；
 *   2) 模板属性：label=/placeholder=/title=/content=/description=/table-title=/aria-label=，
 *      静态值与 `:attr="表达式"`（含模板字符串）同样命中；
 *   3) 模板文本节点：逐字符扫根 `<template>` 区域，标签内与 `{{ }}` 插值之外的中文，
 *      故 `共 {{ total }} 条` 这种中英混排也认得出来；
 *   4) 提示调用：showToast.*('…') / showToast.*(`…`) 与 YdConfirm('…') 的首个实参。
 *
 * 不计入（这些写法出现中文是合理的，误报的门禁会被当成噪声关掉）：
 *   注释块与行注释（本仓注释按规范一律中文）、logger/console 调用（开发者面向日志）、
 *   `title: '序号'` 这类已经改成 t() 之后的残留（不会命中）、字符串比较/枚举值/正则、
 *   以及显式登记的 ICON 目录类数据文件（见 DATA_CATALOG）。
 *
 * 分级：全部按「预算棘轮」处理——存量冻结、只许下降。超预算=错误；预算里对应的 scope
 * 已归零却没更新基线=错误（要求显式确认战果，防止棘轮数字与真实代码脱节）。
 * `--update-baseline` 同样只许下调：先写死文案再刷预算洗白的路子被堵死；确实因为判据
 * 本身变化导致命中上升时，才用 `--allow-raise` 并在评审里说明原因。
 *
 * 用法：
 *   node ./bash/check-hardcoded-text.mts                     # 校验全仓
 *   node ./bash/check-hardcoded-text.mts --update-baseline   # 重新生成预算（只允许下调）
 *   node ./bash/check-hardcoded-text.mts --update-baseline --allow-raise  # 判据变更后重建
 *   node ./bash/check-hardcoded-text.mts --top 20            # 打印命中最多的文件（排障用）
 *   node ./bash/check-hardcoded-text.mts --self-test         # 反例夹具 + 棘轮逻辑自检
 *
 * @path bash/check-hardcoded-text.mts
 * @author ydsz-team
 * @since 4.6.0
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const MICRO_ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/(\w)/, '$1')), '..');

/** 预算文件：scope -> 允许残留的命中数 */
const BASELINE_FILE = 'bash/hardcoded-text-baseline.json';

/** 参与扫描的顶层目录（与 i18n 门禁的词典根保持同源范围） */
const SCAN_PREFIXES = ['apps/', 'main/', 'comm/', 'docs-site/'];

/**
 * 显式豁免：整表都是「按语言无关 id 索引的目录类数据」，中文 label 是检索别名而非界面文案。
 * 每条都必须给理由，且门禁会校验该文件确实仍有命中——豁免清单腐化同样报错。
 */
const DATA_CATALOG: { file: string; reason: string }[] = [
  {
    file: 'apps/userinfo-web/src/views/system/menu/components/YdIconPicker.vue',
    reason: '331 条 lucide 图标目录（name -> 中文检索别名），界面展示图标本体；翻译或改动需产品决策',
  },
];

/** 文案字段（脚本对象字面量侧） */
const TEXT_FIELDS = [
  'ariaLabel',
  'cancelText',
  'confirmText',
  'content',
  'description',
  'emptyText',
  'label',
  'message',
  'okText',
  'placeholder',
  'text',
  'title',
  'tooltip',
];

/** 模板属性名（kebab 与 camel 都列） */
const TEXT_ATTRS = [
  'aria-label',
  'cancel-text',
  'confirm-text',
  'content',
  'description',
  'empty-text',
  'label',
  'ok-text',
  'placeholder',
  'table-title',
  'title',
  'tooltip',
];

const CJK = '[\\u4e00-\\u9fff]';
/** 预编译：每次匹配都要新建 RegExp（g 标志的 lastIndex 会串味），故只存源码 */
function ruleSources(): string[] {
  return [
    `\\b(?:${TEXT_FIELDS.join('|')})\\s*:\\s*'[^']*${CJK}[^']*'`,
    `\\b(?:${TEXT_FIELDS.join('|')})\\s*:\\s*"[^"]*${CJK}[^"]*"`,
    `\\b(?:${TEXT_FIELDS.join('|')})\\s*:\\s*\`[^\`]*${CJK}`,
    `\\b(?:${TEXT_ATTRS.join('|')})="[^"]*${CJK}[^"]*"`,
    `\\bshowToast\\.\\w+\\(\\s*[\`'][^\`']*${CJK}`,
    `\\bYdConfirm\\(\\s*[\`'][^\`']*${CJK}`,
  ];
}

const RULES = ruleSources().map((source) => new RegExp(source, 'g'));

/** 注释整体抹掉时保持换行数，行号与原文对齐便于排障 */
function blankOut(match: string): string {
  return '\n'.repeat((match.match(/\n/g) ?? []).length);
}

/**
 * 抽出「参与渲染判定」的代码行。
 *
 * <p>注释里的中文不算界面文案，但按行判断会漏掉跨行注释：组件文档常在 `template` 内
 * 写一段多行 HTML 注释的用法示例（YdDropdown 的 8 处命中全是这种示例），逐行剥离认不出
 * 续行，就会把文档当成技术债。故先跨行抹掉 HTML 注释与块注释，再逐行处理行注释；
 * URL 里的双斜杠用哨兵保护，避免把协议地址之后的真实代码吃掉。
 */
function extractCodeLines(source: string): string[] {
  const stripped = source
    .replaceAll(/<!--[\s\S]*?-->/g, blankOut)
    .replaceAll(/\/\*[\s\S]*?\*\//g, blankOut);
  return stripped.split(/\r?\n/).map((line) =>
    line
      .replaceAll(/:\/\//g, '\u0000\u0000')
      .replace(/\/\/.*$/, '')
      .replaceAll('\u0000\u0000', '://'),
  );
}

/**
 * 抽出根 `<template>` 区域内的「文本节点」字符（按行返回，其余位置为空串）。
 *
 * <p>逐字符扫描：标签内（含带引号的属性值）与 `{{ }}` 插值都跳过，剩下的中文一定是会被
 * 渲染出来的界面文案。这样才认得出 `共 {{ total }} 条`、`已选 {{ n }} 项` 这类中英混排——
 * 纯正则匹配标签边界时，`{{}}` 会把一段文案切成两截，写死的中文反而漏判。
 *
 * <p>区域取「首个 `<template` 行」到「末个 `</template>` 行」，因此 `<script>`/`<style>`/
 * `<docs>` 里的字符串不参与统计；同名单行模板（夹具、压缩过的文件）也能覆盖。
 */
function extractTemplateTextLines(lines: string[]): string[] {
  const out: string[] = lines.map(() => '');
  const open = lines.findIndex((line) => /^[ \t]*<template[\s>]/.test(line));
  if (open < 0) return out;
  let close = -1;
  for (let i = lines.length - 1; i >= open; i--) {
    if ((lines[i] as string).includes('</template>')) {
      close = i;
      break;
    }
  }
  if (close < open) return out;
  let inTag = false;
  let quote = '';
  let inMustache = false;
  for (let li = open; li <= close; li++) {
    const line = lines[li] as string;
    let kept = '';
    for (let ci = 0; ci < line.length; ci++) {
      const ch = line[ci] as string;
      if (inTag) {
        if (quote) {
          if (ch === quote) quote = '';
        } else if (ch === '"' || ch === "'") {
          quote = ch;
        } else if (ch === '>') {
          inTag = false;
        }
        continue;
      }
      if (inMustache) {
        if (ch === '}' && line[ci + 1] === '}') {
          inMustache = false;
          ci++;
        }
        continue;
      }
      if (ch === '<') {
        inTag = true;
      } else if (ch === '{' && line[ci + 1] === '{') {
        inMustache = true;
        ci++;
      } else {
        kept += ch;
      }
    }
    out[li] = kept;
  }
  return out;
}

/** 单文件命中数 */
function countFileHits(source: string): number {
  const cjk = new RegExp(CJK);
  const codeLines = extractCodeLines(source);
  const textLines = extractTemplateTextLines(codeLines);
  let total = 0;
  codeLines.forEach((line, i) => {
    // 开发者面向日志：logger.warn('重置密钥失败: {}', error) 保留中文是规范
    if (!/^\s*(logger|console)\.[a-z]/.test(line)) {
      if (cjk.test(line)) {
        for (const rule of RULES) {
          const hits = line.match(new RegExp(rule.source, 'g'));
          if (hits) total += hits.length;
        }
      }
    }
    // 模板文本节点：一行内写死的中文按 1 处计（同一句被换行拆开也只在有中文的行计数）
    if (cjk.test(textLines[i] as string)) total += 1;
  });
  return total;
}

/** 文件所属 scope：apps/<app> 或顶层两段目录 */
function scopeOf(file: string): string {
  if (file.startsWith('apps/')) return file.split('/')[1] as string;
  return file.split('/').slice(0, 2).join('/');
}

function listVueFiles(root: string): string[] {
  const inScope = (rel: string) => SCAN_PREFIXES.some((p) => rel.startsWith(p));
  let files: string[];
  try {
    files = execFileSync('git', ['ls-files', '*.vue'], {
      cwd: root,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).split('\n');
  } catch {
    // 非 git 环境（自检夹具目录）退回递归遍历
    const acc: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.vue')) acc.push(relative(root, full).replaceAll('\\', '/'));
      }
    };
    walk(root);
    files = acc;
  }
  return files.filter((f) => f && inScope(f));
}

interface Report {
  counts: Record<string, number>;
  files: Map<string, number>;
  scanned: number;
  /** 扫描中出现过的所有 scope（含零命中），用于区分「已清零」与「目录改名」 */
  scopesSeen: Set<string>;
  total: number;
}

/** 扫描 root 下的 .vue，返回按 scope 聚合的命中数 */
function scan(root: string): Report {
  const excluded = new Set(DATA_CATALOG.map((e) => e.file));
  const counts: Record<string, number> = {};
  const files = new Map<string, number>();
  const scopesSeen = new Set<string>();
  let scanned = 0;
  let total = 0;
  for (const rel of listVueFiles(root)) {
    const abs = join(root, rel);
    if (!existsSync(abs)) continue;
    scanned += 1;
    scopesSeen.add(scopeOf(rel));
    if (excluded.has(rel)) continue;
    let source: string;
    try {
      source = readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    const hits = countFileHits(source);
    if (hits === 0) continue;
    files.set(rel, hits);
    const scope = scopeOf(rel);
    counts[scope] = (counts[scope] ?? 0) + hits;
    total += hits;
  }
  return { counts, files, scanned, scopesSeen, total };
}

interface Baseline {
  hint: string;
  budgets: Record<string, number>;
}

function readBaseline(root: string): Baseline {
  const abs = join(root, BASELINE_FILE);
  if (!existsSync(abs)) {
    throw new Error(`缺少预算文件 ${BASELINE_FILE}（先跑 --update-baseline 固化存量）`);
  }
  return JSON.parse(readFileSync(abs, 'utf8')) as Baseline;
}

/** 与预算比对：超支/新 scope 未登记/基线条目失效，三类都算缺陷 */
function compareBudget(
  counts: Record<string, number>,
  budgets: Record<string, number>,
  scopesSeen?: Set<string>,
): string[] {
  const over: string[] = [];
  for (const [scope, count] of Object.entries(counts)) {
    if (!(scope in budgets)) {
      over.push(`${scope}: 新出现的 scope 残留 ${count} 处，未登记预算（跑 --update-baseline 显式认领）`);
      continue;
    }
    const budget = budgets[scope] as number;
    if (count > budget) {
      over.push(`${scope}: 命中 ${count} > 预算 ${budget}（新增 ${count - budget} 处硬编码文案）`);
    }
  }
  for (const [scope, budget] of Object.entries(budgets)) {
    if (scope in counts) continue;
    if (budget === 0) {
      over.push(`${scope}: 预算 0 且已零命中，跑 --update-baseline 删除该条目`);
    } else if (scopesSeen?.has(scope)) {
      over.push(`${scope}: 已清零（原预算 ${budget}），跑 --update-baseline 认领战果`);
    } else {
      over.push(`${scope}: 预算 ${budget} 但整个 scope 已扫不到 .vue —— 目录迁移或改名，基线与真实布局脱节`);
    }
  }
  return over;
}

/** 预算下调方向校验：返回被抬高（新增债务）的 scope，供 --update-baseline 拒绝写入 */
function findRaisedBudgets(counts: Record<string, number>, previous: Record<string, number>): [string, number, number][] {
  const raised: [string, number, number][] = [];
  for (const [scope, count] of Object.entries(counts)) {
    const budget = previous[scope];
    if (budget !== undefined && count > budget) raised.push([scope, budget, count]);
  }
  return raised;
}

function updateBaseline(root: string, allowRaise: boolean): void {
  const { counts, scanned, total } = scan(root);
  if (scanned === 0) {
    console.error('[check:ui-text] 扫描到 0 个 .vue，拒绝写入基线（扫描根失效会让门禁永远"通过"）');
    process.exit(1);
  }
  // 棘轮的牙齿：刷新预算只能下调。否则「先加硬编码、再 --update-baseline 洗白」就能绕过门禁。
  const previous = existsSync(join(root, BASELINE_FILE)) ? readBaseline(root).budgets : {};
  const raised = findRaisedBudgets(counts, previous);
  if (raised.length > 0 && !allowRaise) {
    console.error('[check:ui-text] 拒绝写入：以下 scope 的预算高于当前基线，属新增技术债');
    console.error(raised.map(([scope, from, to]) => `  - ${scope}: ${from} → ${to}`).join('\n'));
    console.error('  正确做法是把新写的文案改成 t() 绑定；确需认领新增债务请先在评审里说明。');
    console.error('  若本次上升是因为门禁判据本身变了（漏判修复等），用 --allow-raise 重建并注明原因。');
    process.exit(1);
  }
  if (raised.length > 0) {
    console.warn(
      `[check:ui-text] --allow-raise：${raised.length} 个 scope 预算上调 ` +
        `(${raised.map(([s, from, to]) => `${s} ${from}→${to}`).join('、')})，请在评审里说明判据变化原因`,
    );
  }
  const payload: Baseline = {
    budgets: Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1])),
    hint: '界面硬编码中文预算：由 `node ./bash/check-hardcoded-text.mts --update-baseline` 生成，只允许下调',
  };
  writeFileSync(join(root, BASELINE_FILE), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  const before = Object.values(previous).reduce((a, b) => a + b, 0);
  console.log(
    `[check:ui-text] 已写入预算：合计 ${total} 处（原 ${before}）/ ${Object.keys(counts).length} 个 scope ` +
      `→ ${BASELINE_FILE}（后续只减不增）`,
  );
}

function printTop(root: string, limit: number): void {
  const { counts, files, total, scanned } = scan(root);
  console.log(`[check:ui-text] 扫描 ${scanned} 个 .vue，命中 ${total} 处 / ${files.size} 个文件`);
  for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(5)}  ${k}`);
  }
  console.log('--- Top 文件 ---');
  for (const [f, n] of [...files.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)) {
    console.log(`  ${String(n).padStart(4)}  ${f}`);
  }
}

function checkAll(root: string): void {
  const { counts, files, scanned, scopesSeen, total } = scan(root);
  // 反向断言：扫描根一旦失效（目录改名/ls-files 空返回），门禁会永远报"通过"
  if (scanned === 0) {
    console.error('[check:ui-text] 扫描到 0 个 .vue —— 扫描根失效，判定为门禁自身故障');
    process.exit(1);
  }
  for (const entry of DATA_CATALOG) {
    if (!existsSync(join(root, entry.file))) {
      console.error(`[check:ui-text] 豁免清单里的文件已不存在：${entry.file}（请同步清理 DATA_CATALOG）`);
      process.exit(1);
    }
  }
  const baseline = readBaseline(root);
  const over = compareBudget(counts, baseline.budgets, scopesSeen);
  if (over.length > 0) {
    console.error('[check:ui-text] 硬编码文案预算被突破：');
    console.error(over.map((item) => `  - ${item}`).join('\n'));
    process.exit(1);
  }
  const baselineTotal = Object.values(baseline.budgets).reduce((a, b) => a + b, 0);
  const verb = total < baselineTotal ? '已下调' : '持平';
  console.log(
    `[check:ui-text] 预算内 ✓ — 界面硬编码中文存量 ${total} 处 / ${files.size} 个文件（预算 ${baselineTotal}，${verb}）：` +
      `${Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([s, n]) => `${s} ${n}`).join('、')}`,
  );
}

// =====================================================================/
// 门禁自检：反例夹具逐项命中 + 正例夹具零命中 + 棘轮/腐化分支各自报错
// =====================================================================/

/** 反例清单：[文件名, 内容, 该文件必须命中的最少处数] */
const NEGATIVES: [string, string, number][] = [
  ['vxe-title.vue', '<script setup>const gridOptions = { columns: [{ type: \'seq\', title: \'序号\' }] };</script>\n<template><Page /></template>', 1],
  ['schema-label.vue', '<script setup>const s = [{ componentProps: { placeholder: \'应用名称\' }, label: \'关键词\' }];</script>\n<template><Page /></template>', 2],
  ['attr-text.vue', '<template><YdButton placeholder="请输入名称" table-title="应用管理">创建应用</YdButton></template>', 3],
  ['toast.vue', '<script setup>showToast.success(\'创建成功\');YdConfirm(\'确认删除？\');</script>\n<template><Page /></template>', 2],
  ['uikit-label.vue', '<script setup>const opts = [{ label: "已启用" }];</script>\n<template><Page /></template>', 1],
  ['url-line.vue', '<script setup>const cfg = { url: \'https://x.test/y\', title: \'面板标题\' };</script>\n<template><Page /></template>', 1],
  ['tpl-literal.vue', '<script setup>const opts = [{ label: `${n} 条/页` }];</script>\n<template><Page /></template>', 1],
  ['mixed-text.vue', '<script setup>const n = 3</script>\n<template>\n  <div>\n    共 {{ n }} 条\n  </div>\n</template>', 1],
  ['toast-literal.vue', '<script setup>showToast.warning(`超过 ${max} 字`);</script>\n<template><Page /></template>', 1],
];

/** 正例清单：合法写法，必须零命中，否则门禁会被当成噪声关掉 */
const POSITIVES: [string, string][] = [
  ['bound.vue', '<script setup>const { t } = useI18n();const gridOptions = { columns: [{ title: t(\'seq\') }] };</script>\n<template><YdButton :placeholder="t(\'a\')">{{ t(\'b\') }}</YdButton></template>'],
  ['comments.vue', '<!-- 说明：本页面用于管理 OAuth2 应用 -->\n<script setup>\n/** 校验规则 */\n// 用户主动取消\nconst gridOptions = { columns: [] };\nlogger.warn(\'重置密钥失败: {}\', error);\nconsole.log(\'调试输出\');\n</script>\n<template><Page /></template>'],
  ['lazy.vue', '<template><img loading="lazy" alt="photo" /><div class="text-xs">v-text</div></template>'],
  ['compare.vue', '<script setup>if (row.status === \'SUCCESS\') { ok = true }</script>\n<template><Page /></template>'],
  ['doc-block.vue', '<template>\n  <!--\n    用法示例：\n    <YdDropdown label="操作" :options="[{ label: \'编辑\' }]" />\n    <YdDropdownMenuItem>删除</YdDropdownMenuItem>\n  -->\n  <YdButton :placeholder="t(\'ok\')">{{ t(\'ok\') }}</YdButton>\n</template>'],
  ['pure-interp.vue', '<script setup>const n = 3</script>\n<template>\n  <div class="text-sm">\n    {{ t(\'total\', { n }) }}\n  </div>\n</template>'],
  ['multiline-attr.vue', '<template>\n  <YdButton\n    :class="\n      cn(\'a\', \'b\')\n    "\n    @click="go"\n  >\n    {{ t(\'ok\') }}\n  </YdButton>\n</template>'],
];

/** 夹具放在真实仓库同构的 scope 路径下，才能同时验证 scopeOf 与 SCAN_PREFIXES 过滤 */
const FIXTURE_DIR = 'apps/demo-web/src/views';

function fixtureFiles(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const [name, content] of [...NEGATIVES.map(([n, c]) => [n, c] as [string, string]), ...POSITIVES]) {
    files[`${FIXTURE_DIR}/${name}`] = content;
  }
  return files;
}

const DEMO_SEEN = new Set(['demo-web']);

/** [用例, 实际命中, 预算, 是否应报错] */
const RATCHET_CASES: [string, Record<string, number>, Record<string, number>, boolean][] = [
  ['超预算', { 'demo-web': 1 }, { 'demo-web': 0 }, true],
  ['预算 0 但基线未删', {}, { 'demo-web': 0 }, true],
  ['已清零未认领战果', {}, { 'demo-web': 5 }, true],
  ['新 scope 未认领', { 'demo-web': 3, 'other-web': 1 }, { 'demo-web': 3 }, true],
  ['预算指向已消失目录', { 'demo-web': 3 }, { 'demo-web': 3, 'ghost-web': 9 }, true],
  ['预算内持平', { 'demo-web': 3 }, { 'demo-web': 3 }, false],
  ['预算内下调', { 'demo-web': 2 }, { 'demo-web': 3 }, false],
  ['清零且基线已删', {}, {}, false],
];

/** [用例, 当前命中, 旧预算, 应拒写的 scope 数] */
const RAISE_CASES: [string, Record<string, number>, Record<string, number>, number][] = [
  ['抬高已有 scope', { 'demo-web': 4 }, { 'demo-web': 3 }, 1],
  ['持平', { 'demo-web': 3 }, { 'demo-web': 3 }, 0],
  ['下调', { 'demo-web': 2 }, { 'demo-web': 3 }, 0],
  ['全新 scope 可认领', { 'new-web': 7 }, { 'demo-web': 3 }, 0],
  ['基线为空时全量写入', { 'demo-web': 9 }, {}, 0],
];

function selfTestFn(): void {
  const dir = mkdtempSync(join(tmpdir(), 'ui-text-self-test-'));
  const problems: string[] = [];
  try {
    const files = fixtureFiles();
    for (const [rel, content] of Object.entries(files)) {
      const abs = join(dir, rel);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, content, 'utf8');
    }
    const { counts, scanned, total } = scan(dir);
    if (scanned !== Object.keys(files).length) {
      problems.push(`夹具应有 ${Object.keys(files).length} 个 .vue 被遍历，实际 ${scanned}`);
    }
    for (const [name, , want] of NEGATIVES) {
      const got = countFileHits(readFileSync(join(dir, `${FIXTURE_DIR}/${name}`), 'utf8'));
      if (got < want) problems.push(`${name} 命中 ${got}，期望 ≥${want}`);
    }
    for (const [name] of POSITIVES) {
      const got = countFileHits(readFileSync(join(dir, `${FIXTURE_DIR}/${name}`), 'utf8'));
      if (got !== 0) problems.push(`${name} 意外命中 ${got}（判据冤枉了合法写法）`);
    }
    // scope 聚合必须与总数守恒，且 apps/<app> 归并为单个 <app> scope
    const scopeSum = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0 || scopeSum !== total) {
      problems.push(`scope 聚合与总数不守恒：${JSON.stringify(counts)} vs 总数 ${total}`);
    }
    if (Object.keys(counts).length !== 1 || counts['demo-web'] === undefined) {
      problems.push(`apps/demo-web 应归并为 scope "demo-web"，实际 ${JSON.stringify(counts)}`);
    }
    if (countFileHits(readFileSync(join(dir, `${FIXTURE_DIR}/attr-text.vue`), 'utf8')) === 0) {
      problems.push('夹具未被计入，扫描范围过滤可能失效');
    }
    // 棘轮：超预算/未认领/基线失效各自报错，下降与持平放行
    for (const [label, countsCase, budgets, wantFail] of RATCHET_CASES) {
      const failed = compareBudget(countsCase, budgets, DEMO_SEEN).length > 0;
      if (failed !== wantFail) {
        problems.push(`棘轮用例「${label}」期望 ${wantFail ? '报错' : '通过'}，实际 ${failed ? '报错' : '通过'}`);
      }
    }
    // --update-baseline 只能下调：抬高已有 scope 预算必须被拒（否则先写硬编码再刷基线即可绕过门禁）
    for (const [label, countsCase, previous, wantRaised] of RAISE_CASES) {
      const got = findRaisedBudgets(countsCase, previous).length;
      if (got !== wantRaised) problems.push(`下调校验用例「${label}」期望拒写 ${wantRaised} 项，实际 ${got}`);
    }
    // 缺基线文件必须报错（而不是静默放行）
    let missingBaselineFailed = false;
    try {
      readBaseline(join(dir, 'nope'));
    } catch {
      missingBaselineFailed = true;
    }
    if (!missingBaselineFailed) problems.push('缺少预算文件时必须报错');
    // 真实仓库的豁免清单不得腐化
    const real = scan(MICRO_ROOT);
    for (const entry of DATA_CATALOG) {
      const hits = countFileHits(readFileSync(join(MICRO_ROOT, entry.file), 'utf8'));
      if (hits === 0) problems.push(`豁免 ${entry.file} 已零命中，应从 DATA_CATALOG 移除`);
    }
    if (real.scanned < 500) problems.push(`真实仓库扫描仅 ${real.scanned} 个 .vue，疑似扫描根失效`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  if (problems.length > 0) {
    console.error('[check:ui-text] 门禁自检失败：');
    console.error(problems.map((p) => `  - ${p}`).join('\n'));
    process.exit(1);
  }
  console.log(
    `[check:ui-text] 门禁自检通过 ✓ — 反例命中 ${NEGATIVES.length}/${NEGATIVES.length} 类、` +
      `正例零命中 ${POSITIVES.length}/${POSITIVES.length} 类，棘轮用例 ${RATCHET_CASES.length} 项、` +
      `下调校验 ${RAISE_CASES.length} 项，豁免清单未腐化`,
  );
}

/** 解析 argv：`--root/--top` 各带一个值，其余为开关；未识别的输入直接拒绝（拼错的 flag 静默生效比报错危险） */
function parseArgs(argv: string[]): {
  allowRaise: boolean;
  root: string;
  selfTest: boolean;
  top: number | undefined;
  update: boolean;
} {
  let root = MICRO_ROOT;
  let top: number | undefined;
  let selfTest = false;
  let update = false;
  let allowRaise = false;
  const unknown: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] as string;
    if (arg === '--root') {
      const next = argv[++i];
      if (!next) unknown.push('--root 缺少值');
      else root = resolve(next);
    } else if (arg === '--top') {
      const parsed = Number(argv[++i]);
      if (!Number.isInteger(parsed) || parsed <= 0) unknown.push(`--top 需要一个正整数，收到 "${argv[i] ?? ''}"`);
      else top = parsed;
    } else if (arg === '--self-test') {
      selfTest = true;
    } else if (arg === '--update-baseline') {
      update = true;
    } else if (arg === '--allow-raise') {
      allowRaise = true;
    } else {
      unknown.push(arg);
    }
  }
  if (unknown.length > 0) {
    console.error(`[check:ui-text] 无法识别的参数：${unknown.join(' ')}`);
    console.error(
      '  用法：node ./bash/check-hardcoded-text.mts [--root DIR] [--top N]'
      + ' [--self-test | --update-baseline [--allow-raise]]',
    );
    process.exit(1);
  }
  return { allowRaise, root, selfTest, top, update };
}

function main(): void {
  const { allowRaise, root, selfTest, top, update } = parseArgs(process.argv.slice(2));
  if (selfTest) {
    selfTestFn();
    return;
  }
  if (update) {
    updateBaseline(root, allowRaise);
    return;
  }
  if (top !== undefined) {
    printTop(root, top);
    return;
  }
  checkAll(root);
}

main();
