#!/usr/bin/env node
/**
 * index.html 头部门禁 — 防止 B0-8 两类缺陷再次发生。
 *
 * 背景（改前真实状态）：
 *   1. 主应用与 8 个子应用的 viewport 都写了 `maximum-scale=1.0,user-scalable=0`。
 *      低视力用户因此无法双指放大页面，违反 WCAG 2.1 AA 1.4.4（Resize Text）；
 *      管理台里"字号调小就看不清"的表格外层还有 zoom 依赖，禁缩放等于把内容
 *      钉死在不可读尺寸。
 *   2. head 里同时存在三段"永远不会生效"的第三方引用：
 *      · 内联 `<script>` 注入 hm.baidu.com —— CSP 的 `script-src 'self' 'strict-dynamic'`
 *        直接拦截内联脚本，这段在生产上一直是死的，只在 dev（无 CSP）里跑，
 *        于是"看起来有统计"的错觉长期存在；
 *      · `<link rel=stylesheet href=https://fonts.googleapis.com/...>` —— `style-src
 *        'self' 'unsafe-inline'` 不放行跨域样式表，同样静默失败；
 *      · `rel=preconnect` / `rel=dns-prefetch` —— 这两类**不受 CSP 约束**，浏览器照旧
 *        向第三方域发起 DNS+TCP+TLS 探测，即"功能没生效、开销与隐私暴露全在"。
 *      保留第 3 类而删掉前 2 类是最坏组合，所以三段一起移除，并把恢复方式写进注释。
 *   3. `bash/gen-app.mts` 的新应用脚手架模板是同一个缺陷的放大器：模板一旦带这类
 *      写法，之后每个新建子应用都会天然复现，而人工 review 只看业务代码。
 *
 * 检查项（行内注释一律先剔除再判定：注释文本不参与渲染，不应触发规则）：
 *   H1 viewport：必须存在且含 width=device-width；禁止 user-scalable=no/0、
 *      任何 maximum-scale、minimum-scale>=1（三者都能禁掉缩放）
 *   H2 必须声明字符集（CJK 页面缺 charset 是乱码级缺陷）
 *   H3 <title> 必须非空
 *   H4 禁止无 src 的内联 <script>（CSP script-src 拦截 → 静默失效的死代码）
 *   H5 禁止跨域绝对 URL 的 script src / stylesheet / preconnect / dns-prefetch /
 *      prefetch / preload(as=font|script|style)
 *   H6 门禁前提校验：security-headers.conf 必须真的下发 CSP，且 script-src 不含
 *      unsafe-inline、style-src/font-src 不放行 https:。前提被放宽本身就是缺陷
 *      （放宽 CSP 来"救活"内联脚本，正是本门禁要拦的路径）
 *   H7 bash/gen-app.mts 模板同样受 H1–H5 约束（提取失败即报错，不允许静默跳过）
 *
 * 用法：
 *   node ./bash/check-html-head.mts                # 校验真实仓库
 *   node ./bash/check-html-head.mts --self-test     # 用反例夹具证明门禁不是空转
 *   node ./bash/check-html-head.mts --root <dir>    # 校验指定目录树：把 git show HEAD 的
 *                                                  # index.html 还原到临时目录即可复核"改前必红"
 *
 * @path bash/check-html-head.mts
 * @author ydsz-team
 * @since 4.5.0
 */

import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HEADERS_FILE_REL = 'bash/deploy/security-headers.conf';
const GEN_APP_FILE_REL = 'bash/gen-app.mts';

/** 协议相对或绝对 http(s) 的 URL —— 即"跨域第三方引用"的判据 */
const ABSOLUTE_URL = /^(?:https?:)?\/\//i;

/** 不受 CSP 约束、但会向第三方域发起连接的 rel 值 */
const PROBE_RELS = new Set(['preconnect', 'dns-prefetch', 'prefetch']);

/** 注释不参与渲染：剔除后再判定，避免"防回归说明里写 maximum-scale=1"被自己拦下 */
function stripHtmlComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * 提取指定标签的开始标签属性。
 *
 * @param {string} text 已去注释的 HTML
 * @param {string} tag 标签名（小写）
 * @returns {{raw: string, attrs: Record<string, string>}[]}
 */
function startTags(text, tag) {
  const out = [];
  const re = new RegExp(`<${tag}\\b([^>]*)>`, 'gi');
  let m;
  while ((m = re.exec(text)) !== null) out.push({ raw: m[0], attrs: parseAttrs(m[1]) });
  return out;
}

