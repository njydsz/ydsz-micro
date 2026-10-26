/**
 * v-safe-html 指令 — DOMPurify 式白名单消毒
 *
 * 替代全局 5 处裸 v-html，防御 XSS。
 * 策略：仅允许 b/i/em/strong/a/br/span + 有限的 href/class 属性。
 * 如需完整 HTML 消毒（场景极少），可用 processAll 模式。
 *
 * 使用：app.directive('safe-html', vSafeHtml);
 * 模板：<div v-safe-html="htmlContent"></div>
 *
 * @path comm/effects/common-ui/src/components/safe-html/index.ts
 * @author ydsz-team
 * @since 3.0.0
 */

import type { Directive } from 'vue';

/**
 * 允许的白名单标签。
 *
 * <p>统一转小写：HTML 解析器会把 SVG 元素名还原成驼峰（clipPath / foreignObject 等），
 * 而 sanitizeNode 按 tagName.toLowerCase() 比对，原样存驼峰会让这些标签被误判为
 * 非白名单并降级成纯文本，流程图渲染随之残缺。
 */
const ALLOWED_TAGS = new Set(
  [
    // 文本格式化标签
    'b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'div', 'code', 'pre',
    // mark：搜索高亮语义标签（global-search/command-palette 高亮关键词）
    'mark',
    // SVG 标签：流程图渲染场景
    'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline',
    'polygon', 'text', 'tspan', 'defs', 'use', 'symbol', 'clipPath',
    'linearGradient', 'radialGradient', 'stop', 'image', 'title', 'desc',
    'textPath', 'marker', 'pattern', 'mask', 'filter', 'switch', 'foreignObject',
  ].map((tag) => tag.toLowerCase()),
);

/** 允许的 http 协议 */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

/** 允许的白名单属性（通用 + SVG） */
const ALLOWED_ATTRS = new Set([
  // 通用属性
  'class', 'id', 'style', 'title', 'dir', 'lang', 'tabindex',
  // 链接属性
  'href', 'target', 'rel',
  // SVG 呈现属性
  'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'stroke-dasharray', 'stroke-dashoffset', 'stroke-opacity', 'fill-opacity',
  'opacity', 'transform', 'd', 'x', 'y', 'width', 'height', 'rx', 'ry',
  'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'points', 'viewBox', 'preserveAspectRatio',
  'xmlns', 'xmlns:xlink', 'xlink:href', 'version', 'gradientUnits',
  'gradientTransform', 'offset', 'stop-color', 'stop-opacity', 'clip-path',
  'clip-rule', 'fill-rule', 'mask', 'filter', 'marker-start', 'marker-mid',
  'marker-end', 'text-anchor', 'font-family', 'font-size', 'font-weight',
  'dominant-baseline', 'alignment-baseline', 'patternUnits', 'patternTransform',
  'maskUnits', 'maskContentUnits', 'filterUnits', 'primitiveUnits',
  'refX', 'refY', 'markerWidth', 'markerHeight', 'orient', 'startOffset',
  'lengthAdjust', 'textLength', 'spreadMethod', 'result', 'in', 'in2',
  'mode', 'k1', 'k2', 'k3', 'k4', 'order', 'kernelMatrix', 'divisor',
  'bias', 'targetX', 'targetY', 'edgeMode', 'preserveAlpha', 'surfaceScale',
  'specularConstant', 'specularExponent', 'stdDeviation', 'dx', 'dy',
  'glyphRef', 'format', 'path', 'side', 'hreflang', 'media', 'role', 'aria-label',
]);

/** 白名单属性 */
function sanitizeAttrs(element: Element): void {
  const attrs = element.getAttributeNames();
  for (const attr of attrs) {
    // href 安全校验：仅允许 http/https/mailto 协议
    if (attr === 'href' || attr === 'xlink:href') {
      const value = element.getAttribute(attr) || '';
      if (
        !value.startsWith('/') &&
        !value.startsWith('#') &&
        !ALLOWED_PROTOCOLS.has((value.match(/^[^:]+:/)?.[0] ?? ''))
      ) {
        element.removeAttribute(attr);
      }
      continue;
    }
    // 移除所有非白名单属性（含事件处理器 onclick/onload 等）
    if (!ALLOWED_ATTRS.has(attr)) {
      element.removeAttribute(attr);
    }
  }
}

function sanitizeNode(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    // 不允许的标签：用 textContent 替换整个元素
    if (!ALLOWED_TAGS.has(element.tagName.toLowerCase())) {
      const text = element.textContent || '';
      element.parentNode?.replaceChild(document.createTextNode(text), element);
      return;
    }
    sanitizeAttrs(element);
    // 递归子节点
    const children = [...element.childNodes];
    for (const child of children) {
      sanitizeNode(child);
    }
  }
}

function sanitize(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;
  document.body.appendChild(template);

  // DOM 规范只在 Element 上定义 innerHTML，template.content（DocumentFragment）没有，
  // 直接读会得到 undefined 并把它写进界面。这里把解析结果搬进宿主元素后再消毒、再序列化。
  const host = document.createElement('div');
  host.append(...Array.from(template.content.childNodes));
  document.body.removeChild(template);

  for (const child of Array.from(host.childNodes)) {
    sanitizeNode(child);
  }

  return host.innerHTML;
}

/**
 * v-safe-html 指令。
 *
 * 使用方式：<div v-safe-html="raw"></div>
 */
export const vSafeHtml: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    el.innerHTML = sanitize(binding.value || '');
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      el.innerHTML = sanitize(binding.value || '');
    }
  },
};

/** 注册指令到 Vue App */
export function registerSafeHtmlDirective(app: { directive: (name: string, directive: Directive) => void }): void {
  app.directive('safe-html', vSafeHtml);
}

/** 功能性导出：手动调用消毒 */
export { sanitize };
