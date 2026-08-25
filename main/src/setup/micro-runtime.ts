/**
 * 微前端运行时装配模块
 *
 * 负责 micro-kernel 内核注册、micro-runtime 实例创建、子应用注册表解析
 * （静态/远程/自动三模式）、生命周期钩子、版本管理、路由预测预加载、
 * per-app Tab 会话追踪。
 *
 * 从 bootstrap.ts 拆出（原 v3.0/v3.3/v3.7.0/v4.0 逻辑），保持行为不变。
 *
 * @path main/src/setup/micro-runtime.ts
 * @author ydsz-team
 * @since 4.1.0
 */
import { watchEffect } from "vue";

import {
  createKernel,
  getErrorFallbackMessagesByLocale,
  getPreloadManager,
  getVersionManager,
  setErrorFallbackMessages,
  setStaticRegistry,
} from "@ydsz/micro-kernel";
import { registerPreloadAdapter } from "@YDSZ-core/menu-ui";
import { createRuntime, registerKernel, type MicroAppConfig } from "@ydsz/micro-runtime";
import { preferences } from "@ydsz/preferences";
import { startProgress, stopProgress } from "@ydsz/utils";
import { getProdEntry, MICRO_APPS, PATH_TO_APP_MAP } from "@ydsz/vite-config";

import { createLogger } from "@YDSZ-core/shared/utils";

import { recordSubAppTabOpened } from "#/hooks/use-tabbar-micro-sync";
import { router } from "#/router";

/**
 * 单个 micro-runtime 实例（整个主应用生命周期唯一，供其他模块获取）。
 *
 * 注意：ESM 的 import 绑定对消费者是只读的，外部无法重新赋值；
 * 内部通过本模块唯一写入，实现“可读不可改”的不可变导出。
 */
export let microRuntime: null | ReturnType<typeof createRuntime> = null;

/** 微运行时日志器 */
const runtimeLogger = createLogger("MicroRuntime");
/** 版本管理器日志器 */
const versionLogger = createLogger("VersionManager");

/** 注册表模式：默认 'auto'（优先远程，回退静态），可通过 VITE_MICRO_APPS_REGISTRY_MODE 覆盖 */
function getRegistryMode(): "auto" | "remote" | "static" {
  const mode = import.meta.env.VITE_MICRO_APPS_REGISTRY_MODE;
  if (mode === "static" || mode === "remote" || mode === "auto") return mode;
  // 若未配 VITE_MICRO_APPS_REGISTRY_MODE 但配了 VITE_MICRO_APPS_REGISTRY endpoint，自动启用 remote
  if (import.meta.env.VITE_MICRO_APPS_REGISTRY) return "remote";
  return "auto";
}

/** 子应用静态注册配置（静态模式 / 远程注册表失败回退共用） */
function buildStaticAppConfigs() {
  return MICRO_APPS.map((app) => ({
    name: app.name,
    entry: import.meta.env.DEV
      ? `//localhost:${app.devPort}`
      : getProdEntry(app),
    container: "#subapp-container",
    activeRule: app.activeRule,
    sandbox: app.sandbox,
  }));
}

/**
 * 启动微前端运行时。
 *
 * v3.7.0: 支持远程注册表（registry='auto'/'remote' 时异步拉取注册表）；
 *         registry='static' 保持同步注册以兼容既有流程。
 * v3.3:
 *   - 同步 error-boundary 降级 UI 文案至当前偏好语言，运行时随语言切换更新
 *   - nprogress 联动 micro-kernel 生命周期：beforeLoad 启动、afterMount/error 停止，
 *     使子应用几秒级 ESM 加载 + mount 耗时获得连续的顶部进度条反馈
 */
