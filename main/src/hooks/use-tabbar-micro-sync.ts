/**
 * 多 Tab 子应用同步增强
 *
 * v3.7.0 (P3-1): 从"关闭任意 Tab 即卸载子应用"升级为"按子应用会话追踪"：
 * 1. 每个子应用独立追踪打开的 Tab 数，仅当最后一项 Tab 关闭时才卸载子应用
 * 2. 打开 Tab 时自动 pin 子应用（防 keep-alive 淘汰），最后 Tab 关闭时 unpin
 * 3. 记录子应用最后一次激活的路径，下次打开同子应用时自动恢复激活态
 *
 * 与 `comm/effects/layouts` 中 useTabbar 的配合：
 * - useTabbar 的 watch(route.fullPath) 在路由变化时自动 addTab
 * - 本 hook 监听 onTabClosed / onTabOpened，维护 per-app Tab 计数器
 * - 计数器 > 0 时 setKeepAlive(true) 并 pin；计数器 === 0 时 unpin 并 unmount
 *
 * @path main/src/hooks/use-tabbar-micro-sync.ts
 * @author ydsz-team
 * @since 3.0.0
 */

import { onTabClosed } from "@ydsz/stores";
import { PATH_TO_APP_MAP } from "@ydsz/vite-config";
import { createLogger } from "@YDSZ-core/shared/utils";

import { microRuntime } from "../bootstrap";

/** 模块级日志器 */
const logger = createLogger("MultiTabSync");

/** 路由前缀 → 子应用名 映射（由注册表单源 PATH_TO_APP_MAP 驱动） */
const PATH_TO_APP = PATH_TO_APP_MAP;

/** 打开指定路径的子应用名 */
function getAppFromPath(path: string): null | string {
  for (const [prefix, appName] of Object.entries(PATH_TO_APP)) {
    if (path.startsWith(prefix)) {
      return appName;
    }
  }
  return null;
}

/**
 * 子应用 Tab 会话状态
 *
 * 维护每个子应用当前打开的 Tab 路径集合与最后激活路径，
 * 用于决定何时可以安全卸载子应用、何时需要 keep-alive pin。
 *
 * @since 3.0.0
 */
interface SubAppSession {
  /** 该子应用最后激活的路径（用于路由恢复） */
  lastActivePath: null | string;
  /** 当前打开的 Tab 路径集合（fullPath 去重） */
  openPaths: Set<string>;
}

/** 子应用名 → 会话状态（内存 Map，不持久化；刷新后重建） */
const sessions = new Map<string, SubAppSession>();

/** 获取或创建子应用会话 */
function getOrCreateSession(appName: string): SubAppSession {
  let session = sessions.get(appName);
  if (!session) {
    session = { openPaths: new Set(), lastActivePath: null };
    sessions.set(appName, session);
  }
  return session;
}

/**
 * 记录子应用打开了一个 Tab
 *
 * 由路由变化驱动添加，首次打开时自动 pin 子应用并启用 keep-alive。
 * 已存在路径时仅更新激活态（lastActivePath）。
 *
 * @param path - 打开的完整路径
 * @param appName - 关联的子应用名
 *
 * @example
 * ```ts
 * // 在 route guard 或 onTabOpened 回调中
 * recordSubAppTabOpened('/YDSZ-proj/execution/list', 'workflow-web');
 * ```
 *
 * @since 3.0.0
 */
export function recordSubAppTabOpened(path: string, appName: string): void {
  const session = getOrCreateSession(appName);
  const isNewTab = !session.openPaths.has(path);
  session.openPaths.add(path);
  session.lastActivePath = path;

  // 首次打开该子应用的 Tab → 保活 + pin
  if (isNewTab && microRuntime) {
    microRuntime.setKeepAlive(appName, true);
    // v4.2.1 N8: setPinnedApp 已纳入 MicroRuntime 接口（此前 as any 调用永不生效）
    microRuntime.setPinnedApp?.(appName, true);
  }
}

