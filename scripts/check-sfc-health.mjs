/**
 * 一次性体检脚本：解析全仓库 .vue 文件，报告模板/脚本语法损坏的文件。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parse, compileScript } = require('vue/compiler-sfc');

const ROOT = process.cwd();
const SKIP = /node_modules|dist|\.turbo|test-results|coverage|playwright-report|chrome\/dist/;
const files = [];

function walk(dir) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.test(ent.name)) continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.endsWith('.vue')) files.push(p);
  }
}

walk(ROOT);

const broken = [];
let ok = 0;

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const rel = f.slice(ROOT.length + 1);
  try {
    const { descriptor, errors } = parse(src, { filename: f });
    if (errors.length) {
      broken.push(`${rel} :: ${errors.map(e => `${e.message}${e.loc ? ` (${e.loc.start.line}:${e.loc.start.column})` : ''}`).join(' | ')}`);
      continue;
    }
    // script setup 编译校验（捕获 export 误用、宏错误等）
    if (descriptor.scriptSetup || descriptor.script) {
      try {
        const lang = descriptor.script?.lang ?? descriptor.scriptSetup?.lang;
        const plugins = lang === 'ts' ? ['typescript'] : [];
        compileScript(descriptor, { id: 'check', babelParserPlugins: plugins, fs: { fileExists: () => false, readFile: () => undefined } });
      } catch (e) {
        broken.push(`${rel} :: [script] ${e.message}`);
        continue;
      }
    }
    // 模板编译校验
    if (descriptor.template) {
      try {
        const { compileTemplate } = require('vue/compiler-sfc');
        const r = compileTemplate({ source: descriptor.template.content, filename: f, id: 'check' });
        if (r.errors.length) {
          broken.push(`${rel} :: [template] ${r.errors.map(e => (typeof e === 'string' ? e : e.message)).join(' | ')}`);
          continue;
        }
      } catch (e) {
        broken.push(`${rel} :: [template] ${e.message}`);
        continue;
      }
    }
    ok++;
  } catch (e) {
    broken.push(`${rel} :: [fatal] ${e.message}`);
  }
}

console.log(`total: ${files.length}, ok: ${ok}, broken: ${broken.length}`);
for (const b of broken) console.log(`  ✗ ${b}`);
