# YDSZ Vue — 无头组件 API 参考

> 完整的 Props / Events / Slots / Expose 参考手册

## Accordion 手风琴

### AccordionRoot

```vue
<AccordionRoot
  type="single"
  collapsible
  v-model:modelValue="openItem"
>
```

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `modelValue` | `string \| string[]` | — | 否 | 受控展开项 |
| `defaultValue` | `string \| string[]` | — | 否 | 默认展开项 |
| `type` | `'single' \| 'multiple'` | — | 否 | 单选 / 多选模式 |
| `collapsible` | `boolean` | `false` | 否 | 是否允许全部收起 |
| `disabled` | `boolean` | `false` | 否 | 禁用整个面板 |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | 否 | 方向 |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | 否 | 阅读方向 |

- **Emits**: `update:modelValue` `(value: string | string[] | undefined)`
- **Slots**: `default` `(props: { modelValue })`

### AccordionItem

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `value` | `string` | — | **是** |
| `disabled` | `boolean` | `false` | 否 |

- **Slots**: `default` `(props: { open: boolean })`
- **Expose**: `open`

### AccordionHeader

无额外 props，渲染 `<h3>` 标签。

### AccordionTrigger

无额外 props，继承 CollapsibleTrigger。

### AccordionContent

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `forceMount` | `boolean` | — |

---

## AlertDialog 警告对话框

### AlertDialogRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `open` | `boolean` | — |
| `defaultOpen` | `boolean` | `false` |
| `modal` | **固定 `true`** | — |

- **Emits**: `update:open` `(value: boolean)`
- **Slots**: `default` `(props: { open })`

### AlertDialogContent

- 阻止 `@pointer-down-outside` 和 `@interact-outside`
- **默认 focus 到 Cancel 按钮**

---

## Avatar 头像

### AvatarRoot

无额外 props，渲染 `<span>` 容器。

### AvatarImage

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `src` | `string` | — | **是** |
| `referrerPolicy` | `ReferrerPolicy` | — | 否 |

- **Emits**: `loadingStatusChange` `(value: ImageLoadingStatus)`

### AvatarFallback

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `delayMs` | `number` | `0` |

---

## Checkbox 复选框

### CheckboxRoot

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `defaultChecked` | `boolean` | — | 否 |
| `checked` | `boolean \| 'indeterminate'` | — | 否 |
| `disabled` | `boolean` | — | 否 |
| `required` | `boolean` | — | 否 |
| `name` | `string` | — | 否 |
| `value` | `string` | `'on'` | 否 |

- **Emits**: `update:checked` `(value: boolean)`
- **Slots**: `default` `(props: { checked })`

### CheckboxIndicator

| 属性 | 类型 |
|------|------|
| `forceMount` | `boolean` |

---

## Collapsible 折叠

### CollapsibleRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `defaultOpen` | `boolean` | `false` |
| `open` | `boolean` | — |
| `disabled` | `boolean` | — |

- **Emits**: `update:open` `(value: boolean)`
- **Slots**: `default` `(props: { open })`

### CollapsibleTrigger

无额外 props，渲染 `<button>`。

### CollapsibleContent

| 属性 | 类型 |
|------|------|
| `forceMount` | `boolean` |

---

## Dialog 对话框

### DialogRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `open` | `boolean` | — |
| `defaultOpen` | `boolean` | `false` |
| `modal` | `boolean` | `true` |

- **Slots**: `default` `(props: { open })`

### DialogContent

| 属性 | 类型 |
|------|------|
| `forceMount` | `boolean` |
| `trapFocus` | `boolean` |
| `disableOutsidePointerEvents` | `boolean` |

**Emits**: `escapeKeyDown`, `focusOutside`, `interactOutside`, `pointerDownOutside`, `openAutoFocus`, `closeAutoFocus`

### DialogTrigger / DialogPortal / DialogOverlay / DialogClose / DialogTitle / DialogDescription

均继承 PrimitiveProps 基础属性。

---

## HoverCard 悬停卡片

### HoverCardRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `defaultOpen` | `false` | `false` |
| `open` | `boolean` | — |
| `openDelay` | `number` | `700` |
| `closeDelay` | `number` | `300` |

- **Emits**: `update:open`
- **Slots**: `default` `(props: { open })`

### HoverCardContent

| 属性 | 类型 |
|------|------|
| `forceMount` | `boolean` |
| `side` / `align` | Floating UI 定位 |
| `sideOffset` / `alignOffset` | `number` |
| `avoidCollisions` | `boolean` |
| `trapFocus` | `boolean` |
| 等 Floating UI 全部选项 | — |

- **Emits**: 继承 DismissableLayerEmits

---

## Menu / ContextMenu / DropdownMenu

