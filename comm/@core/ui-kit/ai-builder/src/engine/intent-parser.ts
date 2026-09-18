/**
 * 自然语言意图解析器。
 *
 * <p>将用户的自然语言描述解析为结构化的 {@link PageIntent}。
 * 处理流程：
 * <ol>
 *   <li>清洗文本（去标点、统一空格、去除停用词）</li>
 *   <li>提取已知字段（「字段：xxx 类型：xxx」格式 / 逗号分隔清单）</li>
 *   <li>意图分类（表单/列表/详情/看板）</li>
 *   <li>提取模块名（「在 xxx 模块下」/ 「xxx 管理」等提示）</li>
 * </ol>
 *
 * <p>本解析器为纯函数式，无状态、无副作用，便于单测。
 *
 * @path comm\@core\ui-kit\ai-builder\src\engine\intent-parser.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { PageIntent } from '../types';

/** 页面类型关键词 → 类型映射 */
const PAGE_TYPE_KEYWORDS: Record<string, PageIntent['pageType']> = {
  table: 'table',
  列表: 'table',
  表格: 'table',
  查询: 'table',
  检索: 'table',
  清单: 'table',
  form: 'form',
  表单: 'form',
  创建: 'form',
  新增: 'form',
  编辑: 'form',
  修改: 'form',
  录入: 'form',
  填写: 'form',
  detail: 'detail',
  详情: 'detail',
  查看: 'detail',
  展示: 'detail',
  信息: 'detail',
  dashboard: 'dashboard',
  看板: 'dashboard',
  仪表盘: 'dashboard',
  统计: 'dashboard',
  报表: 'dashboard',
  分析: 'dashboard',
  概览: 'dashboard',
};

/** 停用词表 */
const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都',
  '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你',
  '会', '着', '没有', '看', '好', '自己', '这',
]);

/**
 * 原始文本清洗。
 *
 * @param text 用户输入的原始描述
 * @return 清洗后的文本
 */
function cleanText(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/[,.，。、；;：:！!？?'"\r\n]+/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ');
  return cleaned.trim();
}

/**
 * 从描述中提取显式声明的字段。
 *
 * <p>支持的格式：
 * <ul>
 *   <li>「字段：name, age, email」</li>
 *   <li>「需要 name age email」</li>
 *   <li>逗号分隔的纯字段清单「name, age, email」</li>
 * </ul>
 *
 * @param text 清洗后的文本
 * @return 提取到的字段名数组
 */
function extractKnownFields(text: string): string[] {
  const fieldPatterns = [
    /字段[：:]\s*([\w\u4e00-\u9fff]+(?:[,，、\s]+[\w\u4e00-\u9fff]+)*)/,
    /需要[：:]\s*([\w\u4e00-\u9fff]+(?:[,，、\s]+[\w\u4e00-\u9fff]+)*)/,
    /属性[：:]\s*([\w\u4e00-\u9fff]+(?:[,，、\s]+[\w\u4e00-\u9fff]+)*)/,
  ];
  for (const pattern of fieldPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1]
        .split(/[,，、\s]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !STOP_WORDS.has(s));
    }
  }
  return [];
}

/**
 * 意图分类 — 判断用户想创建什么类型的页面。
 *
 * @param text 清洗后的文本
 * @return 推断的页面类型
 */
function classifyPageType(text: string): PageIntent['pageType'] {
  for (const [keyword, pageType] of Object.entries(PAGE_TYPE_KEYWORDS)) {
    if (text.includes(keyword)) {
      return pageType;
    }
  }
  return undefined;
}

/**
 * 提取模块名。
 *
 * @param text 清洗后的文本
 * @return 提取到的模块名
 */
function extractModuleName(text: string): string | undefined {
  const modulePattern = /([\w\u4e00-\u9fff]+)(?:模块|系统|管理|平台|功能)/;
  return text.match(modulePattern)?.[1];
}

/**
 * 将自然语言描述解析为结构化的页面意图。
 *
 * @param description 用户输入的自然语言
 * @return 结构化的 {@link PageIntent}
 * @example
 * ```ts
 * parseIntent('创建一个用户管理表单，需要姓名、年龄、邮箱字段')
 * // { description: '...', pageType: 'form', knownFields: ['姓名', '年龄', '邮箱'], moduleName: '用户' }
 * ```
 */
export function parseIntent(description: string): PageIntent {
  const cleaned = cleanText(description);
  return {
    description: cleaned,
    pageType: classifyPageType(cleaned),
    knownFields: extractKnownFields(cleaned),
    moduleName: extractModuleName(cleaned),
  };
}

/**
 * 为纯字段清单生成智能描述。
 *
 * <p>当用户仅输入字段清单而无完整描述时，自动补全为通顺的业务语句。
 *
 * @param fields 字段清单
 * @param pageType 页面类型
 * @return 补全后的自然语言描述
 */
export function generateDescriptionFromFields(
  fields: string[],
  pageType: PageIntent['pageType'],
): string {
  const fieldText: string =
    fields.length > 0 ? `包含 ${fields.join('、')} 等字段` : '';
  const typeActions: Record<string, string> = {
    form: '创建一个表单',
    table: '创建一个列表页面',
    detail: '创建一个详情页',
    dashboard: '创建一个数据看板',
  };
  const action: string = (pageType && typeActions[pageType]) || '创建页面';
  return `${action}${fieldText ? `，${fieldText}` : ''}。`;
}
