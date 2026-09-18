/**
 * 组件面板数据 — 默认可用组件清单。
 *
 * <p>定义左侧组件面板全部可用组件，包含默认 props 和分组信息。
 * 业务方可通过 props 扩展 react-natively 注册自定义组件。
 *
 * @path comm\@core\ui-kit\form-designer\src\palette\component-palette.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { DesignerComponentMeta } from '../types';

/**
 * 基础表单控件面板数据。
 */
export const BASIC_COMPONENTS: DesignerComponentMeta[] = [
  {
    componentType: 'YDSZInput',
    label: '单行文本',
    icon: 'input',
    group: 'basic',
    defaultProps: { placeholder: '请输入' },
    isContainer: false,
  },
  {
    componentType: 'YdTextarea',
    label: '多行文本',
    icon: 'textarea',
    group: 'basic',
    defaultProps: { placeholder: '请输入', rows: 3 },
    isContainer: false,
  },
  {
    componentType: 'InputNumber',
    label: '数字输入',
    icon: 'number',
    group: 'basic',
    defaultProps: { placeholder: '请输入数字' },
    isContainer: false,
  },
  {
    componentType: 'YdSelect',
    label: '下拉选择',
    icon: 'select',
    group: 'basic',
    defaultProps: { placeholder: '请选择', options: [] },
    isContainer: false,
  },
  {
    componentType: 'YdRadioGroup',
    label: '单选框组',
    icon: 'radio',
    group: 'basic',
    defaultProps: { options: [] },
    isContainer: false,
  },
  {
    componentType: 'YdCheckbox',
    label: '复选框',
    icon: 'checkbox',
    group: 'basic',
    defaultProps: {},
    isContainer: false,
  },
  {
    componentType: 'YdSwitch',
    label: '开关',
    icon: 'switch',
    group: 'basic',
    defaultProps: {},
    isContainer: false,
  },
  {
    componentType: 'YdDatePicker',
    label: '日期选择',
    icon: 'date',
    group: 'basic',
    defaultProps: { placeholder: '请选择日期' },
    isContainer: false,
  },
  {
    componentType: 'TimePicker',
    label: '时间选择',
    icon: 'time',
    group: 'basic',
    defaultProps: { placeholder: '请选择时间' },
    isContainer: false,
  },
  {
    componentType: 'YdUpload',
    label: '文件上传',
    icon: 'upload',
    group: 'basic',
    defaultProps: { action: '/api/upload', limit: 5 },
    isContainer: false,
  },
];

/**
 * 高级组件。
 */
export const ADVANCED_COMPONENTS: DesignerComponentMeta[] = [
  {
    componentType: 'YdRichText',
    label: '富文本编辑器',
    icon: 'richtext',
    group: 'advanced',
    defaultProps: { height: 300 },
    isContainer: false,
  },
  {
    componentType: 'YdUserSelect',
    label: '人员选择',
    icon: 'user',
    group: 'advanced',
    defaultProps: { placeholder: '请选择人员' },
    isContainer: false,
  },
  {
    componentType: 'YdDeptSelect',
    label: '部门选择',
    icon: 'dept',
    group: 'advanced',
    defaultProps: {},
    isContainer: false,
  },
];

/**
 * 布局组件。
 */
export const LAYOUT_COMPONENTS: DesignerComponentMeta[] = [
  {
    componentType: 'YdGrid',
    label: '栅格布局',
    icon: 'grid',
    group: 'layout',
    defaultProps: { columns: 2, gutter: 16 },
    isContainer: true,
  },
  {
    componentType: 'YdDivider',
    label: '分割线',
    icon: 'divider',
    group: 'layout',
    defaultProps: {},
    isContainer: false,
  },
];

/** 全部组件清单 */
export const ALL_PALETTE_COMPONENTS: DesignerComponentMeta[] = [
  ...BASIC_COMPONENTS,
  ...ADVANCED_COMPONENTS,
  ...LAYOUT_COMPONENTS,
];

/** 分组信息 */
export const COMPONENT_GROUPS = [
  { key: 'basic', label: '基础控件' },
  { key: 'advanced', label: '高级控件' },
  { key: 'layout', label: '布局控件' },
] as const;