/** 属性串 → 键值表；值统一小写化由调用方按需处理，布尔属性值为空串 */
function parseAttrs(raw) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const value = m[2] ?? m[3] ?? m[4] ?? '';
    attrs[m[1].toLowerCase()] = value;
  }
  return attrs;
}

/** 按 name=viewport 取到 viewport meta 的 content（取不到返回空串） */
function viewportContent(text) {
  const meta = startTags(text, 'meta').find((t) => (t.attrs.name ?? '').toLowerCase() === 'viewport');
  return meta ? meta.attrs.content ?? '' : '';
}

/**
 * 对一份 index.html 文本执行 H1–H5。
 *
 * @param {string} label 文件标识（用于报告定位）
 * @param {string} html 原文
 * @param {string[]} sink 失败项收集
 */
function checkHtml(label, html, sink) {
  const text = stripHtmlComments(html);
  if (!/<head\b/i.test(text) || !/<body\b/i.test(text)) {
    sink.push(`${label} 缺少 <head> 或 <body>，无法按 index.html 结构判定（解析前提失效）`);
    return;
  }

  // ---------- H1 viewport ----------
  const vw = viewportContent(text);
  if (!vw) {
    sink.push(`${label} 缺少 <meta name="viewport">：移动端会按 980px 虚拟宽度渲染，管理台表格整体缩成不可读`);
  } else {
    if (!/width\s*=\s*device-width/i.test(vw)) {
      sink.push(`${label} viewport 未声明 width=device-width（当前 content="${vw}"）`);
    }
    if (/user-scalable\s*=\s*(?:no|0)/i.test(vw)) {
      sink.push(`${label} viewport 用 user-scalable 禁用了缩放：违反 WCAG 2.1 AA 1.4.4（Resize Text），content="${vw}"`);
    }
    if (/maximum-scale\s*=/i.test(vw)) {
      sink.push(`${label} viewport 用 maximum-scale 封死了放大上限：违反 WCAG 2.1 AA 1.4.4，content="${vw}"`);
    }
    const minScale = vw.match(/minimum-scale\s*=\s*([\d.]+)/i);
    if (minScale && Number(minScale[1]) >= 1) {
      sink.push(`${label} viewport 的 minimum-scale=${minScale[1]}（>=1 等于禁止缩小/放大），content="${vw}"`);
    }
  }

  // ---------- H2 字符集 ----------
  const hasCharset =
    startTags(text, 'meta').some((t) => Object.hasOwn(t.attrs, 'charset')) ||
    startTags(text, 'meta').some(
      (t) => /^content-type$/i.test(t.attrs['http-equiv'] ?? '') && /charset=/i.test(t.attrs.content ?? ''),
    );
  if (!hasCharset) sink.push(`${label} 未声明字符集：CJK 页面会被按本地编码猜测解析成乱码`);

  // ---------- H3 标题 ----------
  const title = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(text);
  if (!title || !title[1].trim()) {
    sink.push(`${label} <title> 为空：浏览器标签页/历史记录无法区分主应用与子应用`);
  }

  // ---------- H4 内联脚本 ----------
  for (const tag of startTags(text, 'script')) {
    if (Object.hasOwn(tag.attrs, 'src')) continue;
    sink.push(
      `${label} 存在内联 <script>（${tag.raw}）：CSP script-src 为 'self' 'strict-dynamic'，内联脚本在生产一律被拦截，` +
        '即这段代码只在 dev 生效、上线静默失效。改为第一方外链模块文件。',
    );
  }

  // ---------- H5 跨域引用 ----------
  for (const tag of startTags(text, 'script')) {
    const src = tag.attrs.src ?? '';
    if (ABSOLUTE_URL.test(src)) {
      sink.push(`${label} <script src> 指向跨域 ${src}：CSP script-src 仅 'self'，该脚本不会加载（且引入第三方 JS 等于交出 DOM）`);
    }
  }
  for (const tag of startTags(text, 'link')) {
    const href = tag.attrs.href ?? '';
    if (!ABSOLUTE_URL.test(href)) continue;
    const rel = (tag.attrs.rel ?? '').toLowerCase();
    const as = (tag.attrs.as ?? '').toLowerCase();
    if (rel === 'stylesheet') {
      sink.push(`${label} <link rel=stylesheet> 跨域 ${href}：CSP style-src 不放行跨域样式表，字体/样式静默丢失。改自托管 woff2 + 本地 @font-face。`);
    } else if (PROBE_RELS.has(rel)) {
      sink.push(`${label} <link rel=${rel}> 指向第三方 ${href}：preconnect/dns-prefetch 不受 CSP 约束，仍会发起 DNS+TCP+TLS 探测（首屏额外延迟与隐私暴露）`);
    } else if (rel === 'preload' && ['font', 'script', 'style'].includes(as)) {
      sink.push(`${label} <link rel=preload as=${as}> 跨域 ${href}：CSP ${as === 'script' ? 'script' : as === 'font' ? 'font' : 'style'}-src 不放行该域，预加载只会产生失败的探测请求`);
    } else {
      sink.push(`${label} <link rel=${rel || '(缺 rel)'}> 跨域 ${href}：需确认对应 CSP 指令已显式放行，否则等价于无效引用`);
    }
  }
}

