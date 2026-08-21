/**
 * 内核路由同步 — 路由监听 + activeRule 匹配 + 应用激活
 *
 * 从 kernel.ts 提取的路由同步逻辑，覆盖 popstate（浏览器前进/后退）+
 * 自定义 route-change（history pushState/replaceState 补丁）。
 *
 * === P2-2: activeRule 索引 ===
 * string 类型按长度降序排列：/app/detail 优先于 /app。
 * /function/RegExp 走 slow-path。
 *
 * === S2 修复 ===
 * 路径不匹配任何子应用时，卸载当前活跃应用。
 *
 * @path comm/effects/micro-kernel/src/kernel-router.ts
 * @author ydsz-team
 * @since 4.2.1
 */

import type { MicroAppConfig, StartOptions } from "@ydsz/micro-runtime";

import { createLogger } from "@YDSZ-core/shared/utils";

import { isDegraded } from "./error-boundary";
import { matchActiveRule, patchHistory, ROUTE_CHANGE_EVENT } from "./kernel-helpers";
import { deactivateApp, getAppInstance } from "./scheduler";

import type { LifecycleStateAccessors } from "./kernel-lifecycle";

/** 模块级日志器 */
const logger = createLogger("MicroKernel:Router");

/**
 * 创建路由同步函数（startRouterSync）。
 *
 * 路由监听：匹配 activeRule → 激活对应子应用。
 * 覆盖 popstate（浏览器前进/后退）+ 自定义 route-change（history pushState/replaceState 补丁）。
 *
 * @param state - 闭包状态访问器
 * @param switchToAppFn - 已创建的 switchToApp 函数引用
 * @returns startRouterSync 函数
 */
export function createStartRouterSync(
  state: LifecycleStateAccessors,
  switchToAppFn: (config: MicroAppConfig, options?: StartOptions) => Promise<void>,
) {
  return function startRouterSync(
    routerApps: MicroAppConfig[],
    options?: StartOptions,
  ): () => void {
    const historyPatchCleanup = patchHistory();

    // === P2-2: activeRule 索引 — string 类型构建 Map + 排序，/function/RegExp 走 slow-path ===
    const stringRules: Array<{ app: MicroAppConfig; rule: string }> = [];
    const nonStringRules: MicroAppConfig[] = [];
    for (const app of routerApps) {
      if (typeof app.activeRule === "string") {
        stringRules.push({ rule: app.activeRule, app });
      } else {
        nonStringRules.push(app);
      }
    }
    // 长度降序：更具体的路径优先匹配
    stringRules.sort((a, b) => b.rule.length - a.rule.length);

    function findMatchingApp(path: string): MicroAppConfig | null {
      for (const { rule, app } of stringRules) {
        if (path.startsWith(rule)) return app;
      }
      for (const app of nonStringRules) {
        if (matchActiveRule(path, app.activeRule)) return app;
      }
      return null;
    }

    function handleRouteChange(): void {
      const path = window.location.pathname;

      const app = findMatchingApp(path);
      if (app) {
        if (isDegraded(app.name)) {
          // 降级应用走整页跳转
          if (state.getActiveAppName() !== app.name) {
            const fallbackUrl = typeof app.activeRule === "string" ? app.activeRule : app.entry;
            window.location.href = fallbackUrl;
          }
          return;
        }

        // P1-3: 路由激活阶段权限守卫
        if (options?.onRouteActivate && !options.onRouteActivate(app.name)) {
          logger.warn(`Route activation blocked by guard for "${app.name}"`);
          return;
        }

        void switchToAppFn(app, options);
        return;
      }

      // === S2 修复：路径不匹配任何子应用时，卸载当前活跃应用 ===
      if (state.getActiveAppName()) {
        const current = getAppInstance(state.getActiveAppName()!);
        if (current) {
          void deactivateApp(current);
          state.setActiveAppName(null);
          logger.debug(`Deactivated "${current.config.name}" (no activeRule match)`);
        }
      }
    }

    // 首次匹配
    handleRouteChange();

    // 浏览器的前进/后退
    window.addEventListener("popstate", handleRouteChange);
    // history pushState/replaceState 补丁派发的事件
    window.addEventListener(ROUTE_CHANGE_EVENT, handleRouteChange);

    return () => {
      historyPatchCleanup();
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener(ROUTE_CHANGE_EVENT, handleRouteChange);
    };
  };
}
