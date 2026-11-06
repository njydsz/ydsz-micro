# YdDropdown

下拉菜单便利性封装 —— 配置式 options 用法。 用法一（配置式，快速声明）：

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\dropdown\YdDropdown.vue`

## Props

| 属性       | 类型                       | 必填    | 默认值   | 说明         |
| ---------- | -------------------------- | ------- | -------- | ------------ |
| `label`    | `string`                   | 否      | -        | 触发按钮文本 |
| `options`  | `DropdownMenuItemOption[]` | 否      | -        | 配置式菜单项 |
| `trigger`  | `'click'                   | 'hover' | 'focus'` | 否           | -   | 触发方式 |
| `disabled` | `boolean`                  | 否      | -        | 是否禁用     |
| `class`    | `HTMLAttributes['class']`  | 否      | -        | 自定义 class |
