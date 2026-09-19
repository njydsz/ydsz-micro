# YDSZ UI Primitives — 原子组件 API 参考

> 80+ 有样式原子组件的完整 Props / Emits / Slots / 变体参考

## Button YdButton

带完整变体的按钮组件。

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `as` | `any` | `'button'` | 否 |
| `loading` | `boolean` | `false` | 否 |
| `size` | `'default'\|'sm'\|'lg'\|'xs'\|'xl'\|'icon'` | `undefined` | 否 |
| `variant` | `'default'\|'destructive'\|'ghost'\|'heavy'\|'icon'\|'link'\|'outline'\|'secondary'\|'subtle'` | `undefined` | 否 |

**CSS 变体：**

| variant | 样式说明 |
|---------|----------|
| `default` | 品牌色实心 + 阴影（主操作） |
| `destructive` | 红色实心（危险操作） |
| `ghost` | hover 浅色底（弱化次级） |
| `heavy` | hover 深色底 |
| `icon` | hover 浅色底，次文本色 |
| `link` | 链接样式（下划线） |
| `outline` | 描边边框 + 透明底 |
| `secondary` | 次级灰底 |
| `subtle` | 品牌浅色底 |

| size | 样式 |
|------|------|
| `xs` | `h-7 w-7 rounded px-1 text-xs` |
| `sm` | `h-8 rounded-md px-2.5 text-xs` |
| `default` | `h-9 px-4 py-2` |
| `lg` | `h-10 rounded-lg px-5 text-base` |
| `xl` | `h-11 rounded-lg px-6 text-base` |
| `icon` | `size-8 rounded-md px-1 text-lg` |

---

## Input YdInput

增强型输入框，支持前后缀、清除、字数统计。

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `modelValue` | `number \| string` | — | 否 |
| `defaultValue` | `number \| string` | — | 否 |
| `size` | `'xs'\|'sm'\|'default'\|'lg'` | `'default'` | 否 |
| `type` | `string` | `'text'` | 否 |
| `disabled` | `boolean` | — | 否 |
| `readonly` | `boolean` | — | 否 |
| `placeholder` | `string` | — | 否 |
| `maxlength` | `number` | — | 否 |
| `prefix` | `string` | — | 否 |
| `suffix` | `string` | — | 否 |
| `isClearable` | `boolean` | `false` | 否 |
| `isShowCount` | `boolean` | `false` | 否 |

- **Emits**: `update:modelValue`, `clear`
- **Slots**: `prefix`, `suffix`

| size | 样式 |
|------|------|
| `xs` | `h-7 px-2 py-1 text-xs` |
| `sm` | `h-8 px-2.5 py-1.5 text-xs` |
| `default` | `h-10 px-3 py-2 text-sm` |
| `lg` | `h-11 px-4 py-2.5 text-base` |

---

## InputNumber YdInputNumber

数字输入框，支持精度、步进、格式化。

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `modelValue` | `number` | — | 否 |
| `min` | `number` | `MIN_SAFE_INTEGER` | 否 |
| `max` | `number` | `MAX_SAFE_INTEGER` | 否 |
| `step` | `number` | `1` | 否 |
| `precision` | `number` | `undefined` | 否 |
| `size` | `'default'\|'large'\|'small'` | `'default'` | 否 |
| `disabled` | `boolean` | `false` | 否 |
| `isReadonly` | `boolean` | `false` | 否 |
| `placeholder` | `string` | — | 否 |
| `change` | `(val: number) => void` | — | 否 |

- **Emits**: `update:modelValue`

---

## Textarea YdTextarea

多行文本输入框，支持自动增高。

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `modelValue` | `number \| string` | — | 否 |
| `autosize` | `boolean \| AutosizeConfig` | — | 否 |
| `resize` | `'none'\|'both'\|'horizontal'\|'vertical'` | `'vertical'` | 否 |
| `maxlength` | `number` | — | 否 |
| `isShowCount` | `boolean` | — | 否 |
| `disabled` | `boolean` | — | 否 |
| `readonly` | `boolean` | — | 否 |

```typescript
interface AutosizeConfig {
  minRows?: number;
  maxRows?: number;
}
```

---

## Checkbox YdCheckbox

复选框，继承全部 Radix CheckboxRootProps。

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `checked` | `boolean` | — | 否（受控） |
| `defaultChecked` | `boolean` | — | 否 |
| `indeterminate` | `boolean` | — | 否 |

- **Emits**: `update:checked`, `update:modelValue`
- **Slots**: `default`（自定义指示器内容）

---

