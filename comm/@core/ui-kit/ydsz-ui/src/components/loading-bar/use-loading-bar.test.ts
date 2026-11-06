/**
 * useLoadingBar 全局命令式 API 测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\loading-bar\use-loading-bar.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, expect, it, beforeEach } from 'vitest';

import {
  configureLoadingBar,
  finishLoadingBar,
  loadingBar,
  setLoadingBarProgress,
  startLoadingBar,
  useLoadingBar,
} from './use-loading-bar';

describe('useLoadingBar', () => {
  beforeEach(() => {
    loadingBar.finish();
  });

  describe('start', () => {
    it('start() 将 isLoading 置为 true', () => {
      const bar = useLoadingBar();
      expect(bar.isLoading.value).toBe(false);
      bar.start();
      expect(bar.isLoading.value).toBe(true);
    });

    it('start() 重置进度为 0', () => {
      const bar = useLoadingBar();
      bar.setProgress(80);
      bar.start();
      expect(bar.progress.value).toBe(0);
    });
  });

  describe('setProgress', () => {
    it('设置进度并进入确定性模式', () => {
      const bar = useLoadingBar();
      bar.setProgress(45);
      expect(bar.progress.value).toBe(45);
      expect(bar.isDeterminate.value).toBe(true);
      expect(bar.isLoading.value).toBe(true);
    });

    it('进度被钳制在 0-100', () => {
      const bar = useLoadingBar();
      bar.setProgress(150);
      expect(bar.progress.value).toBe(100);
      bar.setProgress(-20);
      expect(bar.progress.value).toBe(0);
    });

    it('NaN 值安全处理为 0', () => {
      const bar = useLoadingBar();
      bar.setProgress(Number.NaN);
      expect(bar.progress.value).toBe(0);
    });
  });

  describe('finish', () => {
    it('finish() 隐藏进度条并重置状态', () => {
      const bar = useLoadingBar();
      bar.start();
      bar.setProgress(50);
      bar.finish();
      expect(bar.isLoading.value).toBe(false);
      expect(bar.progress.value).toBe(0);
      expect(bar.isDeterminate.value).toBe(false);
    });

    it('done() 与 finish() 等价', () => {
      const bar = useLoadingBar();
      bar.start();
      bar.done();
      expect(bar.isLoading.value).toBe(false);
    });
  });

  describe('全局单例 loadingBar', () => {
    it('跨 useLoadingBar 调用共享状态', () => {
      const a = useLoadingBar();
      const b = useLoadingBar();
      a.start();
      expect(b.isLoading.value).toBe(true);
    });

    it('模块级便捷函数可用', () => {
      startLoadingBar();
      expect(loadingBar.isLoading.value).toBe(true);
      setLoadingBarProgress(70);
      expect(loadingBar.progress.value).toBe(70);
      finishLoadingBar();
      expect(loadingBar.isLoading.value).toBe(false);
    });
  });

  describe('configureLoadingBar', () => {
    it('配置 determinate 默认模式', () => {
      configureLoadingBar({ determinate: true });
      const bar = useLoadingBar();
      bar.start();
      expect(bar.isDeterminate.value).toBe(true);
      configureLoadingBar({ determinate: false });
    });
  });
});
