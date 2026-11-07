#!/usr/bin/env node
/**
 * 样式隔离默认值门禁 — 防止 styleIsolation 默认关闭导致样式污染回归。
 *
 * 背景（v4.3.2）：
 *   运行时 CSS 作用域（runtime-css-scope）是子应用样式隔离的唯一运行时兜底。
 *   此前 createSchedulerContext() 默认 `styleIsolationEnabled: false`，
 *   且 kernel-startup 用 `options?.sandbox?.styleIsolation === true` 赋值，
 *   导致未显式传参时隔离被静默关闭，子应用可互相污染样式且无告警。
 *
 * 校验项：
 *   1. createSchedulerContext() 的 styleIsolationEnabled 默认值必须为 true
 *   2. kernel-startup 不得用 `=== true` 形式给 setStyleIsolation 赋值
 *      （该写法会把 undefined 误判为关闭）
 *   3. runtime-css-scope 的失败分支必须上报（不得完全静默）
 *
 * 用法：
 *   node ./bash/check-style-isolation.mts
 *
 * @path bash/check-style-isolation.mts
 * @author ydsz-team
 * @since 4.3.2
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ---------- 自检模式 ----------
// 用内存 fixture 验证门禁能识别三类回归，不依赖真实源码
if (process.argv.includes('--self-test')) {
  const cases: Array<{ name: string; appState: string; startup: string; cssScope: string; expectFail: boolean }> = [
    {
      name: '全部正确',
      appState: 'export function createSchedulerContext(): SchedulerContext { return { styleIsolationEnabled: true, keepAliveEnabled: true } }',
      startup: 'if (options?.sandbox?.styleIsolation === false) { setStyleIsolation(false); }',
      cssScope: 'catch (err) { reportCssScopeFailure(appName, err); }',
      expectFail: false,
    },
    {
      name: '默认关闭（回归）',
      appState: 'export function createSchedulerContext(): SchedulerContext { return { styleIsolationEnabled: false } }',
      startup: 'if (options?.sandbox?.styleIsolation === false) { setStyleIsolation(false); }',
      cssScope: 'catch (err) { reportCssScopeFailure(appName, err); }',
      expectFail: true,
    },
    {
      name: '启动用 === true（回归）',
      appState: 'export function createSchedulerContext(): SchedulerContext { return { styleIsolationEnabled: true } }',
      startup: 'setStyleIsolation(options?.sandbox?.styleIsolation === true);',
      cssScope: 'catch (err) { reportCssScopeFailure(appName, err); }',
      expectFail: true,
    },
    {
      name: '失败分支静默（回归）',
      appState: 'export function createSchedulerContext(): SchedulerContext { return { styleIsolationEnabled: true } }',
      startup: 'if (options?.sandbox?.styleIsolation === false) { setStyleIsolation(false); }',
      cssScope: 'catch (err) { /* silent */ }',
      expectFail: true,
    },
  ];

  let failed = 0;
  for (const c of cases) {
    const problems: string[] = [];
    const ctxBodyMatch = /createSchedulerContext\(\)[^{]*\{[\s\S]*?return\s*\{([\s\S]*?)\n?\s*\}/.exec(
      c.appState,
    );
    const body = ctxBodyMatch?.[1] ?? '';
    const match = /styleIsolationEnabled:\s*(true|false)/.exec(body);
    if (!match) problems.push('未设置初值');
    else if (match[1] !== 'true') problems.push('默认值非 true');

    if (/setStyleIsolation\(\s*[^)]*===\s*true\s*\)/.test(c.startup)) {
      problems.push('=== true 写法');
    }

    if (!/reportCssScopeFailure|logger\.warn|logger\.error/.test(c.cssScope)) {
      problems.push('失败未上报');
    }

    const detected = problems.length > 0;
    const ok = detected === c.expectFail;
    if (!ok) {
      failed++;
      console.error(
        `❌ 自检用例「${c.name}」：期望 ${c.expectFail ? '失败' : '通过'}，实际 ${detected ? '失败' : '通过'}`,
      );
      if (problems.length) console.error(`   命中：${problems.join('、')}`);
    } else {
      console.log(`✅ 自检用例「${c.name}」符合预期`);
    }
  }

  if (failed > 0) {
    console.error(`❌ 样式隔离门禁自检未通过（${failed}/${cases.length}）`);
    process.exit(1);
  }
  console.log(`✅ 样式隔离门禁自检通过（${cases.length}/${cases.length}）`);
  process.exit(0);
}

