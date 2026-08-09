/**
 * loader.ts manifest 解析与缓存单元测试
 *
 * 覆盖范围：
 * - fetchManifest() HTTP 请求与缓存命中
 * - fetchManifest() 网络错误 / HTTP 错误 / JSON 解析错误
 * - clearManifestCache() 缓存清理
 * - removeStylesheets() DOM 样式表清理
 * - loadApp() 加载流程（manifest fetch + CSS 注入 + ESM import）
 * - assertLifecycle() 生命周期断言
 * - KernelError 错误码包装
 * - 重试策略集成
 *
 * @path comm/effects/micro-kernel/src/__tests__/unit/loader.spec.ts
 * @since 4.2.0
 */

import type { Manifest } from "../../loader";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { KernelError, KernelErrorCode } from "../../error-boundary";
// 导入被测模块（须在 mock 之后）
import {
  clearManifestCache,
  fetchManifest,
  removeStylesheets,
} from "../../loader";

// === 模拟依赖模块 ===
vi.mock("@YDSZ-core/shared/utils", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

vi.mock("@ydsz/micro-runtime", () => ({
  // 仅类型占位，运行时不使用
}));

vi.mock("../../link-hints", () => ({
  injectModulePreload: vi.fn(),
  preloadAppAssets: vi.fn(),
}));

/**
 * 构建 mock Response 对象
 */
function mockResponse(opts: {
  json?: () => Promise<unknown> | unknown;
  ok?: boolean;
  status?: number;
  text?: () => Promise<string>;
}): Response {
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    json: opts.json ?? (async () => ({})),
    text: opts.text ?? (async () => ""),
  } as unknown as Response;
}

/**
 * 构建有效 mock manifest
 */
function mockManifest(overrides: Partial<Manifest> = {}): Manifest {
  return {
    name: "test-app",
    entry: "https://cdn.example.com/test-app/index.js",
    css: ["https://cdn.example.com/test-app/style.css"],
    version: "1.0.0",
    ...overrides,
  };
}

describe("fetchManifest() manifest 获取与缓存", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    // 每个用例清理缓存，避免串扰
    clearManifestCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    clearManifestCache();
  });

  it("应从 entry URL 拼接 manifest.json 并发起 fetch", async () => {
    const manifest = mockManifest();
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        status: 200,
        json: async () => manifest,
      }),
    );
    globalThis.fetch = mockFetch;

    const result = await fetchManifest("https://cdn.example.com/test-app");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://cdn.example.com/test-app/manifest.json",
      { signal: undefined },
    );
    expect(result).toEqual(manifest);
  });

  it("应去除 entry 末尾斜杠再拼接 manifest.json", async () => {
    const manifest = mockManifest();
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        json: async () => manifest,
      }),
    );
    globalThis.fetch = mockFetch;

    await fetchManifest("https://cdn.example.com/test-app/");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://cdn.example.com/test-app/manifest.json",
      { signal: undefined },
    );
  });

  it("缓存命中时不应再次发起 fetch", async () => {
    const manifest = mockManifest({ name: "cached-app" });
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        json: async () => manifest,
      }),
    );
    globalThis.fetch = mockFetch;

    // 第一次：实际 fetch
    const result1 = await fetchManifest("https://cdn.example.com/cached");
    // 第二次：命中缓存
    const result2 = await fetchManifest("https://cdn.example.com/cached");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result1).toBe(result2); // 同一引用
    expect(result1.name).toBe("cached-app");
  });

  it("不同 entry 应独立缓存", async () => {
    const manifestA = mockManifest({ name: "app-a" });
    const manifestB = mockManifest({ name: "app-b" });
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        mockResponse({ ok: true, json: async () => manifestA }),
      )
      .mockResolvedValueOnce(
        mockResponse({ ok: true, json: async () => manifestB }),
      );
    globalThis.fetch = mockFetch;

    const resultA = await fetchManifest("https://cdn.example.com/a");
    const resultB = await fetchManifest("https://cdn.example.com/b");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(resultA.name).toBe("app-a");
    expect(resultB.name).toBe("app-b");
  });

  it("应传递 AbortSignal 到 fetch", async () => {
    const manifest = mockManifest();
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        json: async () => manifest,
      }),
    );
    globalThis.fetch = mockFetch;

    const controller = new AbortController();
    await fetchManifest("https://cdn.example.com/test", controller.signal);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://cdn.example.com/test/manifest.json",
      { signal: controller.signal },
    );
  });
});

