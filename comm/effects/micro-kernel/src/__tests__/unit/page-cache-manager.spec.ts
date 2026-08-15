/**
 * page-cache-manager.spec.ts — P3-4 子应用 Page Cache 状态记忆机制测试
 *
 * 覆盖场景：
 * 1. captureScrollPosition — window + 可滚动容器
 * 2. restoreScrollPosition — 延迟恢复 + 路由校验
 * 3. persistPageCache / consumePersistedPageCache — 写入/读取/一次性消费
 * 4. TTL 过期 — 超期返回 null 并清理
 * 5. LRU 淘汰 — 超 maxEntriesPerApp 时移除最旧条目
 * 6. clearPageCacheForApp / clearAllPageCache — 清理 API
 * 7. saveAppState / loadAppState / removeAppState — 编程式状态存取
 * 8. getCacheSummary — 缓存状态摘要
 * 9. configurePageCache / getPageCachePolicy / resetPageCachePolicy — 策略配置
 * 10. hasPersistedPageCache — 不消费的缓存存在性检查
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock storage-utils（与 route-predictor / message-broker 测试保持一致的 mock 策略）
const _storage = new Map<string, unknown>();

vi.mock("../../storage-utils", () => ({
  getStorage: <T = unknown>(key: string): T | null => {
    return (_storage.has(key) ? _storage.get(key) : null) as T | null;
  },
  setStorage: (key: string, value: unknown) => {
    _storage.set(key, value);
  },
  removeStorage: (key: string) => {
    _storage.delete(key);
  },
  STORAGE_KEYS: {
    CANARY_CONFIG: "micro-kernel:canary-config",
    PRELOAD_STATS: "micro-kernel:preload-stats",
    ROUTE_PREDICTIONS: "micro-kernel:route-predictions",
    VERSION_CACHE: "micro-kernel:versions",
    REGISTRY_CACHE: "micro-kernel:registry-cache",
  },
}));

// Mock logger
vi.mock("@YDSZ-core/shared/utils", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

import {
  captureScrollPosition,
  clearAllPageCache,
  clearPageCacheForApp,
  configurePageCache,
  consumePersistedPageCache,
  getCacheSummary,
  getPageCachePolicy,
  hasPersistedPageCache,
  loadAppState,
  persistPageCache,
  removeAppState,
  resetPageCachePolicy,
  restoreScrollPosition,
  saveAppState,
} from "../../page-cache-manager";

import type { PageCacheRecord, ScrollPosition } from "../../page-cache-manager";

// ==================== 测试辅助 ====================

function createMockContainer(): HTMLElement {
  const container = document.createElement("div");
  container.id = "test-app-container";
  document.body.appendChild(container);
  return container;
}

function createScrollableContainer(parent: HTMLElement, id: string, scrollTop = 0): HTMLElement {
  const el = document.createElement("div");
  el.id = id;
  el.style.overflowY = "auto";
  el.scrollTop = scrollTop;
  // happy-dom 不计算 scrollHeight/clientHeight，通过 Object.defineProperty 模拟
  Object.defineProperty(el, "scrollHeight", { value: 1000, configurable: true });
  Object.defineProperty(el, "clientHeight", { value: 200, configurable: true });
  parent.appendChild(el);
  return el;
}

function buildRecord(overrides: Partial<PageCacheRecord> = {}): PageCacheRecord {
  return {
    scroll: {
      windowScrollY: 0,
      windowScrollX: 0,
      containers: {},
    },
    appState: { filter: "all" },
    createdAt: Date.now(),
    routePath: "/dashboard",
    ...overrides,
  };
}

// ==================== 测试套件 ====================

describe("page-cache-manager", () => {
  beforeEach(() => {
    _storage.clear();
    resetPageCachePolicy();
    // Mock window.scrollTo
    window.scrollTo = vi.fn();
    // 清理 DOM
    document.body.innerHTML = "";
  });

  afterEach(() => {
    _storage.clear();
    resetPageCachePolicy();
    vi.restoreAllMocks();
  });

  // ==================== 1. 策略配置 ====================

  describe("策略配置", () => {
    it("getPageCachePolicy 返回默认值", () => {
      const policy = getPageCachePolicy();
      expect(policy.maxEntriesPerApp).toBe(10);
      expect(policy.ttlMs).toBe(24 * 60 * 60 * 1000);
      expect(policy.restoreScrollDelayMs).toBe(100);
      expect(policy.maxContainerScrolls).toBe(20);
    });

    it("configurePageCache 部分覆盖默认策略", () => {
      configurePageCache({ maxEntriesPerApp: 3 });
      const policy = getPageCachePolicy();
      expect(policy.maxEntriesPerApp).toBe(3);
      // 其余不变
      expect(policy.ttlMs).toBe(24 * 60 * 60 * 1000);
      expect(policy.restoreScrollDelayMs).toBe(100);
    });

    it("resetPageCachePolicy 恢复默认值", () => {
      configurePageCache({ maxEntriesPerApp: 1, ttlMs: 1000 });
      resetPageCachePolicy();
      const policy = getPageCachePolicy();
      expect(policy.maxEntriesPerApp).toBe(10);
      expect(policy.ttlMs).toBe(24 * 60 * 60 * 1000);
    });

    it("getPageCachePolicy 返回副本（不泄漏内部引用）", () => {
      const policy = getPageCachePolicy();
      policy.maxEntriesPerApp = 999;
      expect(getPageCachePolicy().maxEntriesPerApp).toBe(10);
    });
  });

  // ==================== 2. 滚动位置捕获 ====================

  describe("captureScrollPosition", () => {
    it("捕获 window 滚动位置", () => {
      // 模拟 window.scrollY
      Object.defineProperty(window, "scrollY", { value: 150, configurable: true });
      Object.defineProperty(window, "scrollX", { value: 50, configurable: true });

      const container = createMockContainer();
      const position = captureScrollPosition(container);

      expect(position.windowScrollY).toBe(150);
      expect(position.windowScrollX).toBe(50);
    });

    it("不捕获无可滚动容器时的容器滚动", () => {
      Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
      Object.defineProperty(window, "scrollX", { value: 0, configurable: true });
      const container = createMockContainer();
      const position = captureScrollPosition(container);
      expect(Object.keys(position.containers).length).toBe(0);
    });
  });

  // ==================== 3. 持久化 + 读取 ====================

  describe("persistPageCache / consumePersistedPageCache", () => {
    it("写入后读取应返回相同记录", () => {
      const record = buildRecord({ appState: { tab: "users" } });
      persistPageCache("app-a", record);

      const consumed = consumePersistedPageCache("app-a", "/dashboard");
      expect(consumed).not.toBeNull();
      expect(consumed?.appState).toEqual({ tab: "users" });
    });

    it("一次性消费：第二次读取返回 null", () => {
      const record = buildRecord();
      persistPageCache("app-a", record);

      const first = consumePersistedPageCache("app-a", "/dashboard");
      expect(first).not.toBeNull();

      const second = consumePersistedPageCache("app-a", "/dashboard");
      expect(second).toBeNull();
    });

    it("不存在记录时返回 null", () => {
      const result = consumePersistedPageCache("non-existent", "/path");
      expect(result).toBeNull();
    });

    it("不同应用的缓存互不影响", () => {
      persistPageCache("app-a", buildRecord());
      persistPageCache("app-b", buildRecord({ routePath: "/settings" }));

      const a = consumePersistedPageCache("app-a", "/dashboard");
      const b = consumePersistedPageCache("app-b", "/settings");

      expect(a).not.toBeNull();
      expect(b).not.toBeNull();
    });
  });

  // ==================== 4. TTL 过期 ====================

  describe("TTL 过期", () => {
    it("超过 TTL 后读取返回 null", () => {
      // 使用极短的 TTL 配置
      configurePageCache({ ttlMs: 1 });

      const record = buildRecord({ createdAt: Date.now() - 100 }); // 100ms 前创建
      persistPageCache("app-a", record);

      // 等待 TTL 过期
      const consumed = consumePersistedPageCache("app-a", "/dashboard");
      expect(consumed).toBeNull();
    });

    it("未过期时正常返回", () => {
      configurePageCache({ ttlMs: 60 * 60 * 1000 }); // 1 小时
      const record = buildRecord({ createdAt: Date.now() - 1000 }); // 1s 前
      persistPageCache("app-a", record);

      const consumed = consumePersistedPageCache("app-a", "/dashboard");
      expect(consumed).not.toBeNull();
    });

    it("过期读取后同时清理 registry", () => {
      configurePageCache({ ttlMs: 1 });
      const record = buildRecord({ createdAt: Date.now() - 100 });
      persistPageCache("app-app-a", record);

      // 过期读取
      consumePersistedPageCache("app-app-a", "/dashboard");

      // 检查 registry
      const summary = getCacheSummary();
      expect(summary.totalApps).toBe(0);
    });
  });

  // ==================== 5. LRU 淘汰 ====================

  describe("LRU 淘汰", () => {
    it("超过 maxEntriesPerApp 时淘汰最旧条目", () => {
      configurePageCache({ maxEntriesPerApp: 2 });

      // 写入 3 条（使用当前时间确保不触发 TTL 过期）
      persistPageCache("app-a", buildRecord({ routePath: "/p1", createdAt: Date.now() }));
      persistPageCache("app-a", buildRecord({ routePath: "/p2", createdAt: Date.now() + 1 }));
      persistPageCache("app-a", buildRecord({ routePath: "/p3", createdAt: Date.now() + 2 }));

      // 应只有 2 条（/p1 最先被写入，最先被淘汰）
      expect(hasPersistedPageCache("app-a", "/p1")).toBe(false);
      expect(hasPersistedPageCache("app-a", "/p2")).toBe(true);
      expect(hasPersistedPageCache("app-a", "/p3")).toBe(true);
    });

    it("persistPageCache 返回被淘汰的 route 列表", () => {
      configurePageCache({ maxEntriesPerApp: 1 });

      persistPageCache("app-a", buildRecord({ routePath: "/old" }));
      const evicted = persistPageCache("app-a", buildRecord({ routePath: "/new" }));

      expect(evicted).toContain("/old");
    });

    it("同 path 更新不触发淘汰", () => {
      configurePageCache({ maxEntriesPerApp: 2 });

      persistPageCache("app-a", buildRecord({ routePath: "/p1" }));
      persistPageCache("app-a", buildRecord({ routePath: "/p2" }));
      // 更新 p1
      persistPageCache("app-a", buildRecord({ routePath: "/p1" }));

      const summary = getCacheSummary();
      expect(summary.totalEntries).toBe(2);
    });
  });

  // ==================== 6. 清理 API ====================

  describe("清理 API", () => {
    it("clearPageCacheForApp 清理指定应用", () => {
      persistPageCache("app-a", buildRecord());
      persistPageCache("app-a", buildRecord({ routePath: "/other" }));
      persistPageCache("app-b", buildRecord({ routePath: "/x" }));

      const cleared = clearPageCacheForApp("app-a");
      expect(cleared).toBe(2);
      expect(hasPersistedPageCache("app-a", "/dashboard")).toBe(false);
      expect(hasPersistedPageCache("app-a", "/other")).toBe(false);
      // app-b 不受影响
      expect(hasPersistedPageCache("app-b", "/x")).toBe(true);
    });

    it("clearPageCacheForApp 返回清理的条目数", () => {
      persistPageCache("app-a", buildRecord());
      const count = clearPageCacheForApp("app-a");
      expect(count).toBe(1);
    });

    it("clearAllPageCache 清理全部", () => {
      persistPageCache("app-a", buildRecord());
      persistPageCache("app-b", buildRecord({ routePath: "/b" }));
      persistPageCache("app-c", buildRecord({ routePath: "/c" }));

      clearAllPageCache();

      const summary = getCacheSummary();
      expect(summary.totalEntries).toBe(0);
    });
  });

  // ==================== 7. 编程式状态存取 ====================

  describe("saveAppState / loadAppState", () => {
    it("保存后读取返回相同值", () => {
      saveAppState("app-a", "filter", { status: "active", sort: "name" });
      const value = loadAppState("app-a", "filter", null);
      expect(value).toEqual({ status: "active", sort: "name" });
    });

    it("不存在键返回默认值", () => {
      const value = loadAppState("app-a", "nonexistent", "default_value");
      expect(value).toBe("default_value");
    });

    it("不同应用的状态隔离", () => {
      saveAppState("app-a", "tab", "users");
      saveAppState("app-b", "tab", "orders");

      expect(loadAppState("app-a", "tab", "")).toBe("users");
      expect(loadAppState("app-b", "tab", "")).toBe("orders");
    });

    it("removeAppState 删除指定状态", () => {
      saveAppState("app-a", "key1", "value1");
      removeAppState("app-a", "key1");
      expect(loadAppState("app-a", "key1", "default")).toBe("default");
    });

    it("支持复杂对象值", () => {
      const complexValue = {
        nested: { a: 1, b: [2, 3] },
        date: "2024-01-01",
      };
      saveAppState("app-a", "complex", complexValue);
      expect(loadAppState("app-a", "complex", null)).toEqual(complexValue);
    });
  });

  // ==================== 8. 缓存摘要 ====================

  describe("getCacheSummary", () => {
    it("无缓存时返回零值", () => {
      const summary = getCacheSummary();
      expect(summary.totalApps).toBe(0);
      expect(summary.totalEntries).toBe(0);
      expect(summary.apps).toEqual([]);
    });

    it("返回正确的统计信息", () => {
      persistPageCache("app-a", buildRecord());
      persistPageCache("app-a", buildRecord({ routePath: "/other" }));
      persistPageCache("app-b", buildRecord({ routePath: "/b" }));

      const summary = getCacheSummary();
      expect(summary.totalApps).toBe(2);
      expect(summary.totalEntries).toBe(3);
      expect(summary.apps).toContainEqual({ name: "app-a", entries: 2 });
      expect(summary.apps).toContainEqual({ name: "app-b", entries: 1 });
    });
  });

  // ==================== 9. hasPersistedPageCache ====================

  describe("hasPersistedPageCache", () => {
    it("缓存存在且未过期返回 true", () => {
      persistPageCache("app-a", buildRecord());
      expect(hasPersistedPageCache("app-a", "/dashboard")).toBe(true);
    });

    it("缓存不存在返回 false", () => {
      expect(hasPersistedPageCache("app-a", "/noexist")).toBe(false);
    });

    it("缓存过期返回 false 并清理", () => {
      configurePageCache({ ttlMs: 1 });
      persistPageCache("app-a", buildRecord({ createdAt: Date.now() - 100 }));

      expect(hasPersistedPageCache("app-a", "/dashboard")).toBe(false);
      // 确认已清理
      const summary = getCacheSummary();
      expect(summary.totalEntries).toBe(0);
    });

    it("hasPersistedPageCache 不消费缓存（可多次查询）", () => {
      persistPageCache("app-a", buildRecord());

      expect(hasPersistedPageCache("app-a", "/dashboard")).toBe(true);
      expect(hasPersistedPageCache("app-a", "/dashboard")).toBe(true);
      // 之后仍能消费
      expect(consumePersistedPageCache("app-a", "/dashboard")).not.toBeNull();
    });
  });

  // ==================== 10. restoreScrollPosition ====================

  describe("restoreScrollPosition", () => {
    it("调用时设置 setTimeout", () => {
      vi.useFakeTimers();
      const container = createMockContainer();
      const record = buildRecord();

      restoreScrollPosition(record, container);

      // setTimeout 应被调用
      expect(vi.getTimerCount()).toBe(1);

      // 快进时间
      vi.advanceTimersByTime(200);

      // 滚动恢复需要匹配路由才滚动 window
      //（在 happy-dom 中 location.pathname 非 /dashboard）

      vi.useRealTimers();
    });

    it("路由 path 匹配时调用 window.scrollTo", () => {
      vi.useFakeTimers();
      const container = createMockContainer();
      const scrollRecord = buildRecord({
        scroll: { windowScrollY: 200, windowScrollX: 10, containers: {} },
        routePath: "/", // happy-dom location.pathname 默认为 /
      });

      restoreScrollPosition(scrollRecord, container);
      vi.advanceTimersByTime(200);

      expect(window.scrollTo).toHaveBeenCalledWith(10, 200);
      vi.useRealTimers();
    });

    it("路由 path 不匹配时不滚动 window", () => {
      vi.useFakeTimers();
      const container = createMockContainer();
      const scrollRecord = buildRecord({
        scroll: { windowScrollY: 200, windowScrollX: 0, containers: {} },
        routePath: "/different-page",
      });

      restoreScrollPosition(scrollRecord, container);
      vi.advanceTimersByTime(200);

      expect(window.scrollTo).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});