const APP_STATE_FILE = join(
  ROOT_DIR,
  'comm/effects/micro-kernel/src/app-state.ts',
);
const STARTUP_FILE = join(
  ROOT_DIR,
  'comm/effects/micro-kernel/src/kernel-startup.ts',
);
const CSS_SCOPE_FILE = join(
  ROOT_DIR,
  'comm/effects/micro-kernel/src/runtime-css-scope.ts',
);

const failures: string[] = [];
const warnings: string[] = [];

function read(abs: string): string {
  if (!existsSync(abs)) {
    failures.push(`文件不存在：${abs}`);
    return '';
  }
  return readFileSync(abs, 'utf8');
}

// ---------- 1. 默认值必须为 true ----------
const appState = read(APP_STATE_FILE);
if (appState) {
  // 定位 createSchedulerContext 的返回对象字面量，检查 styleIsolationEnabled 初值。
  // 用 `return { ... }` 而非整个函数体，兼容单行与多行两种写法。
  const ctxBodyMatch = /createSchedulerContext\(\)[^{]*\{[\s\S]*?return\s*\{([\s\S]*?)\n?\s*\}/.exec(
    appState,
  );
  if (!ctxBodyMatch) {
    failures.push(
      'app-state.ts: 未找到 createSchedulerContext 的返回对象，无法校验默认值',
    );
  } else {
    const body = ctxBodyMatch[1];
    const match = /styleIsolationEnabled:\s*(true|false)/.exec(body);
    if (!match) {
      failures.push(
        'app-state.ts: createSchedulerContext 未设置 styleIsolationEnabled 初值',
      );
    } else if (match[1] !== 'true') {
      failures.push(
        `app-state.ts: styleIsolationEnabled 默认值为 ${match[1]}，必须为 true。` +
          '运行时 CSS 作用域是样式隔离的唯一运行时兜底，默认关闭会导致子应用互相污染。',
      );
    }
  }
}

// ---------- 2. 启动赋值不得使用 `=== true` ----------
const startup = read(STARTUP_FILE);
if (startup) {
  if (/setStyleIsolation\(\s*[^)]*===\s*true\s*\)/.test(startup)) {
    failures.push(
      'kernel-startup.ts: 存在 `setStyleIsolation(x === true)` 写法。' +
        '该形式会把 undefined（未传参）误判为 false 而关闭隔离；' +
        '应改为仅在显式传入 false 时关闭。',
    );
  }
  if (!/setStyleIsolation\(/.test(startup)) {
    warnings.push('kernel-startup.ts: 未找到 setStyleIsolation 调用，请确认隔离开关仍被接线');
  }
}

// ---------- 3. 失败分支必须上报 ----------
const cssScope = read(CSS_SCOPE_FILE);
if (cssScope) {
  if (!/reportCssScopeFailure|logger\.warn|logger\.error/.test(cssScope)) {
    failures.push(
      'runtime-css-scope.ts: 跨域/解析失败分支未做任何上报。' +
        '线上样式污染必须可观测，请通过 logger.warn 上报告警（按应用去重）。',
    );
  }
  // catch 块不应为空
  const emptyCatch = /catch\s*(?:\([^)]*\))?\s*\{\s*\}/.exec(cssScope);
  if (emptyCatch) {
    failures.push('runtime-css-scope.ts: 存在空 catch 块，失败被静默吞掉');
  }
}

// ---------- 输出 ----------
if (warnings.length > 0) {
  for (const w of warnings) console.warn(`⚠️  ${w}`);
}

if (failures.length > 0) {
  console.error('❌ 样式隔离默认值检查未通过：');
  for (const f of failures) console.error(`  - ${f}`);
  console.error(
    '  修复参考：app-state.ts 默认 true；kernel-startup.ts 仅显式 false 时关闭；' +
      'runtime-css-scope.ts 失败时 logger.warn。',
  );
  process.exit(1);
}

console.log('✅ 样式隔离默认值通过：默认开启 + 启动开关正确 + 失败可观测');