## RadioGroup YdRadioGroup

单选按钮组，继承 RadioGroupRoot API。

导出: `YdRadioGroup`, `YdRadioGroupItem`

---

## Select YdSelect

选择器组件，完整继承 Radix Select API。

导出组件: `YdSelect`, `YdSelectContent`, `YdSelectGroup`, `YdSelectItem`, `YdSelectItemText`, `YdSelectLabel`, `YdSelectScrollDownButton`, `YdSelectScrollUpButton`, `YdSelectSeparator`, `YdSelectTrigger`, `YdSelectValue`, `YdVSelect`(虚拟化), `YdVSelectTrigger`, `YdSelectVirtualContent`

| 属性 (YdSelect) | 类型 | 默认值 |
|------------------|------|--------|
| `modelValue` | `string` | — |
| `open` | `boolean` | — |
| `defaultOpen` | `boolean` | `false` |
| `defaultValue` | `string` | `''` |
| `disabled` | `boolean` | — |
| `required` | `boolean` | — |
| `dir` | `Direction` | — |
| `name` | `string` | — |
| `autocomplete` | `string` | — |

---

## Switch YdSwitch

开关切换器。

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `checked` | `boolean` | — |
| `defaultChecked` | `boolean` | — |
| `disabled` | `boolean` | — |
| `required` | `boolean` | — |
| `name` | `string` | — |
| `value` | `string` | `'on'` |

- **Emits**: `update:checked`

---

## AutoComplete YdAutoComplete

自动完成组件，支持本地和异步搜索。

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `value` | `string` | `''` | 否 |
| `options` | `T[]` | `[]` | 否 |
| `isAsync` | `boolean` | `false` | 否 |
| `searchFn` | `(query: string) => Promise<T[]>` | — | 否 |
| `debounceMs` | `number` | `300` | 否 |
| `clearable` | `boolean` | `true` | 否 |
| `emptyText` | `string` | — | 否 |
| `locale` | `string` | `'zh'` | 否 |
| `isDisabled` | `boolean` | `false` | 否 |
| `placeholder` | `string` | — | 否 |

- **Emits**: `update:value`, `search`, `select`

---

## Cascader YdCascader

级联选择器。

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `modelValue` | `(string \| number)[]` | `[]` | 否 |
| `options` | `CascaderOption[]` | `[]` | **是** |
| `placeholder` | `string` | `'请选择'` | 否 |
| `disabled` | `boolean` | `false` | 否 |
| `size` | `'default'\|'large'\|'small'` | `'default'` | 否 |
| `expandTrigger` | `'click'\|'hover'` | `'click'` | 否 |
| `allowClear` | `boolean` | `true` | 否 |
| `showSearch` | `boolean \| CascaderShowSearch` | `false` | 否 |

```typescript
interface CascaderOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  isLeaf?: boolean;
  children?: CascaderOption[];
  [key: string]: unknown;
}
```

- **Emits**: `update:modelValue`, `change`

---

## ColorPicker YdColorPicker

颜色选择器。

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `modelValue` | `string` | `'#3b82f6'` | 否 |
| `format` | `'hex'\|'hex8'\|'hsl'\|'rgb'` | `'hex'` | 否 |
| `presets` | `PresetColor[][]` | `[]` | 否 |
| `showAlpha` | `boolean` | `true` | 否 |
| `showInput` | `boolean` | `true` | 否 |
| `allowClear` | `boolean` | `true` | 否 |
| `size` | `'default'\|'large'\|'small'` | `'default'` | 否 |

- **Emits**: `update:modelValue`, `change`, `formatChange`

---

## DatePicker YdDatePicker

日期选择器。

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `modelValue` | `DatePickerValue` | — | 否 |
| `type` | `DatePickerType` | `'date'` | 否 |
| `shortcuts` | `DatePickerShortcut[]` | — | 否 |
| `placeholder` | `string` | — | 否 |
| `disabled` | `boolean` | `false` | 否 |

```typescript
type DatePickerType = 'datetime' | 'date' | 'week' | 'month' | 'quarter' | 'year'
                  | 'daterange' | 'datetimerange' | 'monthrange' | 'yearrange';

type DatePickerValue = string | readonly [string, string];

interface DatePickerShortcut {
  text: string;
  value: () => DatePickerValue | undefined;
}
```

**导出子组件:** `YdCalendarPanel`, `YdMonthPanel`, `YdQuarterPanel`, `YdYearPanel`

---

## TimePicker YdTimePicker

