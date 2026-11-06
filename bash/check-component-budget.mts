/**
 * 组件级体积预算检查器。
 *
 * <p>扫描 ydsz-ui / ydsz-vue / chart-ui 的源码文件，按组件目录统计代码行数，
 * 对超过预算阈值的组件发出警告。用于防止单组件膨胀。
 *
 * <p>用法：
 * <pre>{@code
 * # 运行体积预算检查
 * node --experimental-strip-types bash/check-component-budget.mts
 *
 * # 自定义阈值（行数）
 * node --experimental-strip-types bash/check-component-budget.mts --max-lines=300
 * }</pre>
 *
 * @path bash\check-component-budget.mts
 * @author ydsz-team
 * @since 1.0.0
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

// ===== 配置 =====

interface BudgetOptions {
  /** 单文件最大行数 */
  maxLines: number;
  /** 单组件目录最大总行数 */
  maxTotalLines: number;
  /** 是否将警告视为错误退出 */
  strict: boolean;
}

const DEFAULT_OPTIONS: BudgetOptions = {
  maxLines: 500,
  maxTotalLines: 2000,
  strict: false,
};

/** 需要检查的包目录 */
const PACKAGES = [
  { name: 'ydsz-ui', path: 'comm/@core/ui-kit/ydsz-ui/src/components' },
  { name: 'ydsz-vue', path: 'comm/@core/ui-kit/ydsz-vue/src' },
  { name: 'chart-ui', path: 'comm/@core/ui-kit/chart-ui/src/components' },
];

/** 跳过的文件模式 */
const SKIP_PATTERNS = ['.test.', '.stories.', '.story.', '-types.ts', 'types.ts'];

/**
 * 体积预算豁免清单。
 *
 * <p>以下文件为上游 fork（radix-vue 等）来源，按 CLAUDE.md STL-004
 * 「禁止直接修改上游 fork 文件（上游同步冲突豁免）」原则，不参与行数门禁。
 *
 * <p>新增豁免必须附上游来源与豁免理由。
 */
const EXEMPT_FILES: string[] = [
  // radix-vue SplitterGroup：拖拽/持久化/键盘导航高度耦合，拆行会破坏上游同步
  'Splitter/SplitterGroup.vue',
];

// ===== 类型定义 =====

interface FileStat {
  path: string;
  lines: number;
  /** 脚本行数（不含 template / style） */
  scriptLines: number;
  /** 模板行数 */
  templateLines: number;
}

interface ComponentStat {
  name: string;
  package: string;
  files: FileStat[];
  totalLines: number;
  /** 脚本总行数 */
  totalScriptLines: number;
  /** 模板总行数 */
  totalTemplateLines: number;
}

interface BudgetReport {
  violations: Array<{
    type: 'file' | 'component';
    name: string;
    lines: number;
    /** 脚本行数（判断 SFC-006 时以此为准） */
    scriptLines: number;
    limit: number;
    package: string;
    /** 超标原因 */
    reason: 'script' | 'total';
  }>;
  stats: ComponentStat[];
}

// ===== 工具函数 =====

/**
 * 统计文件的总行数与脚本行数。
 *
 * <p>脚本行数 = 总行数 - template 块 - style 块。
 * SFC-006 关注的是逻辑膨胀，模板复杂度是组件固有特性，因此
 * 单文件判定以脚本行数为准，总量判定仍以总行数为准。
 */
async function countLines(
  filePath: string,
): Promise<{ lines: number; scriptLines: number; templateLines: number }> {
  const content = await readFile(filePath, 'utf-8');
  const total = content.split('\n').length;

  // 提取 template 块行数
  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
  const templateLines = templateMatch ? templateMatch[1].split('\n').length : 0;

  // 提取 style 块行数
  const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  const styleLines = styleMatch ? styleMatch[1].split('\n').length : 0;

  return {
    lines: total,
    scriptLines: Math.max(1, total - templateLines - styleLines),
    templateLines,
  };
}

/**
 * 扫描目录下所有 .vue / .ts 文件。
 */
async function scanFiles(dir: string): Promise<FileStat[]> {
  const results: FileStat[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await scanFiles(fullPath)));
    } else if (
      (entry.name.endsWith('.vue') || entry.name.endsWith('.ts')) &&
      !SKIP_PATTERNS.some((p) => entry.name.includes(p)) &&
      !EXEMPT_FILES.some((p) => entry.name === p || fullPath.replaceAll('\\', '/').includes(p))
    ) {
      const { lines, scriptLines, templateLines } = await countLines(fullPath);
      results.push({ lines, path: fullPath, scriptLines, templateLines });
    }
  }

  return results;
}

