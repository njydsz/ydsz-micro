/**
 * 页面缓存滚动位置捕获与恢复工具
 *
 * 从 page-cache-manager.ts 提取，避免单文件超过 300 行。
 *
 * @path comm/effects/micro-kernel/src/page-cache-scroll.ts
 * @author ydsz-team
 * @since 4.2.2
 */

import type { PageCachePolicy, ScrollPosition } from "./page-cache-types";

/**
 * 捕获当前页面滚动位置（window + 可滚动容器）。
 *
 * 应在 deactivateApp（keepAlive 摘除 DOM）之前调用，
 * 否则容器已脱离文档流，scrollTop/scrollLeft 可能读不到。
 *
 * @param container - 子应用根容器元素
 * @param policy - 缓存策略（用于获取 maxContainerScrolls 限制）
 * @returns 滚动位置快照
 */
export function captureScrollPosition(
  container: HTMLElement,
  policy: PageCachePolicy,
): ScrollPosition {
  const position: ScrollPosition = {
    windowScrollY: window.scrollY || window.pageYOffset,
    windowScrollX: window.scrollX || window.pageXOffset,
    containers: {},
  };

  // 探测可滚动容器：在子应用容器范围内查找 overflow: auto/scroll 的元素
  const scrollableSelectors = findScrollableContainers(container, policy.maxContainerScrolls);
  for (const { el, selector } of scrollableSelectors) {
    if (el.scrollTop > 0 || el.scrollLeft > 0) {
      position.containers[selector] = {
        top: el.scrollTop,
        left: el.scrollLeft,
      };
    }
  }

  return position;
}

/**
 * 恢复页面滚动位置（window + 容器）。
 *
 * 应在 activateApp hydrate 之后调用，此时 DOM 尺寸已就位。
 * 使用 requestAnimationFrame 确保渲染帧就绪。
 *
 * @param scroll - 滚动位置快照
 * @param routePath - 路由 path（用于校验缓存是否对应当前路由）
 * @param container - 子应用根容器元素
 * @param restoreDelayMs - 恢复延迟（毫秒）
 */
export function restoreScrollPosition(
  scroll: ScrollPosition,
  routePath: string,
  container: HTMLElement,
  restoreDelayMs: number,
): void {
  // 延迟恢复：等待 Vue 完成异步渲染 + hydration
  setTimeout(() => {
    // 恢复 window 滚动（仅当路由 path 一致时）
    if (routePath === location.pathname) {
      window.scrollTo(scroll.windowScrollX, scroll.windowScrollY);
    }

    // 恢复容器滚动
    for (const [selector, pos] of Object.entries(scroll.containers)) {
      const el = container.querySelector<HTMLElement>(selector);
      if (el) {
        el.scrollTo(pos.left, pos.top);
      }
    }
  }, restoreDelayMs);
}

/**
 * 查找子应用容器内的可滚动元素。
 *
 * 排除 window/document 级别，仅查找 overflow-y: auto/scroll 的块级元素。
 * 返回结果按文档顺序排列，限制数量以防性能开销。
 *
 * @param root - 子应用根容器
 * @param limit - 最大查找数量
 */
function findScrollableContainers(
  root: HTMLElement,
  limit: number,
): Array<{ el: HTMLElement; selector: string }> {
  const result: Array<{ el: HTMLElement; selector: string }> = [];
  const allElements = root.querySelectorAll<HTMLElement>("*");

  for (const el of allElements) {
    if (result.length >= limit) break;
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;

    // 排除不可见元素（getComputedStyle 对 display:none 返回 ""）
    if (!overflowY && !overflowX) continue;

    const isScrollableY = (overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight;
    const isScrollableX = (overflowX === "auto" || overflowX === "scroll") && el.scrollWidth > el.clientWidth;

    if (isScrollableY || isScrollableX) {
      result.push({
        el,
        selector: generateSelector(el),
      });
    }
  }

  return result;
}

/**
 * 为元素生成简短的选择器路径（用于恢复时定位）。
 *
 * 优先使用 id，其次用 class（首个类名），最后用标签 + nth-child。
 */
function generateSelector(el: HTMLElement): string {
  if (el.id) return `#${el.id}`;
  if (el.className && typeof el.className === "string") {
    const classes = el.className.trim().split(/\s+/).filter(Boolean);
    if (classes.length > 0) return `.${classes[0]}`;
  }
  // 简化：返回 tagName + data-micro-app 属性链
  const tag = el.tagName.toLowerCase();
  const parent = el.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(
      (child) => (child as HTMLElement).tagName === el.tagName,
    );
    if (siblings.length > 1) {
      const idx = siblings.indexOf(el);
      return `${tag}:nth-child(${idx + 1})`;
    }
  }
  return tag;
}
