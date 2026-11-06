# YdMenu

导航菜单便利性封装 —— 配置式 options 用法。 用法：

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\menu\YdMenu.vue`

## Props

| 属性         | 类型               | 必填        | 默认值 | 说明       |
| ------------ | ------------------ | ----------- | ------ | ---------- |
| `items`      | `MenuItemOption[]` | 是          | -      | 菜单项列表 |
| `modelValue` | `string`           | 否          | -      | 当前选中项 |
| `mode`       | `'horizontal'      | 'vertical'` | 否     | -          | 展开模式：horizontal / vertical |

## Emits

| 事件                | 参数            | 说明 |
| ------------------- | --------------- | ---- |
| `update:modelValue` | `value: string` | -    |
| `select`            | `key: string`   | -    |
