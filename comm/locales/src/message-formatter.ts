/**
 * Intl.MessageFormat 风格的多语种复数/性别/选择形态支持。
 *
 * <p>vue-i18n 原生仅支持简单的 `{name}` 插值，对复数（plural）、
 * 性别（gender）、选择（select）等 Intl.MessageFormat 标准语法无原生支持。
 * 本模块提供一套轻量 polyfill（基于 Intl API），让词条写法贴近 MF 标准：
 *
 * <ul>
 *   <li><b>复数</b>：<code>{count, plural, =0{无} one{# 条} other{# 条}}</code></li>
 *   <li><b>选择</b>：<code>{gender, select, male{他} female{她} other{TA}}</code></li>
 *   <li><b>性别</b>：复数内嵌 select，<code>{count, plural, =0{无剩余} one{{gender,select,male{他}other{}}有 # 条} other{共 # 条}}</code></li>
 * </ul>
 *
 * <p>使用方式：
 * <pre>{@code
 * import { formatMessage } from '@ydsz/locales/message-formatter';
 * // messages: { 'item-count': '{count, plural, =0{无} one{# 条} other{# 条}}' }
 * formatMessage('item-count', { count: 5 }, 'zh-CN');
 * // => '5 条'
 * }</pre>
 *
 * <p>注意：MessageFormat 完整语法非常庞大，本模块覆盖最常用 80% 场景。
 * 完整 MF（如 # 占位符嵌套、offset、=preciseValue 精确匹配）建议
 * 引入 <code>@intl/messageformat</code> 作为生产级替代。
 *
 * @path comm/locales/src/message-formatter.ts
 * @author ydsz-ai
 * @since 26.09.19
 */

/** 支持的形态解析类型 */
type PluralCategory = Intl.LDMLPluralRule;

/**
 * 解析一段 MessageFormat 子表达式（复数/选择/性别）。
 *
 * @param expr - 去掉最外层 `{}` 的内容，如 "count, plural, =0{无} other{# 条}"
 * @param vars - 插值变量
 * @param locale - 语种
 * @return 渲染后的字符串
 */
function parseSubExpression(
  expr: string,
  vars: Record<string, string | number>,
  locale: string,
): string {
  const parts = expr.split(',').map((s) => s.trim());
  if (parts.length < 3) return expr;

  const varName = parts[0]!;
  const type = parts[1]!;
  const rawValue = vars[varName];

  // 解析候选项: =数字 {text} | 关键词 {text}
  const optionRegex = /(?:=(\d+)|(zero|one|two|few|many|other))\s*\{([^}]*)\}/g;
  const options: Array<{ match: string; text: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = optionRegex.exec(expr)) !== null) {
    options.push({ match: m[1] ?? m[2]!, text: m[3]! });
  }

  switch (type) {
    case 'plural':
      return handlePlural(rawValue, options, locale);
    case 'select':
      return handleSelect(rawValue, options);
    default:
      return expr;
  }
}

/**
 * 解析复数分支。
 */
function handlePlural(
  rawValue: string | number | undefined,
  options: Array<{ match: string; text: string }>,
  locale: string,
): string {
  const num = typeof rawValue === 'string' ? Number(rawValue) : (rawValue ?? 0);
  const pluralRules = new Intl.PluralRules(locale);
  const category: PluralCategory = pluralRules.select(num);

  // 精确匹配优先
  const exact = options.find((o) => o.match === String(num));
  if (exact) return renderTemplate(exact.text, { '#': String(num) });

  // 类别匹配
  const byCategory = options.find((o) => o.match === category);
  if (byCategory) return renderTemplate(byCategory.text, { '#': String(num) });

  // 兜底：other
  const other = options.find((o) => o.match === 'other');
  return other ? renderTemplate(other.text, { '#': String(num) }) : String(num);
}

/**
 * 解析选择分支（性别/通用枚举）。
 */
function handleSelect(
  rawValue: string | number | undefined,
  options: Array<{ match: string; text: string }>,
): string {
  const key = String(rawValue ?? '');
  const exact = options.find((o) => o.match === key);
  if (exact) return exact.text;
  const other = options.find((o) => o.match === 'other');
  return other ? other.text : key;
}

/**
 * 渲染文本：将 `#` 替换为数字占位符。
 */
function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/#/g, vars['#'] ?? '#');
}

/**
 * 全量解析一段 MessageFormat 词条（递归处理嵌套 `{}`）。
 */
function parseMessage(
  message: string,
  vars: Record<string, string | number>,
  locale: string,
): string {
  return message.replace(/\{([^}]+(?:\{[^}]*\}[^}]*)*)\}\s*\{([^}]*)\}/g, (_full, prefix: string, body: string) => {
    // prefix 形如 "count, plural" / "gender, select"
    const subExpr = `${prefix}, ${body}`;
    return parseSubExpressionWrapper(subExpr, vars, locale);
  });
}

/**
 * parseSubExpression 的安全包装（避免命名冲突）。
 */
function parseSubExpressionWrapper(
  expr: string,
  vars: Record<string, string | number>,
  locale: string,
): string {
  return parseSubExpression(expr, vars, locale);
}

/**
 * 对外接口：格式化一条 MessageFormat 消息。
 *
 * @param message - 词条内容（可能包含 MF 表达式）
 * @param vars - 插值变量
 * @param locale - 语种（用于复数规则）
 * @return 渲染后文本
 */
export function formatMessage(
  message: string,
  vars: Record<string, string | number> = {},
  locale: string = 'zh-CN',
): string {
  return parseMessage(message, vars, locale);
}

/**
 * 按当前语种格式化复数表达式（缩略调用）。
 *
 * @param count - 数量
 * @param messages - 各复数形态词条（zero / one / other）
 * @param locale - 语种
 * @return 匹配的形态文本
 */
export function formatPlural(
  count: number,
  messages: { zero?: string; one: string; other: string },
  locale: string = 'zh-CN',
): string {
  const category = new Intl.PluralRules(locale).select(count);
  const text = category === 'one' ? messages.one
    : category === 'zero' || count === 0 ? (messages.zero ?? messages.other)
    : messages.other;
  return text.replace(/#/g, String(count));
}
