/**
 * Chrome 扩展 TypeScript 构建脚本
 *
 * 将 chrome/ 下各入口 .ts 编译打包为 dist/ 下的 .js，并拷贝静态资源。
 * 编译产物目录布局与源码相同，可直接被 manifest.json 引用。
 *
 * @path chrome/build.mjs
 * @author ydsz-team
 * @since 4.1.0
 */
import { build } from 'esbuild';
import { cp, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const dist = join(root, 'dist');

/** 入口点：src 路径 → dist 路径（不含扩展名） */
const ENTRY_POINTS = [
  ['background.ts', 'background.js'],
  ['content-script.ts', 'content-script.js'],
  ['kernel-bridge.ts', 'kernel-bridge.js'],
  ['popup/popup.ts', 'popup/popup.js'],
  ['devtools/devtools.ts', 'devtools/devtools.js'],
  ['devtools/panel.ts', 'devtools/panel.js'],
];

/** 静态资源相对路径 */
const STATIC_FILES = [
  ['manifest.json', 'manifest.json'],
  ['popup/popup.html', 'popup/popup.html'],
  ['devtools/devtools.html', 'devtools/devtools.html'],
  ['devtools/panel.html', 'devtools/panel.html'],
];

async function run() {
  // 1. 清理并创建 dist 目录
  if (existsSync(dist)) await rm(dist, { recursive: true });
  await mkdir(dist, { recursive: true });

  // 2. esbuild 并行构建所有 TS 入口
  await build({
    entryPoints: ENTRY_POINTS.map(([src, out]) => ({
      in: join(root, src),
      out: join(dist, dirname(out), out.replace(/\.js$/, '')),
    })),
    bundle: false,
    format: 'iife',
    target: ['es2020'],
    platform: 'browser',
    logLevel: 'info',
    legalComments: 'none',
  });

  // 3. 拷贝静态资源
  for (const [src, dest] of STATIC_FILES) {
    const destPath = join(dist, dest);
    await mkdir(dirname(destPath), { recursive: true });
    await cp(join(root, src), destPath);
  }

  console.log(`[chrome] build complete → ${dist}`);
}

run().catch((err) => {
  console.error('[chrome] build failed:', err);
  process.exit(1);
});
