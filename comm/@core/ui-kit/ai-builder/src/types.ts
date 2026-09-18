/**
 * AI 生成器类型定义。
 *
 * <p>本模块定义了从自然语言描述到页面骨架（Schema）的完整类型契约。
 * 核心概念：
 * <ul>
 *   <li>{@link PageIntent} — 用户输入的自然语言描述 + 上下文</li>
 *   <li>{@link GeneratedPage} — AI 生成的页面骨架</li>
 *   <li>{@link FieldSuggestion} — 字段的 AI 建议结果</li>
 *   <li>{@link AiGenerationOptions} — 生成配置选项</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ai-builder\src\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * 页面意图 — 用户输入的自然语言描述和上下文。
 *
 * <p>作为 AI 生成引擎的输入，包含用户描述的业务场景、
 * 可用字段提示、以及目标场景类型。
 */
export interface PageIntent {
  /** 用户的自然语言描述（必填） */
  description: string;
  /** 页面类型 prompt（表单 / 列表 / 详情 / 看板的自然语言补充） */
  pageType?: 'form' | 'table' | 'detail' | 'dashboard';
  /** 可选的字段提示（用户已明确的字段清单） */
  knownFields?: string[];
  /** 目标模块名称（用于生成 API 路径前缀） */
  moduleName?: string;
}

/**
 * 单个字段建议 — AI 对单个字段的推断结果。
 */
export interface FieldSuggestion {
  /** 字段 key（snake_case 用于 API，camelCase 用于前端） */
  name: string;
  /** 中文标签 */
  label: string;
  /** 推断出的字段类型 */
  fieldType: FieldType;
  /** 是否必填 */
  isRequired: boolean;
  /** 校验规则提示 */
  validationHint?: string;
  /** 枚举选项（当 fieldType 为 enum 时） */
  options?: string[];
  /** 字段说明（来自自然语言解析） */
  tooltip?: string;
  /** 字段排序权重（0-100，越小越靠前） */
  sort: number;
}

/**
 * 支持的字段类型枚举。
 */
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'enum'
  | 'text'
  | 'email'
  | 'phone'
  | 'url'
  | 'money'
  | 'percent';

/**
 * 生成的页面骨架 — AI 生成引擎的输出。
 */
export interface GeneratedPage {
  /** 页面标题 */
  title: string;
  /** 页面描述 */
  description: string;
  /** 推荐的 API 路径 */
  apiPath: string;
  /** 字段建议列表 */
  fields: FieldSuggestion[];
  /** 推断出的页面类型 */
  pageType: 'form' | 'table' | 'detail' | 'dashboard';
  /** 生成置信度（0-1） */
  confidence: number;
  /** 扩展建议（如关联表、外键等） */
  suggestions: string[];
  /** 原始自然语言输入（回显用） */
  rawInput: string;
}

/**
 * AI 生成引擎的配置选项。
 */
export interface AiGenerationOptions {
  /** 是否启用字典自动匹配 */
  enableDictMatch: boolean;
  /** 是否推断校验规则 */
  enableValidation: boolean;
  /** 是否自动对齐现有表字段 */
  enableSchemaAlignment: boolean;
  /** 最大字段数（防止生成过多） */
  maxFields: number;
  /** 语言：zh-CN / en-US */
  locale: 'zh-CN' | 'en-US';
}

/**
 * AI 生成引擎的默认配置。
 */
export const DEFAULT_AI_GENERATION_OPTIONS: AiGenerationOptions = {
  enableDictMatch: true,
  enableValidation: true,
  enableSchemaAlignment: false,
  maxFields: 32,
  locale: 'zh-CN',
};
