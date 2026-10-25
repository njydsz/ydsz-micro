#!/usr/bin/env node
/**
 * nginx 静态资源缓存与安全头分层门禁 — 防止 S6 类缺陷再次发生。
 *
 * 背景：改前的配置同时存在四个问题，且都不是"看一眼就能发现"的那种：
 *   - server 级正则（js/css/图片）会劫持子应用与主应用的静态请求，块内既无
 *     root 也无 =404，文件缺失时由 SPA 兜底返回 index.html，浏览器把 HTML
 *     当 JS 执行 → 白屏；
 *   - 同一正则对所有静态文件无差别 immutable，入口 HTML 命中即发版失效；
 *   - add_header 不跨层继承，声明了 Cache-Control 的 location 静默丢掉 http 层
 *     全部安全头；
 *   - 硬编码 X-CDN-Cache "HIT" 与真实缓存命中无关，属于误导性观测数据。
 *
 * 本脚本按花括号配对解析 location 块及其嵌套深度，只校验结构不变量，不依赖
 * nginx 二进制（本地无 nginx，`nginx -t` 无法执行；语法正确性仍需在镜像构建
 * 或 CI 阶段验证——这一条限制请如实保留在结论里）。
 *
 * 用法：
 *   node ./bash/check-nginx-cache.mts
 *
 * @path bash/check-nginx-cache.mts
 * @author ydsz-team
 * @since 4.5.0
 */

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCKERFILE = join(ROOT_DIR, 'bash/deploy/Dockerfile');

const INCLUDE_DIRECTIVE = 'include /etc/nginx/security-headers.conf';

