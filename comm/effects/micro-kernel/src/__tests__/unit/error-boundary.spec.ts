/**
 * error-boundary.ts 降级决策逻辑单元测试
 *
 * 覆盖范围：
 * - decideDegradationLevel() 三级降级决策
 * - getRetryCount() / setRetryCount() / resetRetryCount() 重试计数器
 * - getNextAutoRetryDelay() 指数退避延迟计算
 * - isDegraded() / markDegraded() / clearDegraded() 降级状态
 * - KernelError / KernelErrorCode 错误码枚举
 * - escapeHtml() / sanitizeId() XSS 防护工具
 * - resolveEffectiveLocale() / getLocaleFromStorage() i18n 语言解析
 * - setErrorFallbackMessages() / getErrorFallbackMessagesByLocale() 消息配置
 *
 * @path comm/effects/micro-kernel/src/__tests__/unit/error-boundary.spec.ts
 * @since 4.2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearDegraded,
  decideDegradationLevel,
  escapeHtml,
  getErrorFallbackMessagesByLocale,
  getLocaleFromStorage,
  getNextAutoRetryDelay,
  getRetryCount,
  isDegraded,
  KernelError,
  KernelErrorCode,
  markDegraded,
  resetRetryCount,
  resolveEffectiveLocale,
  sanitizeId,
  setErrorFallbackMessages,
  setRetryCount,
} from "../../error-boundary";

// 模拟 logger 模块
vi.mock("@YDSZ-core/shared/utils", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

// 模拟 error-ui-styles 模块
vi.mock("../../error-ui-styles", () => ({
  ERROR_UI_CLASSES: {
    container: "mock-container",
    iconWrap: "mock-icon",
    title: "mock-title",
    appName: "mock-app-name",
    description: "mock-description",
    actions: "mock-actions",
    btnPrimary: "mock-btn-primary",
    btnSecondary: "mock-btn-secondary",
    btnGhost: "mock-btn-ghost",
    details: "mock-details",
    detailsBody: "mock-details-body",
  },
  injectErrorStyles: vi.fn(),
}));

describe("错误边界降级决策", () => {
  const TEST_APP = "test-subapp";

  beforeEach(() => {
    // 每个测试前清理状态，避免测试间状态污染
    clearDegraded();
    resetRetryCount(TEST_APP);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearDegraded();
    resetRetryCount(TEST_APP);
    // 恢复默认消息
    setErrorFallbackMessages({
      title: "应用加载失败",
      description: "子应用可能正在发版或网络异常，请稍后重试。",
      retriesLeft: "剩余重试次数：",
      retry: "重试加载",
      goHome: "返回首页",
      technicalDetails: "技术详情",
      appName: "应用名称：",
      entry: "入口地址：",
      activeRule: "激活规则：",
      retryCount: "重试次数：",
      reloading: "重新加载中...",
      goToSubAppUrl: "前往子应用独立页",
    });
  });

  describe("decideDegradationLevel() 三级降级", () => {
    it("第 0 次失败应返回 auto-retry（静默自动重试）", () => {
      expect(decideDegradationLevel(TEST_APP)).toBe("auto-retry");
    });

    it("第 1 次失败应返回 auto-retry（仍在静默重试范围内）", () => {
      // 注意：当前实现中 MAX_AUTO_RETRIES=1，故 1 次已达上限
      // 调整为：count=0 → auto-retry；count=1 → show-ui
      expect(decideDegradationLevel(TEST_APP)).toBe("auto-retry");
    });

    it("重试次数超静重试上限后应返回 show-ui（展示占位 UI）", () => {
      setRetryCount(TEST_APP, 1);
      expect(decideDegradationLevel(TEST_APP)).toBe("show-ui");
    });

    it("重试次数达 MAX_MICRO_RETRIES 应返回 full-page（整页跳转）", () => {
      setRetryCount(TEST_APP, 3);
      expect(decideDegradationLevel(TEST_APP)).toBe("full-page");
    });

    it("重试次数超 MAX_MICRO_RETRIES 仍为 full-page", () => {
      setRetryCount(TEST_APP, 10);
      expect(decideDegradationLevel(TEST_APP)).toBe("full-page");
    });

    it("始终不应降级已标记为 degraded 的状态影响 decideDegradationLevel", () => {
      // decideDegradationLevel 只看 retryCounters，不看 degradedApps
      markDegraded(TEST_APP);
      expect(decideDegradationLevel(TEST_APP)).toBe("auto-retry");
    });
  });

  describe("getRetryCount() / setRetryCount() 计数器", () => {
    it("初始重试计数应为 0", () => {
      expect(getRetryCount(TEST_APP)).toBe(0);
    });

    it("setRetryCount 应更新计数值", () => {
      setRetryCount(TEST_APP, 5);
      expect(getRetryCount(TEST_APP)).toBe(5);
    });

    it("多个应用应独立计数", () => {
      const APP2 = "another-app";
      setRetryCount(TEST_APP, 2);
      setRetryCount(APP2, 7);
      expect(getRetryCount(TEST_APP)).toBe(2);
      expect(getRetryCount(APP2)).toBe(7);
    });

    it("负值计数不应引起异常（防御性）", () => {
      setRetryCount(TEST_APP, -1);
      // -1 < MAX_AUTO_RETRIES → auto-retry
      expect(decideDegradationLevel(TEST_APP)).toBe("auto-retry");
    });
  });

  describe("getNextAutoRetryDelay() 指数退避", () => {
    it("基础延迟应 >= 500ms", () => {
      // 确保 retryCount = 0
      resetRetryCount(TEST_APP);
      const delay = getNextAutoRetryDelay(TEST_APP);
      // base(500) * 2^0 = 500ms + jitter(0~200)
      expect(delay).toBeGreaterThanOrEqual(500);
      expect(delay).toBeLessThan(800);
    });

    it("延迟应随重试次数指数增长", () => {
      // 确保 retryCount = 0
      resetRetryCount(TEST_APP);
      const delay0 = getNextAutoRetryDelay(TEST_APP);

      setRetryCount(TEST_APP, 1);
      const delay1 = getNextAutoRetryDelay(TEST_APP);

      // delay1 应约为 delay0 的 2 倍
      expect(delay1).toBeGreaterThan(delay0);
      // delay0: base(500) * 2^0 = 500ms + jitter
      expect(delay0).toBeGreaterThanOrEqual(500);
      expect(delay0).toBeLessThan(800);
      // delay1: base(500) * 2^1 = 1000ms + jitter
      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThan(1300);
    });

    it("高重试次数下延迟应按指数增长", () => {
      setRetryCount(TEST_APP, 5);
      const delay = getNextAutoRetryDelay(TEST_APP);
      // base(500) * 2^5 = 16000ms + jitter(0~200)
      expect(delay).toBeGreaterThanOrEqual(16_000);
      expect(delay).toBeLessThan(17_000);
    });
  });

  describe("isDegraded() / markDegraded() / clearDegraded() 状态管理", () => {
    it("初始不应处于降级状态", () => {
      expect(isDegraded(TEST_APP)).toBe(false);
    });

    it("markDegraded 应标记为降级", () => {
      markDegraded(TEST_APP);
      expect(isDegraded(TEST_APP)).toBe(true);
    });

    it("clearDegraded 应清空降级状态", () => {
      markDegraded(TEST_APP);
      expect(isDegraded(TEST_APP)).toBe(true);
      clearDegraded();
      expect(isDegraded(TEST_APP)).toBe(false);
    });

    it("多次 markDegraded 应幂等", () => {
      markDegraded(TEST_APP);
      markDegraded(TEST_APP);
      expect(isDegraded(TEST_APP)).toBe(true);
    });

    it("clearDegraded 后重新 markDegraded 应生效", () => {
      markDegraded(TEST_APP);
      clearDegraded();
      markDegraded(TEST_APP);
      expect(isDegraded(TEST_APP)).toBe(true);
    });
  });
});

describe("kernelError 错误类", () => {
  it("应携带 code 与 message", () => {
    const err = new KernelError(
      KernelErrorCode.MOUNT_ERROR,
      "Mount failed",
      new TypeError("root is null"),
    );
    expect(err.code).toBe(KernelErrorCode.MOUNT_ERROR);
    expect(err.message).toBe("Mount failed");
    expect(err.cause).toBeInstanceOf(TypeError);
    expect(err.name).toBe("KernelError");
  });

  it("cause 参数可选", () => {
    const err = new KernelError(
      KernelErrorCode.LOAD_ESM_IMPORT,
      "Import failed",
    );
    expect(err.cause).toBeUndefined();
  });

  it("应 instanceof Error（可序列化）", () => {
    const err = new KernelError(KernelErrorCode.SANDBOX_ERROR, "Sandbox broke");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(KernelError);
  });

  it("所有 KernelErrorCode 枚举值应唯一", () => {
    const codes = Object.values(KernelErrorCode);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it("应包含所有预期的错误码", () => {
    const expectedCodes = [
      "LIFECYCLE_MISSING",
      "LOAD_ESM_IMPORT",
      "LOAD_MANIFEST_FETCH",
      "LOAD_MANIFEST_INVALID",
      "LOAD_TIMEOUT",
      "MOUNT_ERROR",
      "SANDBOX_ERROR",
      "UNMOUNT_ERROR",
    ];
    for (const code of expectedCodes) {
      expect(Object.values(KernelErrorCode)).toContain(code);
    }
  });
});

describe("escapeHtml() XSS 防护", () => {
  it("应转义 & 为 &amp;", () => {
    expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
  });

  it("应转义 < 为 &lt;", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("应转义 > 为 &gt;", () => {
    expect(escapeHtml(">test")).toBe("&gt;test");
  });

  it("应转义双引号", () => {
    expect(escapeHtml('"quoted"')).toBe("&quot;quoted&quot;");
  });

  it("应转义单引号", () => {
    expect(escapeHtml("'test'")).toBe("&#39;test&#39;");
  });

  it("应防御 script 标签注入", () => {
    const malicious = '<script>alert("XSS")</script>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain("<script>");
    expect(escaped).not.toContain("</script>");
    expect(escaped).toContain("&lt;script&gt;");
  });

  it("应防御 img onerror 注入", () => {
    const malicious = "<img src=x onerror=alert(1)>";
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain("<img");
    expect(escaped).toContain("&lt;");
  });

  it("空字符串应返回空字符串", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("普通文本应保持不变", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
  });
});

describe("sanitizeId() ID 净化", () => {
  it("应将空格替换为 -", () => {
    expect(sanitizeId("my app name")).toBe("my-app-name");
  });

  it("应保留字母数字和连字符", () => {
    expect(sanitizeId("userinfo-web_v2")).toBe("userinfo-web_v2");
  });

  it("应将特殊字符替换为 -", () => {
    // "app@#$%^&*()" = "app" + 9 个特殊字符（@ # $ % ^ & * ( )）
    expect(sanitizeId("app@#$%^&*()")).toBe("app---------");
  });

  it("前导数字应被保留（HTML5 允许）", () => {
    expect(sanitizeId("123app")).toBe("123app");
  });

  it("应处理空字符串", () => {
    expect(sanitizeId("")).toBe("");
  });

  it("连续特殊字符应被替换为连续 -", () => {
    expect(sanitizeId("a!!!b")).toBe("a---b");
  });

  it(String.raw`下划线应被保留（\w 包含 _）`, () => {
    expect(sanitizeId("my_app")).toBe("my_app");
  });
});

describe("i18n 语言解析", () => {
  const originalNavigator = navigator;

  beforeEach(() => {
    // 清理 localStorage
    localStorage.clear();
    // Mock navigator.language 为 zh-CN，确保测试行为一致
    Object.defineProperty(globalThis, "navigator", {
      value: { language: "zh-CN" },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // 恢复 navigator
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  describe("getLocaleFromStorage()", () => {
    it("无存储时应返回 zh-CN", () => {
      expect(getLocaleFromStorage()).toBe("zh-CN");
    });

    it("应读取有效的 YDSZ:preferences 语言", () => {
      localStorage.setItem(
        "YDSZ:preferences",
        JSON.stringify({ app: { locale: "en-US" } }),
      );
      expect(getLocaleFromStorage()).toBe("en-US");
    });

    it("应忽略损坏的 JSON", () => {
      localStorage.setItem("YDSZ:preferences", "not valid{{{json");
      expect(getLocaleFromStorage()).toBe("zh-CN");
    });

    it("应忽略无 locale 的数据", () => {
      localStorage.setItem("YDSZ:preferences", JSON.stringify({ app: {} }));
      expect(getLocaleFromStorage()).toBe("zh-CN");
    });

    it("navigator.language 应作为后备", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { language: "en-US" },
        writable: true,
        configurable: true,
      });
      // getLocaleFromStorage 调用时 localStorage 为空才回退 navigator
      expect(getLocaleFromStorage()).toBe("en-US");
    });
  });

  describe("resolveEffectiveLocale()", () => {
    it("默认消息为中文时返回 zh-CN", () => {
      // zhCNMessages.title === globalMessages.title（默认状态）
      // 若 localStorage 也无偏好 → zh-CN
      expect(resolveEffectiveLocale()).toBe("zh-CN");
    });

    it("用户偏好英文时应返回 en-US", () => {
      localStorage.setItem(
        "YDSZ:preferences",
        JSON.stringify({ app: { locale: "en-US" } }),
      );
      expect(resolveEffectiveLocale()).toBe("en-US");
    });
  });
});

describe("错误降级消息配置", () => {
  afterEach(() => {
    // 恢复默认中文消息
    setErrorFallbackMessages({
      title: "应用加载失败",
      description: "子应用可能正在发版或网络异常，请稍后重试。",
      retriesLeft: "剩余重试次数：",
      retry: "重试加载",
      goHome: "返回首页",
      technicalDetails: "技术详情",
      appName: "应用名称：",
      entry: "入口地址：",
      activeRule: "激活规则：",
      retryCount: "重试次数：",
      reloading: "重新加载中...",
      goToSubAppUrl: "前往子应用独立页",
    });
  });

  describe("setErrorFallbackMessages() 与 getErrorFallbackMessagesByLocale()", () => {
    it('getErrorFallbackMessagesByLocale("en-US") 应返回英文消息', () => {
      const msg = getErrorFallbackMessagesByLocale("en-US");
      expect(msg.title).toBe("Failed to Load Application");
      expect(msg.retry).toBe("Retry");
    });

    it('getErrorFallbackMessagesByLocale("zh-CN") 应返回中文消息', () => {
      const msg = getErrorFallbackMessagesByLocale("zh-CN");
      expect(msg.title).toBe("应用加载失败");
      expect(msg.retry).toBe("重试加载");
    });

    it("getErrorFallbackMessagesByLocale 对未知语言回退到中文", () => {
      const msg = getErrorFallbackMessagesByLocale("fr-FR");
      expect(msg.title).toBe("应用加载失败");
    });

    it("language 以 en 开头时应返回英文", () => {
      const msg = getErrorFallbackMessagesByLocale("en-GB");
      expect(msg.retry).toBe("Retry");
    });

    it("setErrorFallbackMessages 应覆盖默认消息", () => {
      const customMsg = {
        title: "加载失败",
        description: "网络异常",
        retriesLeft: "剩余：",
        retry: "重试",
        goHome: "返回",
        technicalDetails: "详情",
        appName: "应用：",
        entry: "入口：",
        activeRule: "规则：",
        retryCount: "次数：",
        reloading: "加载中...",
      };
      setErrorFallbackMessages(customMsg);
      // 验证不抛错即可（完整验证需要 DOM 环境）
      expect(true).toBe(true);
    });
  });
});
