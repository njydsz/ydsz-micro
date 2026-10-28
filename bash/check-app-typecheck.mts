#!/usr/bin/env node
/**
 * 前端类型门禁（棘轮）：10 个 apps/* 应用 + 自带 type-check 的 comm 包，类型错误数只减不增。
 *
 * 为什么需要它（报告 B1-6）：仓库根 `type-check` = `turbo type-check`，而 turbo 只调度
 * "**定义了该任务**"的包。实测 10 个 `apps/*` 应用的 package.json 一个 `type-check` 都没有，
 * 于是 9 个业务应用 + docs-site 的 `.vue` 从来没被类型检查过（`tsc --noEmit` 本身也不看 .vue）；
 * CI 的 `pnpm type-check` 因此常年绿灯却什么都没查。
 *
 * 为什么做棘轮而不是直接"清零即红"：实测存量 = 10 个应用 7,012 条 + comm 包若干，直接判红
 * 就是恒红的假门禁。沿用本仓 checkstyle 的棘轮口径：
 *
 *   T1 每个目标的错误数不得高于基线（新增错误立即判红）
 *   T2 错误数下降时打印建议值，`--update-baseline` 由人复核后下调（只可下调，锁定成果）
 *   T3 fail-closed：基线里没有的新目标、或基线里有却没扫到的目标，一律判错
 *
 * 用法：
 *   node ./bash/check-app-typecheck.mts                       # 判（CI 用）
 *   node ./bash/check-app-typecheck.mts --self-test           # 自检（反例夹具）
 *   node ./bash/check-app-typecheck.mts --update-baseline     # 人复核后刷新基线
 *   node ./bash/check-app-typecheck.mts --only=app/system-web # 局部复跑（豁免"漏扫"判定）
 * 退出码：0 通过；1 存在回退；2 门禁前提不成立（基线缺失、漏扫等）。
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const APPS_DIR = path.join(ROOT, 'apps')
const BASELINE_FILE = path.join(ROOT, 'conf', 'typecheck-baseline.json')
const VUE_TSC = path.join(ROOT, 'node_modules', 'vue-tsc', 'bin', 'vue-tsc.js')
const TSC = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc')

/** 一个被度量的目标：应用（vue-tsc 看 .vue）或 comm 包（自身 tsc --noEmit）。 */
interface Target {
  key: string
  kind: 'app' | 'pkg'
  /** 相对仓库根的目录（仅用于日志） */
  dir: string
  /** 传给子进程的参数 */
  args: string[]
  /** 子进程工作目录 */
  cwd: string
}

export interface TargetResult {
  key: string
  errors: number
  output: string
}

/** 统计诊断行数：`xxx.ts(1,2): error TS1234: ...`，不匹配收尾的 "Found N errors." */
export function countErrors(output: string): number {
  const matches = output.match(/(?:^|\n)[^\n]* error TS\d+: /g)
  return matches ? matches.length : 0
}

export interface Evaluation {
  violations: string[]
  suggestions: string[]
  missing: string[]
}

/** 基线比较：上涨判红、下降给建议、新目标 fail-closed。 */
export function evaluate(results: TargetResult[], baseline: Record<string, number>): Evaluation {
  const violations: string[] = []
  const suggestions: string[] = []
  const missing: string[] = []
  const seen = new Set<string>()
  for (const r of results) {
    seen.add(r.key)
    if (!(r.key in baseline)) {
      violations.push(`${r.key}: 基线中不存在该目标（新目标必须先显式登记，当前 ${r.errors} 条）`)
      continue
    }
    const limit = baseline[r.key]
    if (r.errors > limit) {
      violations.push(`${r.key}: ${r.errors} 条 > 基线 ${limit} 条`)
    } else if (r.errors < limit) {
      suggestions.push(`${r.key}: ${r.errors} 条 < 基线 ${limit} 条，可下调基线`)
    }
  }
  for (const key of Object.keys(baseline)) {
    if (!seen.has(key)) {
      missing.push(`${key}: 基线里有，但本次没扫到（tsconfig 缺失或 --only 过滤）`)
    }
  }
  return { violations, suggestions, missing }
}

function discoverTargets(): Target[] {
  const targets: Target[] = []
  if (fs.existsSync(APPS_DIR)) {
    for (const entry of fs.readdirSync(APPS_DIR, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory()) continue
      const dir = path.join(APPS_DIR, entry.name)
      const tsconfig = path.join(dir, 'tsconfig.json')
      if (!fs.existsSync(tsconfig)) continue
      targets.push({
        key: `app/${entry.name}`,
        kind: 'app',
        dir: path.relative(ROOT, dir),
        args: [VUE_TSC, '--noEmit', '-p', tsconfig],
        cwd: ROOT
      })
    }
  }
  // comm 下"自己声明了 type-check 脚本"的包：沿用各包自己的口径（当前均为 tsc --noEmit）
  const commDir = path.join(ROOT, 'comm')
  const walk = (dir: string, depth: number) => {
    if (depth > 3 || !fs.existsSync(dir)) return
    const pkgJson = path.join(dir, 'package.json')
    if (fs.existsSync(pkgJson)) {
      const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8')) as { scripts?: Record<string, string> }
      if (pkg.scripts?.['type-check']) {
        targets.push({
          key: `pkg/${path.relative(ROOT, dir).replace(/\\/g, '/')}`,
          kind: 'pkg',
          dir: path.relative(ROOT, dir),
          args: [TSC, '--noEmit'],
          cwd: dir
        })
        return
      }
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === 'node_modules') continue
      walk(path.join(dir, entry.name), depth + 1)
    }
  }
  walk(commDir, 0)
  return targets
}

