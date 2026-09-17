/**
 * Chrome 扩展 TypeScript 构建脚本
 *
 * 将 chrome/ 下各入口 .ts 独立编译为 dist/ 下的 .js，并拷贝静态资源。
 * 编译产物目录布局与源码相同，可直接被 manifest.json 引用。
 *
 * 运行方式：`node chrome/build.mjs`（从仓库根目录调用）
 *
 * @path chrome/build.mjs
 * @author ydsz-team
 * @since 4.1.0
 */
import { cp, rm, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transpileModule, ScriptTarget, ModuleKind } from 'typescript';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const dist = join(root, 'dist');

/** 入口点与编译目标 */
const ENTRY_POINTS = [
  ['background.ts', 'background.js'],
  ['content-script.ts', 'content-script.js'],
  ['kernel-bridge.ts', 'kernel-bridge.js'],
  ['popup/popup.ts', 'popup/popup.js'],
  ['devtools/devtools.ts', 'devtools/devtools.js'],
  ['devtools/panel.ts', 'devtools/panel.js'],
];

/** 静态资源相对路径（src → dest under dist） */
const STATIC_FILES = [
  ['manifest.dist.json', 'manifest.json'],
  ['popup/popup.html', 'popup/popup.html'],
  ['devtools/devtools.html', 'devtools/devtools.html'],
  ['devtools/panel.html', 'devtools/panel.html'],
];

async function pathExists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function buildFile(srcRel, destRel) {
  const srcPath = join(root, srcRel);
  const destPath = join(dist, destRel);
  const tsSource = await readFile(srcPath, 'utf8');

  // 独立编译每个文件（isolatedModules 语义：每个文件独立）
  const result = transpileModule(tsSource, {
    compilerOptions: {
      target: ScriptTarget.ES2020,
      module: ModuleKind.ESNext,
      isolatedModules: true,
      removeComments: false,
    },
    fileName: srcRel,
    reportDiagnostics: true,
  });

  // 如果有诊断（错误），输出并终止
  if (result.diagnostics && result.diagnostics.length > 0) {
    for (const d of result.diagnostics) {
      const message = typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText;
      if (d.file && d.start) {
        const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
        console.error(`  ${relative(root, d.file.fileName)}(${line + 1},${character + 1}): ${message}`);
      } else {
        console.error(`  ${message}`);
      }
    }
    throw new Error(`TypeScript 编译失败（${srcRel}）`);
  }

  // transpileModule 已剥离类型，输出纯 JS，直接写入
  const jsCode = result.outputText;
  await mkdir(dirname(destPath), { recursive: true });
  await writeFile(destPath, jsCode, 'utf8');
  console.log(`  ✓ ${srcRel} → ${destRel}`);
}

async function run() {
  // 1. 清理
  if (await pathExists(dist)) await rm(dist, { recursive: true });
  await mkdir(dist, { recursive: true });

  // 2. 独立编译每个 TS 入口
  console.log('[chrome] compiling TypeScript → JavaScript');
  for (const [src, dest] of ENTRY_POINTS) {
    await buildFile(src, dest);
  }

  // 3. 拷贝静态资源
  console.log('[chrome] copying static assets');
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