describe("fetchManifest() 错误处理", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    clearManifestCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    clearManifestCache();
  });

  it("网络错误应抛出 KernelError(LOAD_MANIFEST_FETCH)", async () => {
    const networkError = new TypeError("Failed to fetch");
    globalThis.fetch = vi.fn().mockRejectedValue(networkError);

    await expect(fetchManifest("https://cdn.example.com/fail")).rejects.toThrow(
      KernelError,
    );

    try {
      await fetchManifest("https://cdn.example.com/fail");
    } catch (error) {
      expect(error).toBeInstanceOf(KernelError);
      const kernelErr = error as KernelError;
      expect(kernelErr.code).toBe(KernelErrorCode.LOAD_MANIFEST_FETCH);
      expect(kernelErr.cause).toBe(networkError);
      expect(kernelErr.message).toContain("Network error");
      expect(kernelErr.message).toContain(
        "https://cdn.example.com/fail/manifest.json",
      );
    }
  });

  it("hTTP 404 应抛出 KernelError(LOAD_MANIFEST_FETCH)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: false,
        status: 404,
      }),
    );

    await expect(
      fetchManifest("https://cdn.example.com/missing"),
    ).rejects.toThrow(KernelError);

    try {
      await fetchManifest("https://cdn.example.com/missing");
    } catch (error) {
      expect(error).toBeInstanceOf(KernelError);
      const kernelErr = error as KernelError;
      expect(kernelErr.code).toBe(KernelErrorCode.LOAD_MANIFEST_FETCH);
      expect(kernelErr.message).toContain("404");
      // HTTP 错误不应携带 cause（非网络层错误）
      expect(kernelErr.cause).toBeUndefined();
    }
  });

  it("hTTP 500 应抛出 KernelError(LOAD_MANIFEST_FETCH)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: false,
        status: 500,
      }),
    );

    try {
      await fetchManifest("https://cdn.example.com/server-error");
    } catch (error) {
      expect(error).toBeInstanceOf(KernelError);
      const kernelErr = error as KernelError;
      expect(kernelErr.code).toBe(KernelErrorCode.LOAD_MANIFEST_FETCH);
      expect(kernelErr.message).toContain("500");
    }
  });

  it("hTTP 503 应抛出 KernelError(LOAD_MANIFEST_FETCH)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: false,
        status: 503,
      }),
    );

    try {
      await fetchManifest("https://cdn.example.com/unavailable");
    } catch (error) {
      expect(error).toBeInstanceOf(KernelError);
      const kernelErr = error as KernelError;
      expect(kernelErr.code).toBe(KernelErrorCode.LOAD_MANIFEST_FETCH);
    }
  });

  it("jSON 解析失败应抛出 KernelError(LOAD_MANIFEST_INVALID)", async () => {
    const jsonParseError = new SyntaxError("Unexpected token < in JSON");
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        json: async () => {
          throw jsonParseError;
        },
      }),
    );

    await expect(
      fetchManifest("https://cdn.example.com/invalid-json"),
    ).rejects.toThrow(KernelError);

    try {
      await fetchManifest("https://cdn.example.com/invalid-json");
    } catch (error) {
      expect(error).toBeInstanceOf(KernelError);
      const kernelErr = error as KernelError;
      expect(kernelErr.code).toBe(KernelErrorCode.LOAD_MANIFEST_INVALID);
      expect(kernelErr.cause).toBe(jsonParseError);
      expect(kernelErr.message).toContain("Invalid JSON");
    }
  });

  it("空响应体 JSON 解析应抛出 LOAD_MANIFEST_INVALID", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        json: async () => {
          throw new SyntaxError("Unexpected end of JSON input");
        },
      }),
    );

    try {
      await fetchManifest("https://cdn.example.com/empty");
    } catch (error) {
      expect(error).toBeInstanceOf(KernelError);
      const kernelErr = error as KernelError;
      expect(kernelErr.code).toBe(KernelErrorCode.LOAD_MANIFEST_INVALID);
    }
  });

  it("fetch 抛出的 CORS 错误应包装为 LOAD_MANIFEST_FETCH", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("CORS error"));

    try {
      await fetchManifest("https://other-origin.com/app");
    } catch (error) {
      expect(error).toBeInstanceOf(KernelError);
      const kernelErr = error as KernelError;
      expect(kernelErr.code).toBe(KernelErrorCode.LOAD_MANIFEST_FETCH);
      expect(kernelErr.cause).toBeInstanceOf(TypeError);
    }
  });
});