/** 记录子应用关闭了一个 Tab；返回是否需要卸载子应用 */
function recordSubAppTabClosed(appName: string, path: string): boolean {
  const session = sessions.get(appName);
  if (!session) return false;

  session.openPaths.delete(path);
  if (session.openPaths.size === 0) {
    // 最后一项 Tab 关闭 → 可卸载
    sessions.delete(appName);
    return true;
  }

  // 如果关闭的是当前激活路径，尝试恢复到最近一个仍打开的路径
  if (session.lastActivePath === path) {
    const remaining = [...session.openPaths];
    session.lastActivePath = remaining[remaining.length - 1] ?? null;
  }
  return false;
}

/**
 * 根据路径前缀提取子应用名
 *
 * 遍历 PATH_TO_APP_MAP 匹配路径前缀，返回对应的子应用名。
 *
 * @param path - 完整路由路径
 * @returns 匹配的子应用名，未匹配时返回 null
 *
 * @example
 * ```ts
 * getAppFromPath('/YDSZ-proj/execution/list'); // => 'workflow-web'
 * getAppFromPath('/unknown/path');              // => null
 * ```
 *
 * @since 3.0.0
 */
export { getAppFromPath };

/**
 * 启动标签页-微前端联动。
 *
 * 在主布局 onMounted 中调用一次即可。
 *
 * 职责：
 * - Tab 关闭时追踪 per-app 计数器，最后一个 Tab 卸载子应用
 * - Tab 关闭时 unpin 子应用，允许后续 keep-alive LRU 淘汰
 * - 安全降级：microRuntime 未初始化时静默跳过
 *
 * 与 useTabbar 的配合：
 * - useTabbar 的 `addTab` 已隐式调用 recordSubAppTabOpened (通过 route watcher)
 * - 如果业务侧需独立追踪 Tab 打开事件，可手动调用 recordSubAppTabOpened
 */
export function useTabbarMicroSync(): void {
  onTabClosed((path) => {
    if (!microRuntime) return;

    const appName = getAppFromPath(path);
    if (!appName) return;

    const shouldUnmount = recordSubAppTabClosed(appName, path);
    if (!shouldUnmount) {
      // 还有其他 Tab 使用该子应用，不卸载
      return;
    }

    // 最后一 Tab 关闭 → 取消 pin + 取消保活 + 卸载
    microRuntime.setPinnedApp?.(appName, false);
    microRuntime.setKeepAlive(appName, false);

    void microRuntime.unmountApp(appName).then((result) => {
      if (result.success) {
        logger.info(`Unmounted ${appName} (all tabs closed)`);
      }
    });
  });

  // 路由切换时更新 per-app 的 lastActivePath
  // 注：此处保留回调注册能力，供主应用路由 router.afterEach 调用
}

/**
 * 获取当前子应用会话快照
 *
 * 返回所有子应用会话状态的深拷贝数组，供调试面板或开发者工具使用。
 * 返回数据为深拷贝，调用方可安全修改而不影响内部状态。
 *
 * @returns 子应用会话快照数组，每项包含 appName、lastActivePath 和 openPaths
 *
 * @example
 * ```ts
 * // 调试面板中展示
 * const snapshot = getSubAppSessionSnapshot();
 * snapshot.forEach(({ appName, openPaths }) => {
 *   console.log(`${appName}: ${openPaths.length} 个 Tab 打开`);
 * });
 * ```
 *
 * @since 3.0.0
 */
export function getSubAppSessionSnapshot(): Array<{
  appName: string;
  lastActivePath: null | string;
  openPaths: string[];
}> {
  return [...sessions.entries()].map(([appName, session]) => ({
    appName,
    openPaths: [...session.openPaths],
    lastActivePath: session.lastActivePath,
  }));
}

/**
 * 获取子应用最后激活的路径
 *
 * 在用户打开新 Tab 且目标路由前缀与原活跃子应用相同时，
 * 可调用此函数决定是否跳转到 lastActivePath 恢复之前的浏览位置。
 *
 * @param appName - 子应用名
 * @returns 可恢复路径，或 null（无历史记录）
 *
 * @example
 * ```ts
 * // 打开新 Tab 时尝试恢复
 * const lastPath = getSubAppLastActivePath('workflow-web');
 * if (lastPath && lastPath !== currentPath) {
 *   router.push(lastPath);
 * }
 * ```
 *
 * @since 3.0.0
 */
export function getSubAppLastActivePath(appName: string): null | string {
  return sessions.get(appName)?.lastActivePath ?? null;
}
