/**
 * ydsz-ui ESLint 插件规则自检脚本。
 *
 * <p>vitest include 不含 conf/，故用 node 直接断言插件规则行为。
 * 运行：node conf/lint-configs/eslint-plugin-ydsz-ui/rules/self-check.mjs
 *
 * @path conf/lint-configs/eslint-plugin-ydsz-ui/rules/self-check.mjs
 * @author ydsz-team
 * @since 26.11.06
 */

import assert from 'node:assert/strict';

import { Linter } from 'eslint';

import plugin from '../index.mjs';

const linter = new Linter({ configType: 'flat' });

/**
 * 用指定规则检查代码。
 *
 * @param filename - 目标文件名（决定豁免匹配）
 * @param code - 待检查代码
 * @param ruleId - 规则 id
 * @returns ESLint 消息数组
 */
function lintAs(filename, code, ruleId) {
  const config = [
    {
      files: ['**/*.ts', '**/*.vue'],
      languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
      plugins: { ydsz: plugin },
      rules: { [`ydsz/${ruleId}`]: 'error' },
    },
  ];
  return linter.verify(code, config, { filename });
}

// ── no-element-plus ──────────────────────────────────────────
{
  const errors = lintAs(
    'src/demo.ts',
    "import { ElButton } from 'element-plus';",
    'no-element-plus',
  );
  assert.equal(errors.length, 1, '应检测到 element-plus 引入');
  assert.equal(errors[0].messageId, 'forbidden');

  const errors2 = lintAs(
    'src/demo.ts',
    "import { Search } from '@element-plus/icons-vue';",
    'no-element-plus',
  );
  assert.equal(errors2.length, 1, '应检测到 @element-plus/icons-vue');

  const clean = lintAs(
    'src/demo.ts',
    "import { YdButton } from '@ydsz-core/ydsz-ui';",
    'no-element-plus',
  );
  assert.equal(clean.length, 0, 'ydsz-ui 引入不应报错');

  const clean2 = lintAs(
    'src/demo.ts',
    "import { Search } from 'lucide-vue-next';",
    'no-element-plus',
  );
  assert.equal(clean2.length, 0, 'lucide 引入不应报错');
}

// ── no-hardcoded-chinese ─────────────────────────────────────
{
  const errors = lintAs(
    'src/components/demo.ts',
    "const msg = '你好世界';",
    'no-hardcoded-chinese',
  );
  assert.ok(errors.length >= 1, '应检测到硬编码中文');
  assert.equal(errors[0].messageId, 'hardcoded');

  const clean = lintAs(
    'src/components/demo.ts',
    "const key = 'common.hello';",
    'no-hardcoded-chinese',
  );
  assert.equal(clean.length, 0, 'i18n key 不应报错');

  const clean2 = lintAs('src/components/demo.ts', 'const unit = "年";', 'no-hardcoded-chinese');
  assert.equal(clean2.length, 0, '单个中文字符不应报错');

  const clean3 = lintAs(
    'src/components/demo.test.ts',
    "const msg = '你好世界';",
    'no-hardcoded-chinese',
  );
  assert.equal(clean3.length, 0, '测试文件豁免');
}

// ── 插件元信息 ────────────────────────────────────────────────
{
  assert.equal(plugin.meta.name, '@ydsz-core/eslint-plugin-ydsz-ui');
  assert.equal(plugin.meta.version, '1.0.0');
  assert.deepEqual(Object.keys(plugin.rules), [
    'no-element-plus',
    'require-a11y-contract',
    'no-hardcoded-chinese',
  ]);
}

console.log('✅ ydsz-ui ESLint 插件自检通过（12 项断言）');