三套菜单组件共享相同 API 结构。

### MenuRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `open` | `boolean` | `false` |
| `dir` | `Direction` | — |
| `modal` | `boolean` | `true` |

### MenuItem

| 属性 | 类型 |
|------|------|
| `disabled` | `boolean` |
| `textValue` | `string` |

**Emits**: `select` `(event: Event)`

### MenuCheckboxItem

| 属性 | 类型 |
|------|------|
| `checked` | `CheckedState` |
| `disabled` | `boolean` |
| `textValue` | `string` |

**Emits**: `update:checked`, `select`

### MenuRadioGroup / MenuRadioItem

```vue
<MenuRadioGroup v-model:modelValue="choice">
  <MenuRadioItem value="a">选项 A</MenuRadioItem>
</MenuRadioGroup>
```

### MenuSub / MenuSubTrigger / MenuSubContent

支持无限嵌套子菜单，触发方式由 `open` / `defaultOpen` 控制。

---

## NumberField 数字输入

### NumberFieldRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `number` | — |
| `defaultValue` | `number` | — |
| `min` | `number` | — |
| `max` | `number` | — |
| `step` | `number` | `1` |
| `formatOptions` | `Intl.NumberFormatOptions` | — |
| `locale` | `string` | `'en-US'` |
| `disabled` | `boolean` | — |
| `required` | `boolean` | — |
| `name` / `id` | `string` | — |

- **Slots**: `default` `(props: { modelValue, textValue })`

### NumberFieldInput / NumberFieldIncrement / NumberFieldDecrement

标准按钮/输入包装。

---

## Pagination 分页

### PaginationRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `page` | `number` | — |
| `defaultPage` | `number` | `1` |
| `total` | `number` | `0` |
| `itemsPerPage` | `number` | `10` |
| `siblingCount` | `number` | `2` |
| `showEdges` | `boolean` | `false` |

- **Emits**: `update:page` `(value: number)`
- **Slots**: `default` `(props: { page, pageCount })`

---

## PinInput PIN 码

### PinInputRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `string[]` | — |
| `defaultValue` | `string[]` | — |
| `placeholder` | `string` | `''` |
| `mask` | `boolean` | — |
| `otp` | `boolean` | — |
| `type` | `'text' \| 'number'` | `'text'` |
| `disabled` | `boolean` | — |

- **Emits**: `update:modelValue`, `complete` `(value: string[])`

### PinInputInput

| 属性 | 类型 | 必填 |
|------|------|------|
| `index` | `number` | **是** |
| `disabled` | `boolean` | 否 |

---

## Popover 气泡

### PopoverRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `defaultOpen` | `boolean` | `false` |
| `open` | `boolean` | — |
| `modal` | `boolean` | `false` |

- **Slots**: `default` `(props: { open })`

### PopoverContent

完整 Floating UI 定位属性集（`side` / `align` / `sideOffset` / `avoidCollisions` 等）。

---

## Progress 进度条

### ProgressRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `number \| null` | — |
| `max` | `number` | `100` |
| `getValueLabel` | `(value, max) => string` | 百分比函数 |

---

## RadioGroup 单选

### RadioGroupRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `string` | — |
| `disabled` | `boolean` | `false` |
| `required` | `boolean` | — |
| `orientation` | `DataOrientation` | — |
| `loop` | `boolean` | `true` |

### RadioGroupItem

| 属性 | 类型 | 必填 |
|------|------|------|
| `value` | `string` | **是** |
| `disabled` | `boolean` | 否 |

---

## ScrollArea 滚动条

### ScrollAreaRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `type` | `'auto' \| 'always' \| 'scroll' \| 'hover'` | `'hover'` |
| `scrollHideDelay` | `number` | `600` |

- **Expose**: `viewport`, `scrollTop()`, `scrollTopLeft()`

