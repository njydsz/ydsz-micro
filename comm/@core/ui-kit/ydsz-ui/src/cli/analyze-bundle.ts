#!/usr/bin/env node
/**
 * ydsz-analyze-bundle —— 分析 ydsz-ui 组件 tree-shaking 后体积
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\cli\analyze-bundle.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve, extname } from 'node:path'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ComponentStat {
  name: string
  fileCount: number
  totalLines: number
  estimatedGzip: string
  priority: 'P0' | 'P1' | 'P2'
}

interface RawArg {
  key: string
  value: string | boolean
}

// ---------------------------------------------------------------------------
// Priority mapping
// ---------------------------------------------------------------------------

const P0_COMPONENTS = new Set([
  'button', 'input', 'select', 'checkbox', 'dialog', 'tooltip', 'card',
  'form', 'table', 'config-provider', 'textarea', 'switch', 'tabs', 'badge',
  'avatar', 'separator', 'label', 'pagination', 'scroll-area', 'dropdown',
  'popover',
])

const P1_COMPONENTS = new Set([
  'alert', 'alert-dialog', 'anchor', 'auto-complete', 'breadcrumb',
  'bulk-actions', 'calendar', 'cascader', 'collapse', 'color-picker',
  'date-picker', 'descriptions', 'divider', 'dropdown-menu', 'empty',
  'hover-card', 'image', 'input-group', 'input-mask', 'input-number',
  'link', 'list', 'menu', 'message', 'notification', 'number-field',
  'page-header', 'pin-input', 'popconfirm', 'progress', 'radio-group',
  'rate', 'resizable', 'result', 'segmented', 'sheet', 'skeleton',
  'slider', 'space', 'spin', 'splitter', 'statistic', 'stepper', 'steps',
  'tag', 'time-picker', 'timeline', 'toggle', 'toolbar', 'tour', 'transfer',
  'tree', 'tree-select', 'typography', 'upload', 'watermark', 'toggle-group',
  'mention', 'context-menu', 'order-list', 'range-picker', 'countdown',
  'count-tag',
])

function getPriority(componentName: string): 'P0' | 'P1' | 'P2' {
  if (P0_COMPONENTS.has(componentName)) return 'P0'
  if (P1_COMPONENTS.has(componentName)) return 'P1'
  return 'P2'
}

// ---------------------------------------------------------------------------
// File scanning
// ---------------------------------------------------------------------------

function isVueFile(filename: string): boolean {
  return extname(filename) === '.vue'
}

function isTsFile(filename: string): boolean {
  return extname(filename) === '.ts' || extname(filename) === '.tsx'
}

function countLines(filePath: string): number {
  try {
    const content = readFileSync(filePath, 'utf-8')
    return content.split('\n').length
  } catch {
    return 0
  }
}

function scanComponentDir(dirPath: string): { fileCount: number; totalLines: number } {
  let fileCount = 0
  let totalLines = 0

  if (!existsSync(dirPath)) {
    return { fileCount: 0, totalLines: 0 }
  }

  const entries = readdirSync(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue

    const fullPath = resolve(dirPath, entry.name)

    if (entry.isDirectory()) {
      const sub = scanComponentDir(fullPath)
      fileCount += sub.fileCount
      totalLines += sub.totalLines
    } else if (entry.isFile() && (isVueFile(entry.name) || isTsFile(entry.name))) {
      fileCount++
      totalLines += countLines(fullPath)
    }
  }

  return { fileCount, totalLines }
}

// ---------------------------------------------------------------------------
// Argument parser
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): RawArg[] {
  const result: RawArg[] = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=')
      if (eqIdx !== -1) {
        result.push({ key: arg.slice(2, eqIdx), value: arg.slice(eqIdx + 1) })
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
        result.push({ key: arg.slice(2), value: argv[++i] })
      } else {
        result.push({ key: arg.slice(2), value: true })
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
        result.push({ key: arg.slice(1), value: argv[++i] })
      } else {
        result.push({ key: arg.slice(1), value: true })
      }
    } else if (arg !== '') {
      result.push({ key: '_', value: arg })
    }
  }
  return result
}

function getArg(args: RawArg[], keys: string[]): string | boolean | undefined {
  for (const key of keys) {
    const found = args.find((a) => a.key === key)
    if (found !== undefined) return found.value
  }
  return undefined
}

function showHelp(): void {
  console.log(`\nydsz-analyze-bundle —— 分析 ydsz-ui 组件 tree-shaking 后体积\n\n用法:\n  ydsz-analyze [选项]\n\n选项:\n  --format, -f     输出格式: markdown | json   (默认: markdown)\n  --dir, -d        指定扫描根目录              (默认: 自动定位 src/)\n  --filter, -F     按优先级过滤: P0 | P1 | P2\n  --help, -h       显示帮助\n  --version, -v    显示版本\n\n示例:\n  ydsz-analyze\n  ydsz-analyze --format json\n  ydsz-analyze --filter P0\n`)
}

function showVersion(): void {
  console.log('ydsz-analyze v1.0.0')
}

// ---------------------------------------------------------------------------
// Output formatters
// ---------------------------------------------------------------------------

function estimateGzip(totalLines: number): string {
  const kb = (totalLines / 100) * 3.5
  return `${kb.toFixed(1)}kb`
}

function formatMarkdown(stats: ComponentStat[]): string {
  const lines: string[] = []

  lines.push('')
  lines.push('## Bundle Analysis Report')
  lines.push('')
  lines.push('| 组件 | 文件数 | 行数 | 估算 gzip | 优先级 |')
  lines.push('|------|--------|------|-----------|--------|')

  let totalFiles = 0
  let totalLinesAll = 0
  let totalGzipKb = 0

  for (const stat of stats) {
    const gzipKb = (stat.totalLines / 100) * 3.5
    totalFiles += stat.fileCount
    totalLinesAll += stat.totalLines
    totalGzipKb += gzipKb

    const priorityBadge = stat.priority === 'P0' ? '**P0**' : stat.priority === 'P1' ? 'P1' : 'P2'
    lines.push(
      `| ${stat.name} | ${stat.fileCount} | ${stat.totalLines} | ${stat.estimatedGzip} | ${priorityBadge} |`,
    )
  }

  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push('| 指标 | 数值 |')
  lines.push('|------|------|')
  lines.push(`| 总组件数 | ${stats.length} |`)
  lines.push(`| 总文件数 | ${totalFiles} |`)
  lines.push(`| 总行数 | ${totalLinesAll} |`)
  lines.push(`| 总估算 gzip | ${totalGzipKb.toFixed(1)}kb |`)
  lines.push('')

  const p0Count = stats.filter((s) => s.priority === 'P0').length
  const p1Count = stats.filter((s) => s.priority === 'P1').length
  const p2Count = stats.filter((s) => s.priority === 'P2').length

  lines.push('## Priority Breakdown')
  lines.push('')
  lines.push(`- **P0** (核心高频): ${p0Count} 组件`)
  lines.push(`- **P1** (常用): ${p1Count} 组件`)
  lines.push(`- **P2** (其他): ${p2Count} 组件`)
  lines.push('')

  return lines.join('\n')
}

function formatJson(stats: ComponentStat[]): string {
  const totalFiles = stats.reduce((sum, s) => sum + s.fileCount, 0)
  const totalLinesAll = stats.reduce((sum, s) => sum + s.totalLines, 0)
  const totalGzipKb = stats.reduce((sum, s) => sum + (s.totalLines / 100) * 3.5, 0)

  return JSON.stringify(
    {
      summary: {
        totalComponents: stats.length,
        totalFiles,
        totalLines: totalLinesAll,
        estimatedGzipKb: Math.round(totalGzipKb * 10) / 10,
        priorityBreakdown: {
          P0: stats.filter((s) => s.priority === 'P0').length,
          P1: stats.filter((s) => s.priority === 'P1').length,
          P2: stats.filter((s) => s.priority === 'P2').length,
        },
      },
      components: stats,
    },
    null,
    2,
  )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function findProjectRoot(): string {
  let current = process.cwd()
  const root = resolve(current, '/')

  while (current !== root) {
    const pkgPath = resolve(current, 'package.json')
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        if (pkg.name === '@ydsz-core/ydsz-ui') {
          return current
        }
      } catch {
        // continue walking up
      }
    }
    current = resolve(current, '..')
  }

  return process.cwd()
}

function main(): void {
  const raw = parseArgs(process.argv.slice(2))

  if (getArg(raw, ['h', 'help']) !== undefined) {
    showHelp()
    return
  }
  if (getArg(raw, ['v', 'version']) !== undefined) {
    showVersion()
    return
  }

  const dirArg = getArg(raw, ['d', 'dir'])
  let scanRoot: string
  if (typeof dirArg === 'string') {
    scanRoot = resolve(process.cwd(), dirArg)
  } else {
    scanRoot = findProjectRoot()
  }

  const formatArg = getArg(raw, ['f', 'format'])
  const format: 'markdown' | 'json' =
    formatArg === 'json' ? 'json' : 'markdown'

  const filterArg = getArg(raw, ['F', 'filter'])
  const filter: 'P0' | 'P1' | 'P2' | undefined =
    filterArg === 'P0' || filterArg === 'P1' || filterArg === 'P2'
      ? filterArg
      : undefined

  if (!existsSync(scanRoot)) {
    console.error(`错误: 目录不存在 ${scanRoot}`)
    process.exit(1)
  }

  const primitivesDir = resolve(scanRoot, 'src/primitives')
  const componentsDir = resolve(scanRoot, 'src/components')

  const stats: ComponentStat[] = []

  function scanRootDir(rootDir: string): void {
    if (!existsSync(rootDir)) return

    const entries = readdirSync(rootDir, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue

      const componentPath = resolve(rootDir, entry.name)
      const { fileCount, totalLines } = scanComponentDir(componentPath)

      if (fileCount > 0) {
        stats.push({
          name: entry.name,
          fileCount,
          totalLines,
          estimatedGzip: estimateGzip(totalLines),
          priority: getPriority(entry.name),
        })
      }
    }
  }

  scanRootDir(primitivesDir)
  scanRootDir(componentsDir)

  stats.sort((a, b) => {
    const priorityOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2 }
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (pDiff !== 0) return pDiff
    return b.totalLines - a.totalLines
  })

  const filteredStats = filter
    ? stats.filter((s) => s.priority === filter)
    : stats

  if (format === 'json') {
    console.log(formatJson(filteredStats))
  } else {
    console.log(formatMarkdown(filteredStats))
  }
}

main()
