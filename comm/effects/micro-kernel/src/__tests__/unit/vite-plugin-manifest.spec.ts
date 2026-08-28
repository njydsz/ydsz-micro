/**
 * vite-plugin-manifest 单元测试 — 构建期完整性清单
 *
 * 覆盖：
 * - manifest.json 基础字段（name/entry/css/version）
 * - v4.4.0 integrity 清单：CSS → 浏览器级 SRI；JS chunk → sha256 清单
 * - 路由级骨架屏配置透传
 *
 * @path comm/effects/micro-kernel/src/__tests__/unit/vite-plugin-manifest.spec.ts
 * @author ydsz-team
 * @since 4.4.0
 */
import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import { viteManifestPlugin } from '../../vite-plugin-manifest';

/** sha256 → SRI 格式（与插件实现一致，用于断言） */
function sha256Sri(content: string | Uint8Array): string {
  return `sha256-${createHash('sha256').update(content).digest('base64')}`;
}

/** 构造最小 generateBundle 上下文并捕获 emitFile 的 manifest 内容 */
function runPlugin(plugin: ReturnType<typeof viteManifestPlugin>, bundle: Record<string, unknown>): Record<string, unknown> {
  const emitted: Array<{ fileName: string; source: string }> = [];
  const ctx = {
    emitFile: (file: { fileName: string; source: string }) => emitted.push(file),
  };

  plugin.configResolved?.({
    base: '/sub/',
  } as never);

  const generateBundle = (plugin as { generateBundle: (o: unknown, b: Record<string, unknown>) => void }).generateBundle;
  generateBundle.call(ctx as never, {}, bundle);

  const manifestAsset = emitted.find((f) => f.fileName === 'manifest.json');
  expect(manifestAsset, 'manifest.json 未产出').toBeDefined();
  return JSON.parse(manifestAsset!.source) as Record<string, unknown>;
}

describe('viteManifestPlugin', () => {
  it('生成基础 manifest 并透传骨架屏配置', () => {
    const plugin = viteManifestPlugin({
      name: 'demo-web',
      version: '1.2.3',
      routes: [{ path: '/users', skeletonType: 'list' }],
    });
    const manifest = runPlugin(plugin, {
      'index.js': {
        type: 'chunk',
        isEntry: true,
        fileName: 'jse/index-demo-abc.js',
        code: 'export const mount = () => {};',
      },
    });

    expect(manifest.name).toBe('demo-web');
    expect(manifest.entry).toBe('/sub/jse/index-demo-abc.js');
    expect(manifest.version).toBe('1.2.3');
    expect(manifest.routes).toEqual([{ path: '/users', skeletonType: 'list' }]);
  });

  it('v4.4.0: integrity 清单包含 CSS 的 SRI hash 与 JS 的 sha256 清单', () => {
    const plugin = viteManifestPlugin({ name: 'demo-web' });
    const cssCode = '.demo{color:red}';
    const jsCode = 'export const mount = () => {};';
    const manifest = runPlugin(plugin, {
      'index.js': {
        type: 'chunk',
        isEntry: true,
        fileName: 'jse/index-demo-abc.js',
        code: jsCode,
      },
      'chunk-shared.js': {
        type: 'chunk',
        isEntry: false,
        fileName: 'js/chunk-shared-def.js',
        code: 'console.log(1)',
      },
      'style.css': {
        type: 'asset',
        fileName: 'css/style-123.css',
        source: cssCode,
      },
    });

    const integrity = manifest.integrity as {
      css: Record<string, string>;
      js: Record<string, string>;
    };

    expect(integrity.css).toBeDefined();
    expect(integrity.css['/sub/css/style-123.css']).toBe(sha256Sri(cssCode));
    expect(integrity.js).toBeDefined();
    expect(integrity.js['/sub/jse/index-demo-abc.js']).toBe(sha256Sri(jsCode));
    expect(Object.keys(integrity.js)).toContain('/sub/js/chunk-shared-def.js');
  });

  it('无入口 chunk 时仅告警不产出 manifest', () => {
    const plugin = viteManifestPlugin({ name: 'demo-web' });
    const emitted: Array<{ fileName: string; source: string }> = [];
    const ctx = { emitFile: (file: { fileName: string; source: string }) => emitted.push(file) };
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const generateBundle = (plugin as { generateBundle: (o: unknown, b: Record<string, unknown>) => void }).generateBundle;
    generateBundle.call(ctx as never, {}, {});

    expect(emitted).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
