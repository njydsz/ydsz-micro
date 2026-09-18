/**
 * 可视化表单设计器类型定义。
 *
 * <p>定义拖拽式表单搭建器的完整数据结构：组件面板、画布 Schema、选中状态等。
 * 核心概念：
 * <ul>
 *   <li>{@link DesignerComponentMeta} — 组件面板中可拖拽的组件元数据</li>
 *   <li>{@link CanvasItem} — 画布上的表单字段实例</li>
 *   <li>{@link DesignerSchema} — 完整设计稿（画布+配置）</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\form-designer\src\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * 组件面板中的组件元数据。
 */
export interface DesignerComponentMeta {
  /** 组件类型标识（与 YdForm 组件名对齐） */
  componentType: string;
  /** 显示名称 */
  label: string;
  /** 图标标识（icon name） */
  icon: string;
  /** 所属分组 */
  group: ComponentGroup;
  /** 默认 props */
  defaultProps: Record<string, unknown>;
  /** 是否包含子组件容器（如栅格布局） */
  isContainer: boolean;
}

/** 组件分组类型 */
export type ComponentGroup =
  | 'basic'
  | 'layout'
  | 'advanced'
  | 'business';

/** 画布中的表单字段实例 */
export interface CanvasItem {
  /** 唯一 ID（拖拽时自动生成） */
  id: string;
  /** 字段名（后续绑定到表单模型） */
  fieldName: string;
  /** 字段中文标签 */
  label: string;
  /** 引用组件类型 */
  componentType: string;
  /** 组件 props */
  componentProps: Record<string, unknown>;
  /** 校验规则 */
  rules: CanvasValidationRule[];
  /** 是否必填 */
  isRequired: boolean;
  /** 栅格占位（1-12） */
  span: number;
  /** 排序序号 */
  sort: number;
  /** 是否禁用（预览态） */
  isDisabled: boolean;
  /** placeholder */
  placeholder?: string;
}

/** 画布校验规则（简化版） */
export interface CanvasValidationRule {
  /** 规则类型 */
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'custom';
  /** 规则值 */
  value?: unknown;
  /** 触发时机 */
  trigger: 'blur' | 'change' | 'submit';
  /** 错误提示 */
  message: string;
}

/** 完整设计稿 Schema */
export interface DesignerSchema {
  /** 设计稿版本号 */
  version: string;
  /** 布局列数（1-12） */
  columns: number;
  /** 标签位置 */
  labelPosition: 'left' | 'top' | 'right';
  /** 标签宽度 */
  labelWidth: number;
  /** 画布上的字段列表 */
  items: CanvasItem[];
  /** 全局表单配置 */
  config: DesignerGlobalConfig;
}

/** 全局表单配置 */
export interface DesignerGlobalConfig {
  /** 提交地址 */
  submitUrl: string;
  /** 提交方法 */
  method: 'POST' | 'PUT';
  /** 是否开启防重复提交 */
  isDebounceEnabled: boolean;
  /** 防重复提交时间窗口（毫秒） */
  debounceTime: number;
  /** 提交成功消息 */
  successMessage: string;
}

/** 设计器默认配置 */
export const DEFAULT_DESIGNER_CONFIG: DesignerGlobalConfig = {
  submitUrl: '',
  method: 'POST',
  isDebounceEnabled: true,
  debounceTime: 500,
  successMessage: '提交成功',
};

export const DEFAULT_DESIGNER_SCHEMA: DesignerSchema = {
  version: '1.0.0',
  columns: 1,
  labelPosition: 'left',
  labelWidth: 100,
  items: [],
  config: DEFAULT_DESIGNER_CONFIG,
};
