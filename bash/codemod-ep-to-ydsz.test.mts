/**
 * codemod-ep-to-ydsz 自检测试。
 *
 * @path bash/codemod-ep-to-ydsz.test.mts
 * @author ydsz-team
 * @since 26.11.06
 *
 * 运行：node bash/codemod-ep-to-ydsz.test.mts
 */

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

/** 创建临时测试目录 */
const tmp = mkdtempSync(join(tmpdir(), 'ydsz-codemod-test-'));

try {
  // ── 测试用例 1：组件 import + 标签 ─────────────────────────
  {
    const file = join(tmp, 'case1.vue');
    writeFileSync(
      file,
      `<script setup lang="ts">
import { YdButton, YdInput } from '@ydsz-core/ydsz-ui';
import { Search } from 'lucide-vue-next';

const msg = showNotification.success('ok');
</script>

<template>
  <yd-button type="primary" size="sm">按钮</yd-button>
  <YdInput v-model="value" />
</template>
`,
      'utf-8',
    );

    execFileSync(process.execPath, ['bash/codemod-ep-to-ydsz.mts', tmp], {
      cwd: process.cwd(),
      stdio: 'pipe',
    });

    const result = readFileSync(file, 'utf-8');
    assert.ok(
      result.includes(`import { YdButton, YdInput } from '@ydsz-core/ydsz-ui';`),
      '应迁移组件 import',
    );
    assert.ok(result.includes(`import { Search } from 'lucide-vue-next';`), '应迁移图标 import');
    assert.ok(result.includes('<yd-button'), '应迁移 el-button 标签');
    assert.ok(result.includes('</yd-button>'), '应迁移结束标签');
    assert.ok(result.includes('<YdInput'), '应迁移 ElInput 标签');
    assert.ok(result.includes('size="sm"'), '应迁移 size 值');
    assert.ok(result.includes('showNotification.success'), '应迁移 ElMessage');
  }

  // ── 测试用例 2：幂等性 ────────────────────────────────────
  {
    const file = join(tmp, 'case2.vue');
    const original = `<script setup lang="ts">
import { YdButton } from '@ydsz-core/ydsz-ui';
</script>
<template>
  <yd-button>按钮</yd-button>
</template>
`;
    writeFileSync(file, original, 'utf-8');

    execFileSync(process.execPath, ['bash/codemod-ep-to-ydsz.mts', tmp], {
      cwd: process.cwd(),
      stdio: 'pipe',
    });

    const result = readFileSync(file, 'utf-8');
    assert.equal(result, original, '幂等：无 EP 痕迹时不应改动');
  }

  // ── 测试用例 3：命令式 API ────────────────────────────────
  {
    const file = join(tmp, 'case3.ts');
    writeFileSync(
      file,
      `import { showNotification, showMessageBox } from '@ydsz-core/popup-ui';

showNotification.success('保存成功');
showMessageBox.confirm('确认删除？');
`,
      'utf-8',
    );

    execFileSync(process.execPath, ['bash/codemod-ep-to-ydsz.mts', tmp], {
      cwd: process.cwd(),
      stdio: 'pipe',
    });

    const result = readFileSync(file, 'utf-8');
    assert.ok(
      result.includes(`import { showNotification, showMessageBox } from '@ydsz-core/popup-ui';`),
      '应迁移命令式 API import',
    );
    assert.ok(result.includes('showNotification.success'), '应迁移 ElMessage 调用');
    assert.ok(result.includes('showMessageBox.confirm'), '应迁移 ElMessageBox 调用');
  }

  console.log('✅ codemod-ep-to-ydsz 自检通过（3 个用例）');
} finally {
  rmSync(tmp, { force: true, recursive: true });
}