/**
 * H6：校验门禁自身依赖的 CSP 前提。
 *
 * @param {string} headersSrc security-headers.conf 文本
 * @param {string[]} sink 失败项收集
 */
function checkCspPremises(headersSrc, sink) {
  if (!/add_header\s+Content-Security-Policy\s/i.test(headersSrc)) {
    sink.push('security-headers.conf 未下发 Content-Security-Policy：本门禁判定内联/跨域引用"会被拦截"的前提不成立');
    return;
  }
  const csp = /add_header\s+Content-Security-Policy\s+"([^"]*)"/i.exec(headersSrc)?.[1] ?? '';
  const directive = (name) => {
    const m = new RegExp(`(?:^|;\\s*)${name}\\s+([^;]*)`).exec(csp);
    return m ? m[1].trim() : '';
  };
  const scriptSrc = directive('script-src');
  const styleSrc = directive('style-src');
  const fontSrc = directive('font-src');

  if (!/'self'/.test(scriptSrc)) sink.push(`CSP script-src 未包含 'self'（当前：${scriptSrc || '缺失'}）`);
  if (/'unsafe-inline'/.test(scriptSrc)) {
    sink.push(
      "CSP script-src 含 'unsafe-inline'：为放行内联脚本而放弃 XSS 兜底，属于本门禁要拦的回归路径；" +
        'inline 脚本应改为第一方外链模块',
    );
  }
  if (/'unsafe-eval'/.test(scriptSrc)) sink.push("CSP script-src 含 'unsafe-eval'：生产 ESM 构建不需要 eval");
  if (/https?:/.test(styleSrc)) {
    sink.push('CSP style-src 放行了跨域（含 https: 或具体域）：跨域样式表的前提被放宽');
  }
  if (/https?:/.test(fontSrc)) {
    sink.push('CSP font-src 放行了跨域：第三方字体引用不再被拦截，等于绕开 H5 的字体规则');
  }
}

/**
 * H7：从脚手架生成器里取出 index.html 模板。
 *
 * 提取不到必须报错——"新应用模板"正是缺陷的批量入口，静默跳过等于给未来开门。
 *
 * @param {string} genSrc bash/gen-app.mts 文本
 * @param {string[]} sink 失败项收集
 */
function checkScaffoldTemplate(genSrc, sink) {
  const m = /const\s+indexHtml\s*=\s*`([\s\S]*?)`;/.exec(genSrc);
  if (!m) {
    sink.push('无法从 bash/gen-app.mts 提取 indexHtml 模板：生成器写法已变，H1–H5 对新建子应用不再受保护');
    return;
  }
  // 模板里的 ${title} 等插值不影响规则判定，仅替换成占位文本避免误判空 title
  checkHtml('bash/gen-app.mts 模板', m[1].replace(/\$\{[^}]*\}/g, 'placeholder'), sink);
}

/**
 * 扫描真实仓库需要检查的 index.html 清单。
 *
 * 目录即来源：apps/ 下每个含 index.html 的应用都会被自动纳入，不维护硬编码列表
 * （硬编码列表会在新增子应用时静默漏检）。
 *
 * @param {string} root 仓库根
 * @returns {{label: string, file: string}[]}
 */
