# YdCardGrid

加载态：栅格骨架

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\entity-card\YdCardGrid.vue`

## Props

| 属性           | 类型      | 必填 | 默认值 | 说明                                             |
| -------------- | --------- | ---- | ------ | ------------------------------------------------ |
| `className`    | `string`  | 否   | -      | 自定义类名                                       |
| `isLoading`    | `boolean` | 否   | -      | 是否处于加载状态                                 |
| `gapClass`     | `string`  | 否   | -      | 自定义间距 class（默认 gap-4）                   |
| `isEmpty`      | `boolean` | 否   | -      | 数据是否为空（用于显示 empty slot）              |
| `minCardWidth` | `number`  | 否   | -      | 默认最小卡片宽度（px），响应式断点下自动调整列数 |
