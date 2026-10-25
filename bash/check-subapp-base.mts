#!/usr/bin/env node
/**
 * 子应用部署 base 一致性门禁 — 防止 S5 类漂移再次发生。
 *
 * 校验 5 类事实源是否都指向同一口径 `/ydsz-{name}-web/`：
 *   1. comm/constants/src/micro-apps.ts 的 canonical 前缀与回退函数
 *   2. 运行时/构建期各回退字面量（registry-adapter、speculation-rules、
 *      gen-registry、gen-nginx-conf、plugin-sw）
 *   3. apps 下各 .env.production 的 VITE_BASE（存在则必须等于 canonical）
 *   4. bash/deploy/Dockerfile 的 COPY 目标目录（每个注册应用都要有）
 *   5. bash/deploy/nginx-sub-apps.conf 的 location（每个注册应用都要有）
 * 可选：若 apps/{name}/dist/index.html 已构建，断言资源引用带 canonical 前缀。
 *
 * 用法：
 *   node ./bash/check-subapp-base.mts          # 校验
 *
 * @path bash/check-subapp-base.mts
 * @author ydsz-team
 * @since 4.5.0
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY_FILE = join(ROOT_DIR, 'comm/constants/src/micro-apps.ts');
const DOCKERFILE = join(ROOT_DIR, 'bash/deploy/Dockerfile');
const NGINX_SNIPPET = join(ROOT_DIR, 'bash/deploy/nginx-sub-apps.conf');

/** 回退字面量所在文件（Node 脚本无法 import TS，故逐一对齐口径） */
const FALLBACK_SITES = [
  'comm/effects/micro-kernel/src/registry-adapter.ts',
  'comm/effects/micro-kernel/src/speculation-rules.ts',
  'bash/gen-registry.mts',
  'bash/gen-nginx-conf.mts',
  'conf/vite-config/src/plugin-sw.ts',
  'conf/vite-config/src/config/application.ts',
];

const failures = [];
const warnings = [];

function read(relOrAbs) {
  const abs = relOrAbs.startsWith(ROOT_DIR) ? relOrAbs : join(ROOT_DIR, relOrAbs);
  if (!existsSync(abs)) {
    failures.push(`文件不存在：${relOrAbs}`);
    return '';
  }
  return readFileSync(abs, 'utf8');
}