function runTarget(target: Target): Promise<TargetResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, target.args, {
      cwd: target.cwd,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let out = ''
    child.stdout.on('data', (d) => (out += d.toString()))
    child.stderr.on('data', (d) => (out += d.toString()))
    child.on('close', () => resolve({ key: target.key, errors: countErrors(out), output: out }))
  })
}

async function runAll(targets: Target[], concurrency: number): Promise<TargetResult[]> {
  const queue = [...targets]
  const results: TargetResult[] = []
  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, queue.length)) }, async () => {
    while (queue.length > 0) {
      const target = queue.shift()!
      results.push(await runTarget(target))
    }
  })
  await Promise.all(workers)
  return results.sort((a, b) => a.key.localeCompare(b.key))
}

function selfTest(): number {
  const failures: string[] = []
  const check = (name: string, ok: boolean) => {
    if (!ok) failures.push(name)
  }

  check('计数：诊断行', countErrors('a.ts(1,2): error TS2322: x\nb.ts(3,4): error TS6133: y\nFound 2 errors.') === 2)
  check('计数：无错误输出为 0', countErrors('Found 0 errors.') === 0)
  check('计数：不把收尾行当诊断', countErrors('src/a.ts(1,1): error TS1: x\nFound 1 errors.') === 1)

  const base = { 'app/a-web': 10, 'pkg/comm/x': 0 }
  check('上涨判红', evaluate([{ key: 'app/a-web', errors: 11, output: '' }], base).violations.length === 1)
  check('下降给建议', evaluate([{ key: 'app/a-web', errors: 9, output: '' }], base).suggestions.length === 1)
  check('持平不判红', evaluate([{ key: 'pkg/comm/x', errors: 0, output: '' }], base).violations.length === 0)
  check('新目标未登记 → 判红', evaluate([{ key: 'app/c-web', errors: 0, output: '' }], base).violations.length === 1)
  check(
    '基线内目标漏扫 → missing',
    evaluate([{ key: 'app/a-web', errors: 10, output: '' }], base).missing.some((m) => m.startsWith('pkg/comm/x'))
  )

  console.log(`自检结果：${failures.length === 0 ? '全部通过' : `${failures.length} 条未通过`}`)
  for (const f of failures) console.error(`  ✗ ${f}`)
  return failures.length === 0 ? 0 : 1
}

function loadBaseline(): Record<string, number> {
  if (!fs.existsSync(BASELINE_FILE)) {
    console.error(`❌ 基线文件不存在：${BASELINE_FILE}（先跑 --update-baseline 并由人复核）`)
    process.exit(2)
  }
  return JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8')) as Record<string, number>
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  if (argv.includes('--self-test')) return selfTest()

  const update = argv.includes('--update-baseline')
  const onlyArg = argv.find((a) => a.startsWith('--only='))
  const all = discoverTargets()
  if (all.length === 0) {
    console.error('❌ 一个目标都没扫到 —— 扫不到不等于没问题（fail-closed）')
    return 2
  }
  const wanted = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').filter(Boolean)) : null
  const targets = wanted ? all.filter((t) => wanted.has(t.key)) : all
  if (targets.length === 0) {
    console.error(`❌ --only 没有匹配到任何目标：${[...(wanted ?? [])].join(', ')}`)
    return 2
  }

  const concurrency = Number(process.env.TYPECHECK_CONCURRENCY || 4)
  console.log(`类型检查 ${targets.length}/${all.length} 个目标（并发 ${concurrency}）`)
  const results = await runAll(targets, concurrency)

  const total = results.reduce((s, r) => s + r.errors, 0)
  if (update) {
    const baseline: Record<string, number> = {}
    for (const r of results) baseline[r.key] = r.errors
    fs.mkdirSync(path.dirname(BASELINE_FILE), { recursive: true })
    fs.writeFileSync(BASELINE_FILE, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8')
    console.log(`✅ 已写入基线 ${BASELINE_FILE}（${results.length} 个目标，合计 ${total} 条）`)
    return 0
  }

  const baseline = loadBaseline()
  const { violations, suggestions, missing } = evaluate(results, baseline)
  // --only 是人工局部复跑：此时"其余目标没扫到"是预期行为；全量跑才 fail-closed。
  const effectiveMissing = wanted ? [] : missing
  for (const r of results) console.log(`   ${r.key}: ${r.errors} 条`)
  console.log(`合计 ${total} 条类型错误`)

  if (effectiveMissing.length > 0) {
    console.error('❌ 基线内目标未扫到（fail-closed）：')
    for (const m of effectiveMissing) console.error(`   ${m}`)
    return 2
  }
  if (violations.length > 0) {
    console.error('❌ 类型错误上涨（棘轮只可下调）：')
    for (const v of violations) console.error(`   ${v}`)
    return 1
  }
  for (const s of suggestions) console.log(`ℹ️ 可下调基线：${s}`)
  console.log('✅ 类型门禁通过（各目标错误数未上涨）')
  return 0
}

main().then((code) => process.exit(code))