function discoverHtmlFiles(root) {
  const files = [];
  const mainIndex = join(root, 'main/index.html');
  if (existsSync(mainIndex)) files.push({ label: 'main/index.html', file: mainIndex });
  const appsDir = join(root, 'apps');
  if (existsSync(appsDir)) {
    for (const entry of readdirSync(appsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const candidate = join(appsDir, entry.name, 'index.html');
      if (existsSync(candidate)) files.push({ label: `apps/${entry.name}/index.html`, file: candidate });
    }
  }
  return files;
}

/**
 * 全部检查的入口。
 *
 * @param {{htmlFiles: {label: string, file: string}[], headersFile: string, genAppFile: string}} targets
 * @param {string[]} sink 失败项收集
 */
function collectFailures(targets, sink) {
  if (targets.htmlFiles.length === 0) {
    sink.push('未扫描到任何 index.html（扫描前提失效，门禁会永远绿灯）');
  }
  for (const { label, file } of targets.htmlFiles) {
    if (!existsSync(file)) {
      sink.push(`${label} 不存在：${file}`);
      continue;
    }
    checkHtml(label, readFileSync(file, 'utf8'), sink);
  }

  if (!existsSync(targets.headersFile)) {
    sink.push(`security-headers.conf 缺失：${targets.headersFile}（无法确认门禁前提）`);
  } else {
    checkCspPremises(readFileSync(targets.headersFile, 'utf8'), sink);
  }

  if (!existsSync(targets.genAppFile)) {
    sink.push(`bash/gen-app.mts 缺失：${targets.genAppFile}（新应用模板脱离门禁）`);
  } else {
    checkScaffoldTemplate(readFileSync(targets.genAppFile, 'utf8'), sink);
  }
}

// ---------- 反例夹具 ----------

/** 修复前的真实写法（main/index.html 的 HEAD 版本）+ 人为补充的缺失项 */
const FIXTURE_HTML = `<!doctype html>
<html lang="zh">
  <head>
    <!-- 说明文字里出现 maximum-scale=1 也不应触发规则：注释不参与渲染 -->
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
    <meta
      name="viewport"
      content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=0"
    />
    <title><%= VITE_APP_TITLE %></title>
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
    <link rel="dns-prefetch" href="https://hm.baidu.com" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..900&display=swap" />
    <link rel="preload" as="font" href="https://fonts.gstatic.com/x.woff2" crossorigin />
    <script>
      var _hmt = _hmt || [];
    </script>
    <script src="https://hm.baidu.com/hm.js?b38e"></script>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;

/** 缺 viewport、缺 charset、空 title 的另一类反例 */
const FIXTURE_HTML_NO_VIEWPORT = `<!doctype html>
<html lang="zh">
  <head>
    <title></title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
`;

/** 放宽 CSP 来"救活"内联脚本的反例（门禁前提被拆掉的情形） */
const FIXTURE_HEADERS_WEAK = `add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' https:; font-src 'self' https:; object-src 'none';" always;
`;

/** 生成器模板带内联脚本的反例（新建应用批量复现缺陷） */
const FIXTURE_GEN_APP = `const indexHtml = \`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>\${title}</title>
  <script>console.log('inline')</script>
</head>
<body>
  <div id="app"></div>
</body>
</html>
\`;
`;

/** 夹具必须命中的检查项（缺任意一条说明门禁已空转） */
const REQUIRED_DETECTIONS = [
  ['H1 禁缩放（user-scalable）', 'user-scalable 禁用了缩放'],
  ['H1 禁缩放（maximum-scale）', 'maximum-scale 封死了放大上限'],
  ['H1 禁缩放（minimum-scale>=1）', 'minimum-scale=1.0'],
  ['H1 缺 viewport', '缺少 <meta name="viewport">'],
  ['H2 缺字符集', '未声明字符集'],
  ['H3 空标题', '<title> 为空'],
  ['H4 内联脚本', '存在内联 <script>'],
  ['H5 跨域样式表', '<link rel=stylesheet> 跨域'],
  ['H5 第三方探测', '不受 CSP 约束'],
  ['H5 跨域字体预加载', '<link rel=preload as=font>'],
  ['H5 跨域脚本', '<script src> 指向跨域'],
  ['H6 CSP 前提被放宽', "script-src 含 'unsafe-inline'"],
  ['H7 生成器模板内联脚本', 'bash/gen-app.mts 模板 存在内联 <script>'],
  ['H7 生成器模板禁缩放', 'bash/gen-app.mts 模板 viewport'],
];

function selfTest() {
  const dir = mkdtempSync(join(tmpdir(), 'ydsz-html-head-selftest-'));
  try {
    writeFileSync(join(dir, 'index.html'), FIXTURE_HTML, 'utf8');
    writeFileSync(join(dir, 'no-viewport.html'), FIXTURE_HTML_NO_VIEWPORT, 'utf8');
    writeFileSync(join(dir, 'security-headers.conf'), FIXTURE_HEADERS_WEAK, 'utf8');
    writeFileSync(join(dir, 'gen-app.mts'), FIXTURE_GEN_APP, 'utf8');

    const sink = [];
    collectFailures(
      {
        htmlFiles: [
          { label: 'apps/demo-web/index.html', file: join(dir, 'index.html') },
          { label: 'apps/empty-web/index.html', file: join(dir, 'no-viewport.html') },
        ],
        headersFile: join(dir, 'security-headers.conf'),
        genAppFile: join(dir, 'gen-app.mts'),
      },
      sink,
    );

    const missed = REQUIRED_DETECTIONS.filter(([, needle]) => !sink.some((f) => f.includes(needle)));
    if (missed.length > 0) {
      console.error('❌ 门禁自检失败：反例未被下列检查命中，说明检查已空转：');
      for (const [name] of missed) console.error(`  - ${name}`);
      console.error(`  实际检出的 ${sink.length} 条：`);
      for (const f of sink) console.error(`    · ${f}`);
      process.exit(1);
    }

    // 正向断言：合法 head 必须 0 失败，否则规则会拦掉正确写法。
    // 该夹具特意把 maximum-scale=1 / user-scalable=0 只写在 HTML 注释里，
    // 用来证明"剔除注释后判定"这条规则真的生效——本仓的防回归说明正是这种写法，
    // 若这里误报，每个 index.html 都会被自己的注释拦下。
    const okSink = [];
    checkHtml(
      'ok.html',
      `<!doctype html><html><head><meta charset="UTF-8" />
      <!-- 防回归说明：禁止 maximum-scale=1 与 user-scalable=0 -->
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>ok</title><link rel="icon" href="/favicon.ico" /></head>
      <body><script type="module" src="/src/main.ts"></script></body></html>`,
      okSink,
    );
    if (okSink.length > 0) {
      console.error('❌ 门禁自检失败：合法 head（仅注释里出现禁用写法）被判为缺陷：');
      for (const f of okSink) console.error(`  - ${f}`);
      process.exit(1);
    }
    console.log(
      `✅ 门禁自检通过：反例命中 ${REQUIRED_DETECTIONS.length}/${REQUIRED_DETECTIONS.length} 项，另含正向断言（注释内写法不误报）`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---------- 主流程 ----------
const argv = process.argv.slice(2);
const rootFlagIdx = argv.indexOf('--root');
if (rootFlagIdx !== -1 && !argv[rootFlagIdx + 1]) {
  console.error('❌ --root 后面必须跟目录路径');
  process.exit(2);
}
const TARGET_ROOT = rootFlagIdx === -1 ? ROOT_DIR : resolve(argv[rootFlagIdx + 1]);
const UNKNOWN_ARGS = argv.filter((arg, i) => arg !== '--self-test' && arg !== '--root' && i !== rootFlagIdx + 1);
if (UNKNOWN_ARGS.length > 0) {
  console.error(`❌ 未知参数：${UNKNOWN_ARGS.join(' ')}（支持 --self-test、--root <dir>）`);
  process.exit(2);
}

if (argv.includes('--self-test')) {
  selfTest();
} else {
  const failures = [];
  const htmlFiles = discoverHtmlFiles(TARGET_ROOT);
  collectFailures(
    {
      htmlFiles,
      headersFile: join(TARGET_ROOT, HEADERS_FILE_REL),
      genAppFile: join(TARGET_ROOT, GEN_APP_FILE_REL),
    },
    failures,
  );
  if (failures.length > 0) {
    console.error(`❌ index.html 头部检查未通过（根目录 ${TARGET_ROOT}）：`);
    for (const f of failures) console.error(`  - ${f}`);
    console.error(
      '  修复参考 main/index.html：viewport 只写 width=device-width, initial-scale=1.0；' +
        '第三方字体改自托管；统计脚本改第一方外链并在 CSP 中显式放行。',
    );
    process.exit(1);
  }
  console.log(
    `✅ index.html 头部检查通过：${htmlFiles.length} 个入口 + CSP 前提（${HEADERS_FILE_REL}）+ 脚手架模板（${GEN_APP_FILE_REL}）；注释不参与判定`,
  );
}
