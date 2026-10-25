/**
 * 自定义 ESLint 规则：require-test-companion
 *
 * <p>强制要求 apps 下 src/views 与 src/components 内的 .vue 文件
 * 拥有同名的 .test.ts 伴生文件。未找到伴生文件时发 warning（不阻断开发）。
 *
 * 注意：本文件注释内不要出现「任意路径通配」（星号紧跟斜杠的形式），
 * 该序列会提前闭合块注释并让整个 ESLint 配置解析失败，导致仓库级 lint 瘫痪。
 *
 * @path conf/lint-configs/eslint-plugin-test-companion/rules/require-test-companion.mjs
 * @author ydsz-team
 * @since 26.10.14
 */

import { existsSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';

/** 需要检查伴生测试的路径匹配模式（相对于 cwd） */
const TARGET_PATTERNS = [
  /^apps\/[^/]+\/src\/views\/.*\.vue$/,
  /^apps\/[^/]+\/src\/components\/.*\.vue$/,
];

/**
 * 判断文件路径是否命中目标模式。
 * @param {string} filePath - 文件的绝对路径（或相对工作区根目录的路径）
 * @returns {boolean}
 */
function isTargetFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  // 去掉可能的 cwd 前缀
  const relativeLike = normalized.replace(/^.*?(apps\/)/, 'apps/');
  return TARGET_PATTERNS.some((p) => p.test(relativeLike));
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
