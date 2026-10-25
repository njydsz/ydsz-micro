#!/usr/bin/env node
/**
 * nginx 子应用配置生成器 — MICRO_APPS → nginx.conf 生成闭环。
 *
 * 从 comm/constants/src/micro-apps.ts 读取微应用注册表（v4.4.1 A3 迁移），
 * 自动生成子应用 location 片段并写入 bash/deploy/nginx-sub-apps.conf。
 * nginx.conf 通过 include 指令引用该片段，确保注册表与部署配置始终一致。
 *
 * 用法：
 *   node ./bash/gen-nginx-conf.mjs           # 写入片段文件
 *   node ./bash/gen-nginx-conf.mjs --check   # 仅校验，不写入（CI 用）
 *
 * @path bash\gen-nginx-conf.mjs
 * @author ydsz-team
 * @since 1.0.0
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');
const CONFIG_FILE = join(ROOT_DIR, 'comm/constants/src/micro-apps.ts');
const OUTPUT_FILE = join(ROOT_DIR, 'bash/deploy/nginx-sub-apps.conf');

const isCheckMode = process.argv.includes('--check');

/**
 * 从 comm/constants/src/micro-apps.ts 提取子应用注册信息。
 *
 * 该文件是 TypeScript，但仅导入类型（vue-router 的 RouteRecordRaw），
 * 运行时数据为纯静态。此处用正则提取 name/prodPath 字段，
 * 避免引入 jiti/tsx 等额外依赖。
 *
 * @returns {{ name: string, prodPath?: string }[]}
 */
