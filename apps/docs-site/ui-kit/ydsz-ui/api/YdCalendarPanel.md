# YdCalendarPanel

星期标题行

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\date-picker\YdCalendarPanel.vue`

## Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `displayMonth` | `Date` | 是 | - | 当前显示的月份（以该月 1 号为锚点） |
| `selected` | `string` | 否 | - | 单日期模式的选中值 (YYYY-MM-DD) |
| `rangeStart` | `string` | 否 | - | 范围模式的起始日期 (YYYY-MM-DD) |
| `rangeEnd` | `string` | 否 | - | 范围模式的结束日期 (YYYY-MM-DD) |
| `rangeHover` | `string` | 否 | - | 范围模式中、结束点未确定时的悬停预览日期 (YYYY-MM-DD) |

## Emits

| 事件 | 参数 | 说明 |
|------|------|------|
| `select` | `date: Date` | - |
| `hover` | `date: Date` | - |
| `clearHover` | `void` | - |