时间选择器。

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `value` | `string` | — | 否 |
| `placeholder` | `string` | `'选择时间'` | 否 |
| `use12Hours` | `boolean` | `false` | 否 |
| `hourStep` | `number` | `1` | 否 |
| `minuteStep` | `number` | `1` | 否 |
| `secondStep` | `number` | `1` | 否 |
| `disabledHours` | `() => number[]` | — | 否 |
| `disabledMinutes` | `(hour) => number[]` | — | 否 |
| `disabledSeconds` | `(hour, minute) => number[]` | — | 否 |

---

## Mention YdMention

提及 / @ 交互组件。

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `modelValue` | `string` | `''` | 否 |
| `options` | `Array<{ label: value }>` | `[]` | **是** |
| `prefix` | `string \| string[]` | `'@'` | 否 |
| `search` | `(term: string) => void` | — | 否 |
| `disabled` | `boolean` | `false` | 否 |

---

## Rate YdRate

评分组件。

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `modelValue` | `number` | `0` | 否 |
| `count` | `number` | `5` | 否 |
| `allowHalf` | `boolean` | `false` | 否 |
| `disabled` | `boolean` | `false` | 否 |
| `readonly` | `boolean` | `false` | 否 |

---

## Slider YdSlider

滑块组件。

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `number[]` | — |
| `range` | `boolean` | `false` |
| `min` / `max` / `step` | `number` | `0` / `100` / `1` |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `disabled` | `boolean` | `false` |

---

## TreeSelect YdTreeSelect

树下拉选择。

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `modelValue` | `string \| number` | — | 否 |
| `options` | `TreeSelectOption[]` | `[]` | **是** |
| `placeholder` | `string` | `'请选择'` | 否 |
| `multiple` | `boolean` | `false` | 否 |
| `treeCheckable` | `boolean` | `false` | 否 |
| `showSearch` | `boolean` | `false` | 否 |
| `defaultExpandLevel` | `number` | `1` | 否 |

---

## Upload YdUpload

文件上传组件（支持分片）。

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `action` | `string` | — | 否 |
| `fileList` | `UploadUserFile[]` | — | 否 |
| `accept` | `string` | — | 否 |
| `headers` | `Record<string, string>` | — | 否 |
| `data` | `Record<string, string \| Blob>` | — | 否 |
| `name` | `string` | `'file'` | 否 |
| `isMultiple` | `boolean` | `false` | 否 |
| `isDrag` | `boolean` | `false` | 否 |
| `limit` | `number` | — | 否 |
| `beforeUpload` | `(file) => boolean \| Promise<boolean>` | — | 否 |
| `httpRequest` | `(options) => Promise<any>` | — | 否 |
| `onSuccess` | `(response, file) => void` | — | 否 |
| `onError` | `(error, file) => void` | — | 否 |
| `onProgress` | `(percent, file) => void` | — | 否 |
| `locale` | `string` | `'zh'` | 否 |

```typescript
enum UploadStatus { READY = 'ready', UPLOADING = 'uploading', SUCCESS = 'success', FAIL = 'fail' }
interface UploadFile { id?, name, percentage?, raw?, response?, size?, status?, url? }
interface UploadUserFile { name: string; url?: string; }
```

- **Emits**: `update:fileList`
- **Expose**: `clearFiles()`

---

## Form YdForm

集成 vee-validate + zod 的表单容器。

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `initialValues` | `Record<string, unknown>` | — | 否 |
| `isDisabled` | `boolean` | `false` | 否 |
| `isSubmitting` | `boolean` | `false` | 否 |

- **Emits**: `submit` `(values)`, `invalidSubmit` `(errors)`
- **Slots**: `default` `(props: { errors, isSubmitting })`
- **Expose**: `errors`, `submitWithErrorFocus`, `validate`, `values`

**额外导出:** `YdFormControl`, `YdFormDescription`, `YdFormItem`, `YdFormLabel`, `YdFormMessage`

---

## Avatar YdAvatar

头像组件。

**CSS 变体 (shape):**
- `circle`: `rounded-full`（自然人）
- `square`: `rounded-lg`（组织/应用）

**CSS 变体 (size):** `xs`(24px) / `sm`(32px) / `base`(40px) / `lg`(48px) / `xl`(64px) / `2xl`(96px) / `3xl`(128px)

导出: `YdAvatar`, `YdAvatarFallback`, `YdAvatarImage`

---

## Badge YdBadge

徽标组件。

**CSS variant:** `default` / `primary` / `destructive` / `outline` / `secondary` / `success` / `warning` / `info`

---

## Divider YdDivider

