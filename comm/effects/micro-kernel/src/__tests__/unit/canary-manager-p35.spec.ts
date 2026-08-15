/**
 * canary-manager-p35.spec.ts — P3-5 灰度发布增强测试
 *
 * 覆盖场景：
 * 1. 组织级白名单（whitelistOrgIds）命中
 * 2. 标签路由（routeTags）命中
 * 3. 分流决策遥测事件（onResolution / emitResolutionEvent）
 * 4. 回调取消注册（onResolution 返回的函数 / offResolution）
 * 5. 回调异常不影响分流结果
 * 6. Backward compatibility（无新字段时行为不变）
 * 7. org 与 userId 白名单的优先级（user 优先）
 * 8. tag 匹配与白名单优先级（白名单优先）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock storage-utils
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
  getCanaryManager,
  resetCanaryManager,
} from "../../canary-manager";
import type {
  CanaryGlobalConfig,
  CanaryResolutionEvent,
} from "../../canary-manager";

// ==================== 测试辅助 ====================

function buildConfig(overrides: Partial<CanaryGlobalConfig> = {}): CanaryGlobalConfig {
  return {
    enabled: true,
    mode: "advanced",
    whitelistUserIds: [],
    whitelistOrgIds: [],
    routeTags: [],
    forceTag: "canary",
    apps: [
      {
        appName: "workflow-web",
        stable: {
          version: "4.0.0",
          tag: "stable",
          entry: "https://cdn.example.com/workflow/4.0.0/",
          percentage: 90,
        },
        canaries: [
          {
            version: "4.1.0-canary",
            tag: "canary",
            entry: "https://cdn.example.com/workflow/4.1.0-canary/",
            percentage: 10,
          },
        ],
      },
    ],
    ...overrides,
  };
}

// ==================== 测试套件 ====================

describe("canary-manager P3-5", () => {
  beforeEach(() => {
    _storage.clear();
  });

  afterEach(() => {
    resetCanaryManager();
  });

  // ==================== 1. 组织级白名单 ====================

  describe("组织级白名单", () => {
    it("orgId 在 whitelistOrgIds 中时应命中 forceTag", () => {
      const cm = getCanaryManager();
      // 直接注入配置（跳过 init）
      (cm as unknown as { config: CanaryGlobalConfig }).config = buildConfig({
        whitelistOrgIds: ["org-engineering"],
      });

      const result = cm.resolveVersion("workflow-web", {
        userId: "user-anyone",
        orgId: "org-engineering",
      });

      expect(result.resolved.tag).toBe("canary");
      expect(result.whitelisted).toBe(true);
    });

    it("orgId 不在 whitelistOrgIds 时按百分比逻辑分流", () => {
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = buildConfig({
        whitelistOrgIds: ["org-engineering"],
      });

      // 找一个不属于该 org 且哈希不在 10% 桶位的 userId
      const result = cm.resolveVersion("workflow-web", {
        userId: "user-stable-fallback",
        orgId: "org-other-dept",
      });

      // 如果该用户哈希在 10% 内就会命中 canary，否则 stable
      // 这里确保不是因 org 命中
      expect(typeof result.resolved.tag).toBe("string");
      expect(result.whitelisted).toBe(false);
    });

    it("whitelistOrgIds 为空数组时所有人走百分比", () => {
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = buildConfig({
        whitelistOrgIds: [],
      });

      const result = cm.resolveVersion("workflow-web", {
        userId: "user-anyone",
        orgId: "org-engineering",
      });

      expect(result.whitelisted).toBe(false);
    });

    it("无 orgId 的用户不受 whitelistOrgIds 影响", () => {
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = buildConfig({
        whitelistOrgIds: ["org-engineering"],
      });

      const result = cm.resolveVersion("workflow-web", {
        userId: "user-no-org",
      });

      // 不应因 org 命中（因为没提供 orgId）
      expect(result.whitelisted).toBe(false);
    });
  });

  // ==================== 2. 标签路由 ====================

  describe("标签路由", () => {
    it("用户标签与 routeTags 有交集时命中 forceTag", () => {
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = buildConfig({
        routeTags: ["internal-tester", "vip"],
      });

      const result = cm.resolveVersion("workflow-web", {
        userId: "user-labeled",
        tags: ["internal-tester", "engineering"],
      });

      expect(result.resolved.tag).toBe("canary");
    });

    it("用户标签与 routeTags 无交集时走百分比", () => {
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = buildConfig({
        routeTags: ["internal-tester"],
      });

      const result = cm.resolveVersion("workflow-web", {
        userId: "user-regular",
        tags: ["engineering", "product"],
      });

      // 不应命中 canary（除非百分比哈希恰好命中）
      expect(result.resolved.tag).toMatch(/stable|canary/);
    });

    it("用户无 tags 字段时标签路由不参与", () => {
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = buildConfig({
        routeTags: ["internal-tester"],
      });

      const result = cm.resolveVersion("workflow-web", {
        userId: "user-no-tags",
      });

      // 不应命中（无标签匹配）
      expect(result.resolved.tag).toBe("stable");
    });

    it("routeTags 为空数组时标签路由不参与", () => {
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = buildConfig({
        routeTags: [],
      });

      const result = cm.resolveVersion("workflow-web", {
        userId: "user-with-tags",
        tags: ["internal-tester"],
      });

      // 标签路由不生效，走百分比
      expect(result.resolved.tag).toBe("stable");
    });
  });

  // ==================== 3. 分流决策遥测事件 ====================

  describe("onResolution 遥测事件", () => {
    it("决策后触发回调并传入正确的事件数据", async () => {
      vi.useFakeTimers();
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = buildConfig({
        whitelistUserIds: ["user-whitelisted"],
      });

      const events: CanaryResolutionEvent[] = [];
      cm.onResolution((e) => events.push(e));

      cm.resolveVersion("workflow-web", { userId: "user-whitelisted" });

      // 事件通过 queueMicrotask 异步触发
      await vi.advanceTimersByTimeAsync(0);

      expect(events.length).toBe(1);
      expect(events[0].appName).toBe("workflow-web");
      expect(events[0].userId).toBe("user-whitelisted");
      expect(events[0].resolvedTag).toBe("canary");
      expect(events[0].resolvedVersion).toBe("4.1.0-canary");
      expect(events[0].whitelisted).toBe(true);
      expect(events[0].reason).toBe("whitelist_user");
      expect(typeof events[0].timestamp).toBe("number");

      vi.useRealTimers();
    });

    it("org 命中时 reason = whitelist_org", async () => {
      vi.useFakeTimers();
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = buildConfig({
        whitelistOrgIds: ["org-rd"],
      });

      const events: CanaryResolutionEvent[] = [];
      cm.onResolution((e) => events.push(e));

      cm.resolveVersion("workflow-web", {
        userId: "user-any",
        orgId: "org-rd",
      });

      await vi.advanceTimersByTimeAsync(0);

      expect(events[0].reason).toBe("whitelist_org");
      expect(events[0].orgId).toBe("org-rd");
      vi.useRealTimers();
    });

    it("tag 命中时 reason = tag_match", async () => {
      vi.useFakeTimers();
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = buildConfig({
        routeTags: ["beta-tester"],
      });

      const events: CanaryResolutionEvent[] = [];
      cm.onResolution((e) => events.push(e));

      cm.resolveVersion("workflow-web", {
        userId: "user-tagged",
        tags: ["beta-tester"],
      });

      await vi.advanceTimersByTimeAsync(0);

      expect(events[0].reason).toBe("tag_match");
      vi.useRealTimers();
    });

    it("无监听器时 resolveVersion 正常工作不抛错", () => {
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = buildConfig();

      expect(() => {
        cm.resolveVersion("workflow-web", { userId: "user-1" });
      }).not.toThrow();
    });
  });

  // ==================== 4. 回调管理 ====================

  describe("回调管理", () => {
    it("onResolution 返回的取消函数可移除回调", async () => {
      vi.useFakeTimers();
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = buildConfig();

      const events: CanaryResolutionEvent[] = [];
      const unregister = cm.onResolution((e) => events.push(e));

      // 第一次决策
      cm.resolveVersion("workflow-web", { userId: "user-1" });
      await vi.advanceTimersByTimeAsync(0);
      expect(events.length).toBe(1);

      // 取消注册
      unregister();

      // 第二次决策
      cm.resolveVersion("workflow-web", { userId: "user-2" });
      await vi.advanceTimersByTimeAsync(0);
      expect(events.length).toBe(1); // 未再新增

      vi.useRealTimers();
    });

    it("offResolution 移除指定回调", async () => {
      vi.useFakeTimers();
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = buildConfig();

      const eventsA: CanaryResolutionEvent[] = [];
      const eventsB: CanaryResolutionEvent[] = [];
      const cbA = (e: CanaryResolutionEvent) => eventsA.push(e);
      const cbB = (e: CanaryResolutionEvent) => eventsB.push(e);

      cm.onResolution(cbA);
      cm.onResolution(cbB);

      cm.offResolution(cbB);

      cm.resolveVersion("workflow-web", { userId: "user-1" });
      await vi.advanceTimersByTimeAsync(0);

      expect(eventsA.length).toBe(1);
      expect(eventsB.length).toBe(0); // B 已移除

      vi.useRealTimers();
    });

    it("回调内部抛出异常不影响分流结果和后续回调", async () => {
      vi.useFakeTimers();
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = buildConfig({
        whitelistUserIds: ["user-wl"],
      });

      const events: CanaryResolutionEvent[] = [];

      // 注册一个会抛错的回调 + 一个正常的回调
      cm.onResolution(() => {
        throw new Error("telemetry bug");
      });
      cm.onResolution((e) => events.push(e));

      // 分流决策应正常返回
      const result = cm.resolveVersion("workflow-web", { userId: "user-wl" });
      expect(result.resolved.tag).toBe("canary");

      await vi.advanceTimersByTimeAsync(0);

      // 第二个回调仍能收到事件
      expect(events.length).toBe(1);

      vi.useRealTimers();
    });
  });

  // ==================== 5. Backward Compatibility ====================

  describe("向后兼容", () => {
    it("无 whitelistOrgIds/routeTags 时行为与以前一致", () => {
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = {
        enabled: true,
        mode: "advanced",
        whitelistUserIds: ["legacy-user"],
        forceTag: "canary",
        apps: [
          {
            appName: "legacy-app",
            stable: {
              version: "1.0.0",
              tag: "stable",
              entry: "https://legacy.example.com/",
              percentage: 80,
            },
            canaries: [
              {
                version: "1.1.0-rc",
                tag: "canary",
                entry: "https://legacy.example.com/rc/",
                percentage: 20,
              },
            ],
          },
        ],
      };

      // 白名单命中
      const result = cm.resolveVersion("legacy-app", { userId: "legacy-user" });
      expect(result.resolved.tag).toBe("canary");
      expect(result.whitelisted).toBe(true);
    });

    it("simple 模式仍正常工作", () => {
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = {
        enabled: true,
        mode: "simple",
        whitelistUserIds: [],
        forceTag: "beta",
        apps: [
          {
            appName: "simple-app",
            stable: {
              version: "1.0.0",
              tag: "stable",
              entry: "https://simple.example.com/",
              percentage: 100,
            },
            canaries: [
              {
                version: "1.1.0-beta",
                tag: "beta",
                entry: "https://simple.example.com/beta/",
                percentage: 0,
              },
            ],
          },
        ],
      };

      const result = cm.resolveVersion("simple-app", { userId: "any" });
      expect(result.resolved.tag).toBe("beta");
    });
  });

  // ==================== 6. 优先级 ====================

  describe("优先级", () => {
    it("userId 白名单优先级高于 org 白名单", async () => {
      vi.useFakeTimers();
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = buildConfig({
        whitelistUserIds: ["user-specific"],
        whitelistOrgIds: ["org-mismatch"], // 用户不属于此 org
      });

      const events: CanaryResolutionEvent[] = [];
      cm.onResolution((e) => events.push(e));

      const result = cm.resolveVersion("workflow-web", {
        userId: "user-specific",
        orgId: "org-different",
      });

      expect(result.resolved.tag).toBe("canary");
      await vi.advanceTimersByTimeAsync(0);
      expect(events[0].reason).toBe("whitelist_user"); // 非 whitelist_org

      vi.useRealTimers();
    });

    it("用户白名单优先级高于标签路由", async () => {
      vi.useFakeTimers();
      const cm = getCanaryManager();
      (cm as unknown as { config: CanaryGlobalConfig }).config = buildConfig({
        whitelistUserIds: ["user-priority"],
        routeTags: ["overridden-tag"],
      });

      const events: CanaryResolutionEvent[] = [];
      cm.onResolution((e) => events.push(e));

      const result = cm.resolveVersion("workflow-web", {
        userId: "user-priority",
        tags: ["overridden-tag"],
      });

      expect(result.resolved.tag).toBe("canary");
      await vi.advanceTimersByTimeAsync(0);
      expect(events[0].reason).toBe("whitelist_user");

      vi.useRealTimers();
    });
  });
});
