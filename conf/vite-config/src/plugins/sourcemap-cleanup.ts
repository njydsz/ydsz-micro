/**
 * Sourcemap 产物清理插件
 *
 * @remarks
 * 生产构建默认输出 hidden sourcemap（`sourcemap: 'hidden'`），用于后端监控服务
 * 做 stack trace 符号化。sourcemap 体积可达 JS 本体的 4 倍以上，随静态资源
 * 部署会无谓放大产物并泄露源码结构，因此构建末尾统一清理。
 *
 * 清理时机为 `closeBundle`（post），与 {@link viteArchiverPlugin} 保持一致的
 * 延迟策略，避免阻塞主构建流程；归档插件在本插件之后执行，可确保 `dist.zip`
 * 同样不含 `.map`。
 *
 * 需要保留 sourcemap 做本地符号化调试时，设置环境变量
 * `YDSZ_KEEP_SOURCEMAP=true` 即可跳过清理。
 *
 * @author ydsz-team
 * @since 4.0.0
 */
import type { PluginOption } from 'vite';

import { consola as logger } from 'consola';

import type { SourcemapCleanupOptions } from '../typing';

import { join } from 'node:path';

/** 递归收集目录树中全部 `.map` 文件。 */
async function collectMapFiles(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await import('node:fs/promises').then((m) =>
    m.readdir(dir, { withFileTypes: true }),
  );
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectMapFiles(full, acc);
    } else if (entry.name.endsWith('.map')) {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * 构建结束后清理 dist 目录下的 sourcemap 文件。
 *
 * @param options - 清理配置（目标目录、是否强制清理），缺省使用默认值
 * @returns Vite 插件对象
 */
export const viteSourcemapCleanupPlugin = (options: SourcemapCleanupOptions = {}): PluginOption => {
  return {
    apply: 'build',
    closeBundle: {
      handler() {
        const { distDir = 'dist', force = false } = options;

        setTimeout(async () => {
          if (!force && process.env.YDSZ_KEEP_SOURCEMAP === 'true') {
            logger.info('[sourcemap-cleanup] YDSZ_KEEP_SOURCEMAP=true，跳过清理');
            return;
          }

          const targetDir = join(process.cwd(), distDir);
          const fsp = await import('node:fs/promises');

          let mapFiles: string[] = [];
          try {
            mapFiles = await collectMapFiles(targetDir);
          } catch {
            // dist 目录不存在或不可读时静默退出（非构建场景）
            return;
          }

          if (mapFiles.length === 0) {
            logger.info('[sourcemap-cleanup] 无 sourcemap 需清理');
            return;
          }

          let removed = 0;
          let failed = 0;
          for (const file of mapFiles) {
            try {
              await fsp.rm(file, { force: true });
              removed++;
            } catch {
              failed++;
            }
          }

          logger.success(
            `[sourcemap-cleanup] 已清理 ${removed} 个 sourcemap${failed > 0 ? `（${failed} 个失败）` : ''}`,
          );
        }, 0);
      },
    },
  };
};