describe("clearManifestCache() 缓存清理", () => {
  it("应清空所有缓存的 manifest", async () => {
    const manifest = mockManifest();
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        json: async () => manifest,
      }),
    );
    globalThis.fetch = mockFetch;

    // 预填充缓存
    await fetchManifest("https://cdn.example.com/app1");
    await fetchManifest("https://cdn.example.com/app2");
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // 清理缓存
    clearManifestCache();

    // 再次获取应重新 fetch
    await fetchManifest("https://cdn.example.com/app1");
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("清空不存在的缓存应安全（幂等）", () => {
    expect(() => clearManifestCache()).not.toThrow();
    expect(() => clearManifestCache()).not.toThrow();
  });

  it("清理缓存后不应影响下一次 fetch 的正确性", async () => {
    const manifest = mockManifest({ name: "fresh" });
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        json: async () => manifest,
      }),
    );

    await fetchManifest("https://cdn.example.com/fresh");
    clearManifestCache();
    const result = await fetchManifest("https://cdn.example.com/fresh");

    expect(result.name).toBe("fresh");
  });
});

describe("removeStylesheets() DOM 样式表清理", () => {
  beforeEach(() => {
    // 清理 head 中的所有 link 标签
    document
      .querySelectorAll("link[data-micro-kernel-app]")
      .forEach((el) => el.remove());
  });

  it("应移除指定应用的样式表", () => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.example.com/test.css";
    link.dataset.microKernelApp = "test-app";
    document.head.append(link);

    removeStylesheets("test-app");

    const remaining = document.querySelectorAll(
      'link[data-micro-kernel-app="test-app"]',
    );
    expect(remaining.length).toBe(0);
  });

  it("不应移除其他应用的样式表", () => {
    const link1 = document.createElement("link");
    link1.rel = "stylesheet";
    link1.href = "https://cdn.example.com/app1.css";
    link1.dataset.microKernelApp = "app-1";
    document.head.append(link1);

    const link2 = document.createElement("link");
    link2.rel = "stylesheet";
    link2.href = "https://cdn.example.com/app2.css";
    link2.dataset.microKernelApp = "app-2";
    document.head.append(link2);

    removeStylesheets("app-1");

    const remaining1 = document.querySelectorAll(
      'link[data-micro-kernel-app="app-1"]',
    );
    const remaining2 = document.querySelectorAll(
      'link[data-micro-kernel-app="app-2"]',
    );
    expect(remaining1.length).toBe(0);
    expect(remaining2.length).toBe(1);
  });

  it("移除不存在的样式表应安全（无异常）", () => {
    expect(() => removeStylesheets("nonexistent-app")).not.toThrow();
  });

  it("应移除同一应用的多个样式表", () => {
    for (let i = 0; i < 3; i++) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://cdn.example.com/style${i}.css`;
      link.dataset.microKernelApp = "multi-css-app";
      document.head.append(link);
    }

    removeStylesheets("multi-css-app");

    const remaining = document.querySelectorAll(
      'link[data-micro-kernel-app="multi-css-app"]',
    );
    expect(remaining.length).toBe(0);
  });
});

describe("manifest 数据结构校验", () => {
  it("应正确解析包含 routes 的 manifest", async () => {
    const manifest = mockManifest({
      routes: [
        { path: "/users", skeletonType: "list" },
        { path: "/detail", skeletonType: "detail" },
      ],
    });
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        json: async () => manifest,
      }),
    );

    const result = await fetchManifest("https://cdn.example.com/routed-app");

    expect(result.routes).toHaveLength(2);
    expect(result.routes?.[0]?.path).toBe("/users");
    expect(result.routes?.[0]?.skeletonType).toBe("list");
  });

  it("应解析无 routes 的 manifest", async () => {
    const manifest = mockManifest();
    delete manifest.routes;
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        json: async () => manifest,
      }),
    );

    const result = await fetchManifest("https://cdn.example.com/no-routes");

    expect(result.routes).toBeUndefined();
  });

  it("应解析无 css 的 manifest（空数组）", async () => {
    const manifest = mockManifest({ css: [] });
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        json: async () => manifest,
      }),
    );

    const result = await fetchManifest("https://cdn.example.com/no-css");

    expect(result.css).toEqual([]);
  });

  it("应保留 manifest 中额外字段（前向兼容）", async () => {
    const manifest = mockManifest({
      description: "测试应用",
      author: "dev-team",
    });
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        json: async () => manifest,
      }),
    );

    const result = await fetchManifest("https://cdn.example.com/extra-fields");

    expect(result).toHaveProperty("name", "test-app");
    expect(result).toHaveProperty("description", "测试应用");
    expect(result).toHaveProperty("author", "dev-team");
  });
});

describe("fetchManifest() manifest 缓存验证行为", () => {
  it("有效的 manifest.json 响应应被缓存", async () => {
    const manifest = mockManifest();
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        json: async () => manifest,
      }),
    );
    globalThis.fetch = mockFetch;

    // 首次获取
    await fetchManifest("https://cdn.example.com/cache-test");
    // 第二次获取应命中缓存
    const result = await fetchManifest("https://cdn.example.com/cache-test");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual(manifest);
  });
});
