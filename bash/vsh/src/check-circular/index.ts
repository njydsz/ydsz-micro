/**
 * @file vsh check-circular - 循环依赖检测工具
 * @author YDSZ Team
 * @since 2026-08-23
 * @description 检测项目中的循环依赖，确保模块依赖图无环。
 *              2026-08-24 重构：
 *                - 移除对 @typescript-eslint/typescript-estree 的硬编码依赖（改为正则提取 specifier，零第三方依赖）；
 *                - 复用 tsconfig.paths.json 解析 @ydsz/@YDSZ-core 别名，并支持 #/ 包内别名；
 *                - 修复原 resolveImport 对 #/ 直接 return null、@ 前缀错误拼接导致的「主路径循环检测失明」问题；
 *                - 默认递归收集 main/apps/comm 全部源码文件参与构图。
 */

import { readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { collectSourceFiles, loadPathMapping, resolveSpecifier, extractSpecifiers } from '../shared/fs-path.ts';

/** 依赖图 */
type DependencyGraph = Map<string, Set<string>>;

/** 循环依赖结果 */
interface CircularDependency {
  cycle: string[];
  description: string;
}

/**
 * 解析文件中的 import 依赖 specifier（正则提取，覆盖 .ts / .vue）。
 */
function parseImports(filePath: string): string[] {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return extractSpecifiers(content);
  } catch {
    return [];
  }
}

/**
 * 构建依赖图（仅纳入项目内文件，第三方包忽略）。
 */
function buildDependencyGraph(
  filePath: string,
  graph: DependencyGraph,
  visited: Set<string>,
  rootDir: string,
  paths: Record<string, string[]>,
): void {
  const resolvedPath = resolve(filePath);
  if (visited.has(resolvedPath)) return;
  visited.add(resolvedPath);

  if (!graph.has(resolvedPath)) {
    graph.set(resolvedPath, new Set());
  }

  const imports = parseImports(filePath);
  for (const imp of imports) {
    const resolvedImport = resolveSpecifier(imp, filePath, rootDir, paths);
    if (resolvedImport) {
      graph.get(resolvedPath)!.add(resolvedImport);
      if (!visited.has(resolvedImport)) {
        buildDependencyGraph(resolvedImport, graph, visited, rootDir, paths);
      }
    }
  }
}

/**
 * 使用 DFS 检测循环依赖
 */
function detectCycles(graph: DependencyGraph, rootDir: string): CircularDependency[] {
  const cycles: CircularDependency[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): void {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) ?? new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recursionStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart);
        // 跳过单节点自环（A -> A，通常由 barrel 重导出 / #/ 别名解析回自身导致，非架构问题）
        if (cycle.length <= 1) continue;
        cycles.push({
          cycle: [...cycle, neighbor],
          description:
            cycle.map((p) => relative(rootDir, p)).join(' → ') +
            ` → ${relative(rootDir, neighbor)}`,
        });
      }
    }

    path.pop();
    recursionStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

/**
 * 执行循环依赖检测
 */
export async function checkCircular(options: {
  rootDir?: string;
  files?: string[];
}): Promise<CircularDependency[]> {
  const rootDir = options.rootDir ?? process.cwd();
  const graph: DependencyGraph = new Map();
  const visited = new Set<string>();
  const paths = loadPathMapping(rootDir);

  const files = options.files ?? collectSourceFiles(rootDir);
  for (const file of files) {
    buildDependencyGraph(file, graph, visited, rootDir, paths);
  }

  return detectCycles(graph, rootDir);
}

// CLI 入口
if (import.meta.url === `file://${process.argv[1]}`) {
  const rootDir = resolve(process.argv[2] ?? process.cwd());
  console.log(`🔍 执行循环依赖检测: ${rootDir}`);
  checkCircular({ rootDir })
    .then((cycles) => {
      if (cycles.length === 0) {
        console.log('✅ 循环依赖检测通过：未发现循环');
        process.exit(0);
      }
      console.error(`❌ 发现 ${cycles.length} 处循环依赖:\n`);
      for (const c of cycles) {
        console.error(`  循环: ${c.description}`);
      }
      process.exit(1);
    })
    .catch((err) => {
      console.error('循环依赖检测出错:', err);
      process.exit(2);
    });
}
