#!/usr/bin/env node
/**
 * 沙箱边界门禁 — 防止子应用绕过 fakeWindow 直写全局对象。
 *
 * 背景（v4.3.2）：
 *   micro-kernel 的 proxy 沙箱自述「因 ESM 严格模式禁 with，不拦截模块顶层
 *   window/globalThis 读写」。因此子应用直写 `window.xxx = ...` 会逃逸到真实
 *   全局，污染主壳与其他子应用；`globalThis` 同理。
 *
 * 校验项（仅扫 apps/ 子应用源码，不扫 comm/ main/ bash/）：
 *   1. 禁止 `window.<name> = ...` 形式的赋值（允许 === / !== / == / != 比较）
 *   2. 禁止 `globalThis.<name> = ...` 赋值
 *   3. 禁止 `localStorage` / `sessionStorage` 的**裸 key** 调用
 *      （允许带命名空间前缀的 key，如 `ydsz_pref_` / `YDSZ_` / 应用名前缀）
 *
 * 说明：
 *   - 不做「禁用 localStorage」的一刀切：偏好设置等场景读写 storage 是合理的，
 *     真正的要求是 key 必须命名空间化，避免多应用同 origin 下互相覆盖。
 *   - 例外：`.test.ts` 测试文件、`mock/` 目录下的模拟代码不参与校验。
 *
 * 用法：
 *   node ./bash/check-sandbox-boundary.mts
 *   node ./bash/check-sandbox-boundary.mts --self-test
 *
 * @path bash/check-sandbox-boundary.mts
 * @author ydsz-team
 * @since 4.3.2
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APPS_DIR = join(ROOT_DIR, 'apps');

/** 允许的 key 前缀（命名空间化标识） */
const ALLOWED_KEY_PREFIXES = ['ydsz_', 'YDSZ_', 'pref_', 'pmis_'];

/** 跳过校验的目录/文件名特征 */
const SKIP_DIR_NAMES = new Set(['node_modules', 'dist', 'coverage', 'mock', '__mocks__']);
const SKIP_FILE_PATTERNS = [/\.test\.ts$/, /\.spec\.ts$/, /\.d\.ts$/];

interface Finding {
  file: string;
  line: number;
  rule: string;
  snippet: string;
}

// ==================== 自检模式 ====================

if (process.argv.includes('--self-test')) {
  const cases: Array<{ name: string; code: string; expect: Finding[] }> = [
    {
      name: 'window 赋值被识别',
      code: 'window.__foo = 1;',
      expect: [{ rule: 'window-assign' }],
    },
    {
      name: 'window 比较不误报',
      code: 'if (window.__foo === 1) {}',
      expect: [],
    },
    {
      name: 'globalThis 赋值被识别',
      code: 'globalThis.__bar = 2;',
      expect: [{ rule: 'globalThis-assign' }],
    },
    {
      name: '带命名空间的 storage key 放行',
      code: "localStorage.setItem('ydsz_pref_theme', 'dark');",
      expect: [],
    },
    {
      name: '裸 storage key 被识别',
      code: "localStorage.setItem('theme', 'dark');",
      expect: [{ rule: 'bare-storage-key' }],
    },
    {
      name: '模板拼接的命名空间 key 放行',
      code: "localStorage.setItem(`${LS_PREFIX}theme`, 'dark');",
      expect: [],
    },
  ];

  let failed = 0;
  for (const c of cases) {
    const findings = scanCode(c.code, 'virtual.ts');
    const rules = findings.map((f) => f.rule);
    const expectedRules = c.expect.map((e) => e.rule).sort();
    const actualRules = [...rules].sort();
    const ok =
      actualRules.length === expectedRules.length &&
      actualRules.every((r, i) => r === expectedRules[i]);
    if (!ok) {
      failed++;
      console.error(
        `❌ 自检用例「${c.name}」：期望 [${expectedRules.join(',')}]，实际 [${actualRules.join(',')}]`,
      );
    } else {
      console.log(`✅ 自检用例「${c.name}」符合预期`);
    }
  }

  if (failed > 0) {
    console.error(`❌ 沙箱边界门禁自检未通过（${failed}/${cases.length}）`);
    process.exit(1);
  }
  console.log(`✅ 沙箱边界门禁自检通过（${cases.length}/${cases.length}）`);
  process.exit(0);
}

