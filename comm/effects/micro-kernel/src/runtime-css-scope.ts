/**
 * 运行时 CSS 作用域隔离（v4.2.1 N5 短期方案）
 *
 * 背景：构建期 micro-scoped-postcss 插件已为自有子应用 CSS 加
 * `[data-micro-app="app-name"]` 前缀。但以下场景仍可能样式泄露：
 * - 子应用遗漏 PostCSS 配置 / 使用 :global 选择器
 * - 第三方库（组件库 / 富文本等）注入的全局样式
 * - 非 scoped-postcss 构建链路接入的子应用
 *
 * 本模块提供**运行时兜底**：通过 CSSOM 读取已加载样式表，
 * 为每条规则的选择器追加 `[data-micro-app="app-name"]` 前缀，
 * 生成作用域化 `<style>` 替换原 `<link>`。
 *
 * 限制与降级：
 * - 跨域样式表（CDN 且未配 CORS）CSSOM 不可读 → 静默保留原样
 *   （构建期 scoping 已覆盖自有子应用，此场景兜底缺失可接受）
 * - 默认**不启用**（自有子应用已构建期 scoping，重复 scope 会破坏选择器），
 *   由 config.styleIsolation 或 start options 显式开启
 *
 * @path comm/effects/micro-kernel/src/runtime-css-scope.ts
 * @author ydsz-team
 * @since 4.2.1
 */

import { createLogger } from "@YDSZ-core/shared/utils";

const logger = createLogger("MicroKernel");

/** scoped style 的 data 属性标记（卸载时定位） */
const SCOPED_STYLE_ATTR = "data-micro-kernel-scoped-app";

/**
 * 为指定子应用的全部样式表应用运行时作用域。
 *
 * 每个 link 只处理一次（幂等）。样式未加载完成时监听 load 事件后重试。
 *
 * @param appName - 子应用名（对应容器 data-micro-app 属性值）
 * @since 4.2.1
 */
export function applyRuntimeCssScope(appName: string): void {
  if (typeof document === "undefined") return;

  const links = Array.from(
    document.querySelectorAll<HTMLLinkElement>(
      `link[data-micro-kernel-app="${appName}"]`,
    ),
  );
  for (const link of links) {
    // 已被本模块处理过则跳过
    if (link.dataset.microKernelScoped === "done") continue;

    const sheet = link.sheet;
    if (!sheet) {
      // 样式尚未加载完成：监听 load 后重试（一次）
      if (!link.dataset.microKernelScopedPending) {
        link.dataset.microKernelScopedPending = "1";
        link.addEventListener(
          "load",
          () => applyRuntimeCssScope(appName),
          { once: true },
        );
      }
      continue;
    }

    try {
      const scopedCss = buildScopedCss(appName, sheet);
      if (!scopedCss) continue;

      const style = document.createElement("style");
      style.setAttribute(SCOPED_STYLE_ATTR, appName);
      style.textContent = scopedCss;
      link.replaceWith(style);
      link.dataset.microKernelScoped = "done";
      logger.debug(`Runtime CSS scope applied for "${appName}"`);
    } catch (err) {
      // 跨域读取失败或规则解析异常 → 保留原始样式（构建期 scoping 兜底）
      logger.debug(
        `Runtime CSS scope skipped for "${appName}" (${String(err)})`,
      );
    }
  }
}

/**
 * 移除指定子应用的运行时 scoped 样式。
 *
 * 子应用完整卸载时调用，避免残留样式影响其他应用。
 *
 * @param appName - 子应用名
 * @since 4.2.1
 */
export function removeRuntimeCssScope(appName: string): void {
  if (typeof document === "undefined") return;
  const styles = document.querySelectorAll<HTMLStyleElement>(
    `style[${SCOPED_STYLE_ATTR}="${appName}"]`,
  );
  for (const style of styles) {
    style.remove();
  }
  // 清理残留的 pending 标记（link 可能已被移除）
}

/**
 * 构建前缀化 CSS 文本。
 *
 * 遍历样式表规则：
 * - CSSStyleRule：选择器加 `[data-micro-app]` 前缀
 * - CSSMediaRule / CSSSupportsRule：递归处理嵌套规则
 * - @font-face / @keyframes：原样保留（名称被子应用 animation/font 引用）
 * - :root / html / body：不 scope（全局 CSS 变量与重置需透传）
 *
 * @param appName - 子应用名
 * @param sheet - 样式表（CSSStyleSheet 或分组规则）
 * @returns 前缀化 CSS 文本；无可处理规则时返回空串
 */
function buildScopedCss(
  appName: string,
  sheet: CSSStyleSheet | CSSGroupingRule,
): string {
  const prefix = `[data-micro-app="${appName}"]`;
  const parts: string[] = [];
  const rules = Array.from(sheet.cssRules ?? []);

  for (const rule of rules) {
    try {
      if (rule instanceof CSSStyleRule) {
        const scopedSelectors = rule.selectorText
          .split(",")
          .map((s) => s.trim())
          .map((s) => scopeSelector(s, prefix))
          .join(", ");
        parts.push(`${scopedSelectors} { ${rule.style.cssText} }`);
      } else if (
        rule instanceof CSSMediaRule ||
        rule instanceof CSSSupportsRule
      ) {
        const inner = buildScopedCss(appName, rule as CSSGroupingRule);
        if (inner) {
          const atName = rule instanceof CSSMediaRule ? "media" : "supports";
          parts.push(
            `@${atName} ${(rule as CSSMediaRule | CSSSupportsRule).conditionText} { ${inner} }`,
          );
        }
      } else if (rule.cssText) {
        // @font-face / @keyframes / @import 等：原样保留
        parts.push(rule.cssText);
      }
    } catch {
      // 单条规则异常不影响整体
    }
  }

  return parts.join("\n");
}

/**
 * 单条选择器加前缀。
 *
 * 规则：
 * - :root 相关 → 不透传前缀（CSS 变量需全局可见）
 * - html / body 全局重置 → 不加前缀（避免子应用重置失效）
 * - 已含 data-micro-app 前缀 → 跳过
 * - keyframes 内部选择器（from/to/%） → 原样
 * - 其余 → `${prefix} ${selector}`
 */
function scopeSelector(selector: string, prefix: string): string {
  if (!selector) return selector;
  if (selector === ":root" || selector.startsWith(":root")) return selector;
  if (selector === "html" || selector === "body") return selector;
  if (selector.startsWith("html ") || selector.startsWith("body ")) {
    return selector;
  }
  if (selector.startsWith(prefix)) return selector;
  // keyframes 的 from/to/百分比 选择器
  if (
    selector === "from" ||
    selector === "to" ||
    /^\d+(\.\d+)?%$/.test(selector)
  ) {
    return selector;
  }
  return `${prefix} ${selector}`;
}
