# YdYearPanel

十年导航

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\date-picker\YdYearPanel.vue`

## Props

| 属性          | 类型     | 必填 | 默认值 | 说明                                            |
| ------------- | -------- | ---- | ------ | ----------------------------------------------- |
| `decadeStart` | `number` | 是   | -      | 当前十年的锚定起点（即 decadeStart 为整十年份） |
| `selected`    | `string` | 否   | -      | 单模式选中 YYYY                                 |
| `rangeStart`  | `string` | 否   | -      | 起始 YYYY                                       |
| `rangeEnd`    | `string` | 否   | -      | 结束 YYYY                                       |
| `rangeHover`  | `string` | 否   | -      | 范围预览                                        |

## Emits

| 事件          | 参数         | 说明 |
| ------------- | ------------ | ---- |
| `select`      | `date: Date` | -    |
| `hover`       | `date: Date` | -    |
| `clearHover`  | `void`       | -    |
| `prev-decade` | `void`       | -    |
| `next-decade` | `void`       | -    |
