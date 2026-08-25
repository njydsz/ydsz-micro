/**
 * Vitest 根级配置（仅服务仓库根目录自身的测试）
 *
 * <p>配置 Vue 3 + JSX 测试环境，使用 happy-dom 作为 DOM 模拟器。
 *
 * <p>v4.3.1 架构调整：全仓测试改为「每包自持配置」——各 workspace 包
 * （apps/*、main、comm/*）使用各自包内的 vitest.config.ts 与 test 脚本，
 * 由 `pnpm test`（turbo）编排执行。根级配置不再跨包 glob（**/*.spec.ts），
 * 原因：跨包运行缺少各包专属别名/插件声明，必然产生解析失败；
 * 同时移除 json reporter（其产物 test-results.json 长期滞留仓库根目录）。
 *
 * 根级仅覆盖 `tests/` 目录（仓库级横切测试预留位）。
 *
 * @path vitest.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import Vue from '@vitejs/plugin-vue';
import VueJsx from '@vitejs/plugin-vue-jsx';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [Vue(), VueJsx()],
  test: {
    // 仓库级横切测试预留位；各包测试请勿放置于此
    include: ['tests/**/*.{test,spec}.ts'],
    coverage: {
      // v4.3.1：@vitest/coverage-v8 已安装（root devDependencies），
      // 覆盖率门槛自此可执行；各包覆盖率请使用包内 test:coverage 脚本。
      exclude: [
        '**/e2e/**',
        '**/node_modules/**',
        '**/*.config.{js,ts,mjs,mts}',
        '**/*.d.ts',
        '**/dist/**',
        '**/build/**',
        '**/.{git,idea,vscode}/**',
        '**/coverage/**',
        '**/fixtures/**',
        '**/__mocks__/**',
        '**/types/**',
        '**/mock/**',
      ],
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Q1 目标阈值：branches/functions 70%、lines/statements 80%
      // 后续阶段提升路线：Q2 → 80%/85%，Q3 → 85%/90%
      thresholds: {
        perFile: true,
        branches: 70,
        functions: 70,
        lines: 80,
        statements: 80,
      },
    },
    environment: 'happy-dom',
    exclude: [...configDefaults.exclude, '**/e2e/**'],
    // 契约化重构期间部分包可能暂无测试文件
    passWithNoTests: true,
  },
});
