/**
 * 关键词匹配引擎。
 *
 * <p>将用户自然语言中的关键词映射到字段类型和标签。
 * 采用「关键词权重 + 上下文」策略，支持多关键词组合判定。
 *
 * <p>映射规则：
 * <ul>
 *   <li>数字类关键词（金额/数量/比例/百分比） → number / money / percent</li>
 *   <li>时间类关键词（日期/时间/创建时间/截止） → date / datetime</li>
 *   <li>状态类关键词（状态/是否/启用/有效） → boolean / enum</li>
 *   <li>描述类关键词（描述/备注/说明/详情） → text</li>
 *   <li>联系类关键词（邮箱/电话/手机/链接） → email / phone / url</li>
 *   <li>默认 → string</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ai-builder\src\engine\keyword-matcher.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { FieldType } from '../types';

/**
 * 关键词规则条目。
 */
interface KeywordRule {
  /** 匹配关键词列表 */
  keywords: string[];
  /** 命中的字段类型 */
  fieldType: FieldType;
  /** 权重（越高越优先） */
  weight: number;
  /** 校验提示（可选） */
  validationHint?: string;
}

/**
 * 关键词规则表（priority 递减）。
 */
const KEYWORD_RULES: KeywordRule[] = [
  {
    keywords: ['金额', '价格', '费用', '薪资', '工资', '总价', '单价', '成本', '预算', '收入', '利润'],
    fieldType: 'money',
    weight: 90,
    validationHint: '请输入有效金额（保留两位小数）',
  },
  {
    keywords: ['比例', '百分比', '占比', '利率', '折扣率', '完成率'],
    fieldType: 'percent',
    weight: 90,
    validationHint: '请输入 0-100 之间的百分比数值',
  },
  {
    keywords: ['数量', '个数', '总计', '总数', '次数', '库存', '年龄'],
    fieldType: 'number',
    weight: 85,
  },
  {
    keywords: ['日期', '年月日', '生日', '出生日期'],
    fieldType: 'date',
    weight: 88,
  },
  {
    keywords: ['时间', '时分秒', '创建时间', '更新时间', '截止时间', '开始时间', '结束时间'],
    fieldType: 'datetime',
    weight: 88,
  },
  {
    keywords: ['邮箱', 'email', '电子邮箱', '邮件地址'],
    fieldType: 'email',
    weight: 92,
    validationHint: '请输入有效的电子邮箱地址',
  },
  {
    keywords: ['电话', '手机', '联系方式', '手机号码', '座机'],
    fieldType: 'phone',
    weight: 92,
    validationHint: '请输入有效的电话号码',
  },
  {
    keywords: ['链接', '网址', 'URL', '地址链接', '网页'],
    fieldType: 'url',
    weight: 92,
  },
  {
    keywords: ['是否', '启用', '禁用', '有效', '无效', '活跃', '冻结', '开放', '关闭', '启用状态'],
    fieldType: 'boolean',
    weight: 75,
  },
  {
    keywords: ['状态', '类型', '类别', '等级', '优先级', '来源'],
    fieldType: 'enum',
    weight: 60,
  },
  {
    keywords: ['描述', '备注', '说明', '详情', '简介', '内容', '评论', '反馈'],
    fieldType: 'text',
    weight: 70,
  },
];

/**
 * 字段名 → 中文标签映射表。
 */
const FIELD_LABEL_MAP: Record<string, string> = {
  name: '名称',
  title: '标题',
  code: '编码',
  description: '描述',
  status: '状态',
  type: '类型',
  remark: '备注',
  sort: '排序',
  creator: '创建人',
  createdAt: '创建时间',
  updater: '更新人',
  updatedAt: '更新时间',
  startDate: '开始日期',
  endDate: '结束日期',
  startTime: '开始时间',
  endTime: '结束时间',
  email: '电子邮箱',
  phone: '电话',
  address: '地址',
  url: '链接',
  count: '数量',
  amount: '金额',
  price: '价格',
  parentId: '上级',
  level: '层级',
  isEnable: '是否启用',
  isDelete: '是否删除',
  isTop: '是否置顶',
};

/**
 * 根据字段名推断中文标签。
 *
 * @param fieldName snake_case 或 camelCase 字段名
 * @return 推断的中文标签，无匹配时返回字段名本身
 */
export function inferFieldLabel(fieldName: string): string {
  const normalized = fieldName.toLowerCase().replace(/[_-]/g, '');
  for (const [key, label] of Object.entries(FIELD_LABEL_MAP)) {
    if (normalized.includes(key.toLowerCase())) {
      return label;
    }
  }
  return fieldName;
}

/**
 * 根据关键词推断字段类型。
 *
 * @param text 待分析的文本片段
 * @return 推断字段类型和命中权重
 */
export function inferFieldType(text: string): { type: FieldType; weight: number } {
  let bestMatch: { type: FieldType; weight: number } = { type: 'string', weight: 0 };
  for (const rule of KEYWORD_RULES) {
    for (const keyword of rule.keywords) {
      if (text.includes(keyword) && rule.weight > bestMatch.weight) {
        bestMatch = { type: rule.fieldType, weight: rule.weight };
      }
    }
  }
  return bestMatch;
}

/**
 * 根据文本推断字段是否必填。
 *
 * @param text 描述文本
 * @param fieldName 字段名
 * @return 是否判断为必填
 */
export function inferIsRequired(text: string, fieldName: string): boolean {
  const requiredKeywords = ['必填', '必须', '不可为空', '必选', '不能为空'];
  if (requiredKeywords.some((kw) => text.includes(kw))) {
    return true;
  }
  const requiredFieldNames = ['name', 'title', 'code', 'status', 'type'];
  return requiredFieldNames.some((key) => fieldName.toLowerCase().includes(key));
}

/**
 * 获取字段类型的校验提示。
 *
 * @param fieldType 字段类型
 * @param isRequired 是否必填
 * @return 校验提示文本
 */
export function getValidationHint(fieldType: FieldType, isRequired: boolean): string {
  const suffix = isRequired ? '（必填）' : '';
  const typeHintMap: Record<FieldType, string> = {
    string: '请输入文本内容',
    number: '请输入数字',
    boolean: '请选择状态',
    date: '请选择日期',
    datetime: '请选择时间',
    enum: '请选择选项',
    text: '请输入内容',
    email: '请输入有效的电子邮箱',
    phone: '请输入有效的电话号码',
    url: '请输入有效的链接地址',
    money: '请输入金额',
    percent: '请输入百分比',
  };
  return `${typeHintMap[fieldType] ?? '请输入内容'}${suffix}`;
}
