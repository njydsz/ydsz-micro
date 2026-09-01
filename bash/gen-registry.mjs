/**
 * 注册表生成器 — 从 comm/constants/src/micro-apps.ts 生成 registry.json
 *
 * CI/CD 流水线在构建子应用后调用此脚本，
 * 将最新子应用清单写入 public/registry.json 并部署到 CDN。
 *
 * 使用方式：node bash/gen-registry.mjs [--output <path>]
 *
 * @example
 *   # 写入默认位置（main/public/registry.json）
 *   pnpm gen:registry
 *
 *   # 写入自定义路径（如 CDN 部署目录）
 *   pnpm gen:registry --output dist-cdn/registry.json
 *
 * @path bash\gen-registry.mjs
 * @author ydsz-team
 * @since 3.7.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ==================== 参数解析 ====================

const args = process.argv.slice(2);
let outputPath = path.join(root, 'main', 'public', 'registry.json');

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' && args[i + 1]) {
    outputPath = path.isAbsolute(args[i + 1])
      ? args[i + 1]
      : path.join(root, args[i + 1]);
    i++;
  }
}

// ==================== 读取注册表 ====================

// v4.4.1 A3: 注册表单源为 comm/constants/src/micro-apps.ts（TS 源文件，
// 该包不做 dist 构建），Node 脚本无法直接 import TS，统一走正则裸读。
// 该文件为纯数据定义（接口 + 数组字面量），正则解析稳定可靠。
let MICRO_APPS;
try {
  const configPath = path.join(root, 'comm', 'constants', 'src', 'micro-apps.ts');
  const src = fs.readFileSync(configPath, 'utf8');
  const match = src.match(/export const MICRO_APPS[^\n]+=\s*\[([\s\S]*?)\n\];/);
  if (!match) {
    console.error('[GenRegistry] 无法解析 MICRO_APPS 配置（comm/constants/src/micro-apps.ts）');
    process.exit(1);
  }
  // 数据文件内容为受控的 JSON 兼容字面量（同仓提交、CI 校验），此处直接求值
  MICRO_APPS = eval(`[${match[1]}]`);
} catch (error) {
  console.error('[GenRegistry] 读取注册表失败:', error);
  process.exit(1);
}

if (!MICRO_APPS || !Array.isArray(MICRO_APPS) || MICRO_APPS.length === 0) {
  console.error('[GenRegistry] MICRO_APPS 配置为空');
  process.exit(1);
}

// ==================== 生成 JSON ====================

const now = new Date().toISOString();
const registry = {
  version: now,
  generatedBy: 'gen-registry.mjs',
  apps: MICRO_APPS.map((app) => ({
    name: app.name,
    packageName: app.packageName,
    activeRule: app.activeRule,
    redirect: app.redirect,
    title: app.title,
    icon: app.icon,
    order: app.order,
    prodPath: app.prodPath ?? `/YDSZ-${app.name}/`,
    skeletonType: app.skeletonType ?? 'default',
    sandbox: app.sandbox ?? 'snapshot',
  })),
};

// ==================== 写入文件 ====================

const outputDir = path.dirname(outputPath);
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(registry, null, 2) + '\n');

console.info(`[GenRegistry] ✅ registry.json 已生成`);
console.info(`  路径: ${outputPath}`);
console.info(`  版本: ${now}`);
console.info(`  应用数: ${registry.apps.length}`);
console.info(`  应用列表: ${registry.apps.map((a) => a.name).join(', ')}`);
