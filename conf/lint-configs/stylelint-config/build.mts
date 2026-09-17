/**
 * @ydsz/stylelint-config 构建脚本
 *
 * 将 src/index.ts 编译为 dist/index.mjs（供运行时消费）。
 * 依赖 Node 24 的 typescript 模块 + transpileModule。
 *
 * @path conf/lint-configs/stylelint-config/build.mts
 * @author ydsz-team
 * @since 4.1.0
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transpileModule, ScriptTarget, ModuleKind } from 'typescript';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const srcPath = join(root, 'src', 'index.ts');
const distDir = join(root, 'dist');
const distPath = join(distDir, 'index.mjs');

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function run(): Promise<void> {
  const tsSource = await readFile(srcPath, 'utf8');
  const result = transpileModule(tsSource, {
    compilerOptions: {
      target: ScriptTarget.ES2022,
      module: ModuleKind.ESNext,
      isolatedModules: true,
      removeComments: false,
    },
    fileName: srcPath,
    reportDiagnostics: true,
  });

  if (result.diagnostics && result.diagnostics.length > 0) {
    for (const d of result.diagnostics) {
      const msg = typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText;
      console.error(`  ${d.file?.fileName ?? '?'}: ${msg}`);
    }
    throw new Error(`@ydsz/stylelint-config 构建失败`);
  }

  if (!(await pathExists(distDir))) await mkdir(distDir, { recursive: true });
  await writeFile(distPath, result.outputText, 'utf8');
  console.log(`  ✓ src/index.ts → dist/index.mjs`);
}

run().catch((err: unknown) => {
  console.error('[stylelint-config] build failed:', err);
  process.exit(1);
});
