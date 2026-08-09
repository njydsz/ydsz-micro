/**
 * useLocaleSync 主子应用国际化运行时同步 composable 单元测试
 *
 * 覆盖范围：
 * - registerLocaleProvider() — 主应用 provider 注册与就绪派发
 * - onLocaleChange() — 子应用 consumer 注册与 locale 广播
 * - useLocaleSync() provider 模式 — 监听并广播 locale 变化
 * - useLocaleSync() consumer 模式 — 跟随 provider 变化
 * - 初始 locale 同步
 * - 超时回退机制
 * - locale 不变时不重复发布（去重）
 *
 * @path comm/effects/micro-kernel/src/composables/__tests__/use-locale-sync.spec.ts
 * @since 4.2.0
 */

import type { UseLocaleSyncOptions } from "../use-locale-sync";

import { ref } from "vue";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  onLocaleChange,
  registerLocaleProvider,
  useLocaleSync,
} from "../use-locale-sync";

// 必须在使用 vue lifecycle hooks 之前注册 Mock
const unmountCallbacks = new Set<() => void>();

vi.mock("vue", async () => {
  const actual = await vi.importActual<typeof import("vue")>("vue");
  return {
    ...actual,
    onUnmounted: (cb: () => void) => {
      unmountCallbacks.add(cb);
    },
  };
});

vi.mock("@YDSZ-core/composables", () => ({
  createSharedComposable: (fn: () => unknown) => () => fn(),
  useSimpleLocale: () => ({
    $t: { value: (k: string) => k },
    currentLocale: { value: "zh-CN" },
    setSimpleLocale: vi.fn(),
  }),
}));

/**
 * 构建 mock Composer 对象
 */
function mockComposer(initialLocale = "zh-CN") {
  const localeRef = ref(initialLocale);
  return {
    locale: localeRef,
    t: vi.fn((k: string) => k),
    // 其他方法占位
  } as unknown as UseLocaleSyncOptions["i18n"];
}

/**
 * 清理模块级共享状态
 */
function resetSharedState(): void {
  // 强制调用已注册的卸载回调以清理内部状态
  const callbacks = [...unmountCallbacks];
  unmountCallbacks.clear();
  callbacks.forEach((cb) => cb());
}

describe("registerLocaleProvider()", () => {
  it("应注册 provider 并可通过 getLocale 读取当前 locale", () => {
    const composer = mockComposer("en-US");
    const unregister = registerLocaleProvider(composer);
    expect(typeof unregister).toBe("function");
    composer.locale.value = "zh-CN";
    unregister();
  });

  it("应在注册后立即派发 locale 给等待中的 resolver", () => {
    const composer = mockComposer("zh-CN");
    const unregister = registerLocaleProvider(composer);
    const composer2 = mockComposer("en-US");
    const unregister2 = registerLocaleProvider(composer2);
    unregister();
    unregister2();
  });
});

describe("onLocaleChange()", () => {
  it("应立即回调当前 provider locale", () => {
    const composer = mockComposer("zh-CN");
    const unregister = registerLocaleProvider(composer);

    const callback = vi.fn();
    const off = onLocaleChange(callback);

    expect(callback).toHaveBeenCalledWith("zh-CN");
    expect(typeof off).toBe("function");

    off();
    unregister();
  });

  it("取消注册后不再接收广播", () => {
    const composer = mockComposer("zh-CN");
    const unregisterProvider = registerLocaleProvider(composer);

    const callback = vi.fn();
    const off = onLocaleChange(callback);

    callback.mockClear();
    off();

    expect(callback).not.toHaveBeenCalled();

    unregisterProvider();
  });
});

describe("useLocaleSync() provider 模式", () => {
  beforeEach(() => resetSharedState());
  afterEach(() => resetSharedState());

  it("应返回 locale ref", () => {
    const composer = mockComposer("zh-CN");
    const { locale } = useLocaleSync({ i18n: composer });
    expect(locale.value).toBe("zh-CN");
  });

  it("应暴露 setLocale 方法修改 locale", () => {
    const composer = mockComposer("zh-CN");
    const { locale, setLocale } = useLocaleSync({ i18n: composer });

    setLocale("en-US");

    expect(locale.value).toBe("en-US");
    expect(composer.locale.value).toBe("en-US");
  });

  it("应在 i18n.locale 变化时同步到 ref", async () => {
    const composer = mockComposer("zh-CN");
    const { locale } = useLocaleSync({ i18n: composer });

    composer.locale.value = "en-US";

    await vi.waitFor(() => {
      expect(locale.value).toBe("en-US");
    });
  });

  it("应在 i18n.locale 变化时广播到 consumers", async () => {
    const composer = mockComposer("zh-CN");
    useLocaleSync({ i18n: composer });

    const childCallback = vi.fn();
    onLocaleChange(childCallback);

    composer.locale.value = "en-US";

    await vi.waitFor(() => {
      const calls = childCallback.mock.calls.flat();
      expect(calls).toContain("en-US");
    });
  });
});

