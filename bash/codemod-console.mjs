/**
 * codemod-console.mjs — 将生产代码中的 console.* 收敛到统一 logger（云顶规范 §14.5）
 *
 * @path bash\codemod-console.mjs
 * @author ydsz-team
 * @since 1.0.0
 *
 * 策略（安全优先，避免引入导入环 / 未用变量）：
 * 1. 仅改写「真实代码行」中的 `console.<method>(` 前缀为 `logger.<method>(`；
 *    跳过注释行（行注释 / JSDoc ` *` / 块注释）、字符串字面量内的文本。
 * 2. 仅当文件存在真实 console 调用时才注入 logger：
 *    - 若已存在 `createLogger` 导入与 `logger` 实例，直接复用（不重复注入）；
 *    - 否则注入 `import { createLogger } from '@YDSZ-core/shared/utils';`
 *      与 `const logger = createLogger('<Module>');`
 *      （.ts 置于最后一个顶层 import 之后；.vue 置于 <script> 开标签之后）。
 * 3. 豁免文件：logger.ts 实现层、shadcn-ui 生成件、Node 工具（bash/conf）、
 *    standalone/mock、测试、chrome 扩展、service-worker。
 *
 * 运行：node bash/codemod-console.mjs [rootDir]
 * 幂等：重复运行不会产生重复导入 / 重复 logger。
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = process.argv[2] ?? process.cwd();
const METHODS = ['log', 'info', 'warn', 'error', 'debug', 'trace'];

const EXEMPT = [
  /utils\/logger\.ts$/,
  /@core\/ui-kit\/shadcn-ui\//,
  /\/__tests__\//,
  /\.spec\.ts$/,
  /\.test\.ts$/,
  /\/tests\//,
  /\/mock\//,
  /standalone-main\.ts$/,
  /^bash[\\/]/,
  /^conf[\\/]/,
  /vite-plugin-manifest\.ts$/,
  /chrome[\\/]/,
  /service-worker\.ts$/,
  /\.d\.ts$/,
];

const isExempt = (p) => EXEMPT.some((re) => re.test(p.split('\\').join('/')));
const SKIP = new Set(['node_modules', 'dist', 'build', '.git', 'coverage', '.turbo']);

const changed = [];

function walk(dir, depth) {
  if (depth > 10) return;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const e of entries) {
    if (SKIP.has(e)) continue;
    const full = join(dir, e);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, depth + 1);
    else if (/\.(ts|mts|cts|vue)$/.test(e) && !/\.d\.ts$/.test(e)) processFile(full);
  }
}

function moduleName(file) {
  const base = basename(file).replace(/\.(ts|mts|cts|vue)$/, '');
  return base
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function replaceConsole(line) {
  // 行内注释之后的 console 跳过
  const cIdx = line.indexOf('//');
  const probe = cIdx >= 0 ? line.slice(0, cIdx) : line;
  let mutated = line;
  for (const m of METHODS) {
    const needle = `console.${m}(`;
    let from = 0;
    let found;
    while ((found = probe.indexOf(needle, from)) >= 0) {
      const realIdx = cIdx >= 0 ? mutated.lastIndexOf(needle, cIdx) : mutated.indexOf(needle, from);
      if (realIdx >= 0 && mutated.slice(0, realIdx).indexOf('//') < 0) {
        mutated = mutated.slice(0, realIdx) + `logger.${m}(` + mutated.slice(realIdx + needle.length);
        return { line: mutated, hit: true };
      }
      from = found + 1;
    }
  }
  return { line: mutated, hit: false };
}

function processFile(file) {
  if (isExempt(file)) return;
  let text;
  try {
    text = readFileSync(file, 'utf-8');
  } catch {
    return;
  }
  const isVue = /\.vue$/.test(file);

  const hasCreateLoggerImport =
    /createLogger\s+from\s+['"]@YDSZ-core\/shared\/utils['"]/.test(text) ||
    (/from\s+['"]@YDSZ-core\/shared\/utils['"]/.test(text) && /createLogger/.test(text));
  const hasLoggerConst = /(const|let|var)\s+logger\s*=/.test(text);

  const lines = text.split('\n');
  let inBlock = false;
  let inScript = !isVue; // .ts 默认在脚本上下文；.vue 需等待 <script> 开标签
  let needLogger = false;
  const out = [];
  let scriptOpenIdx = -1;

  for (let raw of lines) {
    let line = raw;

    if (isVue) {
      if (/<script\b[^>]*>/.test(line)) {
        inScript = true;
        scriptOpenIdx = out.length; // 开标签将被推入此索引，注入点位于其后
      }
      if (/<\/script>/.test(line)) inScript = false;
    }

    // 块注释起止
    if (/\/\*/.test(line) && !/\*\//.test(line)) inBlock = true;
    const endsBlock = /\*\//.test(line);
    const lineIsComment =
      inBlock ||
      /^\s*\*/.test(line) || // JSDoc / 续行注释
      /^\s*\/\//.test(line); // 整行行注释

    if (!lineIsComment && inScript) {
      const r = replaceConsole(line);
      if (r.hit) {
        line = r.line;
        needLogger = true;
      }
    }

    if (endsBlock) inBlock = false;
    out.push(line);
  }

  if (!needLogger) return; // 无真实替换 → 不注入，避免未用变量

  let result = out.join('\n');
  if (!hasLoggerConst) {
    const mod = moduleName(file);
    const loggerDecl = `const logger = createLogger('${mod}');`;
    const importLine = `import { createLogger } from '@YDSZ-core/shared/utils';`;

    if (isVue) {
      // 注入到 <script> 开标签之后
      const arr = result.split('\n');
      if (scriptOpenIdx >= 0) {
        const items = hasCreateLoggerImport ? [loggerDecl] : [importLine, loggerDecl];
        arr.splice(scriptOpenIdx + 1, 0, ...items);
        result = arr.join('\n');
      }
    } else {
      // 置于最后一个顶层 import 之后
      const importRegex = /^\s*import\s.+?from\s+['"][^'"]+['"];?\s*$/gm;
      let lastImport = -1;
      let mm;
      while ((mm = importRegex.exec(result)) !== null) lastImport = mm.index + mm[0].length;
      if (lastImport >= 0) {
        const upto = result.slice(0, lastImport).split('\n').length - 1;
        const arr = result.split('\n');
        arr.splice(upto + 1, 0, ...(hasCreateLoggerImport ? [loggerDecl] : [importLine, loggerDecl]));
        result = arr.join('\n');
      } else {
        result = `${hasCreateLoggerImport ? '' : importLine + '\n'}${loggerDecl}\n${result}`;
      }
    }
  }

  if (result !== text) {
    writeFileSync(file, result, 'utf-8');
    changed.push(file);
  }
}

walk(ROOT, 0);
console.log(`codemod-console: 改写 ${changed.length} 个文件`);
for (const f of changed) console.log(`  ${f.split('\\').join('/')}`);
