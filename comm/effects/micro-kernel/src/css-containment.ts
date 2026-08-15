/**
 * css-containment.ts — CSS Containment 样式隔离增强 (P4-2)
 *
 * 在 v4.2.1 N5 runtime-css-scope 之上，补充 CSS Containment 属性，
 * 为子应用容器建立布局/绘制/样式边界，防止：
 *
 * 1. 子应用的大范围 DOM 变更触发主应用的重排/重绘（布局隔离）
 * 2. 子应用的 contain: style 防止计数器/ quotes 泄漏（样式隔离）
 * 3. 子应用的 contain: paint 防止负 margin / overflow 溢出绘制
 *
 * Containment 优势（runtime-css-scope 无法覆盖的场景）：
 * - runtime-css-scope 基于 `[data-micro-app]` 属性选择器前缀，
 *   不影响选择器匹配顺序和样式级联
 * - contain 是浏览器引擎级优化，提供真正的渲染边界
 * - 零运行时开销（不含 CSSOM 解析/重写）
 *
 * 与沙箱的关系：
 * - iframe 沙箱已天然隔离（无需额外 containment）
 * - proxy / snapshot 沙箱 + attribute scope + containment = 近似 iframe 隔离
 *
 * 使用方式：
 * - 主应用在 start 时设置 `sandbox.cssContainment: true`（默认关闭）
 * - 子应用级 config.cssContainment: true 覆盖全局
 *
 * 浏览器兼容性：
 * - CSS Containment Level 1 所有主流浏览器全支持（Chrome 52+, Firefox 69+, Safari 15.4+）
 * - 不支持的环境自动降级（属性不生效，不报错）
 *
 * @path comm/effects/micro-kernel/src/css-containment.ts
 * @author ydsz-team
 * @since 4.2.2
 */

import { createLogger } from "@YDSZ-core/shared/utils";

const logger = createLogger("MicroKernel:CssContainment");

// ==================== 类型定义 ====================

/** CSS Containment 级别 */
export type ContainmentLevel = "layout" | "paint" | "strict" | "content" | "size";

/** Containment 配置 */
export interface ContainmentConfig {
  /** CSS contain 属性值 */
  level: ContainmentLevel;
  /** 是否启用 style containment（防止 counter/quotes 泄漏） */
  enableStyleContainment: boolean;
}

// ==================== 默认配置 ====================

/** 默认 containment 设置 */
const DEFAULT_CONTAINMENT: ContainmentConfig = {
  level: "content",
  enableStyleContainment: true,
};

// ==================== Level 到 CSS contain 值的映射 ====================

/**
 * 将 ContainmentLevel 转换为 CSS contain 属性值。
 *
 * - `layout` → "layout"（布局独立）
 * - `paint` → "paint"（绘制裁剪）
 * - `strict` → "strict"（= layout style paint size，最强隔离）
 * - `content` → "content"（= layout style paint，推荐默认值）
 * - `size` → "size"（子元素尺寸不影响父级）
 */
function levelToContainValue(level: ContainmentLevel): string {
  switch (level) {
    case "strict":
      return "strict"; // layout style paint size
    case "content":
      return "content"; // layout style paint
    case "layout":
      return "layout";
    case "paint":
      return "paint";
    case "size":
      return "size";
    default:
      return "content";
  }
}

// ==================== 容器级 Containment API ====================

/** 已启用 containment 的容器 WeakSet（避免重复应用） */
const _enabledContainers = new WeakSet<HTMLElement>();

/**
 * 为子应用容器启用 CSS Containment。
 *
 * 在 activateApp 挂载后调用，对子应用容器设置 contain 属性。
 * 幂等设计：重复调用同一容器无副作用。
 *
 * @param container - 子应用容器元素
 * @param config - containment 配置（可选，默认 content）
 * @returns 是否成功设置
 *
 * @example
 * // 主应用容器引用
 * const container = document.querySelector('#sub-app-container');
 * enableCssContainment(container, { level: 'strict' });
 */