function parseMicroApps() {
  if (!existsSync(CONFIG_FILE)) {
    console.error(`❌ 配置文件不存在: ${CONFIG_FILE}`);
    process.exit(1);
  }

  const content = readFileSync(CONFIG_FILE, 'utf-8');

  const arrayStart = content.indexOf('export const MICRO_APPS');
  if (arrayStart === -1) {
    console.error('❌ 未找到 MICRO_APPS 导出');
    process.exit(1);
  }

  const bracketStart = content.indexOf('[', arrayStart);
  const bracketEnd = content.indexOf('];', bracketStart);
  if (bracketStart === -1 || bracketEnd === -1) {
    console.error('❌ MICRO_APPS 数组格式异常');
    process.exit(1);
  }

  const arrayContent = content.slice(bracketStart, bracketEnd);

  const entries = [];
  const blockRegex = /\{[^{}]*\}/g;
  let blockMatch;

  while ((blockMatch = blockRegex.exec(arrayContent)) !== null) {
    const block = blockMatch[0];
    const nameMatch = block.match(/name:\s*['"`]([^'"`]+)['"`]/);
    const prodPathMatch = block.match(/prodPath:\s*['"`]([^'"`]+)['"`]/);

    if (nameMatch) {
      entries.push({
        name: nameMatch[1],
        prodPath: prodPathMatch?.[1],
      });
    }
  }

  if (entries.length === 0) {
    console.error('❌ 未从 MICRO_APPS 提取到任何子应用');
    process.exit(1);
  }

  return entries;
}

/**
 * 获取子应用生产部署路径（与 comm/constants/src/micro-apps.ts 的 getProdEntry 逻辑一致）。
 *
 * 回退值必须与 defaultProdPath() 保持小写 `/ydsz-{name}/`：nginx location 在 Linux 上
 * 大小写敏感，而 Dockerfile 的 COPY 目标目录同为小写。
 */
function getProdPath(app) {
  return app.prodPath ?? `/ydsz-${app.name}/`;
}

/**
 * 生成 nginx 子应用 location 片段。
 *
 * 缓存分层策略（B0-5）：
 * - 外层 location 只声明目录基址与 SPA 深链回退，并且默认 no-store——
 *   入口 HTML 必须每次协商，否则发版后用户仍会拿到旧 index.html，
 *   旧 HTML 引用的 hash 已不存在，表现为白屏。
 * - 嵌套正则 location 处理带内容 hash 的 JS/CSS（immutable 一年）与
 *   图片/字体（30 天），并用 try_files $uri =404 阻断"文件不存在时
 *   回落 index.html"——那正是 HTML 被当 JS 执行的根因。
 * - 嵌套 .map 一律 404：构建用 hidden sourcemap，映射文件只上传错误监控后端。
 *
 * 两个 nginx 语义约束（改动本模板前请先读）：
 * 1. add_header 不跨层继承：当前层级一旦声明自己的 add_header，上层的
 *    add_header 全部失效。因此每个声明了 Cache-Control 的 location 都必须
 *    重新 include security-headers.conf。
 * 2. 目录基址用 root 而非 alias：alias 在带嵌套 location 的块中语义复杂
 *    （嵌套块仍按完整 URI 匹配，alias 的替换路径却不参与），root +
 *    "/ydsz-{name}/" 前缀天然自洽，也和 Dockerfile 的 COPY 目标一致。
 */
function generateNginxSnippet(apps) {
  const blocks = apps.map((app) => {
    const path = getProdPath(app);
    const trimmed = path.endsWith('/') ? path.slice(0, -1) : path;
    const dirName = trimmed.slice(1);

    return `    # ---- ${app.name} → /usr/share/nginx/html/${dirName} ----
    location ${path} {
      root /usr/share/nginx/html;
      index index.html;
      # 深链只回退到本应用入口，禁止回退主应用 /index.html
      try_files $uri $uri/ ${path}index.html;

      include /etc/nginx/security-headers.conf;
      add_header Cache-Control "no-cache, no-store, must-revalidate" always;

      # sourcemap 禁止对外暴露（hidden sourcemap 仅上传符号化后端）
      location ~* \\.map$ {
        access_log off;
        return 404;
      }

      # 带内容 hash 的 JS/CSS/WASM：一年强缓存；缺失即 404，绝不回落 HTML
      location ~* \\.(?:js|css|wasm)$ {
        try_files $uri =404;
        include /etc/nginx/security-headers.conf;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        add_header Access-Control-Allow-Origin "*" always;
      }

      # 图片/字体/媒体：文件名同样带 hash，30 天便于低成本回滚
      location ~* \\.(?:png|jpe?g|gif|svg|webp|avif|ico|bmp|woff2?|ttf|otf|eot|mp4|webm)$ {
        try_files $uri =404;
        include /etc/nginx/security-headers.conf;
        add_header Cache-Control "public, max-age=2592000" always;
        add_header Access-Control-Allow-Origin "*" always;
      }
    }`;
  });

  return [
    '# ==================== Sub-App Static Assets ====================',
    '# 此文件由 bash/gen-nginx-conf.mts 从 MICRO_APPS 自动生成，请勿手动修改。',
    '# 新增子应用后运行: pnpm run gen:nginx',
    '#',
    '# 缓存分层：入口 HTML = no-store（发版即生效）；hash JS/CSS = immutable 1y；',
    '# 图片/字体 = 30d；.map = 404。每个含 add_header 的 location 必须重新',
    '# include security-headers.conf，否则 nginx 会静默丢掉全部安全响应头。',
    '',
    blocks.join('\n\n'),
    '',
  ].join('\n');
}

/**
 * 主流程：解析 MICRO_APPS 注册表，生成 nginx location 片段。
 *
 * --check 模式：校验现有 nginx-sub-apps.conf 与注册表一致，不一致则退出码 1；
 * 默认模式：直接覆盖写入 bash/deploy/nginx-sub-apps.conf。
 */
function main() {
  const apps = parseMicroApps();
  const snippet = generateNginxSnippet(apps);

  if (isCheckMode) {
    if (!existsSync(OUTPUT_FILE)) {
      console.error('❌ nginx-sub-apps.conf 不存在，请先运行 pnpm run gen:nginx');
      process.exit(1);
    }
    const existing = readFileSync(OUTPUT_FILE, 'utf-8');
    if (existing.trim() !== snippet.trim()) {
      console.error('❌ nginx-sub-apps.conf 与 MICRO_APPS 不一致，请运行 pnpm run gen:nginx');
      process.exit(1);
    }
    console.log(`✅ nginx-sub-apps.conf 与 ${apps.length} 个子应用注册一致`);
    return;
  }

  writeFileSync(OUTPUT_FILE, snippet, 'utf-8');
  console.log(`✅ 已生成 ${OUTPUT_FILE}`);
  console.log(`   ${apps.length} 个子应用: ${apps.map((a) => a.name).join(', ')}`);
}

main();
