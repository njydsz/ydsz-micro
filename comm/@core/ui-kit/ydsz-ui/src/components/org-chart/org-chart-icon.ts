/**
 * YdOrgChart 节点图标的安全渲染守卫。
 *
 * <p>`icon` 面向开发者传入的静态标记（单段 SVG 或单个 `<i>`/`<span>` 图标元素）。
 * 组织数据一般来自接口，任意 HTML 直投 DOM 即为 XSS 注入面，
 * 因此这里只放行「单一根元素 + 图标标签」的片段，其余（多元素、事件属性、
 * `javascript:` 协议、script/iframe 等）一律降级为空字符串，由调用处不渲染图标。
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/components/org-chart/org-chart-icon.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 允许作为图标根的元素：SVG 图形与字体图标占位标签 */
const ICON_ROOT_TAGS = 'svg|i|span|em';

/** 根标签起始：标签名 + 属性串（属性内不含 >，故嵌套同名片段会被后续闭合检查拒绝） */
const ROOT_OPEN = new RegExp(`^<(${ICON_ROOT_TAGS})\\b([^>]*)>`, 'i');

/** 自闭合的单一根元素（属性内不含 >，否则不匹配 → 拒绝） */
const SELF_CLOSING_ROOT = new RegExp(`^<(${ICON_ROOT_TAGS})\\b[^>]*/>$`, 'i');

/** 事件属性、危险协议与可执行标签：命中即整体拒绝 */
const DANGEROUS_ICON_PART
  = /\son[a-z]+\s*=|javascript:|<\/\s*script|<\s*(iframe|object|embed|form|link|meta|base)\b/i;

/**
 * 判断标记是否为「单一图标根元素」。
 *
 * <p>成对写法额外要求同名闭合标签全程只出现一次且位于末尾：
 * `<svg><path/></svg>` 合法，`<i></i><i></i>` 这类多根片段不合法
 * （仅靠首尾标签同名无法区分二者）。
 *
 * @param markup - trim 后的标记
 * @returns 是否为单一 svg/i/span/em 根
 */
function isSingleIconRoot(markup: string): boolean {
  if (SELF_CLOSING_ROOT.test(markup)) return true;
  const open = ROOT_OPEN.exec(markup);
  if (!open) return false;
  const closingTag = `</${open[1]}>`;
  return markup.indexOf(closingTag) === markup.length - closingTag.length;
}

/**
 * 校验并返回可安全注入的图标标记。
 *
 * @param icon - 节点原始图标字符串（可能来自接口数据）
 * @returns 通过白名单校验的标记；不合规时为空字符串
 */
export function safeIconHtml(icon?: string): string {
  if (!icon) return '';
  const trimmed = icon.trim();
  if (!isSingleIconRoot(trimmed)) return '';
  if (DANGEROUS_ICON_PART.test(trimmed)) return '';
  return trimmed;
}
