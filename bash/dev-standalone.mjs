#!/usr/bin/env node
/**
 * 子应用独立开发模式 CLI 工具
 *
 * 一条命令启动任意子应用的独立开发环境（脱离主应用）：
 *   - 自动检测子应用是否存在
 *   - 注入 Mock 数据层支持
 *   - 使用独立端口避免冲突
 *   - 支持实时热更新
 *
 * 使用方式：
 *   pnpm standalone userinfo-web
 *   pnpm standalone agent-web --port 5702 --no-mock
 *
 * @example
 *   # 启动用户中心子应用的独立开发模式
 *   node bash/dev-standalone.mjs userinfo-web
 *
 *   # 启动 AI 助手，禁用 Mock
 *   node bash/dev-standalone.mjs agent-web --no-mock
 *
 *   # 自定义端口
 *   node bash/dev-standalone.mjs workflow-web --port 5800
 *
 * @path bash/dev-standalone.mjs
 * @author remi-team
 * @since 4.0.0
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ==================== 参数解析 ====================

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
子应用独立开发模式 CLI

用法：
  node bash/dev-standalone.mjs <app-name> [options]

参数：
  <app-name>      子应用目录名（如 userinfo-web）

选项：
  --port <num>    自定义端口（默认自动分配）
  --no-mock       禁用 Mock 数据层
  --no-open       不自动打开浏览器
  --help, -h      显示帮助

示例：
  node bash/dev-standalone.mjs userinfo-web
  node bash/dev-standalone.mjs agent-web --port 5702
  node bash/dev-standalone.mjs workflow-web --no-mock
`);
  process.exit(0);
}

const appName = args[0];

// 解析选项
let customPort = null;
let enableMock = true;
let shouldOpen = true;

for (let i = 1; i < args.length; i++) {
  switch (args[i]) {
    case '--port':
      customPort = Number.parseInt(args[++i], 10);
      break;
    case '--no-mock':
      enableMock = false;
      break;
    case '--no-open':
      shouldOpen = false;
      break;
    default:
      console.warn(`[Standalone] 未知选项: ${args[i]}`);
  }
}

// ==================== 应用验证 ====================

const appDir = path.join(root, 'apps', appName);

if (!fs.existsSync(appDir)) {
  console.error(`[Standalone] 错误：子应用 "${appName}" 不存在于 apps/${appName}/`);
  console.error(`[Standalone] 可用的子应用：`);
  const apps = fs.readdirSync(path.join(root, 'apps'));
  apps.forEach((app) => console.error(`  - ${app}`));
  process.exit(1);
}

const standaloneEntry = path.join(appDir, 'src', 'standalone-main.ts');
if (!fs.existsSync(standaloneEntry)) {
  console.warn(`[Standalone] 警告：${appName} 没有 standalone-main.ts 入口文件`);
  console.warn(`[Standalone] 使用标准 dev 模式启动（可能缺少 mock 数据支持）`);
}

// ==================== 端口分配 ====================

// 默认端口映射（对齐 micro-apps.config.ts）
const portMap = {
  'userinfo-web': 5701,
  'system-web': 5702,
  'message-web': 5703,
  'cronjob-web': 5704,
  'workflow-web': 5705,
  'nextwiki-web': 5706,
  'literule-web': 5707,
  'agent-web': 5708,
  'report-web': 5709,
};

const port = customPort || portMap[appName] || 5700;

// ==================== 启动应用 ====================

console.info(`
==========================================
  REMI — ${appName} 独立开发模式
==========================================
  URL:       http://localhost:${port}/
  Mock:      ${enableMock ? '已启用' : '已禁用'}
  端口:      ${port}
  应用目录:  apps/${appName}/
==========================================
`);

// 构建环境变量
const env = {
  ...process.env,
  VITE_STANDALONE: 'true',
  VITE_ENABLE_MOCK: enableMock ? 'true' : 'false',
  VITE_APP_MODE: 'standalone',
};

// 启动 Vite dev server
const viteArgs = [
  'exec',
  'pnpm',
  '--filter',
  `@remi/${appName}`,
  'vite',
  '--mode',
  'development',
  '--port',
  String(port),
  '--host',
];

if (shouldOpen) {
  viteArgs.push('--open', '/');
}

const child = spawn('pnpm', viteArgs, {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`[Standalone] 退出码: ${code}`);
  }
  process.exit(code || 0);
});

// 优雅退出处理
const handleSignal = (signal) => {
  console.info(`\n[Standalone] 收到 ${signal}，正在停止...`);
  child.kill(signal);
};

process.on('SIGINT', () => handleSignal('SIGINT'));
process.on('SIGTERM', () => handleSignal('SIGTERM'));