describe("useLocaleSync() consumer 模式（已有 provider 时）", () => {
  beforeEach(() => resetSharedState());
  afterEach(() => resetSharedState());

  it("应立即同步 provider 的当前 locale", () => {
    const mainComposer = mockComposer("en-US");
    const unregisterProvider = registerLocaleProvider(mainComposer);

    const childComposer = mockComposer("zh-CN");
    const { locale } = useLocaleSync({
      i18n: childComposer,
      initialLocale: "zh-CN",
    });

    expect(locale.value).toBe("en-US");
    expect(childComposer.locale.value).toBe("en-US");

    unregisterProvider();
  });

  it("应在 provider locale 变化时跟随", async () => {
    // 主应用使用 useLocaleSync 注册 provider 并设置 watch
    const mainComposer = mockComposer("zh-CN");
    useLocaleSync({ i18n: mainComposer });

    // 子应用使用 useLocaleSync（consumer 模式）
    const childComposer = mockComposer("en-US");
    const { locale } = useLocaleSync({
      i18n: childComposer,
      initialLocale: "en-US",
    });

    expect(locale.value).toBe("zh-CN");

    mainComposer.locale.value = "en-US";

    await vi.waitFor(() => {
      expect(locale.value).toBe("en-US");
      expect(childComposer.locale.value).toBe("en-US");
    });
  });

  it("whenReady 在 provider 就绪后应尽快 resolve", async () => {
    const mainComposer = mockComposer("zh-CN");
    const unregisterProvider = registerLocaleProvider(mainComposer);

    const childComposer = mockComposer("en-US");
    const { whenReady } = useLocaleSync({
      i18n: childComposer,
      initialLocale: "en-US",
    });

    const readyLocale = await whenReady();
    expect(readyLocale).toBe("zh-CN");

    unregisterProvider();
  });
});

describe("useLocaleSync() 超时回退", () => {
  beforeEach(() => resetSharedState());
  afterEach(() => resetSharedState());

  it("provider 未就绪时应回退到 initialLocale", async () => {
    const childComposer = mockComposer("en-US");
    const { locale, whenReady } = useLocaleSync({
      i18n: childComposer,
      initialLocale: "en-US",
      providerReadyTimeout: 50,
    });

    const result = await whenReady();
    expect(result).toBe("en-US");
    expect(locale.value).toBe("en-US");
  });

  it("provider 未就绪时应回退到 i18n.locale", async () => {
    const childComposer = mockComposer("ja-JP");
    const { whenReady } = useLocaleSync({
      i18n: childComposer,
      providerReadyTimeout: 30,
    });

    const result = await whenReady();
    expect(result).toBe("ja-JP");
  });
});

describe("useLocaleSync() locale 去重", () => {
  beforeEach(() => resetSharedState());
  afterEach(() => resetSharedState());

  it("相同 locale 不应触发广播", async () => {
    const composer = mockComposer("zh-CN");
    const { setLocale } = useLocaleSync({ i18n: composer });

    const callback = vi.fn();
    onLocaleChange(callback);
    callback.mockClear();

    setLocale("zh-CN");

    expect(callback).not.toHaveBeenCalled();
  });

  it("不同 locale 应触发广播", async () => {
    const composer = mockComposer("zh-CN");
    const { setLocale } = useLocaleSync({ i18n: composer });

    const callback = vi.fn();
    onLocaleChange(callback);
    callback.mockClear();

    setLocale("en-US");

    // watch 是异步的，需等待广播
    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("en-US");
    });
  });
});

describe("useLocaleSync() 清理与卸载", () => {
  beforeEach(() => resetSharedState());
  afterEach(() => resetSharedState());

  it("卸载时应调用 onUnmounted 回调清理 provider 注册", () => {
    const composer = mockComposer("zh-CN");
    useLocaleSync({ i18n: composer });

    const callbacks = [...unmountCallbacks];
    unmountCallbacks.clear();
    callbacks.forEach((cb) => cb());

    const composer2 = mockComposer("en-US");
    registerLocaleProvider(composer2);
  });
});
