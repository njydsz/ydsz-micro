/**
 * 自定义 ESLint 规则：require-test-companion
 *
 * <p>强制要求 apps 下 src/views 与 src/components 内的 .vue 文件
 * 拥有同名的 .test.ts 伴生文件。未找到伴生文件时发 warning。
 *
 * <p>仓库 `pnpm lint` 带 --max-warnings=0（warning 即阻断），故引入 baseline.json
 * 作为「存量债务名单」：名单内文件跳过检查，名单外的（含新增文件）一律报警。
 * 补上伴生测试后应把对应条目从名单删除，使存量债务只减不增。
 *
 * 注意：本文件注释内不要出现「任意路径通配」（星号紧跟斜杠的形式），
 * 该序列会提前闭合块注释并让整个 ESLint 配置解析失败，导致仓库级 lint 瘫痪。
 *
 * @path conf/lint-configs/eslint-plugin-test-companion/rules/require-test-companion.mjs
 * @author ydsz-team
 * @since 26.10.14
 */

import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 需要检查伴生测试的路径匹配模式（相对于 cwd） */
const TARGET_PATTERNS = [
  /^apps\/[^/]+\/src\/views\/.*\.vue$/,
  /^apps\/[^/]+\/src\/components\/.*\.vue$/,
];

/** baseline.json 位于插件包根目录（与 rules 目录同级） */
const BASELINE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'baseline.json',
);

/**
 * 读取存量债务名单（仓库相对路径，正斜杠）。
 *
 * <p>文件缺失或损坏时按空名单处理：此时所有缺测文件都会报警，
 * 属于「门禁变严」而非「门禁空转」，符合失败方向朝前的原则。
 *
 * @returns {Set<string>} 免检文件集合
 */
function readBaseline() {
  try {
    const raw = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
    return new Set(Array.isArray(raw) ? raw : []);
  }
  catch {
    return new Set();
  }
}

const baseline = readBaseline();

/**
 * 归一化为仓库相对路径（正斜杠）。
 *
 * <p>ESLint 传入的是绝对路径，且从子目录运行时会残留上级前缀；统一切到 `apps/` 起点，
 * 使路径匹配与 baseline 查表使用同一套键，避免因 cwd 不同而门禁空转。
 *
 * @param {string} filePath - 文件绝对路径
 * @returns {string} 形如 `apps/xxx/src/views/.../Foo.vue` 的相对路径
 */
function toRepoPath(filePath) {
  return filePath.replace(/\\/g, '/').replace(/^.*?(apps\/)/, '$1');
}

/**
 * 判断文件路径是否命中目标模式。
 * @param {string} filePath - 文件的绝对路径（或相对工作区根目录的路径）
 * @returns {boolean}
 */
function isTargetFile(filePath) {
  const repoPath = toRepoPath(filePath);
  return TARGET_PATTERNS.some((p) => p.test(repoPath));
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        '要求 apps/*/src/views 和 apps/*/src/components 下的 .vue 文件拥有 .test.ts 伴生文件',
    },
    messages: {
      missingTestCompanion:
        '组件 {{ filename }} 缺少测试伴生文件 {{ basename }}.test.ts',
    },
    schema: [],
  },
  create(context) {
    return {
      Program(node) {
        const filePath = context.filename;
        if (!filePath) return;

        // 仅对目标路径检查
        if (!isTargetFile(filePath)) return;

        // 存量债务名单内的文件跳过（补上伴生测试后请删除对应条目）
        if (baseline.has(toRepoPath(filePath))) return;

        const dir = dirname(filePath);
        const baseName = basename(filePath, '.vue');
        const testFilePath = join(dir, `${baseName}.test.ts`);

        if (!existsSync(testFilePath)) {
          context.report({
            node,
            loc: { line: 1, column: 0 },
            messageId: 'missingTestCompanion',
            data: {
              filename: baseName + '.vue',
              basename: baseName,
            },
          });
        }
      },
    };
  },
};