```typescript
interface DividerProps {
  class?: any;
  dashed?: boolean;
  orientation?: 'center' | 'left' | 'right';
  type?: 'horizontal' | 'vertical';
}
```

---

## Sheet YdSheet

抽屉面板。

**CSS 变体 (side):** `bottom` / `left` / `right`(默认) / `top`

导出: `YdSheet`, `YdSheetClose`, `YdSheetContent`, `YdSheetDescription`, `YdSheetFooter`, `YdSheetHeader`, `YdSheetTitle`, `YdSheetTrigger`

---

## Tag YdTag

标签组件。

**CSS variant:** `default` / `primary` / `success` / `warning` / `destructive` / `info`

**CSS size:** `sm` / `md`(默认) / `lg`

---

## Toggle YdToggle

切换按钮（Radix Toggle 封装）。

**CSS size:** `default`(h-9) / `lg`(h-10) / `sm`(h-8)

**CSS variant:** `default`(透明底) / `outline`(描边边框)

---

## ContextMenu YdContextMenu

15 个子组件：Root, Trigger, Portal, Content, Group, Item, ItemIndicator, CheckboxItem, RadioItem, RadioGroup, Label, Separator, Sub, SubContent, SubTrigger, Shortcut

---

## Dialog YdDialog

9 个子组件：Root, Close, Content, Description, Footer, Header, ScrollContent, Title, Trigger

---

## Table YdTable

完整数据表格，包含 ColumnDef 定义。

```typescript
interface ColumnDef {
  type?: 'index' | 'selection' | 'expand';
  id: string;
  header: string;
  accessorKey?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  cell?: (row, index) => string;
  fixed?: 'left' | 'right';
  sorter?: (a, b) => number;
  filters?: FilterOption[];
  filterMethod?: (value, row) => boolean;
  sortOrder?: 'asc' | 'desc' | null;
  isHidden?: boolean;
  hideable?: boolean;
  draggable?: boolean;
}
```

导出: YdTable, YdTableBody, YdTableCaption, YdTableCell, YdTableColumn, YdTableColumnGroup, YdTableEmpty, YdTableFooter, YdTableHead, YdTableHeader, YdTableRow

---

## Tree YdTree

树形组件。

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `treeData` | `Recordable<any>[]` | — | **是** |
| `labelField` | `string` | — | 否 |
| `valueField` | `string` | — | 否 |
| `childrenField` | `string` | — | 否 |
| `defaultValue` | `Arrayable<number \| string>` | — | 否 |
| `multiple` | `boolean` | — | 否 |
| `checkStrictly` | `boolean` | — | 否 |
| `defaultExpandedLevel` | `number` | — | 否 |
| `showSearch` | (see VTreeSearch) | — | 否 |

导出: `YdTree`, `YdVTreeSearch`, `useTreeSearch`

---

## ConfigProvider YdConfigProvider

全局配置提供者，控制尺寸、密度、国际化、RTL、主题等。

```typescript
type Density = 'default' | 'compact' | 'loose';
type ComponentSize = 'small' | 'default' | 'large';
type LocaleLang = 'zh-CN' | 'en-US';

interface ConfigContext {
  size?: ComponentSize;
  density?: Density;
  prefixCls?: string;
  locale?: { lang?: LocaleLang; isRTL?: boolean; messages?: ... };
  renderEmpty?: () => unknown;
  wave?: WaveConfig;
  isDisabled?: boolean;
  theme?: ThemeConfig;
}
```

---

## Pagination YdPagination

分页组件。

---

## Progress YdProgress

进度条。

---

## Steps YdSteps

步骤条。

```typescript
type StepStatus = 'wait' | 'process' | 'finish' | 'error';
```

导出: `YdSteps`, `YdStepItem`

---

## Timeline YdTimeline

时间线。

导出: `YdTimeline`, `YdTimelineItem`

---

## Typography YdTypography

排版组件。

导出: `YdTypography`, `YdTitle`, `YdText`, `YdParagraph`

 Tabs, Breadcrumb, Card, Collapse, ColorPicker, ConfigProvider, ContextMenu, CountTag, 
 Countdown, Descriptions, Dialog, Divider, Empty, HoverCard, IconPicker, Image, Anchor, 
 BackTop, BulkActions, Calendar, List, Pagination, Popconfirm, Popover, QrCode, Result, 
 Resizable, ScrollArea, Separator, Skeleton, Space, Spin, Statistic, Switch, Table, 
 Tag, Toggle, ToggleGroup, Toolbar, Tooltip, Tour, Transfer, TreeSelect, Typography, Watermark, 
 BackTop