/** 与 gen-nginx-conf.mts 相同的裸读策略，提取 name / prodPath */
function parseRegistry(src) {
  const arrayMatch = src.match(/export const MICRO_APPS[^\n]+=\s*\[([\s\S]*?)\n\];/);
  if (!arrayMatch) {
    failures.push('无法从 micro-apps.ts 解析 MICRO_APPS');
    return [];
  }
  const entries = [];
  const blockRegex = /\{[^{}]*\}/g;
  let blockMatch;
  while ((blockMatch = blockRegex.exec(arrayMatch[1])) !== null) {
    const block = blockMatch[0];
    const name = block.match(/name:\s*['"`]([^'"`]+)['"`]/)?.[1];
    const prodPath = block.match(/prodPath:\s*['"`]([^'"`]+)['"`]/)?.[1];
    if (name) entries.push({ name, prodPath });
  }
  if (entries.length === 0) failures.push('MICRO_APPS 解析结果为空');
  return entries;
}

const registrySrc = read(REGISTRY_FILE);

// ---------- 1. canonical 口径 ----------
const canonicalPrefix = registrySrc.match(/SUB_APP_BASE_PREFIX\s*=\s*['"`]([^'"`]+)['"`]/)?.[1];
if (canonicalPrefix !== '/ydsz-') {
  failures.push(
    `micro-apps.ts 的 SUB_APP_BASE_PREFIX 期望 '/ydsz-'，实际 ${JSON.stringify(canonicalPrefix)}`,
  );
}
if (!/function\s+defaultProdPath/.test(registrySrc)) {
  failures.push('micro-apps.ts 缺少 defaultProdPath()（单一口径函数）');
}
if (!/app\.prodPath\s*\?\?\s*defaultProdPath\(/.test(registrySrc)) {
  failures.push('getProdEntry() 未使用 defaultProdPath() 作为回退');
}

const apps = parseRegistry(registrySrc);
const prodPathOf = (app) => app.prodPath ?? `${canonicalPrefix ?? '/ydsz-'}${app.name}/`;

// ---------- 2. 回退字面量 ----------
for (const site of FALLBACK_SITES) {
  const src = read(site);
  if (!src) continue;
  const upper = src.match(/[`'"]\/YDSZ-\$\{?/);
  if (upper) {
    failures.push(`${site} 仍使用大写 '/YDSZ-${'{name}'}/' 回退`);
  }
}

// 构建期 base 的前缀常量也必须与注册表同口径（否则产物 base 与 nginx location 分叉）
const vitePresetSrc = read('conf/vite-config/src/config/application.ts');
const presetPrefix = vitePresetSrc.match(/SUB_APP_BASE_PREFIX\s*=\s*['"`]([^'"`]+)['"`]/)?.[1];
if (presetPrefix !== canonicalPrefix) {
  failures.push(
    `vite-config 的 SUB_APP_BASE_PREFIX 期望 ${JSON.stringify(canonicalPrefix)}，实际 ${JSON.stringify(presetPrefix)}`,
  );
}

// ---------- 3. .env.production ----------
const appsDir = join(ROOT_DIR, 'apps');
if (existsSync(appsDir)) {
  for (const app of apps) {
    const envFile = join(appsDir, app.name, '.env.production');
    if (!existsSync(envFile)) {
      warnings.push(`apps/${app.name}/.env.production 缺失`);
      continue;
    }
    const declared = readFileSync(envFile, 'utf8').match(/^VITE_BASE=(.+)$/m)?.[1]?.trim();
    if (!declared) continue;
    const expected = prodPathOf(app);
    if (declared !== expected) {
      failures.push(
        `apps/${app.name}/.env.production 的 VITE_BASE=${declared} 与注册表口径 ${expected} 不一致`,
      );
    }
  }
}

// ---------- 4. Dockerfile COPY ----------
const dockerfile = read(DOCKERFILE);
for (const app of apps) {
  const dirName = prodPathOf(app).replaceAll('/', '');
  if (!dockerfile.includes(`/usr/share/nginx/html/${dirName}`)) {
    failures.push(`Dockerfile 缺少 apps/${app.name}/dist → /usr/share/nginx/html/${dirName} 的 COPY`);
  }
}

// ---------- 5. nginx location ----------
const nginx = read(NGINX_SNIPPET);
for (const app of apps) {
  const expected = prodPathOf(app);
  if (!new RegExp(`location ${expected.replace(/\//g, '\\/')} \\{`).test(nginx)) {
    failures.push(`nginx-sub-apps.conf 缺少 location ${expected}（请运行 pnpm gen:nginx）`);
  }
}

// ---------- 6. 可选：已构建产物的 base ----------
for (const app of apps) {
  const indexHtml = join(appsDir, app.name, 'dist', 'index.html');
  if (!existsSync(indexHtml)) continue;
  const html = readFileSync(indexHtml, 'utf8');
  const refs = [...html.matchAll(/(?:src|href)=["']([^"']*(?:jse|js|css)\/[^"']+)["']/g)].map(
    (m) => m[1],
  );
  if (refs.length === 0) continue;
  const expected = prodPathOf(app);
  const bad = refs.filter((ref) => !ref.startsWith(expected));
  if (bad.length > 0) {
    failures.push(
      `apps/${app.name}/dist/index.html 有 ${bad.length} 个资源引用未以 ${expected} 开头，例如 ${bad[0]}`,
    );
  }
}

// ---------- 输出 ----------
const builtAppCount = existsSync(appsDir)
  ? readdirSync(appsDir).filter((d) => existsSync(join(appsDir, d, 'dist', 'index.html'))).length
  : 0;

if (warnings.length > 0) {
  for (const w of warnings) console.warn(`⚠️  ${w}`);
}

if (failures.length > 0) {
  console.error(`❌ 子应用 base 一致性检查未通过（${apps.length} 个注册应用，${builtAppCount} 个已构建）：`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error('  修复：统一走 comm/constants 的 defaultProdPath()，然后 pnpm gen:nginx && pnpm gen:registry');
  process.exit(1);
}

console.log(
  `✅ 子应用 base 一致性通过：${apps.length} 个应用 × 5 类事实源 + 产物引用（已构建 ${builtAppCount} 个）`,
);
