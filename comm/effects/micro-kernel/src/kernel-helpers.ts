/**
 * kernel-helpers.ts — kernel 提取的纯函数与工具
 *
 * 从 kernel.ts 中提取的无闭包态依赖的函数：
 * - resolveContainer: 容器配置解析
 * - patchHistory: history.pushState/replaceState 补丁
 * - matchActiveRule: 路由激活规则匹配
 * - scheduleIdle: requestIdleCallback 安全包装
 * - runWithConcurrency: 并发控制执行器
 * - shouldSkipPrefetchDueToNetwork: 弱网预加载跳过
 *
 * 提取后 kernel.ts 从 ~1000 行缩减至 ~750 行，提升可读性与可维护性。
 *
 * @path comm/effects/micro-kernel/src/kernel-helpers.ts
 * @author ydsz-team
 * @since 4.0.1
 */

/** 内核自定义路由变更事件名，供 history patch + popstate 统一触发 */
export const ROUTE_CHANGE_EVENT = 'micro-kernel:route-change';

/**
 * 解析容器配置为 HTMLElement。
 *
 * 支持两种模式：
 * - string: CSS 选择器（如 '#subapp-container'）
 * - HTMLElement: 直接传入 DOM 元素（适用于动态创建容器或嵌套子应用场景）
 *
 * @param container - 容器配置，支持 CSS 选择器字符串或 HTMLElement
 * @returns 解析后的 HTMLElement，未找到时返回 null
 */
export function resolveContainer(container: string | HTMLElement): HTMLElement | null {
  if (typeof container === 'string') {
    return document.querySelector(container) as HTMLElement | null;
  }
  return container;
}

/**
 * 对 history.pushState / replaceState 打补丁，使其派发自定义路由变更事件。
 *
 * 这样主应用 Vue Router 的 router.push 等操作也能被 micro-kernel 感知，
 * 而不只依赖浏览器 popstate（后者只在前进/后退时触发）。
 *
 * 参照 qiankun、micro-app、Garfish 的通用实践。
 *
 * @returns 清理函数（恢复原始 pushState/replaceState）
 */
export function patchHistory(): () => void {
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  function dispatchRouteChange(): void {
    window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_EVENT));
  }

  history.pushState = function (...args: Parameters<typeof originalPushState>): void {
    originalPushState.apply(this, args);
    dispatchRouteChange();
  };

  history.replaceState = function (...args: Parameters<typeof originalReplaceState>): void {
    originalReplaceState.apply(this, args);
    dispatchRouteChange();
  };

  return () => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  };
}

/**
 * 匹配 activeRule 规则。
 *
 * 支持三种匹配模式：
 * - string: 路由前缀匹配（向后兼容）
 * - RegExp: 正则表达式匹配 pathname
 * - function: 自定义匹配函数，接收完整 pathname 参数
 *
 * @param path - 当前 pathname
 * @param activeRule - 激活规则
 * @returns 是否匹配
 */
export function matchActiveRule(
  path: string,
  activeRule: string | RegExp | ((path: string) => boolean),
): boolean {
  if (typeof activeRule === 'string') {
    return path.startsWith(activeRule);
  }
  if (activeRule instanceof RegExp) {
    return activeRule.test(path);
  }
  if (typeof activeRule === 'function') {
    return activeRule(path);
  }
  return false;
}

/**
 * requestIdleCallback 的安全包装。
 *
 * `requestIdleCallback` 在部分环境不可用：
 *   - Safari < 16.4、Firefox < 116、Node/happy-dom 测试环境。
 *
 * 不可用时回退到 `setTimeout(cb, 0)`，保证预加载逻辑在这些环境下仍能执行
 * （仅放弃"空闲时段"调度语义，不影响功能正确性）。
 *
 * @param cb - 空闲时执行的回调
 */
export function scheduleIdle(cb: () => void): void {
  const ric = (globalThis as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
  if (typeof ric === 'function') {
    ric(cb);
  } else {
    setTimeout(cb, 0);
  }
}

/**
 * 并发控制执行器（p-limit 风格的轻量实现）。
 *
 * 限制同时执行的异步任务数，避免全部并发导致：
 * - 浏览器同源连接数限制（通常 6/域名）
 * - 与活跃应用的 API 请求抢占带宽
 * - TCP 拥塞窗口过小导致的队头阻塞
 *
 * 任务按数组顺序启动，但任一完成即补充下一个，保持"并发度恒定为 limit"。
 *
 * @param items - 待处理数组
 * @param limit - 最大并发数（默认 3）
 * @param fn - 异步处理函数
 */
export async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<unknown>,
): Promise<void> {
  if (items.length === 0) return;
  const concurrency = Math.max(1, limit);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const item = items[index++];
      await fn(item);
    }
  }

  // 启动 concurrency 个 worker
  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
}

/**
 * 网络条件感知 — 判断是否应跳过预加载。
 *
 * 依据 Network Information API（navigator.connection）：
 *   - effectiveType 为 slow-2g / 2g / 3g 视为慢速网络
 *   - saveData 为 true 表示用户开启省流量模式
 *
 * 任一命中即跳过自动预加载，避免在弱网下抢占主请求带宽。
 * 浏览器不支持 Network Information API 时返回 false（保持默认预加载行为）。
 *
 * 注意：仅用于自动预加载决策；用户主动触发的 prefetchApp（hover 预热）
 * 不调用本函数，因为主动行为意味着用户即将访问，值得拉取。
 *
 * @returns 是否应跳过预加载
 */
export function shouldSkipPrefetchDueToNetwork(): boolean {
  const nav = navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      saveData?: boolean;
    };
  };
  const conn = nav.connection;
  if (!conn) return false;

  if (conn.saveData === true) return true;

  const effectiveType = conn.effectiveType;
  if (
    effectiveType === 'slow-2g' ||
    effectiveType === '2g' ||
    effectiveType === '3g'
  ) {
    return true;
  }

  return false;
}