/** 去掉行内注释，避免注释文本干扰花括号配对 */
function stripComments(src) {
  return src
    .split('\n')
    .map((line) => {
      const idx = line.search(/(^|\s)#/);
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join('\n');
}

/** 剔除 body 内的嵌套 location 块，只保留本层自身的指令 */
function directDirectives(body) {
  let out = body;
  for (let guard = 0; guard < 200; guard += 1) {
    const re = /location[^\n{]*\{/;
    const m = re.exec(out);
    if (!m) break;
    let cursor = m.index + m[0].length;
    let depth = 1;
    while (cursor < out.length && depth > 0) {
      const ch = out[cursor];
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      cursor += 1;
    }
    out = out.slice(0, m.index) + out.slice(cursor);
  }
  return out;
}

/**
 * 单次扫描解析所有 location 块。
 *
 * @param {string} src 已去注释的配置文本
 * @returns {{head: string, directives: string, depth: number}[]}
 *   depth 为该 location 外层已开启的块数量（主配置里 server 层=2，子应用片段最外层=0），
 *   调用方用文件内的最小 depth 归一化，从而两个文件口径一致。
 */
function parseLocations(src) {
  const blocks = [];
  const stack = [];
  const re = /(location[^\n{]*\{)|(\{)|(})/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    if (m[1] || m[2]) {
      stack.push({ head: m[1] ? m[1].slice(0, -1).trim() : null, bodyStart: re.lastIndex });
    } else {
      const top = stack.pop();
      if (top && top.head) {
        blocks.push({
          head: top.head,
          pattern: top.head.replace(/^location\s+/, ''),
          depth: stack.length,
          directives: directDirectives(src.slice(top.bodyStart, m.index)),
        });
      }
    }
  }
  return blocks;
}

/**
 * 对一个部署目录执行全部检查。
 *
 * @param {string} deployDir 含 nginx.conf / nginx-sub-apps.conf / security-headers.conf 的目录
 * @param {string} dockerfile Dockerfile 路径
 * @param {string[]} sink 收集失败项
 */
function collectFailures(deployDir, dockerfile, sink) {
  const NGINX_FILE = join(deployDir, 'nginx.conf');
  const SUB_APPS_FILE = join(deployDir, 'nginx-sub-apps.conf');
  const HEADERS_FILE = join(deployDir, 'security-headers.conf');

  // ---------- 0. 文件存在性 ----------
  for (const [label, file] of [
    ['nginx.conf', NGINX_FILE],
    ['nginx-sub-apps.conf', SUB_APPS_FILE],
    ['security-headers.conf', HEADERS_FILE],
  ]) {
    if (!existsSync(file)) sink.push(`${label} 缺失：${file}`);
  }

  // ---------- 1. security-headers.conf 自身完整 ----------
  if (existsSync(HEADERS_FILE)) {
    const headers = readFileSync(HEADERS_FILE, 'utf8');
    for (const required of [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Strict-Transport-Security',
      'X-CSRF-Header',
    ]) {
      if (!headers.includes(required)) sink.push(`security-headers.conf 缺少 ${required}`);
    }
    if (/script-src[^;]*'unsafe-inline'/.test(headers)) {
      sink.push(
        'security-headers.conf 的 script-src 含 unsafe-inline：strict-dynamic 会忽略它，但不支持 strict-dynamic 的浏览器将放行全部内联脚本',
      );
    }
    if (/add_header[^;]*""/.test(headers)) {
      sink.push('security-headers.conf 下发了空值头（无实际防护语义，徒增响应体积）');
    }
  }

  // ---------- 2. http 层 include + Dockerfile COPY ----------
  const nginxSrc = existsSync(NGINX_FILE) ? readFileSync(NGINX_FILE, 'utf8') : '';
  const httpSlice = nginxSrc.slice(nginxSrc.indexOf('http {'), nginxSrc.indexOf('server {'));
  if (!httpSlice.includes(INCLUDE_DIRECTIVE)) {
    sink.push('nginx.conf 的 http 层未 include security-headers.conf（/api/、/ws/ 等裸 location 将无安全头）');
  }
  if (/^\s*add_header\s/m.test(httpSlice)) {
    sink.push('nginx.conf 的 http 层仍有游离 add_header，应统一由 security-headers.conf 提供');
  }
  const dockerfileSrc = existsSync(dockerfile) ? readFileSync(dockerfile, 'utf8') : '';
  if (!dockerfileSrc.includes('COPY bash/deploy/security-headers.conf')) {
    sink.push('Dockerfile 未 COPY security-headers.conf → 镜像内 include 失败，nginx 启动即退出');
  }

  // ---------- 3. 逐块结构不变量 ----------
  for (const [label, src] of [
    ['nginx.conf', nginxSrc],
    ['nginx-sub-apps.conf', existsSync(SUB_APPS_FILE) ? readFileSync(SUB_APPS_FILE, 'utf8') : ''],
  ]) {
    if (!src) continue;
    const blocks = parseLocations(stripComments(src));
    if (blocks.length === 0) {
      sink.push(`${label} 未解析到任何 location 块（解析器失效，请检查脚本）`);
      continue;
    }
    const outerDepth = Math.min(...blocks.map((b) => b.depth));

    for (const block of blocks) {
      const d = block.directives;
      const tag = `${label} → location ${block.head}`;

      // I1：声明了 add_header 却不 include → 安全头被静默丢弃
      if (/add_header\s/.test(d) && !d.includes(INCLUDE_DIRECTIVE)) {
        sink.push(`${tag} 声明了 add_header 但未 include security-headers.conf（add_header 不跨层继承）`);
      }

      // I2：一年 immutable 只允许出现在扩展名正则块，且必须禁止 HTML 兜底
      if (/max-age=31536000/.test(d)) {
        if (!/^~\*/.test(block.pattern)) {
          sink.push(`${tag} 对非扩展名正则块施加了一年缓存（入口 HTML 命中即发版失效）`);
        }
        if (!/try_files\s+\$uri\s+=404/.test(d)) {
          sink.push(`${tag} 使用 immutable 却缺少 try_files $uri =404（文件缺失会回落 HTML → HTML 当 JS 执行）`);
        }
      }

      // I3：SPA 兜底块必须 no-store 且不得带正数 max-age
      if (/try_files[^\n]*index\.html/.test(d)) {
        if (!/no-store/.test(d)) sink.push(`${tag} 是 SPA 兜底入口却未声明 no-store`);
        if (/max-age=(?!0\b)\d+/.test(d)) {
          sink.push(`${tag} 同时具备 HTML 兜底与正数 max-age，发版后旧入口会被继续缓存`);
        }
      }

      // I4：sourcemap 命中即 404
      if (/\\\.map\$|\\.(?:js\|css)\\\.map\$/.test(block.pattern) && !/return\s+404/.test(d)) {
        sink.push(`${tag} 命中 sourcemap 却未 return 404`);
      }

      // I5：禁止伪造 CDN 命中状态
      if (/X-CDN-Cache|CDN-Cache-Status/.test(d)) {
        sink.push(`${tag} 下发了与真实缓存状态无关的 X-CDN-Cache 头`);
      }

      // I6：expires 与显式 Cache-Control 双写易失配，统一只用 Cache-Control
      if (/^\s*expires\s/m.test(d)) {
        sink.push(`${tag} 使用 expires 指令（会与 Cache-Control 双写），改用显式 add_header Cache-Control`);
      }

      // I7：最外层（server 级）不得保留扩展名正则缓存块——它会劫持应用前缀 location
      if (block.depth === outerDepth && /^~\*/.test(block.pattern) && /add_header\s+Cache-Control/.test(d)) {
        sink.push(`${tag} 位于 server 最外层却设置 Cache-Control，会劫持 ${label} 内所有应用前缀 location`);
      }
    }
  }
}

/**
 * 反例夹具：主体取自修复前的真实配置（HEAD 的 nginx.conf 与旧生成模板输出），
 * 另附一条人为的 sourcemap 违规块，用于覆盖旧配置中本就正确、因此天然没有
 * 反例的 I4。--self-test 用它证明本门禁不是"永远绿灯"的空转检查。
 */
const FIXTURE = {
  'nginx.conf': `http {
  add_header Content-Security-Policy "default-src 'self';" always;
  add_header X-CSRF-Token "" always;

  server {
    listen 8080;

    location / {
      root /usr/share/nginx/html/main;
      try_files $uri $uri/ /index.html;
      index index.html;
      add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    include /etc/nginx/nginx-sub-apps.conf;

    location ~* \\.(?:js|css)\\.map$ {
      return 404;
    }

    location ~* \\.(?:js|css|woff2?|svg|png|jpg)$ {
      expires 1y;
      add_header Cache-Control "public, max-age=31536000, immutable";
      add_header X-CDN-Cache "HIT";
    }

    location /health {
      return 200 '{"status":"UP"}';
      add_header Content-Type application/json;
    }
  }
}
`,
  'nginx-sub-apps.conf': `    location /ydsz-userinfo-web/ {
      alias /usr/share/nginx/html/ydsz-userinfo-web/;
      try_files $uri $uri/ /ydsz-userinfo-web/index.html;
      add_header Access-Control-Allow-Origin *;
      add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # 人为违规块：旧配置里没有这种写法，但 I4 若不被覆盖就等于空转检查，
    # 所以显式造一个"命中 .map 却走 SPA 兜底"的反例（真实缺陷形态：.map 请求
    # 返回 index.html，浏览器按 JS 解析 HTML → 语法错误白屏）。
    location /ydsz-system-web/ {
      alias /usr/share/nginx/html/ydsz-system-web/;
      try_files $uri $uri/ /ydsz-system-web/index.html;
      add_header Cache-Control "no-store";

      location ~* \\.map$ {
        add_header Cache-Control "no-store";
      }
    }
`,
};

/** 夹具必须命中的不变量（缺任意一条说明门禁形同虚设） */
const REQUIRED_DETECTIONS = [
  ['I1 安全头丢失', 'add_header 不跨层继承'],
  ['I2 非正则块一年缓存', '入口 HTML 命中即发版失效'],
  ['I2 HTML 兜底缺失', 'HTML 当 JS 执行'],
  ['I3 入口未 no-store', 'SPA 兜底入口却未声明 no-store'],
  ['I4 sourcemap 未 404', '命中 sourcemap 却未 return 404'],
  ['I5 伪造 CDN 头', 'X-CDN-Cache'],
  ['I6 expires 双写', 'expires 指令'],
  ['I7 server 层正则劫持', '位于 server 最外层却设置 Cache-Control'],
];

function selfTest() {
  const dir = mkdtempSync(join(tmpdir(), 'ydsz-nginx-selftest-'));
  try {
    writeFileSync(join(dir, 'nginx.conf'), FIXTURE['nginx.conf'], 'utf8');
    writeFileSync(join(dir, 'nginx-sub-apps.conf'), FIXTURE['nginx-sub-apps.conf'], 'utf8');
    const sink = [];
    collectFailures(dir, join(dir, 'Dockerfile-not-exist.conf'), sink);
    const missed = REQUIRED_DETECTIONS.filter(([, needle]) => !sink.some((f) => f.includes(needle)));
    if (missed.length > 0) {
      console.error('❌ 门禁自检失败：修复前的反例未被下列不变量捕获，说明检查已空转：');
      for (const [name] of missed) console.error(`  - ${name}`);
      console.error(`  实际检出的 ${sink.length} 条：`);
      for (const f of sink) console.error(`    · ${f}`);
      process.exit(1);
    }
    console.log(
      `✅ 门禁自检通过：反例命中 ${REQUIRED_DETECTIONS.length}/${REQUIRED_DETECTIONS.length} 项不变量（检出 ${sink.length} 条缺陷）`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---------- 主流程 ----------
const isSelfTest = process.argv.includes('--self-test');
if (isSelfTest) {
  selfTest();
} else {
  const realFailures = [];
  collectFailures(join(ROOT_DIR, 'bash/deploy'), DOCKERFILE, realFailures);
  if (realFailures.length > 0) {
    console.error('❌ nginx 缓存/安全头分层检查未通过：');
    for (const f of realFailures) console.error(`  - ${f}`);
    console.error('  子应用片段请重新生成：pnpm run gen:nginx；随后 pnpm run check:nginx');
    process.exit(1);
  }
  console.log(
    '✅ nginx 静态分层与安全头 include 检查通过（7 项结构不变量；语法正确性仍需 nginx -t 在镜像内验证）',
  );
}
