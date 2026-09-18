/**
 * 页面骨架生成器。
 *
 * <p>将 {@link PageIntent} 转换为 {@link GeneratedPage}。
 * 当前为「规则引擎 + 关键词匹配」阶段，预留 LLM 接口以便后续升级。
 *
 * <p>处理流程：
 * <ol>
 *   <li>意图分类确认页面类型</li>
 *   <li>字段提取 — 使用显式声明 + NLP 自动推断</li>
 *   <li>字段类型推断（关键词命中、命名模式）</li>
 *   <li>必填判定 + 校验规则建议</li>
 *   <li>组装为 {@link GeneratedPage}</li>
 * </ol>
 *
 * @path comm\@core\ui-kit\ai-builder\src\engine\page-generator.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type {
  AiGenerationOptions,
  FieldSuggestion,
  GeneratedPage,
  PageIntent,
} from '../types';

import {
  DEFAULT_AI_GENERATION_OPTIONS,
} from '../types';
import { generateDescriptionFromFields } from './intent-parser';
import {
  getValidationHint,
  inferFieldLabel,
  inferFieldType,
  inferIsRequired,
} from './keyword-matcher';

/** 常见业务字段名模式（用于自动补全） */
const COMMON_FIELD_PATTERNS: Array<{ name: string; label: string; type: FieldSuggestion['fieldType'] }> = [
  { name: 'name', label: '名称', type: 'string' },
  { name: 'code', label: '编码', type: 'string' },
  { name: 'remark', label: '备注', type: 'text' },
  { name: 'status', label: '状态', type: 'enum' },
  { name: 'isEnable', label: '是否启用', type: 'boolean' },
  { name: 'sort', label: '排序', type: 'number' },
  { name: 'email', label: '电子邮箱', type: 'email' },
  { name: 'phone', label: '电话', type: 'phone' },
];

/** 常见枚举选项 */
const ENUM_OPTIONS_MAP: Record<string, string[]> = {
  status: ['启用', '禁用'],
  enableStatus: ['启用', '禁用'],
  isEnable: ['是', '否'],
  gender: ['男', '女'],
  priority: ['高', '中', '低'],
  level: ['一级', '二级', '三级'],
  auditStatus: ['待审核', '已通过', '已驳回'],
};

/** 默认排序值 */
const DEFAULT_SORT_VALUES: Record<string, number> = {
  name: 10,
  code: 20,
  status: 30,
  type: 35,
  sort: 90,
  remark: 100,
  description: 110,
};

/**
 * 从文本中提取隐含字段名。
 *
 * <p>使用严格模式：仅识别「xxx字段」「xxx属性」「需要xxx」等上下文格式，
 * 避免直接把任意中文词当作字段名（防止手机号"号码"等无意义提取）。
 *
 * @param description 描述文本
 * @return 提取到的候选字段名数组
 */
function extractImplicitFieldNames(description: string): string[] {
  const candidates: string[] = [];
  // 严格模式：只匹配明确的上下文格式
  const strictPatterns = [
    /([\u4e00-\u9fff]{1,8})字段/g,
    /([\u4e00-\u9fff]{1,8})属性/g,
    /(?:需要|包含|有)([\u4e00-\u9fff]{1,10})(?:字段|属性|信息)/g,
  ];
  for (const pattern of strictPatterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match = regex.exec(description);
    while (match) {
      const name = match[1];
      if (name.length >= 2 && !candidates.includes(name)) {
        candidates.push(name);
      }
      match = regex.exec(description);
    }
  }
  return candidates;
}

/**
 * 数字类型中文转 snake_case 字段名。
 */
function toFieldName(text: string): string {
  const map: Record<string, string> = {
    名称: 'name',
    标题: 'title',
    编码: 'code',
    类型: 'type',
    状态: 'status',
    描述: 'description',
    备注: 'remark',
    排序: 'sort',
    金额: 'amount',
    价格: 'price',
    数量: 'count',
    邮箱: 'email',
    电话: 'phone',
    手机: 'mobile',
    地址: 'address',
    链接: 'url',
    日期: 'date',
    时间: 'date',
    生日: 'birthday',
    级别: 'level',
    等级: 'grade',
    优先级: 'priority',
    创建人: 'creator',
    创建时间: 'createdAt',
    更新时间: 'updatedAt',
  };
  return map[text] ?? text.toLowerCase().replace(/\s+/g, '_');
}

/**
 * 判断是否应该包含常见默认字段。
 */
function shouldIncludeCommonField(fieldName: string): boolean {
  const alwaysInclude = ['status', 'isEnable', 'sort', 'email', 'code'];
  return alwaysInclude.includes(fieldName);
}

/**
 * 根据意图生成页面骨架。
 *
 * @param intent 解析后的页面意图
 * @param options 生成配置选项
 * @return 生成的页面骨架
 */
