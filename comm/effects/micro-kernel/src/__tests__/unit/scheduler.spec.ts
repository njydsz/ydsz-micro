/**
 * Scheduler 调度器单元测试
 *
 * 验证 KeepAlive 配置、LRU 淘汰、TTL 过期等核心调度逻辑。
 *
 * @path comm/effects/micro-kernel/src/__tests__/unit/scheduler.spec.ts
 * @author ydsz-team
 * @since 4.1.0
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// 模拟 logger
vi.mock("@YDSZ-core/shared/utils", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// 模拟 loader
vi.mock("../../loader", () => ({
  loadApp: vi.fn(),
  removeStylesheets: vi.fn(),
}));

// 模拟 performance-utils
vi.mock("../../performance-utils", () => ({
  mark: vi.fn(),
  measure: vi.fn(),
}));

// 模拟 error-boundary
vi.mock("../../error-boundary", () => ({
  KernelError: class extends Error {
    code: string;
    constructor(code: string, message: string, _cause?: unknown) {
      super(message);
      this.code = code;
    }
  },
  KernelErrorCode: {
    MOUNT_ERROR: "MOUNT_ERROR",
    LOAD_ESM_IMPORT: "LOAD_ESM_IMPORT",
  },
  decideDegradationLevel: vi.fn(),
  getRetryCount: vi.fn(),
  getNextAutoRetryDelay: vi.fn(),
  isDegraded: vi.fn(),
  markDegraded: vi.fn(),
  renderErrorFallback: vi.fn(),
  setRetryCount: vi.fn(),
}));

// 模拟 sandbox-strategy
vi.mock("../../sandbox-strategy", () => ({
  createSandboxStrategy: vi.fn(() => ({
    mount: vi.fn(),
    unmount: vi.fn(),
    activate: vi.fn(),
    cleanup: vi.fn(),
    type: "snapshot" as const,
  })),
  SnapshotSandboxStrategy: class {
    activate = vi.fn();
    cleanup = vi.fn();
    mount = vi.fn();
    type = "snapshot" as const;
    unmount = vi.fn();
  },
  ProxySandboxStrategy: class {
    activate = vi.fn();
    cleanup = vi.fn();
    fakeWindow = {};
    mount = vi.fn();
    type = "proxy" as const;
    unmount = vi.fn();
  },
  IframeSandboxStrategy: class {
    activate = vi.fn();
    cleanup = vi.fn();
    mount = vi.fn();
    type = "iframe" as const;
    unmount = vi.fn();
  },
}));

// ==================== P0-N1: 全局测试隔离 ====================
// 每个测试前绑定全新默认调度器上下文，确保实例集互不串扰。
// （vi.resetModules 只隔离模块加载，不隔离同一模块实例内的 context 绑定）
beforeEach(async () => {
  const { bindSchedulerContext, createSchedulerContext } =
    await import("../../scheduler");
  bindSchedulerContext(createSchedulerContext());
});

describe("scheduler KeepAlive 配置", () => {
  beforeEach(async () => {
    // 每个测试前重置模块状态
    vi.resetModules();
  });

  it("默认配置：enabled=true, max=5, ttl=30min", async () => {
    const { getKeepAliveConfig } = await import("../../scheduler");
    const config = getKeepAliveConfig();

    expect(config.enabled).toBe(true);
    expect(config.max).toBe(5);
    expect(config.ttl).toBe(30 * 60 * 1000);
  });

  it("configureKeepAlive 可部分更新配置", async () => {
    const { configureKeepAlive, getKeepAliveConfig } =
      await import("../../scheduler");

    configureKeepAlive({ max: 8 });

    const config = getKeepAliveConfig();
    expect(config.max).toBe(8);
    // 未更新的字段保持原值
    expect(config.enabled).toBe(true);
    expect(config.ttl).toBe(30 * 60 * 1000);
  });

  it("configureKeepAlive 可禁用保活", async () => {
    const { configureKeepAlive, isKeepAliveEnabled } =
      await import("../../scheduler");

    configureKeepAlive({ enabled: false });

    expect(isKeepAliveEnabled()).toBe(false);
  });

  it("configureKeepAlive max 不允许负数", async () => {
    const { configureKeepAlive, getKeepAliveConfig } =
      await import("../../scheduler");

    configureKeepAlive({ max: -5 });

    const config = getKeepAliveConfig();
    expect(config.max).toBe(0); // Math.max(0, -5) = 0
  });

  it("configureKeepAlive TTL 不允许负数", async () => {
    const { configureKeepAlive, getKeepAliveConfig } =
      await import("../../scheduler");

    configureKeepAlive({ ttl: -1000 });

    const config = getKeepAliveConfig();
    expect(config.ttl).toBe(0); // Math.max(0, -1000) = 0
  });

  it("setMaxKeepAliveApps 兼容性 API 生效", async () => {
    const { setMaxKeepAliveApps, getKeepAliveConfig } =
      await import("../../scheduler");

    setMaxKeepAliveApps(3);

    const config = getKeepAliveConfig();
    expect(config.max).toBe(3);
  });
});

describe("scheduler 实例管理", () => {
  it("createAppInstance 创建并注册实例", async () => {
    const { createAppInstance, getAppInstance } =
      await import("../../scheduler");

    const config = {
      name: "test-app",
      entry: "/test/",
      container: "#container",
      activeRule: "/test",
    };

    const instance = createAppInstance(config);

    expect(instance.status).toBe("NOT_LOADED");
    expect(instance.keepAlive).toBe(false);
    expect(instance.pinned).toBe(false);
    expect(instance.sandboxType).toBe("snapshot"); // 默认值
    expect(instance.cachedRoot).toBeNull();
    expect(instance.exports).toBeNull();

    const retrieved = getAppInstance("test-app");
    expect(retrieved).toBe(instance);
  });

  it("createAppInstance 支持自定义沙箱类型", async () => {
    const { createAppInstance } = await import("../../scheduler");

    const config = {
      name: "iframe-app",
      entry: "/iframe/",
      container: "#container",
      activeRule: "/iframe",
      sandbox: "iframe" as const,
    };

    const instance = createAppInstance(config);

    expect(instance.sandboxType).toBe("iframe");
  });

  it("getAppInstance 未注册时返回 undefined", async () => {
    const { getAppInstance } = await import("../../scheduler");

    expect(getAppInstance("non-existent")).toBeUndefined();
  });

  it("getAllInstances 返回所有实例", async () => {
    const { createAppInstance, getAllInstances } =
      await import("../../scheduler");

    createAppInstance({
      name: "app-1",
      entry: "/app1/",
      container: "#c",
      activeRule: "/app1",
    });
    createAppInstance({
      name: "app-2",
      entry: "/app2/",
      container: "#c",
      activeRule: "/app2",
    });

    const all = getAllInstances();
    expect(all).toHaveLength(2);
    expect(all.map((i) => i.config.name).sort()).toEqual(["app-1", "app-2"]);
  });
});

describe("scheduler pin/unpin 应用", () => {
  it("setPinnedApp 可固定应用（LRU 跳过）", async () => {
    const { setPinnedApp, setKeepAlive, getAppInstance, createAppInstance } =
      await import("../../scheduler");

    const config = {
      name: "pinned-app",
      entry: "/pinned/",
      container: "#c",
      activeRule: "/pinned",
    };

    createAppInstance(config);
    setKeepAlive("pinned-app", true);
    setPinnedApp("pinned-app", true);

    const instance = getAppInstance("pinned-app");
    expect(instance?.pinned).toBe(true);
    expect(instance?.keepAlive).toBe(true);
  });

  it("setKeepAlive 可启用/禁用保活", async () => {
    const { setKeepAlive, getAppInstance, createAppInstance } =
      await import("../../scheduler");

    const config = {
      name: "keepalive-app",
      entry: "/ka/",
      container: "#c",
      activeRule: "/ka",
    };

    createAppInstance(config);
    setKeepAlive("keepalive-app", true);

    let instance = getAppInstance("keepalive-app");
    expect(instance?.keepAlive).toBe(true);

    setKeepAlive("keepalive-app", false);

    instance = getAppInstance("keepalive-app");
    expect(instance?.keepAlive).toBe(false);
  });
});

describe("scheduler KeepAlive 统计", () => {
  it("getKeepAliveCount 返回当前保活数", async () => {
    const {
      getKeepAliveCount,
      setKeepAlive,
      createAppInstance,
      getAppInstance,
    } = await import("../../scheduler");

    const initialCount = getKeepAliveCount();

    createAppInstance({
      name: "ka-test-1",
      entry: "/ka1/",
      container: "#c",
      activeRule: "/ka1",
    });
    setKeepAlive("ka-test-1", true);

    // 模拟一次 keepAlive 摘除后的缓存状态（status=UNMOUNTED + cachedRoot）
    const instance = getAppInstance("ka-test-1");
    if (instance) {
      instance.status = "UNMOUNTED";
      instance.cachedRoot = document.createElement("div");
    }

    expect(getKeepAliveCount()).toBe(initialCount + 1);
  });

  it("getKeepAliveTTL 返回当前 TTL", async () => {
    const { getKeepAliveTTL, configureKeepAlive } =
      await import("../../scheduler");

    expect(getKeepAliveTTL()).toBe(30 * 60 * 1000);

    configureKeepAlive({ ttl: 5 * 60 * 1000 });

    expect(getKeepAliveTTL()).toBe(5 * 60 * 1000);
  });
});

describe("p0-N1: SchedulerContext 闭包隔离", () => {
  // 动态导入的模块函数，用宽松类型声明避免测试文件耦合具体签名
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let bindCtx: (ctx: any) => any;
  let createCtx: () => unknown;

  beforeEach(async () => {
    const mod = await import("../../scheduler");
    bindCtx = mod.bindSchedulerContext;
    createCtx = mod.createSchedulerContext;
    // 每个测试前绑定全新默认上下文，避免测试间串扰
    bindCtx(createCtx() as Parameters<typeof bindCtx>[0]);
  });

  it("createSchedulerContext 创建全新上下文（默认值）", async () => {
    const { getKeepAliveConfig } = await import("../../scheduler");

    const ctx = createCtx() as any;
    expect(ctx.appInstances.size).toBe(0);
    expect(ctx.maxKeepAliveApps).toBe(5);
    expect(ctx.keepAliveTTL).toBe(30 * 60 * 1000);
    expect(ctx.keepAliveEnabled).toBe(true);
    expect(getKeepAliveConfig().max).toBe(5);
  });

  it("bindSchedulerContext 后模块级函数操作新上下文", async () => {
    const {
      createAppInstance,
      getAllInstances,
      configureKeepAlive,
      getKeepAliveConfig,
    } = await import("../../scheduler");

    const ctxA = createCtx() as any;
    const ctxB = createCtx() as any;
    (bindCtx as any)(ctxA);

    createAppInstance({
      name: "iso-a",
      entry: "/a/",
      container: "#c",
      activeRule: "/a",
    });
    configureKeepAlive({ max: 3 });

    // 切到 B：看不到 A 的实例，配置独立
    (bindCtx as any)(ctxB);
    expect(getAllInstances()).toHaveLength(0);
    expect(getKeepAliveConfig().max).toBe(5);

    // 切回 A：实例仍在
    (bindCtx as any)(ctxA);
    expect(getAllInstances()).toHaveLength(1);
    expect(getAllInstances()[0]?.config.name).toBe("iso-a");
    expect(getKeepAliveConfig().max).toBe(3);
  });

  it("bindSchedulerContext 返回上一个上下文", async () => {
    const ctxA = createCtx() as any;
    const prev = (bindCtx as any)(ctxA);
    expect(prev).toBeDefined();
    // 恢复
    (bindCtx as any)(prev);
  });
});

describe("p0-N2: AbortSignal 中止支持", () => {
  it("activateApp 收到已中止 signal 时抛 AbortError", async () => {
    const { activateApp, createAppInstance } = await import("../../scheduler");
    const { loadApp } = await import("../../loader");

    const instance = createAppInstance({
      name: "abort-app",
      entry: "/abort/",
      container: "#c",
      activeRule: "/abort",
    });
    (loadApp as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      exports: {
        mount: vi.fn().mockResolvedValue(undefined),
        unmount: vi.fn(),
      },
      manifest: null,
      duration: 10,
      fromCache: false,
    });

    const controller = new AbortController();
    controller.abort();

    await expect(
      activateApp(
        instance,
        document.createElement("div"),
        {},
        {},
        undefined,
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("deactivateApp 收到已中止 signal 时直接返回 success", async () => {
    const { deactivateApp, createAppInstance } =
      await import("../../scheduler");

    const instance = createAppInstance({
      name: "deact-abort",
      entry: "/da/",
      container: "#c",
      activeRule: "/da",
    });
    instance.status = "MOUNTED";

    const controller = new AbortController();
    controller.abort();

    const result = await deactivateApp(instance, controller.signal);
    expect(result.success).toBe(true);
  });
});