export function registerMicroRuntime() {
  // 1. 注册 micro-kernel 内核
  registerKernel("micro-kernel", () => createKernel());

  // 1.1 v4.3.0: 注入静态注册表（内核依赖反转，见 registry-adapter.setStaticRegistry）
  //     远程注册表拉取失败时的回退数据源，内核不再直接依赖构建配置包。
  setStaticRegistry(MICRO_APPS);

  // 2. 创建运行时实例
  microRuntime = createRuntime({ kernel: "micro-kernel" });
  runtimeLogger.info("Initialized with kernel: micro-kernel");

  // 2.1 接线：菜单 hover 预加载适配器（依赖反转，见 @YDSZ-core/menu-ui preload-adapter）
  //     底层 UI 组件不直接依赖 micro-kernel，由主应用在此组装二者。
  registerPreloadAdapter({
    triggerPreload: (appName) => getPreloadManager().triggerPreload(appName),
    hasPermission: (appName) => getPreloadManager().hasPermission(appName),
  });

  // 3. 初始化版本管理器
  getVersionManager({
    checkInterval: 5 * 60 * 1000, // 5分钟检查一次
    autoCheck: true,
    onVersionCheck: (result) => {
      if (result.hasUpdate) {
        versionLogger.info(
          `App ${result.appName} updated: ${result.currentVersion} -> ${result.latestVersion}`,
        );
        // 可以在这里触发更新提示或自动刷新逻辑
      }
    },
  });
  versionLogger.info("Initialized");

  // v3.3: 同步 error-boundary 降级 UI 文案至当前偏好语言
  // watchEffect 保证后续语言切换时文案自动更新
  watchEffect(() => {
    const locale = preferences.app.locale;
    setErrorFallbackMessages(getErrorFallbackMessagesByLocale(locale));
  });

  // 4. 注入子应用配置（支持异步注册表）
  const registryMode = getRegistryMode();

  if (registryMode === "static") {
    // === 静态注册（同步） ===
    microRuntime!.registerApps(buildStaticAppConfigs());
    finishRuntimeSetup();
  } else {
    // === 远程/自动注册（异步：拉取注册表 → 注册 → 启动） ===
    void (async () => {
      try {
        runtimeLogger.info(`Registry mode: ${registryMode}, fetching ...`);
        const configs = await microRuntime!.registerAppsAsync({
          adapter: registryMode,
        });
        runtimeLogger.info(
          `Registry resolved: ${configs.length} apps registered`,
        );
        finishRuntimeSetup();
      } catch (error) {
        // 注册表拉取失败：回退到静态配置
        runtimeLogger.warn(
          `Registry fetch failed (${String(error)}), fallback to static`,
        );
        microRuntime!.registerApps(buildStaticAppConfigs());
        finishRuntimeSetup();
      }
    })();
  }
}

/**
 * 公共后续流程：生命周期钩子 + 启动 prefetch。
 * 同步 / 异步两条注册路径最终都汇聚于此。
 */
function finishRuntimeSetup() {
  if (!microRuntime) return;

  // 5. 生命周期钩子
  microRuntime.addLifecycleHook("beforeLoad", (app: MicroAppConfig) => {
    runtimeLogger.debug(`子应用 ${app.name} 开始加载...`);
    if (preferences.transition.progress) {
      startProgress();
    }
  });
  microRuntime.addLifecycleHook("afterMount", (app: MicroAppConfig) => {
    runtimeLogger.debug(`子应用 ${app.name} 挂载完成`);
    if (preferences.transition.progress) {
      stopProgress();
    }
  });
  microRuntime.addLifecycleHook("error", (app: MicroAppConfig, err) => {
    runtimeLogger.error(`子应用 ${app.name} 加载/挂载失败:`, err);
    if (preferences.transition.progress) {
      stopProgress();
    }
  });
  microRuntime.addLifecycleHook("afterUnmount", (app: MicroAppConfig) => {
    runtimeLogger.debug(`子应用 ${app.name} 卸载完成`);
  });

  // 6. 启动：micro-kernel 内建 prefetch 预热高频应用
  const prefetchApps = import.meta.env.VITE_PREFETCH_APPS
    ? import.meta.env.VITE_PREFETCH_APPS.split(",").map((s: string) => s.trim())
    : ["userinfo-web"];

  microRuntime.start({
    prefetch: (app) => prefetchApps.includes(app.name),
    // v4.2.1 N9: 路由预测预加载已下沉到内核 start() 内部（routePreload 默认启用）
  });

  // P3-1: 注册 per-app Tab 会话追踪
  // 每次路由跳转后，若目标路由属于某子应用，更新该子应用的会话状态
  // （打开路径集合 / 最后激活路径），驱动 useTabbarMicroSync 的保活/pin 决策
  router.afterEach((to) => {
    if (!to?.fullPath) return;
    const appName = getAppFromPathFromMap(to.fullPath);
    if (appName) {
      recordSubAppTabOpened(to.fullPath, appName);
    }
  });
}

/**
 * 从子应用路由映射中反查应用名（bootstrap 内部复用）。
 * 与 use-tabbar-micro-sync 保持解耦，避免 import cycle。
 */
function getAppFromPathFromMap(path: string): null | string {
  for (const [prefix, appName] of Object.entries(PATH_TO_APP_MAP)) {
    if (path.startsWith(prefix)) {
      return appName;
    }
  }
  return null;
}