export function enableCssContainment(
  container: HTMLElement,
  config?: Partial<ContainmentConfig>,
): boolean {
  if (_enabledContainers.has(container)) return true;

  const merged: ContainmentConfig = { ...DEFAULT_CONTAINMENT, ...config };
  const containValue = buildContainShorthand(merged);

  try {
    container.style.contain = containValue;

    // 可选：content-visibility: auto 进一步减少不可见子应用的渲染开销
    // 注意：content-visibility 需配合 contain-intrinsic-size 使用
    // 此处仅对 content/strict level 启用
    if (merged.level === "content" || merged.level === "strict") {
      // content-visibility 由主应用自行决定是否启用（需知道子应用高度上下文）
    }

    _enabledContainers.add(container);
    logger.debug(`CSS containment "${containValue}" applied to container`);
    return true;
  } catch (error) {
    logger.warn(`Failed to apply CSS containment: ${error}`);
    return false;
  }
}

/**
 * 移除子应用容器的 Containment。
 *
 * 在 deactivateApp / 完整卸载时调用，释放 CSS 属性。
 *
 * @param container - 子应用容器元素
 */
export function disableCssContainment(container: HTMLElement): void {
  if (!_enabledContainers.has(container)) return;

  try {
    container.style.contain = "";
    _enabledContainers.delete(container);
  } catch (error) {
    logger.warn(`Failed to remove CSS containment: ${error}`);
  }
}

/**
 * 判断容器是否已启用 Containment。
 *
 * @param container - 子应用容器元素
 */
export function hasCssContainment(container: HTMLElement): boolean {
  return _enabledContainers.has(container);
}

// ==================== 组合 contain 属性值 ====================

/**
 * 构建 CSS contain 简写属性值。
 *
 * 根据 level 生成基础值，可选追加 style（避免 counter/quotes 泄漏）。
 */
function buildContainShorthand(config: ContainmentConfig): string {
  const base = levelToContainValue(config.level);
  if (config.enableStyleContainment && !base.includes("style")) {
    // 如果 level 不含 style，追加
    if (base === "layout" || base === "paint" || base === "size") {
      return `${base} style`;
    }
  }
  return base;
}

// ==================== CSS 变量透传 ====================

/**
 * 从主应用 :root 复制的 CSS 变量缓存。
 *
 * 子应用可在挂载时调用 `copyRootCssVariables(container)` 将其注入自身容器，
 * 使得 runtime-css-remed 的变量引用正常工作（color: var(--primary)）。
 *
 * @example
 * copyRootCssVariables(container);
 * container.style.background = 'var(--primary)';
 */
export function copyRootCssVariables(target: HTMLElement): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  try {
    const rootStyle = window.getComputedStyle(document.documentElement);
    const variablesToCopy = collectRootCssVariables(rootStyle);

    for (const [name, value] of variablesToCopy) {
      target.style.setProperty(name, value);
    }

    logger.debug(
      `Copied ${variablesToCopy.size} CSS variables to sub-app container`,
    );
  } catch (error) {
    logger.warn(`Failed to copy CSS variables: ${error}`);
  }
}

/**
 * 收集 :root 定义的 CSS 自定义属性（--xxx）。
 *
 * 解析 document.documentElement 内联 style 和第一级 <style> 定义。
 * 仅包含以 -- 开头的自定义属性，不复制原生属性。
 */
function collectRootCssVariables(
  rootStyle: CSSStyleDeclaration,
): Map<string, string> {
  const result = new Map<string, string>();

  for (let i = 0; i < rootStyle.length; i++) {
    const propName = rootStyle[i];
    if (propName.startsWith("--")) {
      const value = rootStyle.getPropertyValue(propName).trim();
      if (value) {
        result.set(propName, value);
      }
    }
  }

  return result;
}