export function generatePage(
  intent: PageIntent,
  options: AiGenerationOptions = DEFAULT_AI_GENERATION_OPTIONS,
): GeneratedPage {
  const effectiveDescription = intent.description || generateDescriptionFromFields(
    intent.knownFields ?? [],
    intent.pageType,
  );

  const fields: FieldSuggestion[] = [];
  const seen = new Set<string>();

  // 1. 处理显式声明的字段
  if (intent.knownFields && intent.knownFields.length > 0) {
    for (const rawField of intent.knownFields) {
      const fieldName = toFieldName(rawField);
      if (seen.has(fieldName)) {
        continue;
      }
      seen.add(fieldName);
      const inferredFromText = inferFieldType(rawField);
      fields.push({
        name: fieldName,
        label: inferFieldLabel(fieldName) !== fieldName
          ? inferFieldLabel(fieldName)
          : rawField,
        fieldType: inferredFromText.type,
        isRequired: inferIsRequired(effectiveDescription, fieldName),
        sort: DEFAULT_SORT_VALUES[fieldName]
          ?? (50 + fields.length * 5),
        validationHint: getValidationHint(
          inferredFromText.type,
          inferIsRequired(effectiveDescription, fieldName),
        ),
      });
    }
  }

  // 2. 自动推断隐含字段
  const implicitFields = extractImplicitFieldNames(effectiveDescription);
  for (const rawName of implicitFields) {
    const fieldName = toFieldName(rawName);
    if (seen.has(fieldName)) {
      continue;
    }
    if (fields.length >= options.maxFields) {
      break;
    }
    seen.add(fieldName);
    fields.push({
      name: fieldName,
      label: rawName,
      fieldType: inferFieldType(rawName).type,
      isRequired: false,
      sort: DEFAULT_SORT_VALUES[fieldName] ?? (50 + fields.length * 5),
    });
  }

  // 3. 补全通用字段（仅在显式字段不足时）
  if (fields.length < 8) {
    for (const common of COMMON_FIELD_PATTERNS) {
      if (seen.has(common.name) || !shouldIncludeCommonField(common.name)) {
        continue;
      }
      if (fields.length >= options.maxFields) {
        break;
      }
      seen.add(common.name);
      fields.push({
        name: common.name,
        label: common.label,
        fieldType: common.type,
        isRequired: false,
        sort: DEFAULT_SORT_VALUES[common.name] ?? (50 + fields.length * 5),
      });
    }
  }

  // 4. 为枚举类型字段补充选项
  if (options.enableDictMatch) {
    for (const field of fields) {
      if (field.fieldType === 'enum' && (!field.options || field.options.length === 0)) {
        const matchedOptions = ENUM_OPTIONS_MAP[field.name]
          ?? ENUM_OPTIONS_MAP[field.label];
        if (matchedOptions) {
          field.options = matchedOptions;
        }
      }
    }
  }

  // 5. 排序
  fields.sort((a, b) => a.sort - b.sort);

  // 6. 生成页面标题和描述
  const moduleName = intent.moduleName ?? '';
  const pageType = intent.pageType ?? 'form';
  const titleMap: Record<string, string> = {
    form: moduleName ? `${moduleName}表单` : '新建表单',
    table: moduleName ? `${moduleName}列表` : '列表页',
    detail: moduleName ? `${moduleName}详情` : '详情页',
    dashboard: moduleName ? `${moduleName}看板` : '数据看板',
  };
  const title: string = titleMap[pageType] ?? '新建页面';
  const description = `${title} — 由 AI 生成器自动创建，可根据实际需求调整字段。`;

  // 7. 生成 API 路径
  const apiSegment = moduleName
    ? toModuleName(moduleName)
    : 'generated';
  const apiPath = `/api/v1/${apiSegment}`;

  // 8. 生成辅助建议
  const suggestions: string[] = [];
  if (fields.length > 10) {
    suggestions.push('字段较多，建议拆分为主表+子表单提升可读性');
  }
  const enumFields = fields.filter((f) => f.fieldType === 'enum' && (!f.options || f.options.length === 0));
  if (enumFields.length > 0) {
    suggestions.push(
      `枚举字段「${enumFields.map((f) => f.label).join('、')}」需配置对应字典类型`,
    );
  }
  suggestions.push('生成后记得在路由守卫中配置页面权限');

  // 9. 计算置信度
  const confidence = intent.knownFields && intent.knownFields.length > 0
    ? Math.min(0.95, 0.6 + intent.knownFields.length * 0.05)
    : 0.45;

  return {
    title,
    description,
    apiPath,
    fields,
    pageType,
    confidence,
    suggestions,
    rawInput: effectiveDescription,
  };
}

/**
 * 模块名转 URL 路径段（camelCase → kebab-case）。
 */
function toModuleName(name: string): string {
  return name
    .replace(/([A-Z])/g, '-$1')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .replace(/^-/, '');
}
