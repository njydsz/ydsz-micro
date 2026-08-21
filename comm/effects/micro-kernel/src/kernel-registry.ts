/**
 * 内核应用注册 — registerAppsInternal / addAppInternal
 *
 * 从 kernel.ts 提取的应用注册辅助函数，处理应用去重、
 * 实例创建、版本追踪与构建模式 manifest 预热。
 *
 * @path comm/effects/micro-kernel/src/kernel-registry.ts
 * @author ydsz-team
 * @since 4.2.1
 */

import type { MicroAppConfig } from "@ydsz/micro-runtime";

import { createLogger } from "@YDSZ-core/shared/utils";

import { getAppInstance, createAppInstance } from "./scheduler";

/** 模块级日志器 */
const logger = createLogger("MicroKernel:Registry");

/**
 * 应用注册所需的依赖。
 */
export interface RegistryContext {
  /** 获取当前应用列表 */
  getApps: () => MicroAppConfig[];
  /** 设置应用列表 */
  setApps: (apps: MicroAppConfig[]) => void;
  /** 版本管理器：更新应用条目 */
  setAppEntries: (entries: Map<string, string>) => void;
}

/**
 * 创建应用注册辅助函数。
 *
 * @param ctx - 注册上下文
 * @returns registerAppsInternal 和 addAppInternal 函数
 */
export function createRegistryFunctions(ctx: RegistryContext) {
  function preloadManifestSafe(entry: string): void {
    import("./link-hints").then(({ preloadManifest }) => preloadManifest(entry));
  }

  function registerAppsInternal(newApps: MicroAppConfig[]): void {
    const apps = ctx.getApps();
    ctx.setApps([...new Set([...apps, ...newApps])]);
    for (const app of newApps) {
      if (!getAppInstance(app.name)) createAppInstance(app);
    }
    ctx.setAppEntries(new Map(ctx.getApps().map((a) => [a.name, a.entry])));
    const isBuildMode = !(
      import.meta !== undefined &&
      (import.meta as { env?: Record<string, unknown> }).env?.DEV === true
    );
    if (isBuildMode) {
      for (const app of newApps) preloadManifestSafe(app.entry);
    }
  }

  function addAppInternal(app: MicroAppConfig): boolean {
    const apps = ctx.getApps();
    if (apps.some((a) => a.name === app.name)) {
      logger.warn(`addApp: app "${app.name}" already registered, skip`);
      return false;
    }
    ctx.setApps([...apps, app]);
    if (!getAppInstance(app.name)) createAppInstance(app);
    ctx.setAppEntries(new Map(ctx.getApps().map((a) => [a.name, a.entry])));
    const isBuildMode = !(
      import.meta !== undefined &&
      (import.meta as { env?: Record<string, unknown> }).env?.DEV === true
    );
    if (isBuildMode) preloadManifestSafe(app.entry);
    logger.info(`addApp: registered "${app.name}"`);
    return true;
  }

  return { registerAppsInternal, addAppInternal };
}