/**
 * 按组件目录分组统计。
 */
function groupByComponent(
  files: FileStat[],
  packagePath: string,
  packageName: string,
): ComponentStat[] {
  const groups = new Map<string, FileStat[]>();

  for (const file of files) {
    // 取 src/ 下的第一级子目录作为组件名
    const rel = relative(packagePath, file.path);
    const parts = rel.split(/[\\/]/);
    const componentName = parts.length > 1 ? parts[0] : '_root';

    const existing = groups.get(componentName) ?? [];
    existing.push(file);
    groups.set(componentName, existing);
  }

  return Array.from(groups.entries()).map(([name, componentFiles]) => ({
    files: componentFiles,
    name,
    package: packageName,
    totalLines: componentFiles.reduce((sum, f) => sum + f.lines, 0),
    totalScriptLines: componentFiles.reduce((sum, f) => sum + f.scriptLines, 0),
    totalTemplateLines: componentFiles.reduce((sum, f) => sum + f.templateLines, 0),
  }));
}

/**
 * 检查体积预算。
 */
function checkBudget(stats: ComponentStat[], options: BudgetOptions): BudgetReport {
  const violations: BudgetReport['violations'] = [];

  for (const stat of stats) {
    // 检查单组件脚本总行数
    if (stat.totalScriptLines > options.maxTotalLines) {
      violations.push({
        lines: stat.totalLines,
        limit: options.maxTotalLines,
        name: `${stat.package}/${stat.name}`,
        package: stat.package,
        reason: 'script',
        scriptLines: stat.totalScriptLines,
        type: 'component',
      });
    }

    // 检查单文件脚本行数（SFC-006 关注逻辑膨胀）
    for (const file of stat.files) {
      if (file.scriptLines > options.maxLines) {
        violations.push({
          lines: file.lines,
          limit: options.maxLines,
          name: relative(process.cwd(), file.path),
          package: stat.package,
          reason: 'script',
          scriptLines: file.scriptLines,
        });
      }
    }
  }

  return { stats, violations };
}

/**
 * 格式化输出报告。
 */
function formatReport(report: BudgetReport, options: BudgetOptions): string {
  const lines: string[] = [];

  lines.push('📊 组件体积预算报告');
  lines.push(`   阈值: 单文件 ${options.maxLines} 行 / 单组件 ${options.maxTotalLines} 行`);
  lines.push('');

  if (report.violations.length === 0) {
    lines.push('✅ 全部通过');
  } else {
    lines.push(`⚠️  ${report.violations.length} 项超出预算：`);
    lines.push('');

    for (const v of report.violations.sort((a, b) => b.scriptLines - a.scriptLines)) {
      const icon = v.type === 'component' ? '📦' : '📄';
      const ratio = ((v.scriptLines / v.limit) * 100).toFixed(0);
      lines.push(`  ${icon} ${v.name}`);
      lines.push(`     脚本 ${v.scriptLines} 行 / 总 ${v.lines} 行（${ratio}% of ${v.limit}）`);
    }
  }

  // Top 10 最大组件
  lines.push('');
  lines.push('🏆 Top 10 最大组件：');
  const top10 = [...report.stats]
    .sort((a, b) => b.totalScriptLines - a.totalScriptLines)
    .slice(0, 10);

  for (const stat of top10) {
    const status = stat.totalScriptLines > options.maxTotalLines ? '⚠️' : '✅';
    lines.push(
      `  ${status} ${stat.package}/${stat.name}: 脚本 ${stat.totalScriptLines} 行 / 模板 ${stat.totalTemplateLines} 行 / 总 ${stat.totalLines} 行 (${stat.files.length} 文件)`,
    );
  }

  return lines.join('\n');
}

// ===== 主流程 =====

async function main(): Promise<void> {
  // 解析命令行参数
  const args = process.argv.slice(2);
  const options = { ...DEFAULT_OPTIONS };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--max-lines' && args[i + 1]) {
      options.maxLines = Number.parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--max-total' && args[i + 1]) {
      options.maxTotalLines = Number.parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--strict') {
      options.strict = true;
    }
  }

  console.log('🔍 扫描组件体积...');

  const allStats: ComponentStat[] = [];

  for (const pkg of PACKAGES) {
    try {
      const files = await scanFiles(pkg.path);
      const stats = groupByComponent(files, pkg.path, pkg.name);
      allStats.push(...stats);
    } catch {
      console.warn(`⚠️ 跳过不存在的目录: ${pkg.path}`);
    }
  }

  const report = checkBudget(allStats, options);
  const output = formatReport(report, options);

  console.log(output);

  if (options.strict && report.violations.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ 体积检查失败:', error);
  process.exit(1);
});