// ==================== 扫描实现 ====================

/**
 * 扫描单段源码，返回命中项。
 *
 * @param code - 源码文本
 * @param file - 文件路径（用于报错展示）
 * @returns 命中列表
 */
function scanCode(code: string, file: string): Finding[] {
  const findings: Finding[] = [];
  const lines = code.split(/\r?\n/);

  lines.forEach((line, index) => {
    // 跳过注释行与注释内容，避免误报
    const withoutComment = stripComments(line);
    const lineNo = index + 1;
    const trimmed = withoutComment.trim();

    // 1. window.<name> = ... 赋值（排除比较运算符）
    //    匹配 `window.foo =` / `window['foo'] =`，但排除 `===` `!==` `==` `!=` `<=`
    const windowAssign = /(?:^|[^=!<>])\bwindow\.([A-Za-z_$][\w$]*)\s*=(?!=)/.exec(trimmed)
      || /(?:^|[^=!<>])\bwindow\[\s*['"][^'"]+['"]\s*\]\s*=(?!=)/.exec(trimmed);
    if (windowAssign) {
      findings.push({ file, line: lineNo, rule: 'window-assign', snippet: trimmed });
    }

    // 2. globalThis.<name> = ... 赋值
    const globalAssign = /(?:^|[^=!<>])\bglobalThis\.([A-Za-z_$][\w$]*)\s*=(?!=)/.exec(trimmed);
    if (globalAssign) {
      findings.push({ file, line: lineNo, rule: 'globalThis-assign', snippet: trimmed });
    }

    // 3. 裸 storage key
    const storageCall = /\b(localStorage|sessionStorage)\.(getItem|setItem|removeItem)\(\s*(['"`])([^'"`]*)\3/.exec(trimmed);
    if (storageCall) {
      const key = storageCall[4];
      // 模板字符串（反引号包裹）视为「调用方前缀拼接」，放行
      if (storageCall[3] === '`') return;
      if (!isNamespaced(key)) {
        findings.push({ file, line: lineNo, rule: 'bare-storage-key', snippet: trimmed });
      }
    }
  });

  return findings;
}

/** 剥离行内注释（简单实现：截断 // 之后内容，不处理字符串内的 //） */
function stripComments(line: string): string {
  const idx = line.indexOf('//');
  return idx === -1 ? line : line.slice(0, idx);
}

/** 判断 storage key 是否已命名空间化 */
function isNamespaced(key: string): boolean {
  if (!key) return false;
  return ALLOWED_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/** 递归收集待扫描文件 */
function collectFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIR_NAMES.has(entry)) continue;
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) {
      collectFiles(abs, out);
    } else if (/\.(ts|vue|mts)$/.test(entry) && !SKIP_FILE_PATTERNS.some((p) => p.test(entry))) {
      out.push(abs);
    }
  }
  return out;
}

// ==================== 主流程 ====================

const files = collectFiles(APPS_DIR);
if (files.length === 0) {
  console.error(`❌ 未找到 apps/ 下的源码文件：${APPS_DIR}`);
  process.exit(1);
}

const allFindings: Finding[] = [];
for (const file of files) {
  allFindings.push(...scanCode(readFileSync(file, 'utf-8'), file));
}

if (allFindings.length > 0) {
  console.error(`❌ 沙箱边界检查未通过，发现 ${allFindings.length} 处越界写法：\n`);
  for (const f of allFindings) {
    const rel = f.file.startsWith(ROOT_DIR) ? f.file.slice(ROOT_DIR.length + 1) : f.file;
    const label =
      f.rule === 'window-assign'
        ? 'window 直写（应改用 useMicroProps().fakeWindow）'
        : f.rule === 'globalThis-assign'
          ? 'globalThis 直写（应改用 useMicroProps().fakeWindow）'
          : '裸 storage key（应加命名空间前缀）';
    console.error(`  ${rel}:${f.line}  [${label}]`);
    console.error(`      ${f.snippet}`);
  }
  console.error(
    '\n修复指引：\n' +
      '  - window/globalThis 赋值：改用 inject 的 fakeWindow（见 useMicroProps）\n' +
      '  - storage key：加应用/模块前缀，如 `ydsz_<module>_<key>`\n',
  );
  process.exit(1);
}

console.log(`✅ 沙箱边界检查通过（扫描 ${files.length} 个文件）`);
