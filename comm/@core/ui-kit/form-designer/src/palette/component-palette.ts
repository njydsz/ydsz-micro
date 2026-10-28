/**
 * 组件面板数据 — 默认可用组件清单。
 *
 * <p>定义左侧组件面板全部可用组件，包含默认 props 和分组信息。
 * 业务方可通过 props 扩展 react-natively 注册自定义组件。
 *
 * <p>显示文案只存词典键（labelKey / placeholderKey），由渲染侧的 t() 解析，
 * 因此切换语种时面板与新建字段会同步变化。
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
    labelKey: 'designer.item.singleLine',
    placeholderKey: 'designer.placeholder.input',
    icon: 'input',
    group: 'basic',
    defaultProps: {},
    isContainer: false,
  },
  {
    componentType: 'YdTextarea',
    labelKey: 'designer.item.multiLine',
    placeholderKey: 'designer.placeholder.input',
    icon: 'textarea',
    group: 'basic',
    defaultProps: { rows: 3 },
    isContainer: false,
  },
  {
    componentType: 'InputNumber',
    labelKey: 'designer.item.numberInput',
    placeholderKey: 'designer.placeholder.number',
    icon: 'number',
    group: 'basic',
    defaultProps: {},
    isContainer: false,
  },
  {
    componentType: 'YdSelect',
    labelKey: 'designer.item.select',
    placeholderKey: 'designer.placeholder.select',
    icon: 'select',
    group: 'basic',
    defaultProps: { options: [] },
    isContainer: false,
  },
  {
    componentType: 'YdRadioGroup',
    labelKey: 'designer.item.radioGroup',
    icon: 'radio',
    group: 'basic',
    defaultProps: { options: [] },
    isContainer: false,
  },
  {
    componentType: 'YdCheckbox',
    labelKey: 'designer.item.checkbox',
    icon: 'checkbox',
    group: 'basic',
    defaultProps: {},
    isContainer: false,
  },
  {
    componentType: 'YdSwitch',
    labelKey: 'designer.item.switch',
    icon: 'switch',
    group: 'basic',
    defaultProps: {},
    isContainer: false,
  },
  {
    componentType: 'YdDatePicker',
    labelKey: 'designer.item.datePicker',
    placeholderKey: 'designer.placeholder.date',
    icon: 'date',
    group: 'basic',
    defaultProps: {},
    isContainer: false,
  },
  {
    componentType: 'TimePicker',
    labelKey: 'designer.item.timePicker',
    placeholderKey: 'designer.placeholder.time',
    icon: 'time',
    group: 'basic',
    defaultProps: {},
    isContainer: false,
  },
  {
    componentType: 'YdUpload',
    labelKey: 'designer.item.fileUpload',
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
    labelKey: 'designer.item.richEditor',
    icon: 'richtext',
    group: 'advanced',
    defaultProps: { height: 300 },
    isContainer: false,
  },
  {
    componentType: 'YdUserSelect',
    labelKey: 'designer.item.userSelect',
    placeholderKey: 'designer.placeholder.user',
    icon: 'user',
    group: 'advanced',
    defaultProps: {},
    isContainer: false,
  },
  {
    componentType: 'YdDeptSelect',
    labelKey: 'designer.item.deptSelect',
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
    labelKey: 'designer.item.gridLayout',
    icon: 'grid',
    group: 'layout',
    defaultProps: { columns: 2, gutter: 16 },
    isContainer: true,
  },
  {
    componentType: 'YdDivider',
    labelKey: 'designer.item.divider',
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
  { key: 'basic', labelKey: 'designer.groupBasic' },
  { key: 'advanced', labelKey: 'designer.groupAdvanced' },
  { key: 'layout', labelKey: 'designer.groupLayout' },
] as const;
