/**
 * 内核 Props 更新 — updateApp / updateAllApps / prefetchApp
 *
 * 从 kernel.ts 提取的子应用 props 更新与手动预加载逻辑。
 *
 * @path comm/effects/micro-kernel/src/kernel-props.ts
 * @author ydsz-team
 * @since 4.2.1
 */

import type { MicroAppConfig, MountProps } from "@ydsz/micro-runtime";

import { createLogger } from "@YDSZ-core/shared/utils";

import { loadApp } from "./loader";
import { getAllInstances, getAppInstance, updateAppProps } from "./scheduler";

/** 模块级日志器 */
const logger = createLogger("MicroKernel:Props");

/**
 * Props 更新所需的依赖。
 */
export interface PropsContext {
  /** 获取当前应用列表 */
  getApps: () => MicroAppConfig[];
  /** 版本管理器：检查更新 */
  checkVersionUpdate: (name: string, manifest: unknown) => Promise<void> | void;
}

/**
 * 创建子应用 props 更新与预加载函数。
 *
 * @param ctx - Props 上下文
 * @returns updateApp / updateAllApps / prefetchApp 函数
 */
export function createPropsFunctions(ctx: PropsContext) {
  /**
   * 运行时更新已挂载子应用的 props（P1-1）。
   * 当主应用需要向子应用注入新数据时，通过此方法通知子应用 update 生命周期。
   */
  async function updateApp(
    name: string,
    newProps: Record<string, unknown>,
  ): Promise<boolean> {
    const instance = getAppInstance(name);
    if (!instance) {
      logger.warn(`updateApp: app "${name}" not registered`);
      return false;
    }
    if (instance.status !== "MOUNTED") {
      logger.debug(`updateApp: app "${name}" not mounted (status=${instance.status}), skip`);
      return false;
    }
    try {
      instance.config.props = { ...instance.config.props, ...newProps };
      await updateAppProps(instance, instance.config.props as MountProps);
      return true;
    } catch (error) {
      logger.error(`updateApp: failed to update "${name}":`, error);
      return false;
    }
  }

  /**
   * 批量更新所有已挂载子应用的 props（P2-1）。
   * 适用于主题切换、租户切换、语言切换等"一键切换"场景。
   */
  async function updateAllApps(
    newProps: Record<string, unknown>,
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const instance of getAllInstances()) {
      if (instance.status !== "MOUNTED") continue;
      results[instance.config.name] = false;
      try {
        instance.config.props = { ...instance.config.props, ...newProps };
        await updateAppProps(instance, instance.config.props as MountProps);
        results[instance.config.name] = true;
      } catch (error) {
        logger.error(`updateAllApps: failed to update "${instance.config.name}":`, error);
      }
    }
    return results;
  }

  /**
   * 手动预加载指定子应用（用于 hover 预热等场景）。
   * 不检查网络条件（用户主动悬停意味着即将访问，值得拉取）。
   */
  async function prefetchApp(name: string): Promise<void> {
    const config = ctx.getApps().find((a) => a.name === name);
    if (!config) {
      logger.warn(`prefetchApp: app "${name}" not registered`);
      return;
    }
    try {
      const result = await loadApp(config);
      if (result.manifest) {
        await ctx.checkVersionUpdate(name, result.manifest);
      }
    } catch {
      // 静默 — 预加载失败不影响后续正常激活
    }
  }

  return { updateApp, updateAllApps, prefetchApp };
}