### ScrollAreaScrollbar

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` |

---

## Select 选择器

### SelectRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `string` | — |
| `open` | `boolean` | — |
| `disabled` | `boolean` | — |
| `dir` | `Direction` | — |
| `name` | `string` | — |
| `required` | `boolean` | — |

- **Emits**: `update:modelValue`, `update:open`

### SelectItem

| 属性 | 类型 | 必填 |
|------|------|------|
| `value` | `string` | **是** |
| `disabled` | `boolean` | 否 |
| `textValue` | `string` | 否 |

### SelectContent

| 属性 | 类型 | 说明 |
|------|------|------|
| `position` | `'popper' \| 'item-aligned'` | 定位策略 |
| `bodyLock` | `boolean` | 锁定身体滚动 |

---

## Slider 滑块

### SliderRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `number[]` | — |
| `defaultValue` | `number[]` | `[0]` |
| `min` / `max` / `step` | `number` | `0` / `100` / `1` |
| `orientation` | `DataOrientation` | `'horizontal'` |
| `inverted` | `boolean` | `false` |
| `minStepsBetweenThumbs` | `number` | `0` |
| `disabled` | `boolean` | `false` |

- **Emits**: `update:modelValue`, `valueCommit`

---

## Splitter 可拖拽分割

### SplitterGroup

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `direction` | `'ltr' \| 'rtl'` | — | **是** |
| `autoSaveId` | `string \| null` | — | 否 |
| `keyboardResizeBy` | `number \| null` | `10` | 否 |
| `storage` | `PanelGroupStorage` | `localStorage` | 否 |

- **Emits**: `layout` `(val: number[])`
- **Slots**: `default` `(props: { layout })`

### SplitterPanel

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `defaultSize` | `number` | — |
| `minSize` | `number` | — |
| `maxSize` | `number` | — |
| `collapsedSize` | `number` | — |
| `collapsible` | `boolean` | — |

- **Emits**: `collapse`, `expand`, `resize`
- **Expose**: `collapse()`, `expand()`, `getSize()`, `resize(size)`, `isCollapsed`, `isExpanded`

---

## Switch 开关

### SwitchRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `defaultChecked` | `boolean` | — |
| `checked` | `boolean` | — |
| `disabled` | `boolean` | — |
| `required` | `boolean` | — |
| `name` | `string` | — |
| `value` | `string` | `'on'` |

- **Slots**: `default` `(props: { checked })`

---

## Tabs 标签页

### TabsRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `StringOrNumber` | — |
| `defaultValue` | `StringOrNumber` | — |
| `orientation` | `DataOrientation` | `'horizontal'` |
| `activationMode` | `'automatic' \| 'manual'` | `'automatic'` |

### TabsTrigger

| 属性 | 类型 | 必填 |
|------|------|------|
| `value` | `StringOrNumber` | **是** |
| `disabled` | `boolean` | 否 |

### TabsContent

| 属性 | 类型 | 必填 |
|------|------|------|
| `value` | `StringOrNumber` | **是** |
| `forceMount` | `boolean` | 否 |

---

## Toggle 切换按钮

### Toggle

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `pressed` | `boolean` | — |
| `defaultValue` | `boolean` | — |
| `disabled` | `boolean` | `false` |

- **Emits**: `update:pressed`
- **Slots**: `default` `(props: { pressed })`

---

## ToggleGroup 切换组

### ToggleGroupRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `modelValue` | `string \| string[]` | — |
| `defaultValue` | `string \| string[]` | — |
| `type` | `'single' \| 'multiple'` | — |
| `disabled` | `boolean` | `false` |
| `rovingFocus` | `boolean` | `true` |
| `loop` | `boolean` | `true` |

### ToggleGroupItem

| 属性 | 类型 | 必填 |
|------|------|------|
| `value` | `string` | **是** |
| `disabled` | `boolean` | 否 |

---

## Tooltip 文字提示

### TooltipRoot

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `defaultOpen` | `boolean` | `false` |
| `open` | `boolean` | — |
| `delayDuration` | `number` | — |
| `disableHoverableContent` | `boolean` | — |
| `disabled` | `boolean` | — |

### TooltipProvider

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `delayDuration` | `number` | `700` |
| `disableHoverableContent` | `boolean` | `false` |
| `disableClosingTrigger` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |

### TooltipContent

完整 Floating UI 定位 + DismissableLayer 事件集。

---

## Tree 树形组件

### TreeRoot (generic \`\<T, U\>\`)

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `items` | `T[]` | — | 否 |
| `modelValue` | `U \| U[]` | — | 否 |
| `expanded` | `string[]` | — | 否 |
| `getKey` | `(val: T) => string` | — | **是** |
| `getChildren` | `(val: T) => T[]` | `val => val.children` | 否 |
| `selectionBehavior` | `'toggle' \| 'replace'` | `'toggle'` | 否 |
| `multiple` | `boolean` | — | 否 |
| `propagateSelect` | `boolean` | — | 否 |
| `disabled` | `boolean` | — | 否 |

- **Emits**: `update:modelValue`, `update:expanded`
- **Slots**: `default` `({ flattenItems, modelValue, expanded })`

### TreeItem (generic \`\<T\>\`)

| 属性 | 类型 | 必填 |
|------|------|------|
| `value` | `T` | **是** |
| `level` | `number` | **是** |

- **Emits**: `select`, `toggle`
- **Slots**: `default` `({ isExpanded, isSelected, isIndeterminate, handleToggle, handleSelect })`
- **Expose**: `isExpanded`, `isSelected`, `isIndeterminate`, `handleToggle`, `handleSelect`
