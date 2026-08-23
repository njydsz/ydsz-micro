/**
 * @file vsh check-circular - 循环依赖检测工具
 * @author YDSZ Team
 * @since 2026-08-23
 * @description 检测项目中的循环依赖，确保模块依赖图无环
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import * as parser from '@typescript-eslint/typescript-estree';

/** 依赖图 */
type DependencyGraph = Map<string, Set<string>>;

/** 循环依赖结果 */
interface CircularDependency {
  cycle: string[];
  description: string;
}

/**
 * 解析文件中的 import 依赖
 */
function parseImports(filePath: string): string[] {
  const imports: string[] = [];
  const content = readFileSync(filePath, 'utf-8');

  try {
    const ast = parser.parse(content, {
      jsx: true,
      loc: false,
      range: false,
    });

    for (const node of ast.body) {
      if (node.type === 'ImportDeclaration') {
        imports.push(node.source.value as string);
      } else if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportAllDeclaration') {
        if (node.source) {
          imports.push(node.source.value as string);
        }
      }
    }
  } catch {
    // 解析失败时使用正则兜底
    const importRegex = /import\s+(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g;
    let match = importRegex.exec(content);
    while (match) {
      imports.push(match[1]);
      match = importRegex.exec(content);
    }
  }

  return imports;
}

/**
 * 构建依赖图
 */
function buildDependencyGraph(
  filePath: string,
  graph: DependencyGraph,
  visited: Set<string>,
  rootDir: string,
): void {
  const resolvedPath = resolve(filePath);
  if (visited.has(resolvedPath)) return;
  visited.add(resolvedPath);

  if (!graph.has(resolvedPath)) {
    graph.set(resolvedPath, new Set());
  }

  const imports = parseImports(filePath);
  const fileDir = dirname(resolvedPath);

  for (const imp of imports) {
    // 只分析相对路径和别名路径
    if (imp.startsWith('.') || imp.startsWith('@')) {
      const resolvedImport = resolveImport(imp, fileDir, rootDir);
      if (resolvedImport) {
        graph.get(resolvedPath)!.add(resolvedImport);
        if (!visited.has(resolvedImport)) {
          buildDependencyGraph(resolvedImport, graph, visited, rootDir);
        }
      }
    }
  }
}

/**
 * 解析导入路径
 */
function resolveImport(importPath: string, fileDir: string, rootDir: string): string | null {
  if (importPath.startsWith('.')) {
    return resolve(fileDir, importPath);
  }
  // 处理别名路径
  if (importPath.startsWith('@')) {
    return resolve(rootDir, 'src', importPath.replace(/^@[^/]+\//, ''));
  }
  return null;
}

/**
 * 使用 DFS 检测循环依赖
 */
function detectCycles(graph: DependencyGraph): CircularDependency[] {
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
        // 发现循环
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart);
        cycles.push({
          cycle: [...cycle, neighbor],
          description: cycle.map(p => relative(process.cwd(), p)).join(' → ') + ` → ${relative(process.cwd(), neighbor)}`,
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

  if (options.files) {
    for (const file of options.files) {
      buildDependencyGraph(file, graph, visited, rootDir);
    }
  }

  return detectCycles(graph);
}

// CLI 入口
if (import.meta.url === `file://${process.argv[1]}`) {
  const rootDir = process.argv[2] ?? process.cwd();
  console.log(`🔍 执行循环依赖检测: ${rootDir}`);
  checkCircular({ rootDir })
    .then(cycles => {
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
    .catch(err => {
      console.error('循环依赖检测出错:', err);
      process.exit(2);
    });
}
