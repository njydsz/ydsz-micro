/**
 * check-bundle — 产物共享依赖重复打包检测
 *
 * importmap 外部化的共享依赖（vue / element-plus / vxe-table 等）必须以
 * bare import 形式出现在构建产物中（运行时由浏览器按 importmap 解析为唯一实例）。
 * 若某应用产物中完全找不到对应 bare import，说明该依赖被误打包进 chunk，
 * 将导致主/子应用出现双实例（provide/inject 与全局状态割裂）。
 *
 * 检查逻辑（产物级，与构建期 bundle-budget 插件互补）：
 * 1. 扫描 main 与 apps 各应用的 dist 产物
 * 2. 读取各应用 package.json 的 YDSZ.shareStrategy 确定应外置的依赖集
 * 3. 对每个应外置依赖，检测产物中是否存在 bare import 证据
 *    （from"dep" / from'dep' / import("dep") / import('dep')）
 * 4. 应用声明了依赖但产物零证据 → 判定为误打包，报错退出
 *
 * @path bash\vsh\src\check-bundle\index.ts
 * @author ydsz-team
 * @since 4.4.0
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export interface BundleViolation {
  /** 应用名（目录名） */
  app: string;
  /** 依赖名 */
  dep: string;
  /** 说明 */
  message: string;
}

/** 共享依赖清单镜像（与 conf/vite-config/src/micro-shared-deps.ts 保持一致，避免跨包 import） */
const CORE_DEPS = ['vue', 'vue-router', 'pinia'];
const UI_DEPS = ['element-plus', '@element-plus/icons-vue', 'vxe-table', 'vxe-pc-ui'];

/** 策略 → 应外置依赖集（与 STRATEGY_MAP 对齐） */
const STRATEGY_MAP: Record<string, string[]> = {
  core: CORE_DEPS,
  'core-ui': [...CORE_DEPS, ...UI_DEPS],
  all: [...CORE_DEPS, ...UI_DEPS, 'axios', 'echarts', 'dayjs', 'vue-demi'],
};

/** 生成检测某依赖 bare import 的正则 */
function bareImportRegex(dep: string): RegExp {
  const escaped = dep.replaceAll('/', '\\/');
  return new RegExp(`(?:from|import)\\s*\\(?["']${escaped}["']`, 'g');
}

/** 递归收集目录下的 .js 产物路径 */
function collectJsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectJsFiles(full));
    } else if (entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * 执行产物共享依赖检测。
 *
 * @param rootDir - monorepo 根目录
 * @returns 违规列表（空数组表示通过；未构建的应用自动跳过）
 */
export function checkBundle(rootDir: string): BundleViolation[] {
  const violations: BundleViolation[] = [];
  const appDirs: Array<{ name: string; path: string }> = [
    { name: 'main-web', path: join(rootDir, 'main') },
    ...readdirSync(join(rootDir, 'apps'))
      .filter((name) => !name.startsWith('.'))
      .map((name) => ({ name, path: join(rootDir, 'apps', name) })),
  ];

  for (const app of appDirs) {
    const distDir = join(app.path, 'dist');
    if (!existsSync(distDir) || !statSync(distDir, { throwIfNoEntry: false })?.isDirectory()) {
      continue; // 未构建则跳过
    }

    // 读取应用共享策略（默认 all，与 vite-config 行为一致）
    let strategy = 'all';
    try {
      const pkg = JSON.parse(readFileSync(join(app.path, 'package.json'), 'utf-8')) as {
        YDSZ?: { shareStrategy?: string };
      };
      strategy = pkg.YDSZ?.shareStrategy || 'all';
    } catch {
      // package.json 缺失时保守使用默认策略
    }

    const expectedDeps = STRATEGY_MAP[strategy] || STRATEGY_MAP.all;
    const jsFiles = collectJsFiles(distDir);
    if (jsFiles.length === 0) continue;

    // 拼接全部产物内容做一次性检测（产物总量有限，内存可承受）
    const bundleContent = jsFiles.map((f) => readFileSync(f, 'utf-8')).join('\n');

    for (const dep of expectedDeps) {
      const evidence = bareImportRegex(dep).test(bundleContent);
      if (!evidence) {
        violations.push({
          app: app.name,
          dep,
          message: `策略 "${strategy}" 要求 ${dep} 经 importmap 外置，但产物中未发现 bare import —— 疑似被误打包（将导致双实例）`,
        });
      }
    }
  }

  return violations;
}
