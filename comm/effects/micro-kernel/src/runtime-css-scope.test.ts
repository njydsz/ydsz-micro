/**
 * 运行时 CSS scope 兜底测试
 *
 * 覆盖 applyRuntimeCssScope 的 link 选择、sheet 未就绪时的 load 重试注册、
 * 已处理幂等标记、removeRuntimeCssScope 的清理语义。
 *
 * 说明：happy-dom 不加载远端 CSS（link.sheet 恒为 null），
 * 因此「sheet 就绪 → 生成 scoped style」的正向分支无法在单测中覆盖，
 * 该路径由构建期 micro-scoped-postcss 与 E2E 保障。
 * 本文件聚焦选择器语义、幂等标记与卸载清理。
 *
 * @path comm\effects\micro-kernel\src\runtime-css-scope.test.ts
 * @author ydsz-team
 * @since 26.11.07
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createSchedulerContext } from './app-state';
import {
  applyRuntimeCssScope,
  clearCssScopeFailureReports,
  removeRuntimeCssScope,
} from './runtime-css-scope';

/** 源码中模块私有常量（未导出），此处镜像用于构造 DOM 与断言 */
const SCOPED_STYLE_ATTR = 'data-micro-kernel-scoped-app';
const APP_ATTR = 'data-micro-kernel-app';
const SCOPED_FLAG = 'data-micro-kernel-scoped';
const PENDING_FLAG = 'data-micro-kernel-scoped-pending';

describe('runtime-css-scope', () => {
  /** 记录创建的元素，afterEach 移除避免污染 document */
  const created: Element[] = [];

  function appendLink(href: string, appName: string): HTMLLinkElement {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(APP_ATTR, appName);
    document.head.appendChild(link);
    created.push(link);
    return link;
  }

  function appendScopedStyle(appName: string): HTMLStyleElement {
    const style = document.createElement('style');
    style.setAttribute(SCOPED_STYLE_ATTR, appName);
    document.head.appendChild(style);
    created.push(style);
    return style;
  }

  afterEach(() => {
    while (created.length > 0) created.pop()!.remove();
    document.querySelectorAll(`style[${SCOPED_STYLE_ATTR}]`).forEach((el) => el.remove());
  });

  describe('applyRuntimeCssScope', () => {
    it('只处理带 data-micro-kernel-app 属性的 link', () => {
      const scoped = appendLink('https://example.com/scoped.css', 'sub-a');
      const plain = document.createElement('link');
      plain.rel = 'stylesheet';
      plain.href = 'https://example.com/plain.css';
      document.head.appendChild(plain);
      created.push(plain);

      applyRuntimeCssScope('sub-a');

      // 匹配到的 link 被打上 pending 标记；未匹配的不受影响
      expect(scoped.getAttribute(PENDING_FLAG)).toBe('1');
      expect(plain.getAttribute(PENDING_FLAG)).toBeNull();
    });

    it('sheet 未就绪时注册 load 重试（一次）', () => {
      const link = appendLink('https://example.com/sub-a.css', 'sub-a');

      applyRuntimeCssScope('sub-a');
      const pendingAfterFirst = link.getAttribute(PENDING_FLAG);

      // 再次调用：pending 已存在，不应重复注册
      applyRuntimeCssScope('sub-a');
      const pendingAfterSecond = link.getAttribute(PENDING_FLAG);

      expect(pendingAfterFirst).toBe('1');
      expect(pendingAfterSecond).toBe('1');
      expect(link.hasAttribute(SCOPED_FLAG)).toBe(false);
    });

    it('已标记 done 的 link 被跳过', () => {
      const link = appendLink('https://example.com/sub-a.css', 'sub-a');
      link.setAttribute(SCOPED_FLAG, 'done');
      link.setAttribute(PENDING_FLAG, '1');

      applyRuntimeCssScope('sub-a');

      // done 优先，pending 不应被清除或改写
      expect(link.getAttribute(SCOPED_FLAG)).toBe('done');
      expect(link.getAttribute(PENDING_FLAG)).toBe('1');
    });

    it('对其他应用的 link 不做处理', () => {
      const link = appendLink('https://example.com/b.css', 'app-b');

      applyRuntimeCssScope('app-a');

      expect(link.getAttribute(PENDING_FLAG)).toBeNull();
    });

    it('对不存在应用调用不抛错', () => {
      expect(() => applyRuntimeCssScope('never-existed')).not.toThrow();
    });
  });

  describe('removeRuntimeCssScope', () => {
    it('移除指定应用的 scoped style 元素', () => {
      appendScopedStyle('sub-a');
      expect(document.querySelector(`style[${SCOPED_STYLE_ATTR}="sub-a"]`)).not.toBeNull();

      removeRuntimeCssScope('sub-a');

      expect(document.querySelector(`style[${SCOPED_STYLE_ATTR}="sub-a"]`)).toBeNull();
    });

    it('只移除目标应用，不影响其他应用', () => {
      appendScopedStyle('app-a');
      appendScopedStyle('app-b');

      removeRuntimeCssScope('app-a');

      expect(document.querySelector(`style[${SCOPED_STYLE_ATTR}="app-a"]`)).toBeNull();
      expect(document.querySelector(`style[${SCOPED_STYLE_ATTR}="app-b"]`)).not.toBeNull();
    });

    it('对不存在的应用名调用不抛错', () => {
      expect(() => removeRuntimeCssScope('never-existed')).not.toThrow();
    });
  });

  describe('默认配置（v4.3.2：样式隔离默认开启）', () => {
    it('createSchedulerContext 默认开启 styleIsolationEnabled', () => {
      // 回归保护：此前默认为 false，导致子应用可互相污染样式
      expect(createSchedulerContext().styleIsolationEnabled).toBe(true);
    });
  });

  describe('跨域失败上报（v4.3.2）', () => {
    it('sheet 不可读时通过 logger.warn 上报告警', () => {
      clearCssScopeFailureReports();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // 构造一个 sheet.cssRules 会抛错的 link：
      // happy-dom 下 link.sheet 为 null，无法直接触发 catch 分支，
      // 因此用 Object.defineProperty 伪造一个会抛 SecurityError 的 sheet。
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.setAttribute(APP_ATTR, 'sub-a');
      document.head.appendChild(link);
      created.push(link);
      Object.defineProperty(link, 'sheet', {
        configurable: true,
        get: () => ({
          cssRules: {
            get length() {
              throw new DOMException('Failed to read cssRules', 'SecurityError');
            },
          },
        }),
      });

      applyRuntimeCssScope('sub-a');

      expect(warnSpy).toHaveBeenCalled();
      // logger 会把模块前缀作为第一个参数，业务消息在其后
      const args = warnSpy.mock.calls[0] ?? [];
      const message = args.map(String).join(' ');
      expect(message).toContain('sub-a');
      expect(message).toMatch(/SecurityError|cssRules/i);
      warnSpy.mockRestore();
    });
  });
});
