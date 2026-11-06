# YdMonthPanel

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\date-picker\YdMonthPanel.vue`

## Props

| 属性          | 类型     | 必填 | 默认值 | 说明                       |
| ------------- | -------- | ---- | ------ | -------------------------- |
| `displayYear` | `Date`   | 是   | -      | 当前显示的年份             |
| `selected`    | `string` | 否   | -      | 单模式选中的月份 (YYYY-MM) |
| `rangeStart`  | `string` | 否   | -      | 范围起始 (YYYY-MM)         |
| `rangeEnd`    | `string` | 否   | -      | 范围结束 (YYYY-MM)         |
| `rangeHover`  | `string` | 否   | -      | 范围预览（结束点未定时）   |

## Emits

| 事件         | 参数         | 说明 |
| ------------ | ------------ | ---- |
| `select`     | `date: Date` | -    |
| `hover`      | `date: Date` | -    |
| `clearHover` | `void`       | -    |
