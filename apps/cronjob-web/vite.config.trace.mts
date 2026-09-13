/**
 * 任务调度子应用 / Vite 构建配置（trace 调试版）。
 *
 * <p>在共享配置基础上追加 trace-jiti 插件，打印 jiti/vite-config/nitropack/c12
 * <p>相关模块的热路径 import 轨迹，用于诊断冷启动耗时瓶颈。
 *
 * <p>日常开发请使用 vite.config.mts；仅在排查「首屏加载慢 / 子应用 import 膨胀」时
 * <p>临时切换到本文件。
 *
 * @path apps/cronjob-web/vite.config.trace.mts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Plugin } from 'vite';

import { defineConfig } from '@ydsz/vite-config';

/**
 * trace-jiti 调试插件 —— 拦截 import 路径并打印 jiti 等模块的来源。
 *
 * @default —— Vite defineConfig 产物（含 trace 调试插件）
 */
export default defineConfig(async () => {
  const trace: Plugin = {
    name: 'trace-jiti',
    enforce: 'pre',
    resolveId(source, importer) {
      if (
        source.includes('jiti') ||
        importer?.includes('jiti') ||
        source.includes('vite-config') ||
        source.includes('nitropack') ||
        source.includes('c12')
      ) {
        console.log('[TRACE-IMPORT]', JSON.stringify(source), 'FROM', importer);
      }
      return null;
    },
  };
  return {
    application: {},
    vite: {
      plugins: [trace],
    },
  };
});
